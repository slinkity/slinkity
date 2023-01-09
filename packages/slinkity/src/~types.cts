import { rendererSchema, userConfigSchema } from './defineConfig.cjs';
import type { ViteDevServer } from 'vite';
import { z } from 'zod';
import { LOADERS } from './~consts.cjs';

export const islandMetaSchema = z
  .object({
    when: z.union([z.enum(LOADERS), z.array(z.enum(LOADERS))]),
    props: z
      .function(
        z.tuple([z.record(z.any()), z.record(z.any())]),
        z.union([z.record(z.any()), z.promise(z.record(z.any()))]),
      )
      .args(z.record(z.any()), z.record(z.any()))
      .returns(z.union([z.record(z.any()), z.promise(z.record(z.any()))])),
  })
  .partial({
    props: true,
  });

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

export type IslandsByInputPath = Map<
  InputPath,
  Record<
    IslandId,
    {
      islandPath: string;
      propIds: Set<string>;
      renderOn: RenderOn;
      unparsedLoadConditions: string[];
      slots: Slots;
      renderer?: Renderer;
    }
  >
>;

export type RenderOn = 'server' | 'client' | 'both';

export type Slots = {
  default: string;
  [slotName: string]: string;
};

export type RenderedContent = {
  content: string;
  inputPath: string;
  outputPath: string;
};

export type RenderedContentByUrl = Map<PageUrl, RenderedContent>;

export type RendererByExt = Map<string, Renderer>;

export type CssUrlsByInputPath = Map<string, Set<string>>;

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
  islandsByInputPath: IslandsByInputPath;
  pageByRelOutputPath: PageByRelOutputPath;
  rendererByExt: RendererByExt;
  cssUrlsByInputPath: CssUrlsByInputPath;
};

export type SlinkityStore = <T>(
  initialValue: T,
  options: never,
) => {
  isSlinkityStoreFactory: true;
  id: string;
  value: T;
  get(): T;
};

export type Renderer = z.infer<typeof rendererSchema>;

export type IslandExport = {
  /**
   * Conditions to hydrate this island, including 'client:idle' and 'client:visible'
   * Defaults to 'client:load'
   * https://slinkity.dev/docs/partial-hydration/
   */
  when: z.infer<typeof islandMetaSchema>['when'];
  /**
   * Generates props to pass to your hydrated component.
   * If you're new to Slinkity, we recommend reading our "Be mindful about your data" docs first:
   * https://slinkity.dev/docs/component-pages-layouts/#%F0%9F%9A%A8-(important!)-be-mindful-about-your-data
   * @param eleventyData Page data from 11ty's data cascade
   * @param functions Univeral shortcodes and javascript functions
   */
  props?: z.infer<typeof islandMetaSchema>['props'];
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

export type RunMode = 'build' | 'watch' | 'serve';
export type OutputMode = 'fs' | 'json' | 'ndjson';

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
