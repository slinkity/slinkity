import type { ViteSSR } from "../cli/toViteSSR"
import type { UserSlinkityConfig } from '..'
import type { Options } from 'browser-sync'

type Environment = 'dev' | 'prod'

/** Paths to all significant directories, as specified in 11ty's "dir" documentation */
export type Dir = {
  input: string;
  output: string;
  includes: string;
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
