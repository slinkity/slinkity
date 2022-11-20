import type {
  EleventyDir,
  PluginGlobals,
  RenderedContent,
  UserConfig,
  ViteServerFactory,
} from "./~types.cjs";
import * as vite from "vite";
import * as path from "path";
import * as fs from "fs";
import { sync as globSync } from "fast-glob";
import {
  toIslandScriptId,
  toIslandVirtualModId,
  toIslandComment,
  SlinkityInternalError,
} from "./~utils.cjs";
import virtual from "@rollup/plugin-virtual";

export async function productionBuild({
  userConfig,
  eleventyConfigDir,
  ...globals
}: {
  userConfig: UserConfig;
  eleventyConfigDir: EleventyDir;
} & Pick<
  PluginGlobals,
  | "propsByInputPath"
  | "cssUrlsByInputPath"
  | "ssrIslandsByInputPath"
  | "pageByRelOutputPath"
  | "htmlFragmentByIslandId"
>) {
  const eleventyTempBuildDir = path.relative(".", userConfig.buildTempDir);
  const resolvedOutput = path.resolve(eleventyConfigDir.output);
  await fs.promises.rename(resolvedOutput, eleventyTempBuildDir);
  try {
    const inputFiles = globSync(`${eleventyTempBuildDir}/**/*.html`, {
      absolute: true,
    });
    // throw to remove temp build output in "finally" block
    if (!inputFiles.length) throw new Error("Output directory empty!");

    const islandVirtualMods = getIslandVirtualMods(globals);
    for (let islandVirtualModId of Object.keys(islandVirtualMods)) {
      inputFiles.push(islandVirtualModId);
    }
    console.log("🏝 Building islands");
    const islandBuildResult = await vite.build(
      mergeRendererConfigs({
        userConfig,
        viteConfig: {
          mode: "production",
          plugins: [slinkityPropsPlugin(globals), virtual(islandVirtualMods)],
          build: {
            write: false,
            minify: false,
            rollupOptions: {
              input: inputFiles,
            },
          },
        },
      })
    );
    let islandTemplatesToInject = new Map<string, string>();
    let filesToWrite = new Map<string, string>();
    if ("output" in islandBuildResult) {
      for (let entry of islandBuildResult.output) {
        const outputName = entry.fileName.replace("\x00virtual:", "");
        if (entry.type === "asset") {
          if (Object.keys(islandVirtualMods).includes(outputName)) {
            islandTemplatesToInject.set(outputName, entry.source.toString());
          } else {
            filesToWrite.set(outputName, entry.source.toString());
          }
        } else {
          filesToWrite.set(outputName, entry.code);
        }
      }
    }

    console.log("📝 Building pages");
    await vite.build(
      mergeRendererConfigs({
        userConfig,
        viteConfig: {
          root: eleventyTempBuildDir,
          mode: "production",
          plugins: [
            slinkityInjectHeadPlugin(globals),
            slinkityInjectIslandsPlugin({
              islandTemplatesMap: islandTemplatesToInject,
            }),
          ],
          build: {
            minify: false,
            outDir: resolvedOutput,
            emptyOutDir: true,
            rollupOptions: {
              input: inputFiles,
            },
          },
        },
      })
    );
  } finally {
    await fs.promises.rm(eleventyTempBuildDir, {
      recursive: true,
    });
  }
}

function getIslandVirtualMods({
  htmlFragmentByIslandId,
}: Pick<PluginGlobals, "htmlFragmentByIslandId">): Record<string, string> {
  const virtualMods: Record<string, string> = {};
  for (let [islandId, scriptHtml] of htmlFragmentByIslandId.entries()) {
    virtualMods[toIslandVirtualModId(islandId)] = scriptHtml;
  }
  return virtualMods;
}

export function createViteServer({
  userConfig,
  ...globals
}: { userConfig: UserConfig } & Pick<
  PluginGlobals,
  | "cssUrlsByInputPath"
  | "ssrIslandsByInputPath"
  | "propsByInputPath"
  | "pageByRelOutputPath"
  | "htmlFragmentByIslandId"
>): ViteServerFactory {
  let viteConfig: vite.InlineConfig = {
    clearScreen: false,
    appType: "custom",
    server: {
      middlewareMode: true,
    },
    plugins: [slinkityPropsPlugin(globals), slinkityInjectHeadPlugin(globals)],
  };

  viteConfig = mergeRendererConfigs({ viteConfig, userConfig });

  let viteServer: vite.ViteDevServer;
  let awaitingServer: ((value: vite.ViteDevServer) => void)[] = [];
  return {
    async getOrInitialize() {
      if (viteServer) return new Promise((resolve) => resolve(viteServer));

      if (awaitingServer.length === 0) {
        vite.createServer(viteConfig).then((_viteServer) => {
          viteServer = _viteServer;
          for (const resolve of awaitingServer) {
            resolve(viteServer);
          }
        });
      }
      return new Promise((resolve) => {
        awaitingServer.push(resolve);
      });
    },
  };
}

function slinkityPropsPlugin({
  propsByInputPath,
}: Pick<PluginGlobals, "propsByInputPath">): vite.Plugin {
  const virtualModuleId = "slinkity:props:";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "slinkity-props-plugin",
    resolveId(id) {
      if (id.startsWith(virtualModuleId)) {
        return id.replace(virtualModuleId, resolvedVirtualModuleId);
      }
    },
    async load(id) {
      if (id.startsWith(resolvedVirtualModuleId)) {
        const inputPath = id.replace(resolvedVirtualModuleId, "");
        const mod = await getPropsModContents({
          inputPath,
          propsByInputPath,
        });
        return { code: mod };
      }
    },
  };
}

async function getPropsModContents({
  inputPath,
  propsByInputPath,
}: Pick<RenderedContent, "inputPath"> &
  Pick<PluginGlobals, "propsByInputPath">) {
  let propsFileContents = "export default {\n";
  const propInfo = propsByInputPath.get(inputPath);
  if (propInfo?.clientPropIds.size) {
    const { hasStore, props, clientPropIds } = propInfo;
    for (const clientPropId of clientPropIds) {
      const { name, getSerializedValue } = props[clientPropId];
      const serializedKey = JSON.stringify(clientPropId);
      const serializedEntry = `{ name: ${JSON.stringify(
        name
      )}, value: ${getSerializedValue()} }`;
      propsFileContents += `  ${serializedKey}: ${serializedEntry},\n`;
    }
    propsFileContents += "}";
    if (hasStore) {
      // TODO: make this better
      propsFileContents +=
        "\n" + (await fs.promises.readFile("./utils/store.client.mjs"));
    }
  }

  return propsFileContents;
}

function slinkityInjectIslandsPlugin({
  islandTemplatesMap,
}: {
  islandTemplatesMap: Map<string, string>;
}): vite.Plugin {
  return {
    name: "vite-plugin-slinkity-inject-islands",
    transformIndexHtml: {
      enforce: "post",
      transform(html) {
        const transformed = html.replace(
          toIslandComment("(.+)"),
          (_, islandVirtualModId: string) => {
            const template = islandTemplatesMap.get(islandVirtualModId);
            console.log({ islandVirtualModId, template });
            if (!template) {
              throw new SlinkityInternalError(
                `${islandVirtualModId} could not be built.`
              );
            }
            return template;
          }
        );
        return transformed;
      },
    },
  };
}

function slinkityInjectHeadPlugin(
  globals: Pick<
    PluginGlobals,
    "ssrIslandsByInputPath" | "cssUrlsByInputPath" | "pageByRelOutputPath"
  >
): vite.Plugin {
  return {
    name: "vite-plugin-slinkity-inject-head",
    transformIndexHtml: {
      enforce: "pre",
      transform(html, ctx) {
        let inputPath: string | undefined;
        if (ctx.originalUrl) {
          // Dev server flow
          inputPath = ctx.originalUrl;
        } else {
          // Production build flow
          const pageInfo = globals.pageByRelOutputPath.get(ctx.path);
          inputPath = pageInfo?.inputPath;
        }
        if (!inputPath) return [];

        const hasClientsideComponents = Object.values(
          globals.ssrIslandsByInputPath.get(inputPath) ?? {}
        ).some((island) => island.isUsedOnClient);

        const head: vite.HtmlTagDescriptor[] = hasClientsideComponents
          ? [
              {
                tag: "script",
                attrs: { type: "module" },
                children: "import 'slinkity/client';",
              },
            ]
          : [];

        const collectedCss = globals.cssUrlsByInputPath.get(inputPath);
        if (!collectedCss) return head;

        return head.concat(
          [...collectedCss].map((href) => ({
            tag: "link",
            attrs: { rel: "stylesheet", href },
          }))
        );
      },
    },
  };
}

function mergeRendererConfigs({
  viteConfig,
  userConfig,
}: {
  viteConfig: vite.InlineConfig;
  userConfig: UserConfig;
}) {
  for (const renderer of userConfig?.renderers ?? []) {
    viteConfig = vite.mergeConfig(viteConfig, renderer.viteConfig ?? {});
  }
  return viteConfig;
}
