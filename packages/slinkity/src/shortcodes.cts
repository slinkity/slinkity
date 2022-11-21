import type { PluginGlobals, UserConfig, ShortcodeThis } from "./~types.cjs";
import {
  toSsrComment,
  toPropComment,
  toResolvedIslandPath,
  extractPropIdsFromHtml,
  toIslandRoot,
  addPropToStore,
  toIslandId,
} from "./~utils.cjs";

export function shortcodes({
  eleventyConfig,
  userConfig,
  ...globals
}: {
  eleventyConfig: any;
  userConfig: UserConfig;
} & Pick<
  PluginGlobals,
  "ssrIslandsByInputPath" | "propsByInputPath" | "islandIdToLoaderParams"
>) {
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

      const existingSsrComponents =
        globals.ssrIslandsByInputPath.get(inputPath);
      globals.ssrIslandsByInputPath.set(inputPath, {
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
      const islandId = toIslandId();
      const islandPath = toResolvedIslandPath(
        unresolvedIslandPath,
        userConfig.islandsDir
      );
      const { htmlWithoutPropComments, propIds } =
        extractPropIdsFromHtml(htmlWithPropComments);

      const props = globals.propsByInputPath.get(inputPath);
      if (propIds.size && props) {
        for (const propId of propIds) {
          props.clientPropIds.add(propId);
        }
      }
      const existingSsrComponents =
        globals.ssrIslandsByInputPath.get(inputPath);
      globals.ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          isUsedOnClient: true,
          slots: { default: htmlWithoutPropComments },
        },
      });
      const isClientOnly = false;
      globals.islandIdToLoaderParams.set(islandId, {
        islandPath,
        loadConditions,
        pageInputPath: inputPath,
        propIds: [...propIds],
        isClientOnly,
      });
      return toIslandRoot({ isClientOnly, islandId });
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
      const islandId = toIslandId();
      const islandPath = toResolvedIslandPath(
        unresolvedIslandPath,
        userConfig.islandsDir
      );
      const { propIds } = extractPropIdsFromHtml(htmlWithPropComments);
      const props = globals.propsByInputPath.get(inputPath);
      if (propIds.size && props) {
        for (const propId of propIds) {
          props.clientPropIds.add(propId);
        }
      }

      const isClientOnly = true;
      globals.islandIdToLoaderParams.set(islandId, {
        islandPath,
        loadConditions,
        pageInputPath: inputPath,
        propIds: [...propIds],
        isClientOnly,
      });
      return toIslandRoot({ isClientOnly, islandId });
    }
  );

  eleventyConfig.addShortcode(
    "prop",
    function (this: ShortcodeThis, name: string, value: any) {
      const { inputPath } = this.page;
      const { id } = addPropToStore({
        name,
        value,
        propsByInputPath: globals.propsByInputPath,
        inputPath,
      });

      return toPropComment(id);
    }
  );
}
