import * as fs from "fs";
import * as path from "path";
import { outputFile } from "fs-extra";
import type { IncomingMessage, ServerResponse } from "http";
import {
  toSsrComment,
  toClientPropsPathFromOutputPath,
  SlinkityInternalError,
  toIslandExt,
  collectCSS,
} from "./~utils.cjs";
import { pages } from "./pages.cjs";
import type {
  CssUrlsByInputPath,
  EleventyEventParams,
  ExtToRendererMap,
  PropsByInputPath,
  RenderedContent,
  Renderer,
  SsrIslandsByInputPath,
  UrlToRenderedContentMap,
  UserConfig,
} from "./~types.cjs";
import { createViteServer } from "./viteServer.cjs";
import { defineConfig } from "./defineConfig.cjs";
import { shortcodes } from "./shortcodes.cjs";

export function plugin(
  eleventyConfig: any,
  unresolvedUserConfig: Partial<UserConfig>
) {
  const propsByInputPath: PropsByInputPath = new Map();
  const ssrIslandsByInputPath: SsrIslandsByInputPath = new Map();
  const cssUrlsByInputPath: CssUrlsByInputPath = new Map();
  const urlToRenderedContentMap: UrlToRenderedContentMap = new Map();

  const userConfig = defineConfig(unresolvedUserConfig);
  const extToRendererMap: ExtToRendererMap = new Map(
    userConfig.renderers
      .map((renderer) =>
        renderer.extensions.map((ext): [string, Renderer] => [ext, renderer])
      )
      .flat()
  );

  const viteServer = createViteServer(userConfig, {
    cssUrlsByInputPath,
    ssrIslandsByInputPath,
  });

  // TODO: find way to flip back on
  // When set to "true," Vite will try to resolve emulated copies via middleware.
  // These don't exist in _site since 11ty manages via memory,
  // so Vite blows up!
  eleventyConfig.setServerPassthroughCopyBehavior(false);
  eleventyConfig.ignores.add(userConfig.islandsDir);

  eleventyConfig.on(
    "eleventy.after",
    async function ({ results, runMode }: EleventyEventParams["after"]) {
      if (runMode === "serve") {
        for (let { content, inputPath, outputPath, url } of results) {
          // used for serving content within dev server middleware
          urlToRenderedContentMap.set(url, {
            content,
            inputPath,
            outputPath,
          });
        }
      }
    }
  );

  shortcodes(eleventyConfig, userConfig, {
    ssrIslandsByInputPath,
    propsByInputPath,
    extToRendererMap,
  });

  pages(eleventyConfig, userConfig, {
    ssrIslandsByInputPath,
    propsByInputPath,
    extToRendererMap,
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
                `${islandPath}.${[...extToRendererMap.keys()][0] ?? "jsx"}`
              )})`
            );
          }
          const islandRenderer = extToRendererMap.get(islandExt);
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
            collectCSS(moduleGraph, collectedCssUrls);
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
          async function applyViteHtmlTransformasync(
            req: IncomingMessage,
            res: ServerResponse,
            next: Function
          ) {
            if (!req.url) {
              next();
              return;
            }
            const page = urlToRenderedContentMap.get(req.url);
            if (page) {
              const html = await handleSsrComments(page);
              await createPropsFile(page);

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

  async function createPropsFile({
    content,
    outputPath,
    inputPath,
  }: RenderedContent) {
    const propInfo = propsByInputPath.get(inputPath);
    if (propInfo?.clientPropIds.size) {
      const { hasStore, props, clientPropIds } = propInfo;
      let propsFileContents = "export default {\n";
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
        propsFileContents +=
          "\n" + (await fs.promises.readFile("./utils/store.client.mjs"));
      }
      const clientPropsPath = path.join(
        eleventyConfig.dir.output,
        toClientPropsPathFromOutputPath(outputPath, eleventyConfig.dir.output)
      );
      await outputFile(clientPropsPath, propsFileContents);
    }

    return content;
  }
}
