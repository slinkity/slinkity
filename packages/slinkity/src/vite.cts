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
import { toIslandScriptId } from "./~utils.cjs";

export async function productionBuild({
  userConfig,
  eleventyConfigDir,
  propsByInputPath,
  ssrIslandsByInputPath,
  cssUrlsByInputPath,
  pageByRelOutputPath,
}: {
  userConfig: UserConfig;
  eleventyConfigDir: EleventyDir;
} & Pick<
  PluginGlobals,
  | "propsByInputPath"
  | "cssUrlsByInputPath"
  | "ssrIslandsByInputPath"
  | "pageByRelOutputPath"
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
    let viteConfig: vite.InlineConfig = {
      root: eleventyTempBuildDir,
      mode: "production",
      plugins: [
        slinkityPropsPlugin({ propsByInputPath }),
        slinkityInjectHeadPlugin({
          ssrIslandsByInputPath,
          cssUrlsByInputPath,
          pageByRelOutputPath,
        }),
      ],
      build: {
        minify: false,
        outDir: resolvedOutput,
        emptyOutDir: true,
        rollupOptions: {
          input: inputFiles,
          output: {
            manualChunks(id, { getModuleInfo }) {
              // Check if it's an inline script
              if (!id.includes(".html?html-proxy&index")) return;
              const code = getModuleInfo(id)?.code;
              if (!code) return;

              const islandScriptMatch = code.match(
                new RegExp(toIslandScriptId(".+"))
              );
              if (!islandScriptMatch) return;

              const [islandScriptId] = islandScriptMatch;
              // If the script contains our special "toIslandScriptId",
              // It's an island script! Split to a separate chunk.
              return islandScriptId;
            },
          },
        },
      },
    };
    viteConfig = mergeRendererConfigs({ viteConfig, userConfig });
    await vite.build(viteConfig);
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
    pageByRelOutputPath,
  }: Pick<
    PluginGlobals,
    | "cssUrlsByInputPath"
    | "ssrIslandsByInputPath"
    | "propsByInputPath"
    | "pageByRelOutputPath"
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
      slinkityInjectHeadPlugin({
        ssrIslandsByInputPath,
        cssUrlsByInputPath,
        pageByRelOutputPath,
      }),
    ],
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

function slinkityInjectHeadPlugin({
  ssrIslandsByInputPath,
  cssUrlsByInputPath,
  pageByRelOutputPath,
}: Pick<
  PluginGlobals,
  "ssrIslandsByInputPath" | "cssUrlsByInputPath" | "pageByRelOutputPath"
>): vite.Plugin {
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
          const pageInfo = pageByRelOutputPath.get(ctx.path);
          inputPath = pageInfo?.inputPath;
        }
        if (!inputPath) return [];

        const hasClientsideComponents = Object.values(
          ssrIslandsByInputPath.get(inputPath) ?? {}
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
