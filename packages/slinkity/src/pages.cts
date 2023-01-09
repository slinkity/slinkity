import { ZodError } from 'zod';
import { LOADERS } from './~consts.cjs';
import { islandMetaSchema, PluginGlobals } from './~types.cjs';
import {
  addPropToStore,
  toResolvedPath,
  toIslandId,
  toIslandExt,
  toIslandComment,
} from './~utils.cjs';

export function pages({
  eleventyConfig,
  ...globals
}: { eleventyConfig: any } & Pick<
  PluginGlobals,
  'islandsByInputPath' | 'propsByInputPath' | 'rendererByExt' | 'viteServer'
>) {
  for (const [ext, renderer] of globals.rendererByExt.entries()) {
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
            return function render(
              this: Record<string, any>,
              { permalink, ...data }: { permalink(data: any, functions: any): string },
            ) {
              if (typeof permalink === 'function') {
                return permalink(data, this);
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
            const existingSsrComponents = globals.islandsByInputPath.get(inputPath);

            const server = await globals.viteServer.getOrInitialize();
            const Component = await server.ssrLoadModule(inputPath);
            const unparsedIslandMeta = await renderer.page?.({ Component }).getIslandMeta();

            let loadConditions: typeof LOADERS[number][] = [];
            let props = serverData;

            if (unparsedIslandMeta) {
              const islandMetaRes = islandMetaSchema.safeParse(unparsedIslandMeta);
              if (!islandMetaRes.success) {
                throw new Error(
                  `"island" export in ${JSON.stringify(
                    inputPath,
                  )} is invalid. Try importing the "IslandExport" type from "slinkity." Usage: https://slinkity.dev/docs/component-pages-layouts/#handle-props-on-hydrated-components`,
                );
              }
              const islandMeta = islandMetaRes.data;
              try {
                const propsRes = islandMeta.props
                  ? islandMeta.props(
                      serverData,
                      eleventyConfig.javascriptFunctions as Record<string, any>,
                    )
                  : {};

                props = propsRes instanceof Promise ? await propsRes : propsRes;
              } catch (e) {
                if (e instanceof ZodError) {
                  throw new Error(
                    'Props functions must return an object. Check the "props" function in your "island" export.',
                  );
                } else throw e;
              }
              loadConditions =
                typeof islandMeta.when === 'string' ? [islandMeta.when] : islandMeta.when;
            }

            const propIds: Set<string> = new Set();
            const isUsedOnClient = loadConditions.length > 0;

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

            globals.islandsByInputPath.set(inputPath, {
              ...existingSsrComponents,
              [islandId]: {
                islandPath,
                propIds,
                renderOn: isUsedOnClient ? 'both' : 'server',
                slots: { default: '' },
                unparsedLoadConditions: loadConditions,
                renderer: globals.rendererByExt.get(toIslandExt(islandPath)),
              },
            });

            return toIslandComment(islandId);
          };
        },
      });
    }
  }
}
