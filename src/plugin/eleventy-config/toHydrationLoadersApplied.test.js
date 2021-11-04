const { parse } = require('node-html-parser')
const { SLINKITY_REACT_MOUNT_POINT, SLINKITY_ATTRS } = require('../../../utils/consts')
const applyHtmlWrapper = require('./applyHtmlWrapper')
const { toHydrationLoadersApplied, webComponentLoader } = require('./toHydrationLoadersApplied')
const { toComponentAttrStore } = require('../../componentAttrStore')
const toHtmlAttrString = require('../../../utils/toHtmlAttrString')

const hydrationModes = ['eager', 'lazy']

/**
 * @param {Partial<import('./componentAttrStore').ComponentAttrs>[]} componentAttrs
 */
function toComponentAttrsWithDefaults(...componentAttrs) {
  const componentAttrStore = toComponentAttrStore()
  const pageOutputPath = 'index.html'
  for (const componentAttr of componentAttrs) {
    componentAttrStore.push({
      path: 'not-important.jsx',
      hydrate: 'eager',
      props: {},
      styleToFilePathMap: {},
      pageOutputPath,
      ...componentAttr,
    })
  }
  return componentAttrStore.getAllByPage(pageOutputPath)
}

function toIdAttr(id) {
  return toHtmlAttrString({ [SLINKITY_ATTRS.id]: id })
}

describe('toHydrationLoadersApplied', () => {
  describe('with no hydrated components', () => {
    it('should not modify content when no componentAttrs exist', async () => {
      const content = `<html>
<head>
  <title>I'm already here!</title>
</head>
<body>
  <ul id="list"><li>Hello World</li></ul>
</body>
</html>`
      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs: [],
      })
      expect(actual).toEqual(content)
    })
    it('should applyHtmlWrapper if none exists', async () => {
      const content = '<ul id="list"><li>Hello World</li></ul>'
      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs: [],
      })
      const expectedRoot = parse(actual)
      applyHtmlWrapper(expectedRoot)
      expect(actual).toEqual(expectedRoot.outerHTML)
    })
    it('should *not* apply web component loader when no hydrated components exist', async () => {
      const componentAttrs = toComponentAttrsWithDefaults({
        path: 'very-cool-component.jsx',
        hydrate: 'static',
      })
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <${SLINKITY_REACT_MOUNT_POINT} ${toIdAttr(componentAttrs[0].id)}>
    <ul id="list"><li>Hello World</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`
      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs,
      })
      expect(actual).not.toContain(webComponentLoader)
    })
  })
  describe('with hydrated components', () => {
    it('should apply web component loader', async () => {
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <ul id="list"><li>Hello World</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs: toComponentAttrsWithDefaults({
          path: 'very-cool-component.jsx',
          hydrate: 'eager',
        }),
      })
      expect(actual).toContain(webComponentLoader)
    })
    test.each(hydrationModes)(
      'should apply correct hydration loaders when hydrate is %s',
      async (hydrate) => {
        const componentAttrs = toComponentAttrsWithDefaults({ hydrate }, { hydrate }, { hydrate })
        const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <h1>My incredible site</h1>
  <${SLINKITY_REACT_MOUNT_POINT} ${toIdAttr(componentAttrs[0].id)}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toIdAttr(componentAttrs[1].id)}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toIdAttr(componentAttrs[2].id)}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

        const actual = await toHydrationLoadersApplied({
          content,
          componentAttrs: toComponentAttrsWithDefaults({ hydrate }, { hydrate }, { hydrate }),
        })
        expect(actual).toMatchSnapshot()
      },
    )
    it('should apply correct props based on componentAttrStore', async () => {
      const componentAttrs = toComponentAttrsWithDefaults(
        {
          path: 'nav.jsx',
          hydrate: 'eager',
          props: {
            firstProp: 'nice',
            secondProp: 42,
            thirdProp: false,
            helper() {
              return 'Testing non-JSON properties'
            },
          },
        },
        {
          path: 'nested/Heading.jsx',
          hydrate: 'lazy',
          props: {
            text: {
              weight: 'bold',
              content: 'Welcome to the site',
            },
          },
        },
        {
          path: 'index.jsx',
          hydrate: 'lazy',
          props: {
            list: ['Have a nice day world'],
          },
        },
      )
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <h1>My incredible site</h1>
  <${SLINKITY_REACT_MOUNT_POINT} ${toIdAttr(componentAttrs[0].id)}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toIdAttr(componentAttrs[1].id)}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toIdAttr(componentAttrs[2].id)}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs,
      })
      expect(actual).toMatchSnapshot()
    })
  })
})
