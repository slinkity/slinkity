import type { UserConfigExport, ViteDevServer } from 'vite'

type ToCommonJSModuleOptions = {
  /** Whether to (attempt to) use the in-memory cache for fetching a build result. Defaults to true in production */
  useCache: boolean;
}

export type ViteSSR = {
  /** Grab a Node-friendly module output from a given file path using Vite */
  toCommonJSModule(filePath: string, options: ToCommonJSModuleOptions): Promise<object>
  /** Get instance of the Vite development server (always null for production envs) */
  getServer(): ViteDevServer | null;
  /** Start the Vite development server (has no effect for production envs) */
  createServer(): void;
}

type PageReturn = {
  useFormatted11tyData: boolean;
  getData(inputPath: any): Promise<Object>;
}

type HydrationMode = 'eager' | 'lazy' | 'none'

export type Hydrate = HydrationMode | {
  mode: HydrationMode;
  props?(data: object): object | Promise<object>;
}

// TODO: in-line comments
export type Renderer = {
  name: string;
  extensions: string[];
  client: string;
  server: string;
  processImportedStyles: boolean;
  viteConfig?(): UserConfigExport | Promise<UserConfigExport>;
  page({ toCommonJSModule }: {
    toCommonJSModule: ViteSSR['toCommonJSModule'];
  }): PageReturn | Promise<PageReturn>;
}

export type UserSlinkityConfig = {
  /** All renderers to apply */
  renderers: Renderer[];
  /**
   * All files (or globs) Slinkity will ask 11ty to ignore during builds and live reload events.
   * Override this property to add and remove ignored files from our defaults.
   * Also see 11ty's ignore documentation here: https://www.11ty.dev/docs/ignores/
  */
  eleventyIgnores: string[] | ((ignores: string[]) => string[]);
};