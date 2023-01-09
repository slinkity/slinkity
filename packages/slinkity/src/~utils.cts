import { nanoid } from "nanoid";
import devalue from "devalue";
import * as path from "path";
import * as vite from "vite";
import type { PropsByInputPath, Renderer, Slots } from "./~types.cjs";
import { z } from "zod";
import { LOADERS, PROPS_VIRTUAL_MOD } from "./~consts.cjs";

export class SlinkityInternalError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "[Slinkity internal]";
  }
}

/**
 * Resolve virtual module ID using Vite's convention
 * https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
 */
export function toResolvedVirtualModId(id: string) {
  return "\0" + id;
}

export function toPropComment(idOrRegExp: string) {
  return `<!--slinkity-prop ${idOrRegExp}-->`;
}

export function toIslandId() {
  return nanoid(6);
}

export function toSsrComment(idOrRegExp: string) {
  return `<!--slinkity-ssr ${idOrRegExp}-->`;
}

export function toIslandComment(idOrRegExp: string) {
  return `<!--slinkity-island ${idOrRegExp}-->`;
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
  children,
}: {
  islandId: string;
  children: string;
}) {
  return `<slinkity-root data-id=${JSON.stringify(
    islandId
  )}>${children}</slinkity-root>`;
}

export function toClientLoader({
  islandId,
  islandPath,
  pageInputPath,
  unparsedLoadConditions,
  propIds,
  slots,
  isClientOnly,
  renderer,
}: {
  islandId: string;
  islandPath: string;
  pageInputPath: string;
  unparsedLoadConditions: string[];
  propIds: string[];
  slots: Slots;
  isClientOnly: boolean;
  renderer?: Renderer;
}) {
  if (typeof renderer?.clientEntrypoint !== "string") {
    throw new Error(
      `No client renderer found for ${JSON.stringify(
        islandPath
      )} in ${JSON.stringify(
        pageInputPath
      )}! Please add a renderer to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`
    );
  }
  const { clientEntrypoint } = renderer;
  const loadConditions: [client: typeof LOADERS[number], options: string][] =
    unparsedLoadConditions.map((loadCondition) => {
      const firstEqualsIdx = loadCondition.indexOf("=");
      const rawKey =
        firstEqualsIdx === -1
          ? loadCondition
          : loadCondition.slice(0, firstEqualsIdx);
      const options =
        firstEqualsIdx === -1 ? "" : loadCondition.slice(firstEqualsIdx + 1);
      const key = z.enum(LOADERS).safeParse(rawKey);
      if (!key.success) {
        throw new Error(
          `[slinkity] ${JSON.stringify(rawKey)} in ${JSON.stringify(
            pageInputPath
          )} is not a valid client directive. Try client:load, client:idle, or other valid directives (https://slinkity.dev/docs/partial-hydration/).`
        );
      }
      return [key.data, options];
    });

  function toImportName(client: typeof LOADERS[number]) {
    return client.replace("client:", "");
  }
  const propsImportParams = new URLSearchParams({
    inputPath: pageInputPath,
  });

  return `<script type="module">${loadConditions
    .map(([client]) => {
      const importName = toImportName(client);
      return `import ${importName} from "slinkity/client/${importName}";`;
    })
    .join("\n")}
      ${
        propIds.length
          ? `
      import propsById from ${JSON.stringify(
        `${PROPS_VIRTUAL_MOD}?${propsImportParams}`
      )};
      const props = {};
      for (let propId of ${JSON.stringify(propIds)}) {
        const { name, value } = propsById[propId];
        props[name] = value;
      }
      `
          : `
      const props = {};
      `
      }
    const target = document.querySelector('slinkity-root[data-id=${JSON.stringify(
      islandId
    )}]');
    Promise.race([
      ${loadConditions
        .map(([client, options]) => {
          const importName = toImportName(client);
          return `${importName}({ target, options: ${JSON.stringify(
            options
          )} })`;
        })
        .join(",\n")}
    ]).then(async function () {
      const [{ default: Component }, { default: renderer }] = await Promise.all([
        import(${JSON.stringify(islandPath)}),
        import(${JSON.stringify(clientEntrypoint)}),
      ]);
      renderer({ Component, target, props, slots: ${JSON.stringify(
        slots
      )}, isClientOnly: ${JSON.stringify(isClientOnly)}
    });
  });</script>`;
}

/**
 * Based on regex of hard-coded stylesheet extensions
 */
export function isStyleImport(imp: string): boolean {
  return /\.(css|scss|sass|less|stylus)($|\?*)/.test(imp);
}

/**
 * Recursively walks through all nested imports for a given module,
 * Searching for any CSS imported via ESM
 */
export function collectCSSImportedViaEsm(
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
      collectCSSImportedViaEsm(subMod, collectedCSSModUrls, visitedModUrls);
    });
  }
}

export function getRoot() {
  return process.env.ELEVENTY_ROOT ?? process.cwd();
}
