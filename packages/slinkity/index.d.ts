export { defineConfig } from './lib/config/defineConfig'
import { ViteSSR } from './cli/toViteSSR'
import { UserConfigExport } from 'vite'

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
  }): {
    useFormatted11tyData: boolean;
    getData(inputPath: any): Promise<Object>;
  };
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