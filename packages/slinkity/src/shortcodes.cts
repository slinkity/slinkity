import type { PluginGlobals, UserConfig, ShortcodeThis } from "./~types.cjs";
import {
  toSsrComment,
  toPropComment,
  toResolvedIslandPath,
  extractPropIdsFromHtml,
  toClientScript,
  toIslandExt,
  addPropToStore,
  toIslandId,
  toIslandWrapper,
} from "./~utils.cjs";

export function shortcodes(
  eleventyConfig: any,
  userConfig: UserConfig,
  {
    ssrIslandsByInputPath,
    propsByInputPath,
    extToRendererMap,
    htmlFragmentByIslandId,
  }: Pick<
    PluginGlobals,
    | "ssrIslandsByInputPath"
    | "propsByInputPath"
    | "extToRendererMap"
    | "htmlFragmentByIslandId"
  >
) {
  eleventyConfig.addPairedShortcode(
    "serverOnlyIsland",
    function (
      this: ShortcodeThis,
      htmlWithPropComments: string,
      unresolvedIslandPath: string
    ) {
      const { inputPath } = this.page;
      const islandId = toIslandId();
      const islandPath = toResolvedIslandPath(
        unresolvedIslandPath,
        userConfig.islandsDir
      );
      const { htmlWithoutPropComments, propIds } =
        extractPropIdsFromHtml(htmlWithPropComments);

      const existingSsrComponents = ssrIslandsByInputPath.get(inputPath);
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          isUsedOnClient: false,
          slots: { default: htmlWithoutPropComments },
        },
      });

      return toSsrComment(islandId);
    }
  );

  eleventyConfig.addPairedShortcode(
    "island",
    function (
      this: ShortcodeThis,
      htmlWithPropComments: string,
      unresolvedIslandPath: string,
      ...loadConditions: string[]
    ) {
      const { inputPath } = this.page;
      const renderer = extToRendererMap.get(toIslandExt(unresolvedIslandPath));
      if (typeof renderer?.clientEntrypoint !== "string") {
        throw new Error(
          `No client renderer found for ${JSON.stringify(
            unresolvedIslandPath
          )} in ${JSON.stringify(
            inputPath
          )}! Please add a renderer to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`
        );
      }
      const islandId = toIslandId();
      const islandPath = toResolvedIslandPath(
        unresolvedIslandPath,
        userConfig.islandsDir
      );
      const { htmlWithoutPropComments, propIds } =
        extractPropIdsFromHtml(htmlWithPropComments);

      const props = propsByInputPath.get(inputPath);
      if (propIds.size && props) {
        for (const propId of propIds) {
          props.clientPropIds.add(propId);
        }
      }
      const existingSsrComponents = ssrIslandsByInputPath.get(inputPath);
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          isUsedOnClient: true,
          slots: { default: htmlWithoutPropComments },
        },
      });

      const isClientOnly = false;

      htmlFragmentByIslandId.set(
        islandId,
        toClientScript({
          pageInputPath: inputPath,
          clientRendererPath: renderer.clientEntrypoint,
          islandPath,
          islandId,
          isClientOnly,
          propIds,
        })
      );

      const islandWrapper = toIslandWrapper({
        islandId,
        loadConditions,
        isClientOnly,
      });
      return islandWrapper;
    }
  );

  eleventyConfig.addPairedShortcode(
    "clientOnlyIsland",
    function (
      this: ShortcodeThis,
      htmlWithPropComments: string,
      unresolvedIslandPath: string,
      ...loadConditions: string[]
    ) {
      const { inputPath } = this.page;
      const renderer = extToRendererMap.get(toIslandExt(unresolvedIslandPath));
      if (typeof renderer?.clientEntrypoint !== "string") {
        throw new Error(
          `No client renderer found for ${JSON.stringify(
            unresolvedIslandPath
          )} in ${JSON.stringify(
            inputPath
          )}! Please add a renderer to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`
        );
      }
      const islandId = toIslandId();
      const islandPath = toResolvedIslandPath(
        unresolvedIslandPath,
        userConfig.islandsDir
      );
      const { propIds } = extractPropIdsFromHtml(htmlWithPropComments);
      const props = propsByInputPath.get(inputPath);
      if (propIds.size && props) {
        for (const propId of propIds) {
          props.clientPropIds.add(propId);
        }
      }

      const isClientOnly = true;

      htmlFragmentByIslandId.set(
        islandId,
        toClientScript({
          pageInputPath: inputPath,
          clientRendererPath: renderer.clientEntrypoint,
          islandPath,
          islandId,
          isClientOnly,
          propIds,
        })
      );

      const islandWrapper = toIslandWrapper({
        islandId,
        loadConditions,
        isClientOnly,
      });
      return islandWrapper;
    }
  );

  eleventyConfig.addShortcode(
    "prop",
    function (this: ShortcodeThis, name: string, value: any) {
      const { inputPath } = this.page;
      const { id } = addPropToStore({
        name,
        value,
        propsByInputPath,
        inputPath,
      });

      return toPropComment(id);
    }
  );
}
