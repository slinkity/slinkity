import { nanoid } from "nanoid";
import devalue from "devalue";
import * as path from "path";
import * as vite from "vite";
import type { PropsByInputPath } from "./~types.cjs";

export class SlinkityInternalError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "[Slinkity internal]";
  }
}

/** @param {string} id Either a prop ID or regex to concat */
export function toPropComment(id: string) {
  return `<!--slinkity-prop ${id}-->`;
}

export function toIslandId() {
  return nanoid(6);
}

export function toIslandVirtualModId(islandIdOrRegExp: string) {
  return `slinkity:island:${islandIdOrRegExp}.html`;
}

/** Used to manually split island loaders to separate chunks during prod builds */
export function toIslandScriptId(islandIdOrRegExp: string) {
  return `slinkity-island-script-${islandIdOrRegExp}`;
}

export function toSsrComment(idOrRegExp: string) {
  return `<!--slinkity-ssr ${idOrRegExp}-->`;
}

export function toIslandComment(id: string) {
  return `<!--slinkity-script ${id}-->`;
}

export function toResolvedIslandPath(
  unresolvedIslandPath: string,
  islandsDir: string
) {
  return vite.normalizePath(path.resolve(islandsDir, unresolvedIslandPath));
}

export function toResolvedPath(...pathSegments: string[]) {
  return vite.normalizePath(path.resolve(...pathSegments));
}

export function extractPropIdsFromHtml(html: string): {
  htmlWithoutPropComments: string;
  propIds: Set<string>;
} {
  const propRegex = new RegExp(toPropComment("(.*)"), "g");
  const matches = [...html.matchAll(propRegex)];

  return {
    htmlWithoutPropComments: html.replace(propRegex, "").trim(),
    propIds: new Set(
      matches.map(([, id]) => {
        return id;
      })
    ),
  };
}

export function prependForwardSlash(pathStr: string) {
  return pathStr.startsWith("/") ? pathStr : "/" + pathStr;
}

export function toIslandExt(islandPath: string): string {
  return path.extname(islandPath).replace(/^\./, "");
}

type AddPropToStoreParams = {
  name: string;
  value: any;
  propsByInputPath: PropsByInputPath;
  inputPath: string;
  isUsedOnClient?: boolean;
};

export function addPropToStore({
  name,
  value,
  propsByInputPath,
  inputPath,
  isUsedOnClient,
}: AddPropToStoreParams): { id: string } {
  const existingPropsInfo = propsByInputPath.get(inputPath);
  let getSerializedValue, id;
  let hasStore = Boolean(existingPropsInfo?.hasStore);
  if (
    typeof value === "object" &&
    value !== null &&
    value.isSlinkityStoreFactory
  ) {
    getSerializedValue = () => `new SlinkityStore(${devalue(value.value)})`;
    id = value.id;
    hasStore = true;
  } else {
    getSerializedValue = () => devalue(value);
    id = toIslandId();
  }
  const clientPropIds = new Set(existingPropsInfo?.clientPropIds ?? []);
  if (isUsedOnClient) {
    clientPropIds.add(id);
  }
  propsByInputPath.set(inputPath, {
    hasStore,
    clientPropIds,
    props: {
      ...(existingPropsInfo?.props ?? {}),
      [id]: { name, value, getSerializedValue },
    },
  });

  return { id };
}

export function toClientScript({
  islandId,
  islandPath,
  pageInputPath,
  clientRendererPath,
  isClientOnly,
  propIds,
}: {
  pageInputPath: string;
  islandId: string;
  islandPath: string;
  clientRendererPath: string;
  isClientOnly: boolean;
  propIds: Set<string>;
}) {
  const clientScript = `<script type="module">
  // ${toIslandScriptId(islandId)}
  import Component from ${JSON.stringify(islandPath)};
  import render from ${JSON.stringify(clientRendererPath)};
  ${
    propIds.size
      ? `
  import propsById from ${JSON.stringify(`slinkity:props:${pageInputPath}`)};
  const props = {};
  for (let propId of ${JSON.stringify([...propIds])}) {
    const { name, value } = propsById[propId];
    props[name] = value;
  }
  `
      : `
  const props = {};
  `
  }
  const target = document.querySelector('is-land[data-root-id=${JSON.stringify(
    islandId
  )}]');
  render({ Component, target, props, isClientOnly: ${JSON.stringify(
    isClientOnly
  )} });
</script>`;

  return clientScript;
}

export function toIslandWrapper({
  islandId,
  loadConditions,
  isClientOnly,
}: {
  islandId: string;
  loadConditions: string[];
  isClientOnly: boolean;
}) {
  const islandScript = `
  <is-land data-root-id=${JSON.stringify(islandId)} ${loadConditions.join(" ")}>
    <template data-island>
      ${toIslandComment(toIslandVirtualModId(islandId))}
    </template>
    ${isClientOnly ? "" : toSsrComment(islandId)}
  </is-land>`;
  return islandScript;
}

/**
 * Regex of hard-coded stylesheet extensions
 * @returns Whether this import ends with an expected CSS file extension
 */
export function isStyleImport(imp: string): boolean {
  return /\.(css|scss|sass|less|stylus)($|\?*)/.test(imp);
}

/**
 * Recursively walks through all nested imports for a given module,
 * Searching for any CSS imported via ESM
 */
export function collectCSS(
  mod: vite.ModuleNode,
  collectedCSSModUrls: Set<string>,
  visitedModUrls: Set<string> = new Set()
) {
  if (!mod || !mod.url || visitedModUrls.has(mod.url)) return;

  visitedModUrls.add(mod.url);
  if (isStyleImport(mod.url)) {
    collectedCSSModUrls.add(mod.url);
  } else {
    mod.importedModules.forEach((subMod) => {
      collectCSS(subMod, collectedCSSModUrls, visitedModUrls);
    });
  }
}
