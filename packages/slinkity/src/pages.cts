import { LOADERS } from "./~consts.cjs";
import { islandMetaSchema, PluginGlobals, UserConfig } from "./~types.cjs";
import {
  toSsrComment,
  addPropToStore,
  toIslandRoot,
  toResolvedPath,
  toIslandId,
} from "./~utils.cjs";

export function pages({
  eleventyConfig,
  ...globals
}: { eleventyConfig: any } & Pick<
  PluginGlobals,
  | "ssrIslandsByInputPath"
  | "propsByInputPath"
  | "extToRendererMap"
  | "viteServer"
  | "islandIdToLoaderParams"
>) {
  for (const [ext, renderer] of globals.extToRendererMap.entries()) {
    if (renderer.page) {
      eleventyConfig.addTemplateFormats(ext);
      eleventyConfig.addExtension(ext, {
        read: false,
        async getData(inputPath: string) {
          const server = await globals.viteServer.getOrInitialize();
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
          return async function render(serverData: Record<string, any>) {
            const islandId = toIslandId();
            const islandPath = toResolvedPath(inputPath);
            const existingSsrComponents =
              globals.ssrIslandsByInputPath.get(inputPath);

            const server = await globals.viteServer.getOrInitialize();
            const Component = await server.ssrLoadModule(inputPath);
            const unparsedIslandMeta = await renderer
              .page?.({ Component })
              .getIslandMeta();

            let isUsedOnClient = false;
            let loadConditions: typeof LOADERS[number][] = [];
            let props = serverData;

            if (unparsedIslandMeta) {
              const islandMetaRes =
                islandMetaSchema.safeParse(unparsedIslandMeta);
              if (!islandMetaRes.success) {
                throw new Error(
                  `"island" export in ${JSON.stringify(
                    inputPath
                  )} is invalid. Try importing the "IslandExport" type from "slinkity." Usage: https://slinkity.dev/docs/component-pages-layouts/#handle-props-on-hydrated-components`
                );
              }
              const islandMeta = islandMetaRes.data;
              if (islandMeta === true) {
                props = {};
                loadConditions = ["client:load"];
              } else if (typeof islandMeta === "object") {
                props = await islandMeta.props(serverData);
                loadConditions =
                  typeof islandMeta.when === "string"
                    ? [islandMeta.when]
                    : islandMeta.when;
              }
            }

            const propIds: Set<string> = new Set();

            for (const [name, value] of Object.entries(props)) {
              const { id } = addPropToStore({
                name,
                value,
                propsByInputPath: globals.propsByInputPath,
                inputPath,
                isUsedOnClient,
              });
              propIds.add(id);
            }

            globals.ssrIslandsByInputPath.set(inputPath, {
              ...existingSsrComponents,
              [islandId]: {
                islandPath,
                propIds,
                isUsedOnClient,
                slots: { default: "" },
              },
            });

            if (isUsedOnClient) {
              // Client-only page templates are not supported!
              const isClientOnly = false;
              globals.islandIdToLoaderParams.set(islandId, {
                islandPath,
                loadConditions,
                pageInputPath: inputPath,
                propIds: [...propIds],
                isClientOnly,
              });
              return toIslandRoot({ isClientOnly, islandId });
            } else {
              return toSsrComment(islandId);
            }
          };
        },
      });
    }
  }
}
