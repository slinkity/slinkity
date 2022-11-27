import type { IncomingMessage, ServerResponse } from "http";
import * as path from "path";
import type {
  CssUrlsByInputPath,
  EleventyEventParams,
  RendererByExt,
  PageByRelOutputPath,
  PropsByInputPath,
  RenderedContent,
  Renderer,
  RunMode,
  SsrIslandsByInputPath,
  TransformThis,
  RenderedContentByUrl,
  UserConfig,
  EleventyDir,
} from "./~types.cjs";
import {
  toSsrComment,
  SlinkityInternalError,
  toIslandExt,
  collectCSSImportedViaEsm,
  toResolvedVirtualModId,
  prependForwardSlash,
} from "./~utils.cjs";
import { defineConfig } from "./defineConfig.cjs";
import { pages } from "./pages.cjs";
import { shortcodes } from "./shortcodes.cjs";
import { createViteServer, productionBuild } from "./vite.cjs";
import { PROPS_VIRTUAL_MOD } from "./~consts.cjs";
import { normalizePath } from "vite";

export function plugin(
  eleventyConfig: any,
  unresolvedUserConfig: Partial<UserConfig>
) {
  const propsByInputPath: PropsByInputPath = new Map();
  const ssrIslandsByInputPath: SsrIslandsByInputPath = new Map();
  const cssUrlsByInputPath: CssUrlsByInputPath = new Map();
  const pageByRelOutputPath: PageByRelOutputPath = new Map();
  /** Used to serve content within dev server middleware */
  const renderedContentByUrl: RenderedContentByUrl = new Map();

  const eleventyDir: EleventyDir = eleventyConfig.dir;
  let runMode: RunMode = "build";
  eleventyConfig.on(
    "eleventy.before",
    function (params: EleventyEventParams["before"]) {
      runMode = params.runMode;
    }
  );

  const userConfig = defineConfig(unresolvedUserConfig);
  userConfig.islandsDir = path.resolve(
    eleventyDir.input,
    userConfig.islandsDir
  );
  const rendererByExt: RendererByExt = new Map(
    userConfig.renderers
      .map((renderer) =>
        renderer.extensions.map((ext): [string, Renderer] => [ext, renderer])
      )
      .flat()
  );

  const viteServer = createViteServer({
    userConfig,
    cssUrlsByInputPath,
    propsByInputPath,
    pageByRelOutputPath,
    rendererByExt,
    eleventyDir,
  });

  // TODO: find way to flip back on
  // When set to "true," Vite will try to resolve emulated copies via middleware.
  // These don't exist in _site since 11ty manages via memory.
  eleventyConfig.setServerPassthroughCopyBehavior(false);
  // TODO: handle _includes
  eleventyConfig.ignores.add(userConfig.islandsDir);

  eleventyConfig.on(
    "eleventy.beforeWatch",
    async function (changedFiles: string[]) {
      for (const changedFile of changedFiles) {
        // Empty props before shortcodes repopulate
        propsByInputPath.delete(changedFile);
      }
    }
  );

  eleventyConfig.on(
    "eleventy.after",
    async function ({ results, runMode }: EleventyEventParams["after"]) {
      // Dev: Invalidate virtual modules across pages. Ex. inline scripts, component props
      const urlsToInvalidate: string[] = [];
      const server = await viteServer.getOrInitialize();

      for (const { content, inputPath, outputPath, url } of results) {
        const relOutputPath = prependForwardSlash(
          normalizePath(path.relative(eleventyDir.output, outputPath))
        );
        pageByRelOutputPath.set(relOutputPath, {
          inputPath,
          outputPath,
          url,
        });

        if (runMode === "serve") {
          renderedContentByUrl.set(url, {
            content,
            inputPath,
            outputPath,
          });

          const inlineScriptBase = toResolvedVirtualModId(relOutputPath);
          for (let key of server.moduleGraph.urlToModuleMap.keys()) {
            if (key.startsWith(inlineScriptBase)) {
              urlsToInvalidate.push(key);
            }
          }
          const islandPropsUrl = `${toResolvedVirtualModId(
            PROPS_VIRTUAL_MOD
          )}?${new URLSearchParams({
            inputPath,
          })}`;
          urlsToInvalidate.push(islandPropsUrl);
        }
      }
      if (runMode === "serve") {
        await Promise.all(
          urlsToInvalidate.map(async (url) => {
            const mod = await server.moduleGraph.getModuleByUrl(url);
            if (mod) server.moduleGraph.invalidateModule(mod);
          })
        );
      }

      if (runMode === "build") {
        // Server is used for resolving components
        // in shortcodes and pages.
        // Close now that this is complete.
        await server.close();
        await productionBuild({
          userConfig,
          eleventyDir,
          propsByInputPath,
          cssUrlsByInputPath,
          pageByRelOutputPath,
          rendererByExt: rendererByExt,
        });
      }
    }
  );

  shortcodes({
    eleventyConfig,
    userConfig,
    ssrIslandsByInputPath,
    propsByInputPath,
    rendererByExt: rendererByExt,
  });

  pages({
    eleventyConfig,
    ssrIslandsByInputPath,
    propsByInputPath,
    rendererByExt: rendererByExt,
    viteServer,
  });

  /**
   * Replace SSR comments with rendered component content
   */
  async function handleSsrComments({
    content,
    inputPath,
    outputPath,
  }: RenderedContent): Promise<string> {
    const islands = ssrIslandsByInputPath.get(inputPath);
    if (!islands)
      throw new SlinkityInternalError(
        `No islands found for inputPath ${JSON.stringify(inputPath)}`
      );

    const ssrRegex = new RegExp(toSsrComment("(.*)"), "g");
    const ssrMatches = [...content.matchAll(ssrRegex)];
    const ssrContentByIslandId = new Map();

    await Promise.all(
      ssrMatches.map(async ([, islandId]) => {
        if (islands[islandId]) {
          const { islandPath, propIds } = islands[islandId];
          const islandExt = toIslandExt(islandPath);
          if (!islandExt) {
            throw new Error(
              `Missing file extension on ${JSON.stringify(
                islandPath
              )} in ${JSON.stringify(
                inputPath
              )}! Please add a file extension, like ${JSON.stringify(
                `${islandPath}.${[...rendererByExt.keys()][0] ?? "jsx"}`
              )})`
            );
          }
          const islandRenderer = rendererByExt.get(islandExt);
          if (!islandRenderer?.ssr) {
            throw new Error(
              `No SSR renderer found for ${JSON.stringify(
                islandPath
              )} in ${JSON.stringify(
                inputPath
              )}! Please add a render to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`
            );
          }
          const server = await viteServer.getOrInitialize();
          const Component = await server.ssrLoadModule(islandPath);
          const collectedCssUrls: Set<string> = new Set();
          const moduleGraph = await server.moduleGraph.getModuleByUrl(
            islandPath
          );
          if (moduleGraph) {
            collectCSSImportedViaEsm(moduleGraph, collectedCssUrls);
          }

          cssUrlsByInputPath.set(inputPath, collectedCssUrls);

          const propsById = propsByInputPath.get(inputPath)?.props ?? {};
          const props: Record<string, any> = {};
          for (let propId of propIds) {
            const { name, value } = propsById[propId];
            props[name] = value;
          }

          const boundJsFns: Record<string, (...args: any) => any> = {};
          for (let fnName in eleventyConfig.javascriptFunctions) {
            boundJsFns[fnName] = eleventyConfig.javascriptFunctions[
              fnName
            ].bind({
              page: { inputPath, outputPath },
            });
          }
          // TODO: support slots
          const { html } = await islandRenderer.ssr({
            Component,
            props,
            ssrLoadModule: server.ssrLoadModule,
            javascriptFunctions: boundJsFns,
          });
          ssrContentByIslandId.set(islandId, html);
        } else {
          throw new SlinkityInternalError(
            `Failed to find island for SSR with id "${islandId}"`
          );
        }
      })
    );

    return content.replace(ssrRegex, (_, islandId) =>
      ssrContentByIslandId.get(islandId)
    );
  }

  eleventyConfig.setServerOptions({
    enabled: false,
    domdiff: false,
    async setup() {
      const server = await viteServer.getOrInitialize();
      return {
        middleware: [
          server.middlewares,
          async function applyViteHtmlTransform(
            req: IncomingMessage,
            res: ServerResponse,
            next: Function
          ) {
            if (!req.url) {
              next();
              return;
            }
            const page = renderedContentByUrl.get(req.url);
            if (page) {
              const html = await handleSsrComments(page);

              res.setHeader("Content-Type", "text/html");
              res.write(
                await server.transformIndexHtml(req.url, html, page.inputPath)
              );
              res.end();
            } else {
              next();
            }
          },
        ],
      };
    },
  });

  eleventyConfig.addTransform(
    "slinkity-prod-handle-ssr-comments",
    async function (this: TransformThis, content: string) {
      if (runMode !== "build") return content;

      const html = await handleSsrComments({
        content,
        outputPath: this.outputPath,
        inputPath: this.inputPath,
      });
      return html;
    }
  );
}
