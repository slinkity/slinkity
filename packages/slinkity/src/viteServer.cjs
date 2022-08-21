const vite = require('vite')

/**
 * @param {import('./@types').UserConfig} userConfig
 * @param {Pick<import('./@types').PluginGlobals, 'ssrIslandsByInputPath' | 'cssUrlsByInputPath'>} pluginGlobals
 */
module.exports.createViteServer = function (
  userConfig,
  { cssUrlsByInputPath, ssrIslandsByInputPath },
) {
  /** @type {import('vite').InlineConfig} */
  let viteConfig = {
    clearScreen: false,
    appType: 'custom',
    server: {
      middlewareMode: true,
    },
    plugins: [
      {
        name: 'vite-plugin-slinkity-inject-head',
        transformIndexHtml(html, ctx) {
          const inputPath = ctx.originalUrl
          if (!inputPath) return []

          const hasClientsideComponents = Object.values(
            ssrIslandsByInputPath.get(inputPath) ?? {},
          ).some((island) => island.isUsedOnClient)

          const head = hasClientsideComponents
            ? [
                {
                  tag: 'script',
                  attrs: { type: 'module' },
                  children: "import '/@id/slinkity/client';",
                },
              ]
            : []

          const collectedCss = cssUrlsByInputPath.get(inputPath)
          if (!collectedCss) return head

          return head.concat(
            [...collectedCss].map((href) => ({
              tag: 'link',
              attrs: { rel: 'stylesheet', href },
            })),
          )
        },
      },
    ],
  }

  for (const renderer of userConfig.renderers) {
    viteConfig = vite.mergeConfig(viteConfig, renderer.viteConfig)
  }

  /** @type {import('vite').ViteDevServer | undefined} */
  let viteServer
  let awaitingServer = []
  return {
    get() {
      return viteServer
    },
    async init() {
      if (viteServer) return viteServer

      if (awaitingServer.length === 0) {
        vite.createServer(viteConfig).then((_viteServer) => {
          viteServer = _viteServer
          for (const resolve of awaitingServer) {
            resolve(viteServer)
          }
        })
      }
      return new Promise((resolve) => {
        awaitingServer.push(resolve)
      })
    },
  }
}
