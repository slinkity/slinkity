import { nanoid } from "nanoid";
import devalue from "devalue";
import * as path from "path";
import * as vite from "vite";
import type { PropsByInputPath } from "./~types.cjs";
import { z } from "zod";
import { ISLAND_VIRTUAL_MOD } from "./~consts.cjs";

export class SlinkityInternalError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "[Slinkity internal]";
  }
}

export function toResolveViteVirtualMod(id: string) {
  return "\0" + id;
}

/** @param {string} id Either a prop ID or regex to concat */
export function toPropComment(id: string) {
  return `<!--slinkity-prop ${id}-->`;
}

export function toIslandId() {
  return nanoid(6);
}

/** Used to manually split island loaders to separate chunks during prod builds */
export function toIslandScriptId(islandIdOrRegExp: string) {
  return `slinkity-island-script-${islandIdOrRegExp}`;
}

/** @param {string} id Either a prop ID or regex to concat */
export function toSsrComment(id: string) {
  return `<!--slinkity-ssr ${id}-->`;
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

export function toIslandRoot({
  islandId,
  isClientOnly,
}: {
  islandId: string;
  isClientOnly: boolean;
}) {
  const clientScript = `
  <slinkity-root data-id=${JSON.stringify(islandId)}>
    ${isClientOnly ? "" : toSsrComment(islandId)}
  </slinkity-root>
  <script type="module" src="/@id/${ISLAND_VIRTUAL_MOD}?id=${islandId}"></script>`;
  return clientScript;
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
