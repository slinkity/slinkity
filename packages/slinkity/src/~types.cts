import { rendererSchema, userConfigSchema } from "./defineConfig.cjs";
import type { ViteDevServer, InlineConfig as ViteInlineConfig } from "vite";
import { z } from "zod";

type Prop = {
  name: string;
  value: any;
  getSerializedValue(): string;
};

type PageUrl = string;
type IslandId = string;
type InputPath = string;
type PropId = string;

export type PropsByInputPath = Map<
  InputPath,
  {
    hasStore: boolean;
    props: Record<PropId, Prop>;
    clientPropIds: Set<PropId>;
  }
>;

export type SsrIslandsByInputPath = Map<
  InputPath,
  Record<
    IslandId,
    {
      islandPath: string;
      propIds: Set<string>;
      isUsedOnClient: boolean;
      slots: Record<string, string>;
    }
  >
>;

export type RenderedContent = {
  content: string;
  inputPath: string;
  outputPath: string;
};

export type UrlToRenderedContentMap = Map<PageUrl, RenderedContent>;

export type ExtToRendererMap = Map<string, Renderer>;

export type CssUrlsByInputPath = Map<string, Set<string>>;

export type HtmlFragmentByIslandId = Map<string, string>;

/** Key: output path relative to output dir (i.e. "/about/index.html", not "/_site/about/index.html") */
export type PageByRelOutputPath = Map<
  string,
  { inputPath: string; outputPath: string; url: string }
>;

export type ViteServerFactory = {
  /** Get an existing Vite server, or initialize a new server if none exists */
  getOrInitialize(): Promise<ViteDevServer>;
};

export type PluginGlobals = {
  viteServer: ViteServerFactory;
  propsByInputPath: PropsByInputPath;
  ssrIslandsByInputPath: SsrIslandsByInputPath;
  urlToRenderedContentMap: UrlToRenderedContentMap;
  pageByRelOutputPath: PageByRelOutputPath;
  extToRendererMap: ExtToRendererMap;
  cssUrlsByInputPath: CssUrlsByInputPath;
  htmlFragmentByIslandId: HtmlFragmentByIslandId;
};

export type SlinkityStore = <T>(
  initialValue: T,
  options: never
) => {
  isSlinkityStoreFactory: true;
  id: string;
  value: T;
  get(): T;
};

export type Renderer = z.infer<typeof rendererSchema>;

export type IslandExport =
  | boolean
  | {
      /**
       * Conditions to hydrate this island, including 'idle', 'media(query)', 'visible', etc
       * Defaults to 'load'
       */
      on?: string[];
      /**
       * Props to pass to this hydrated component
       * Defaults to an empty object, so be careful!
       * If you're new to Slinkity, we recommend reading our "Be mindful about your data" docs first:
       * https://slinkity.dev/docs/component-pages-layouts/#%F0%9F%9A%A8-(important!)-be-mindful-about-your-data
       * @param eleventyData Page data from 11ty's data cascade
       */
      props(
        eleventyData: any
      ): Record<string, any> | Promise<Record<string, any>>;
    };

export type UserConfig = z.infer<typeof userConfigSchema>;

/** 11ty type defs bc they're stuck in the stone age */
export type ShortcodeThis = {
  page: {
    inputPath: string;
    outputPath: string;
  };
};

export type TransformThis = {
  inputPath: string;
  outputPath: string;
};

export type EleventyDir = {
  input: string;
  output: string;
  includes: string;
  data: string;
  layouts?: string;
};

export type RunMode = "build" | "watch" | "serve";
export type OutputMode = "fs" | "json" | "ndjson";

export type EleventyEventParams = {
  after: {
    runMode: RunMode;
    outputMode: OutputMode;
    dir: EleventyDir;
    results: {
      inputPath: string;
      outputPath: string;
      url: string;
      content: string;
    }[];
  };
  before: {
    runMode: RunMode;
    outputMode: OutputMode;
    dir: EleventyDir;
  };
};
