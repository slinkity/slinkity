import type { UserConfigExport, ViteDevServer } from 'vite'
import type { Options } from 'browser-sync'

export type Environment = 'development' | 'production'

type ToCommonJSModuleOptions = {
  /** Whether to (attempt to) use the in-memory cache for fetching a build result. Defaults to true in production */
  useCache: boolean;
}

export type ViteSSR = {
  /**
   * Turn the given file into a Node-friendly module 
   * uses Vite under-the-hood on the dev server and production builds
   * see https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server
   */
  toCommonJSModule(filePath: string, options: ToCommonJSModuleOptions): Promise<object>
  /** Get instance of the Vite development server (always null for production envs) */
  getServer(): ViteDevServer | null;
  /** Start the Vite development server (has no effect for production envs) */
  createServer(): void;
}

export type ComponentLoader = {
  name: string;
  client: undefined | string | {
    mod: string;
    name: string;
  }
}

export type ComponentLoaderClientParams = {
  target: string;
  loader: string;
  loaderArgs: string;
  children: string;
  props: string;
}

export type RendererClientParams = {
  target: string;
  children: string;
  props: any;
  Component: any;
}

type HydrationMode = 'eager' | 'lazy' | 'none'

export type Hydrate = HydrationMode | {
  mode: HydrationMode;
  props?(data: object): object | Promise<object>;
}

type PageReturn = {
  /**
   * whether to format collections for better clientside parsing
   * @see https://github.com/slinkity/slinkity/blob/main/packages/slinkity/utils/toFormattedDataForProps.js
   */
  useFormatted11tyData: boolean;
  /**
   * To retrieve frontmatter data from the component page
   * We recommend using the "toCommonJSModule" param
   * Passed to your page config function
   * @param inputPath Input path for the given template
   */
  getData(inputPath: string): Promise<Object>;
}

export type Renderer = {
  /** name of renderer - used for diff-ing renderers internally */
  name: string;
  /** file extensions this renderer can handle */
  extensions: string[];
  /** path to module used for clientside hydration - browser code */
  client: string;
  /** path to module used for server rendering - NodeJS code */
  server: string;
  /** inject CSS imported by component module into document head */
  injectImportedStyles: boolean;
  /** config to append to Vite server and production builds */
  viteConfig?(): UserConfigExport | Promise<UserConfigExport>;
  /** config to render as a component page */
  page({ toCommonJSModule }: {
    toCommonJSModule: ViteSSR['toCommonJSModule'];
  }): PageReturn | Promise<PageReturn>;
  /** NOT YET SUPPORTED: Adds polyfills to Node's global object */
  polyfills: never;
  /** NOT YET SUPPORTED: List of imports to add as scripts on the client */
  hydrationPolyfills: never;
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

  componentDir: string;
}

/** Paths to all significant directories, as specified in 11ty's "dir" documentation */
export type Dir = {
  input: string;
  output: string;
  includes: string;
  layouts: string;
}

export type ImportAliases = {
  /** alias for importing resources from the project root (`process.cwd()`) */
  root: string;
  /** alias for importing from the project input directory, as specified in 11ty's dir.input */
  input: string;
  /** alias for importing from the project includes directory, as specified in 11ty's dir.includes */
  includes: string;
  /** alias for importing from the project layouts directory, as specified in 11ty's dir.layouts */
  layouts: string;
}

export type EleventyConfigParams = {
  dir: Dir;
  /** utility to import components as Node-friendly modules */
  viteSSR: ViteSSR;
  /** Slinkity config options (either from user config or defaults) */
  userSlinkityConfig: UserSlinkityConfig;
  /** Options to configure Slinkity's own browser sync server for dev environments */
  browserSyncOptions: Options;
  /** whether we want a dev server or a production build */
  environment: Environment;
}