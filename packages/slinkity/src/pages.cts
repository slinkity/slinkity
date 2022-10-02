import { z } from "zod";
import type { PluginGlobals, UserConfig } from "./~types.cjs";
import {
  toSsrComment,
  addPropToStore,
  toClientScript,
  toClientPropsPathFromOutputPath,
  toResolvedPath,
  toIslandId,
} from "./~utils.cjs";

const islandMetaSchema = z.union([
  z.boolean(),
  z.object({
    on: z.array(z.string()).optional(),
    props: z
      .function(
        z.tuple([z.any()]),
        z.union([z.record(z.any()), z.promise(z.record(z.any()))])
      )
      .optional(),
  }),
]);

export function pages(
  eleventyConfig: any,
  userConfig: UserConfig,
  {
    ssrIslandsByInputPath,
    propsByInputPath,
    extToRendererMap,
    viteServer,
  }: Pick<
    PluginGlobals,
    | "ssrIslandsByInputPath"
    | "propsByInputPath"
    | "extToRendererMap"
    | "viteServer"
  >
) {
  for (const [ext, renderer] of extToRendererMap.entries()) {
    if (renderer.page) {
      eleventyConfig.addTemplateFormats(ext);
      eleventyConfig.addExtension(ext, {
        read: false,
        async getData(inputPath: string) {
          const server = await viteServer.getOrInitialize();
          const Component = await server.ssrLoadModule(inputPath);
          return await renderer.page?.({ Component }).getData();
        },
        compileOptions: {
          permalink() {
            const __functions = this;
            return function render({
              permalink,
              ...data
            }: {
              permalink(data: any): string;
            }) {
              if (typeof permalink === "function") {
                return permalink({ ...data, __functions });
              } else {
                return permalink;
              }
            };
          },
        },
        compile(dataOrPermalink: any, inputPath: string) {
          return async function render(serverData: any) {
            const islandId = toIslandId();
            const islandPath = toResolvedPath(inputPath);
            const existingSsrComponents = ssrIslandsByInputPath.get(inputPath);

            const server = await viteServer.getOrInitialize();
            const Component = await server.ssrLoadModule(inputPath);
            const unparsedIslandMeta = await renderer
              .page?.({ Component })
              .getIslandMeta();

            let isUsedOnClient = false;
            let loadConditions: string[] = [];
            /** @type {Record<string, any>} */
            let props = serverData;

            if (unparsedIslandMeta) {
              let islandMeta;
              try {
                islandMeta = islandMetaSchema.parse(unparsedIslandMeta);
              } catch {
                throw new Error(
                  `Unable to parse the "island" export from ${JSON.stringify(
                    inputPath
                  )}. Try importing the "IslandExport" type from "slinkity" for some helpful autocomplete. See our docs for usage: https://slinkity.dev/docs/component-pages-layouts/#handle-props-on-hydrated-components`
                );
              }
              isUsedOnClient =
                islandMeta === true || typeof islandMeta === "object";
              if (isUsedOnClient) {
                props =
                  typeof islandMeta === "object" &&
                  typeof islandMeta.props === "function"
                    ? await islandMeta.props(serverData)
                    : {};
                loadConditions =
                  typeof islandMeta === "object" && Array.isArray(islandMeta.on)
                    ? islandMeta.on.map(
                        (loadCondition) => `on:${loadCondition}`
                      )
                    : [];
              }
            }

            const propIds: Set<string> = new Set();

            for (const [name, value] of Object.entries(props)) {
              const { id } = addPropToStore({
                name,
                value,
                propsByInputPath,
                inputPath,
                isUsedOnClient,
              });
              propIds.add(id);
            }

            ssrIslandsByInputPath.set(inputPath, {
              ...existingSsrComponents,
              [islandId]: {
                islandPath,
                propIds,
                isUsedOnClient,
                slots: { default: "" },
              },
            });

            if (isUsedOnClient) {
              const clientPropsPath = toClientPropsPathFromOutputPath(
                serverData.page.outputPath,
                eleventyConfig.dir.output
              );
              return toClientScript({
                // Client-only page templates are not supported!
                isClientOnly: false,
                islandId,
                islandPath,
                loadConditions,
                clientPropsPath,
                clientRendererPath: renderer.clientEntrypoint,
                propIds,
              });
            } else {
              return toSsrComment(islandId);
            }
          };
        },
      });
    }
  }
}
