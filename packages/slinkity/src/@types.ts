import type { ViteDevServer, InlineConfig as ViteInlineConfig } from 'vite';

type Prop = {
  name: string;
  value: any;
  getSerializedValue(): string;
}

type PageUrl = string;
type IslandId = string;
type InputPath = string;
type PropId = string;

export type PropsByInputPath = Map<InputPath, {
  hasStore: boolean;
  props: Record<PropId, Prop>;
  clientPropIds: Set<PropId>;
}>

export type SsrIslandsByInputPath = Map<InputPath, Record<IslandId, {
  islandPath: string;
  propIds: Set<string>;
  isUsedOnClient: boolean;
  slots: Record<string, string>;
}>>

export type RenderedContent = {
  content: string;
  inputPath: string;
}

export type UrlToRenderedContentMap = Map<PageUrl, RenderedContent>;

export type ExtToRendererMap = Map<string, Renderer>;

export type CssUrlsByInputPath = Map<string, Set<string>>;

export type PluginGlobals = {
  viteServer: {
    get(): ViteDevServer;
    init(): Promise<ViteDevServer>;
  };
  propsByInputPath: PropsByInputPath;
  ssrIslandsByInputPath: SsrIslandsByInputPath;
  urlToRenderedContentMap: UrlToRenderedContentMap;
  extToRendererMap: ExtToRendererMap;
  cssUrlsByInputPath: CssUrlsByInputPath;
}

export type SlinkityStore = <T>(initialValue: T, options: never) => {
  isSlinkityStoreFactory: true;
  id: string;
  value: T;
  get(): T;
}

export type Renderer = {
  name: string;
  extensions: string[];
  clientEntrypoint: string;
  ssr(params: { Component: any; props: any }): { html: string };
  viteConfig?: ViteInlineConfig;
  page?(params: { Component: any }): { getData(): Promise<any> };
}

export type UserConfig = {
  islandsDir?: string;
  renderers?: Renderer[];
}
