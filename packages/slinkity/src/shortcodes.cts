import { yellow } from "kleur/colors";
import type {
  PluginGlobals,
  UserConfig,
  ShortcodeThis,
  RenderOn,
} from "./~types.cjs";
import {
  toPropComment,
  toResolvedIslandPath,
  extractPropIdsFromHtml,
  addPropToStore,
  toIslandId,
  toIslandExt,
  toIslandComment,
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
  "islandsByInputPath" | "propsByInputPath" | "rendererByExt"
>) {
  eleventyConfig.addPairedShortcode(
    "island",
    function (
      this: ShortcodeThis,
      htmlWithPropComments: string,
      unresolvedIslandPath: string,
      ...loadConditions: string[]
    ) {
      const islandId = toIslandId();
      const renderOn = loadConditions.length ? "both" : "server";
      updateIslandsByInputPath({
        islandId,
        renderOn,
        inputPath: this.page.inputPath,
        htmlWithPropComments,
        unresolvedIslandPath,
        loadConditions,
      });

      return toIslandComment(islandId);
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
      const islandId = toIslandId();
      const renderOn = "client";
      updateIslandsByInputPath({
        islandId,
        renderOn,
        inputPath: this.page.inputPath,
        htmlWithPropComments,
        unresolvedIslandPath,
        loadConditions: loadConditions.length
          ? loadConditions
          : ["client:load"],
      });

      return toIslandComment(islandId);
    }
  );

  function updateIslandsByInputPath({
    islandId,
    inputPath,
    htmlWithPropComments,
    unresolvedIslandPath,
    loadConditions,
    renderOn,
  }: {
    islandId: string;
    inputPath: string;
    htmlWithPropComments: string;
    unresolvedIslandPath: string;
    loadConditions: string[];
    renderOn: RenderOn;
  }) {
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
    globals.islandsByInputPath.set(inputPath, {
      ...globals.islandsByInputPath.get(inputPath),
      [islandId]: {
        renderOn,
        islandPath,
        propIds,
        slots: { default: htmlWithoutPropComments },
        unparsedLoadConditions: loadConditions,
        renderer: globals.rendererByExt.get(toIslandExt(islandPath)),
      },
    });
  }

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

  // TODO: remove for 1.0 stable
  eleventyConfig.addShortcode("component", componentRemovedWarning);
  eleventyConfig.addPairedShortcode(
    "slottedComponent",
    componentRemovedWarning
  );
}

function componentRemovedWarning() {
  console.warn(
    yellow(
      `[slinkity] The "component" shortcode has been replaced with "island." This offers new methods for hydration and prop passing. See our shortcode docs for more: https://slinkity.dev/docs/component-shortcodes`
    )
  );
}
