import type {
  EleventyDir,
  PluginGlobals,
  UserConfig,
  ViteServerFactory,
} from "./~types.cjs";
import * as vite from "vite";
import * as path from "path";
import * as fs from "fs";
import { sync as globSync } from "fast-glob";
import { PROPS_VIRTUAL_MOD } from "./~consts.cjs";
import { toResolvedVirtualModId } from "./~utils.cjs";

export async function productionBuild({
  userConfig,
  eleventyDir,
  ...globals
}: {
  userConfig: UserConfig;
  eleventyDir: EleventyDir;
} & Pick<
  PluginGlobals,
  | "propsByInputPath"
  | "cssUrlsByInputPath"
  | "pageByRelOutputPath"
  | "rendererByExt"
>) {
  const eleventyTempBuildDir = path.relative(".", userConfig.buildTempDir);
  const resolvedOutput = path.resolve(eleventyDir.output);
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
        slinkityPropsPlugin(globals),
        slinkityInjectHeadPlugin(globals),
      ],
      resolve: {
        alias: getAliases({ eleventyDir }),
      },
      build: {
        minify: false,
        outDir: resolvedOutput,
        emptyOutDir: true,
        rollupOptions: {
          input: inputFiles,
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

export function createViteServer({
  userConfig,
  eleventyDir,
  ...globals
}: {
  userConfig: UserConfig;
  eleventyDir: EleventyDir;
} & Pick<
  PluginGlobals,
  | "cssUrlsByInputPath"
  | "propsByInputPath"
  | "pageByRelOutputPath"
  | "rendererByExt"
>): ViteServerFactory {
  let viteConfig: vite.InlineConfig = {
    clearScreen: false,
    appType: "custom",
    server: {
      middlewareMode: true,
    },
    plugins: [slinkityPropsPlugin(globals), slinkityInjectHeadPlugin(globals)],
    resolve: {
      alias: getAliases({ eleventyDir }),
    },
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
  const resolvedVirtualModuleId = toResolvedVirtualModId(PROPS_VIRTUAL_MOD);

  return {
    name: "slinkity-props-plugin",
    resolveId(id) {
      if (id.startsWith(PROPS_VIRTUAL_MOD)) {
        return id.replace(PROPS_VIRTUAL_MOD, resolvedVirtualModuleId);
      }
    },
    async load(id) {
      if (id.startsWith(resolvedVirtualModuleId)) {
        const { searchParams } = new URL(id, "file://");
        const inputPath = searchParams.get("inputPath");
        if (!inputPath) return;

        let code = "export default {\n";
        const propInfo = propsByInputPath.get(inputPath);
        if (propInfo?.clientPropIds.size) {
          const { hasStore, props, clientPropIds } = propInfo;
          for (const clientPropId of clientPropIds) {
            const { name, getSerializedValue } = props[clientPropId];
            const serializedKey = JSON.stringify(clientPropId);
            const serializedEntry = `{ name: ${JSON.stringify(
              name
            )}, value: ${getSerializedValue()} }`;
            code += `  ${serializedKey}: ${serializedEntry},\n`;
          }
          code += "}";
          if (hasStore) {
            // TODO: make this better
            code +=
              "\n" + (await fs.promises.readFile("./utils/store.client.mjs"));
          }
        }
        return { code };
      }
    },
  };
}

function slinkityInjectHeadPlugin(
  globals: Pick<PluginGlobals, "cssUrlsByInputPath" | "pageByRelOutputPath">
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

        const collectedCss = globals.cssUrlsByInputPath.get(inputPath);
        if (!collectedCss) return [];

        return [...collectedCss].map((href) => ({
          tag: "link",
          attrs: { rel: "stylesheet", href },
        }));
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

function getAliases({
  eleventyDir,
}: {
  eleventyDir: EleventyDir;
}): vite.AliasOptions {
  return {
    "/@root": process.cwd(),
    "/@input": path.resolve(process.cwd(), eleventyDir.input),
    "/@layouts": path.resolve(
      process.cwd(),
      eleventyDir.layouts ?? eleventyDir.includes
    ),
    "/@includes": path.resolve(process.cwd(), eleventyDir.includes),
  };
}
