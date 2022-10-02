import type {
  PluginGlobals,
  UserConfig,
  ViteServerFactory,
} from "./~types.cjs";
import * as vite from "vite";

export function createViteServer(
  userConfig: UserConfig,
  {
    cssUrlsByInputPath,
    ssrIslandsByInputPath,
  }: Pick<PluginGlobals, "cssUrlsByInputPath" | "ssrIslandsByInputPath">
): ViteServerFactory {
  let viteConfig: vite.InlineConfig = {
    clearScreen: false,
    appType: "custom",
    server: {
      middlewareMode: true,
    },
    plugins: [
      {
        name: "vite-plugin-slinkity-inject-head",
        transformIndexHtml(html, ctx) {
          const inputPath = ctx.originalUrl;
          if (!inputPath) return [];

          const hasClientsideComponents = Object.values(
            ssrIslandsByInputPath.get(inputPath) ?? {}
          ).some((island) => island.isUsedOnClient);

          const head: vite.HtmlTagDescriptor[] = hasClientsideComponents
            ? [
                {
                  tag: "script",
                  attrs: { type: "module" },
                  children: "import '/@id/slinkity/client';",
                },
              ]
            : [];

          const collectedCss = cssUrlsByInputPath.get(inputPath);
          if (!collectedCss) return head;

          return head.concat(
            [...collectedCss].map((href) => ({
              tag: "link",
              attrs: { rel: "stylesheet", href },
            }))
          );
        },
      },
    ],
  };

  for (const renderer of userConfig?.renderers ?? []) {
    viteConfig = vite.mergeConfig(viteConfig, renderer.viteConfig ?? {});
  }

  let viteServer: vite.ViteDevServer;
  let awaitingServer: ((value: vite.ViteDevServer) => void)[] = [];
  return {
    async getOrInitialize() {
      if (viteServer) return new Promise((resolve) => resolve(viteServer));

      if (awaitingServer.length === 0) {
        vite.createServer(viteConfig).then((_viteServer) => {
          viteServer = _viteServer;
          for (const resolve of awaitingServer) {
            resolve(viteServer);
          }
        });
      }
      return new Promise((resolve) => {
        awaitingServer.push(resolve);
      });
    },
  };
}
