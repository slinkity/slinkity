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
        console.log({ mod });
        return { code: mod };
      }
    },
  };
}

export async function productionBuild({
  userConfig,
  eleventyConfigDir,
  propsByInputPath,
}: {
  userConfig: UserConfig;
  eleventyConfigDir: EleventyDir;
} & Pick<PluginGlobals, "propsByInputPath">) {
  const eleventyTempBuildDir = path.relative(".", userConfig.buildTempDir);
  const resolvedOutput = path.resolve(eleventyConfigDir.output);
  await fs.promises.rename(resolvedOutput, eleventyTempBuildDir);
  try {
    const inputFiles = globSync(`${eleventyTempBuildDir}/**/*.html`, {
      absolute: true,
    });
    if (inputFiles.length) {
      await vite.build(
        vite.mergeConfig(
          {
            root: eleventyTempBuildDir,
            mode: "production",
            plugins: [slinkityPropsPlugin({ propsByInputPath })],
            build: {
              outDir: resolvedOutput,
              emptyOutDir: true,
              rollupOptions: {
                input: inputFiles,
              },
            },
          },
          userConfig
        )
      );
    }
  } finally {
    await fs.promises.rm(eleventyTempBuildDir, {
      recursive: true,
    });
  }
}

export function createViteServer(
  userConfig: UserConfig,
  {
    cssUrlsByInputPath,
    ssrIslandsByInputPath,
    propsByInputPath,
  }: Pick<
    PluginGlobals,
    "cssUrlsByInputPath" | "ssrIslandsByInputPath" | "propsByInputPath"
  >
): ViteServerFactory {
  let viteConfig: vite.InlineConfig = {
    clearScreen: false,
    appType: "custom",
    server: {
      middlewareMode: true,
    },
    plugins: [
      slinkityPropsPlugin({ propsByInputPath }),
      {
        name: "vite-plugin-slinkity-inject-head",
        transformIndexHtml(html, ctx) {
          console.log("transforming...");
          const inputPath = ctx.originalUrl;
          if (!inputPath) return [];

          const hasClientsideComponents = Object.values(
            ssrIslandsByInputPath.get(inputPath) ?? {}
          ).some((island) => island.isUsedOnClient);

          const head: vite.HtmlTagDescriptor[] = hasClientsideComponents
            ? [
                {
                  tag: "script",
                  attrs: { type: "module" },
                  children: "import '/@id/slinkity/client';",
                },
              ]
            : [];

          const collectedCss = cssUrlsByInputPath.get(inputPath);
          if (!collectedCss) return head;

          return head.concat(
            [...collectedCss].map((href) => ({
              tag: "link",
              attrs: { rel: "stylesheet", href },
            }))
          );
        },
      },
    ],
  };

  for (const renderer of userConfig?.renderers ?? []) {
    viteConfig = vite.mergeConfig(viteConfig, renderer.viteConfig ?? {});
  }

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
