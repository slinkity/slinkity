export { defineConfig } from './lib/config/defineConfig'

export type UserSlinkityConfig = {
  /**
   * All files (or globs) Slinkity will ask 11ty to ignore during builds and live reload events. Override this property to add and remove ignored files from our defaults. Also see 11ty's ignore documentation here: https://www.11ty.dev/docs/ignores/
   */
  eleventyIgnores: string[] | ((ignores: string[]) => string[]);
};