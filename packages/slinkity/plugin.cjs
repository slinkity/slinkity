const path = require('path')
const vite = require('vite')
const { outputFile, readFile } = require('fs-extra')
const { v4: uuidv4, v5: uuidv5 } = require('uuid')
const preactRenderer = require('./test-preact-renderer/index.cjs')
const devalue = require('devalue')
const { BUILD_ID } = require('./utils/consts.cjs')
const {
  toPropComment,
  toSsrComment,
  toResolvedIslandPath,
  extractPropIdsFromHtml,
  toClientPropsPathFromOutputPath,
} = require('./utils/index.cjs')

/** @type {import('vite').ViteDevServer} */
let viteServer = null

/** @type {import('./@types').PropsByInputPath} */
const propsByInputPath = new Map()

/** @type {import('./@types').SsrIslandsByInputPath} */
const ssrIslandsByInputPath = new Map()

/** @type {import('./@types').UrlToRenderedContentMap} */
const urlToRenderedContentMap = new Map()

/**
 * Replace SSR comments with rendered component content
 * @param {import('./@types').RenderedContent} renderedContent
 * @returns {Promise<string>}
 */
async function handleSsrComments({ inputPath, content }) {
  const islands = ssrIslandsByInputPath.get(inputPath)
  const ssrRegex = new RegExp(toSsrComment('(.*)'), 'g')
  const ssrMatches = [...content.matchAll(ssrRegex)]
  const ssrContentByIslandId = new Map()

  await Promise.all(
    ssrMatches.map(async ([, islandId]) => {
      if (islands[islandId]) {
        const { islandPath, propIds } = islands[islandId]

        const propsById = propsByInputPath.get(inputPath).props
        const props = {}
        for (let propId of propIds) {
          const { name, value } = propsById[propId]
          props[name] = value
        }

        const islandModule = await viteServer.ssrLoadModule(islandPath)
        // TODO: support slots
        const { render } = require(preactRenderer().server)
        console.log(render)
        const ssrContent = await render(islandModule, props)
        ssrContentByIslandId.set(islandId, ssrContent)
      } else {
        throw new Error(`[Slinkity internal] Failed to find island for SSR with id "${islandId}"`)
      }
    }),
  )

  return content.replace(ssrRegex, (_, islandId) => {
    return ssrContentByIslandId.get(islandId)
  })
}

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function plugin(eleventyConfig) {
  eleventyConfig.on('eleventy.after', async function ({ results, runMode }) {
    if (runMode === 'serve') {
      for (let { content, inputPath, outputPath, url } of results) {
        // used for serving content within dev server middleware
        urlToRenderedContentMap.set(url, {
          content,
          inputPath,
          outputPath,
        })
      }
    }
  })

  eleventyConfig.on('eleventy.beforeWatch', function (changedFiles) {
    for (const changedFile of changedFiles) {
      propsByInputPath.delete(changedFile)
    }
  })

  eleventyConfig.setServerOptions({
    middleware: [
      async function applyViteMiddlwares(req, res, next) {
        if (!viteServer) {
          /** @type {import('vite').UserConfig} */
          let mergedConfig = {
            appType: 'mpa',
            server: {
              middlewareMode: true,
            },
          }
          const rendererViteConfigs = [await preactRenderer().viteConfig()]
          for (let rendererViteConfig of rendererViteConfigs) {
            mergedConfig = vite.mergeConfig(mergedConfig, rendererViteConfig)
          }
          viteServer = await vite.createServer(mergedConfig)

          // restart server to avoid "page reload" logs
          // across all 11ty built routes
          await viteServer.restart()
        }

        // __vite-ping lacks a content type,
        // which breaks 11ty's serverless response handler
        if (req.url.endsWith('__vite_ping')) {
          res.setHeader('Content-Type', 'text/plain')
        }
        return viteServer.middlewares(req, res, next)
      },
      async function applyViteHtmlTransform(req, res, next) {
        const page = urlToRenderedContentMap.get(req.url)
        if (page && viteServer) {
          const html = await handleSsrComments(page)

          res.setHeader('Content-Type', 'text/html')
          // TODO: replace SSR comments
          res.write(await viteServer.transformIndexHtml(req.url, html))
          res.end()
        } else {
          next()
        }
      },
    ],
  })

  eleventyConfig.addPairedShortcode(
    'serverOnlyIsland',
    function (htmlWithPropComments, unresolvedIslandPath) {
      const islandPath = toResolvedIslandPath(unresolvedIslandPath)
      const islandId = uuidv4()

      const { htmlWithoutPropComments: html, propIds } =
        extractPropIdsFromHtml(htmlWithPropComments)

      const { inputPath } = this.page
      const existingSsrComponents = ssrIslandsByInputPath.get(inputPath)
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          slots: { default: html },
        },
      })

      return toSsrComment(islandId)
    },
  )

  eleventyConfig.addPairedShortcode(
    'clientOnlyIsland',
    function (htmlWithPropComments, unresolvedIslandPath, ...loadConditions) {
      const islandPath = toResolvedIslandPath(unresolvedIslandPath)
      const clientPropsPath = toClientPropsPathFromOutputPath(
        this.page.outputPath,
        eleventyConfig.dir.output,
      )
      const islandId = uuidv4()

      const { propIds } = extractPropIdsFromHtml(htmlWithPropComments)

      return `
    <is-land ${loadConditions.join(' ')}>
      <script type="module/island">
        import Component from ${JSON.stringify(islandPath)};
        import { h, render } from '/@id/preact';
        ${
          propIds.size
            ? `
        import propsById from ${JSON.stringify(clientPropsPath)};
        const props = {};
        for (let propId of ${JSON.stringify([...propIds])}) {
          const { name, value } = propsById[propId];
          props[name] = value;
        }

        const root = document.querySelector('[data-root-id=${JSON.stringify(islandId)}]');
        render(h(Component, props), root);
        `
            : `
        const root = document.querySelector('[data-root-id=${JSON.stringify(islandId)}]');
        render(h(Component), root);'
      `
        }
      </script>
      <div data-root-id=${JSON.stringify(islandId)}></div>
    </is-land>
    `
    },
  )

  eleventyConfig.addPairedShortcode(
    'island',
    function (htmlWithPropComments, unresolvedIslandPath, ...loadConditions) {
      const islandPath = toResolvedIslandPath(unresolvedIslandPath)
      const clientPropsPath = toClientPropsPathFromOutputPath(
        this.page.outputPath,
        eleventyConfig.dir.output,
      )
      const islandId = uuidv4()

      const { htmlWithoutPropComments: html, propIds } =
        extractPropIdsFromHtml(htmlWithPropComments)

      const { inputPath } = this.page
      const existingSsrIslandEntries = ssrIslandsByInputPath.get(inputPath)
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrIslandEntries,
        [islandId]: {
          islandPath,
          propIds,
          slots: { default: html },
        },
      })

      return `
    <is-land ${loadConditions.join(' ')}>
      <script type="module/island">
        import Component from ${JSON.stringify(islandPath)};
        import { h, render } from '/@id/preact';
        ${
          propIds.size
            ? `
        import propsById from ${JSON.stringify(clientPropsPath)};
        const props = {};
        for (let propId of ${JSON.stringify([...propIds])}) {
          const { name, value } = propsById[propId];
          props[name] = value;
        }

        const root = document.querySelector('[data-root-id=${JSON.stringify(islandId)}]');
        render(h(Component, props), root);
        `
            : `
        const root = document.querySelector('[data-root-id=${JSON.stringify(islandId)}]');
        render(h(Component), root);'
      `
        }
      </script>
      <div data-root-id=${JSON.stringify(islandId)}>
        ${toSsrComment(islandId)}
      </div>
    </is-land>
    `
    },
  )

  eleventyConfig.addShortcode('prop', function (name, value) {
    const { inputPath } = this.page
    let serializedValue, id
    let hasStore = Boolean(propsByInputPath.get(inputPath)?.hasStore)
    if (typeof value === 'object' && value !== null && value.isSlinkityStoreFactory) {
      serializedValue = `new SlinkityStore(${devalue(value.value)})`
      id = value.id
      hasStore = true
    } else {
      serializedValue = devalue(value)
      id = uuidv5(`${name}${serializedValue}`, BUILD_ID)
    }
    const existingPropsOnPage = propsByInputPath.get(inputPath)?.props ?? {}
    propsByInputPath.set(inputPath, {
      hasStore,
      props: {
        ...existingPropsOnPage,
        [id]: { name, value, serializedValue },
      },
    })

    return toPropComment(id)
  })

  eleventyConfig.addTransform('slinkity-create-props-file', async function (content, outputPath) {
    const propInfo = propsByInputPath.get(this.inputPath)
    if (propInfo) {
      const { hasStore, props } = propInfo
      let propsFileContents = 'export default {\n'
      for (const [key, { name, serializedValue }] of Object.entries(props)) {
        const serializedKey = JSON.stringify(key)
        const serializedEntry = `{ name: ${JSON.stringify(name)}, value: ${serializedValue} }`
        propsFileContents += `  ${serializedKey}: ${serializedEntry},\n`
      }
      propsFileContents += '}'
      if (hasStore) {
        propsFileContents += '\n' + (await readFile('./utils/store.client.mjs'))
      }
      const clientPropsPath = path.join(
        eleventyConfig.dir.output,
        toClientPropsPathFromOutputPath(outputPath, eleventyConfig.dir.output),
      )
      await outputFile(clientPropsPath, propsFileContents)
    }

    return content
  })
}
