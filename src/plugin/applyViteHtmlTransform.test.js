const { applyViteHtmlTransform, handleSSRComments } = require('./applyViteHtmlTransform')
const { toComponentAttrStore } = require('./componentAttrStore')
const { SLINKITY_HEAD_STYLES, toSSRComment } = require('../utils/consts')

/** @param {Partial<import('./componentAttrStore').ComponentAttrs>[]} componentAttrs */
function toComponentAttrsWithDefaults(componentAttrs) {
  const componentAttrStore = toComponentAttrStore()
  for (const componentAttr of componentAttrs) {
    componentAttrStore.push({
      path: 'not-important.jsx',
      hydrate: 'eager',
      props: {},
      pageOutputPath: 'default.html',
      ...componentAttr,
    })
  }
  return componentAttrStore
}

function toConvincingUrl(fileName) {
  return `/@fs/Users/person/project/${fileName}`
}

describe('applyViteHtmlTransform', () => {
  const environments = ['prod', 'dev']
  it.each(environments)(
    'should not try and parse files that are not html for %s',
    async (environment) => {
      const componentAttrStore = toComponentAttrStore()
      const content = '<?xml version="1.0" encoding="utf-8"?>'
      const actual = await applyViteHtmlTransform(
        {
          content,
          outputPath: 'feed.xml',
          componentAttrStore,
        },
        {
          environment,
        },
      )
      expect(actual).toBe(content)
    },
  )
  describe('handleSSRComments', () => {
    const outputPath = '/handle/ssr/comments.html'
    const componentPathsToStyles = {
      'nice.jsx': [toConvincingUrl('styles.scss'), toConvincingUrl('more-styles.scss')],
      'cool.svelte': [toConvincingUrl('nested/global.module.scss')],
      'neat.vue': [toConvincingUrl('excellent.css'), toConvincingUrl('neato.stylus')],
    }
    const viteSSR = {
      async toCommonJSModule(componentPath) {
        return {
          default: () => null,
          __importedStyles: componentPathsToStyles[componentPath],
        }
      },
    }
    const componentAttrStore = toComponentAttrsWithDefaults(
      Object.keys(componentPathsToStyles).map((componentPath) => ({
        path: componentPath,
        pageOutputPath: outputPath,
      })),
    )

    it('should inject styles into head', async () => {
      const content = `
<html>
<head>
  <title>It's hydration time</title>
  ${SLINKITY_HEAD_STYLES}
</head>
<body>
</body>
</html>`
      const actual = await handleSSRComments({
        content,
        outputPath,
        componentAttrStore,
        viteSSR,
      })
      expect(actual).toMatchSnapshot()
    })

    it('should replace SSR comments with server rendered content', async () => {
      const content = `
<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  ${componentAttrStore
    .getAllByPage(outputPath)
    .map(({ id }) => toSSRComment(id))
    .join('\n')}
</body>
</html>`
      const actual = await handleSSRComments({
        content,
        outputPath,
        componentAttrStore,
        viteSSR,
      })
      expect(actual).toMatchSnapshot()
    })
  })
})
