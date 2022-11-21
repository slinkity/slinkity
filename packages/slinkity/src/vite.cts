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
import { ISLAND_VIRTUAL_MOD, LOADERS, PROPS_VIRTUAL_MOD } from "./~consts.cjs";
import { z } from "zod";
import { toIslandExt, toResolveViteVirtualMod } from "./~utils.cjs";

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
  | "pageByRelOutputPath"
  | "extToRendererMap"
  | "islandIdToLoaderParams"
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
        slinkityPropsPlugin(globals),
        slinkityInjectHeadPlugin(globals),
        slinkityIslandLoaderPlugin(globals),
      ],
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
  ...globals
}: {
  userConfig: UserConfig;
} & Pick<
  PluginGlobals,
  | "cssUrlsByInputPath"
  | "propsByInputPath"
  | "pageByRelOutputPath"
  | "extToRendererMap"
  | "islandIdToLoaderParams"
>): ViteServerFactory {
  let viteConfig: vite.InlineConfig = {
    clearScreen: false,
    appType: "custom",
    server: {
      middlewareMode: true,
    },
    plugins: [
      slinkityPropsPlugin(globals),
      slinkityInjectHeadPlugin(globals),
      slinkityIslandLoaderPlugin(globals),
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
  const resolvedVirtualModuleId = toResolveViteVirtualMod(PROPS_VIRTUAL_MOD);

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
        console.log({ id, code });
        return { code };
      }
    },
  };
}

function slinkityIslandLoaderPlugin(
  globals: Pick<PluginGlobals, "extToRendererMap" | "islandIdToLoaderParams">
): vite.Plugin {
  const resolvedVirtualModuleId = toResolveViteVirtualMod(ISLAND_VIRTUAL_MOD);

  return {
    name: "slinkity-island-loader-plugin",
    resolveId(id) {
      if (id.startsWith(ISLAND_VIRTUAL_MOD)) {
        return id.replace(ISLAND_VIRTUAL_MOD, toResolveViteVirtualMod);
      }
    },
    async load(id) {
      if (!id.startsWith(resolvedVirtualModuleId)) return;

      const { searchParams } = new URL(id, "file://");
      const islandId = searchParams.get("id");
      if (!islandId) return;
      const loaderParams = globals.islandIdToLoaderParams.get(islandId);
      if (!loaderParams) return;

      const renderer = globals.extToRendererMap.get(
        toIslandExt(loaderParams.islandPath)
      );
      if (typeof renderer?.clientEntrypoint !== "string") {
        throw new Error(
          `No client renderer found for ${JSON.stringify(
            loaderParams.islandPath
          )} in ${JSON.stringify(
            loaderParams.pageInputPath
          )}! Please add a renderer to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`
        );
      }
      const { clientEntrypoint } = renderer;
      const loadConditions: [
        client: typeof LOADERS[number],
        options: string
      ][] = loaderParams.loadConditions.map((loadCondition) => {
        const firstEqualsIdx = loadCondition.indexOf("=");
        const rawKey =
          firstEqualsIdx === -1
            ? loadCondition
            : loadCondition.slice(0, firstEqualsIdx);
        const options =
          firstEqualsIdx === -1 ? "" : loadCondition.slice(firstEqualsIdx);
        const key = z.enum(LOADERS).safeParse(rawKey);
        if (!key.success) {
          throw new Error(
            `[slinkity] ${JSON.stringify(rawKey)} in ${JSON.stringify(
              loaderParams.pageInputPath
            )} is not a valid client directive. Try client:load, client:idle, or other valid directives (https://slinkity.dev/docs/partial-hydration/).`
          );
        }
        return [key.data, options];
      });

      function toImportName(client: typeof LOADERS[number]) {
        return client.replace("client:", "");
      }
      const propsImportParams = new URLSearchParams({
        inputPath: loaderParams.pageInputPath,
      });
      return `${loadConditions
        .map(([client]) => {
          const importName = toImportName(client);
          return `import ${importName} from "slinkity/client/${importName}";`;
        })
        .join("\n")}
          ${
            loaderParams.propIds.length
              ? `
          import propsById from ${JSON.stringify(
            `${PROPS_VIRTUAL_MOD}?${propsImportParams}`
          )};
          const props = {};
          for (let propId of ${JSON.stringify(loaderParams.propIds)}) {
            const { name, value } = propsById[propId];
            props[name] = value;
          }
          `
              : `
          const props = {};
          `
          }
        const target = document.querySelector('slinkity-root[data-id=${JSON.stringify(
          islandId
        )}]');
        Promise.race([
          ${loadConditions
            .map(([client, options]) => {
              const importName = toImportName(client);
              return `${importName}({ target, options: ${JSON.stringify(
                options
              )} })`;
            })
            .join(",\n")}
        ]).then(async function () {
          const [{ default: Component }, { default: renderer }] = await Promise.all([
            import(${JSON.stringify(loaderParams.islandPath)}),
            import(${JSON.stringify(clientEntrypoint)}),
          ]);
          renderer({ Component, target, props, isClientOnly: ${JSON.stringify(
            loaderParams.isClientOnly
          )} });
        });`;
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
