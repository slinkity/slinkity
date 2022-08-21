const vite = require('vite')

module.exports.createViteServer = function ({ userConfig, cssUrlsByInputPath }) {
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
          // TODO: only inject when client-side islands are used
          const head = [
            {
              tag: 'script',
              attrs: { type: 'module' },
              children: "import '/@id/slinkity/client';",
            },
          ]
          if (!ctx.originalUrl) return head

          const collectedCss = cssUrlsByInputPath.get(ctx.originalUrl)
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
