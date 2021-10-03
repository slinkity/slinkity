const { parse } = require('node-html-parser')
const fsPromises = require('fs').promises
const { join } = require('path')
const { SLINKITY_REACT_MOUNT_POINT } = require('../../../utils/consts')
const fileHelpers = require('../../../utils/fileHelpers')
const applyHtmlWrapper = require('./applyHtmlWrapper')
const { toHydrationLoadersApplied, webComponentLoader } = require('./toHydrationLoadersApplied')
const { toComponentAttrStore } = require('./componentAttrStore')

const READ_FILE_CALLED = 'readFile called'

const hydrationModes = ['eager', 'lazy']

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockReturnValue(READ_FILE_CALLED),
  },
}))
jest.mock('../../../utils/fileHelpers', () => ({
  writeFileRec: jest.fn().mockResolvedValue(),
}))

/**
 * @param {Partial<import('./componentAttrStore').ComponentAttrs>[]} componentAttrs
 */
function toComponentAttrsWithDefaults(...componentAttrs) {
  const componentAttrStore = toComponentAttrStore()
  const pageInputPath = 'index.html'
  for (const componentAttr of componentAttrs) {
    componentAttrStore.push({
      path: 'not-important.jsx',
      hydrate: 'eager',
      props: {},
      styleToFilePathMap: {},
      pageInputPath,
      ...componentAttr,
    })
  }
  return componentAttrStore.getAllByPage(pageInputPath)
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
        isDryRun: true,
      })
      expect(actual).toEqual(content)
    })
    it('should applyHtmlWrapper if none exists', async () => {
      const content = '<ul id="list"><li>Hello World</li></ul>'
      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs: [],
        isDryRun: true,
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
  <${SLINKITY_REACT_MOUNT_POINT}>
    <ul id="list"><li>Hello World</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`
      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs,
        isDryRun: true,
      })
      expect(actual).not.toContain(webComponentLoader)
    })
  })
  describe('with styles', () => {
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
    test.each([...hydrationModes, 'static'])(
      'should apply `<style>` tag when hydration mode is %s',
      async (hydrate) => {
        const actual = await toHydrationLoadersApplied({
          content,
          componentAttrs: toComponentAttrsWithDefaults({
            hydrate,
            styleToFilePathMap: {
              'styles.module.css': `
.container {
  display: flex;
  align-items: center;
  justify-content: center;
}`,
            },
          }),
          isDryRun: true,
        })
        expect(actual).toMatchSnapshot()
      },
    )
    it('should flatten multiple style entries to single `<style>` tag', async () => {
      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs: toComponentAttrsWithDefaults(
          {
            styleToFilePathMap: {
              'styles.module.css': `
              .container {
                display: grid;
                place-items: center;
              }
              .blockquote {
                padding: 0;
              }`,
              'more-styles.module.css': `
              h1 {
                font-size: 6rem;
              }`,
            },
          },
          {
            styleToFilePathMap: {
              'even-more-styles.module.css': `
              .container {
                display: flex;
                justify-content: center;
                align-items: center;
              }`,
            },
          },
        ),
        isDryRun: true,
      })
      expect(actual).toMatchSnapshot()
    })
    it('should dedup styles when key is repeated', async () => {
      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs: toComponentAttrsWithDefaults(
          {
            styleToFilePathMap: {
              'styles.module.css': `
              .container {
                display: grid;
                place-items: center;
              }
              .blockquote {
                padding: 0;
              }`,
              'more-styles.module.css': `
              h1 {
                font-size: 6rem;
              }`,
            },
          },
          {
            styleToFilePathMap: {
              'even-more-styles.module.css': `
              .container {
                display: flex;
                justify-content: center;
                align-items: center;
              }`,
              'styles.module.css': `
              .container {
                display: grid;
                place-items: center;
              }
              .blockquote {
                padding: 0;
              }`,
            },
          },
        ),
        isDryRun: true,
      })
      expect(actual).toMatchSnapshot()
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
        isDryRun: true,
      })
      expect(actual).toContain(webComponentLoader)
    })
    test.each(hydrationModes)(
      'should apply correct hydration loaders when hydrate is %s',
      async (hydrate) => {
        const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <h1>My incredible site</h1>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

        const actual = await toHydrationLoadersApplied({
          content,
          componentAttrs: toComponentAttrsWithDefaults({ hydrate }, { hydrate }, { hydrate }),
          isDryRun: true,
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
  <${SLINKITY_REACT_MOUNT_POINT}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrs,
        isDryRun: true,
      })
      expect(actual).toMatchSnapshot()
    })
  })
  describe('with dry run disabled', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })
    it('should read the JSX file from the correct path', async () => {
      const componentAttrs = toComponentAttrsWithDefaults(
        {
          path: 'nav.jsx',
          hydrate: 'eager',
        },
        {
          path: 'nested/Heading.jsx',
          hydrate: 'eager',
        },
      )
      const dir = {
        input: 'src',
        output: '_site',
      }
      const toRelativeInput = (componentPath) => join(dir.input, componentPath)
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <${SLINKITY_REACT_MOUNT_POINT}>
  <nav>
    <a href="/home">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      await toHydrationLoadersApplied({
        content,
        componentAttrs,
        dir,
        isDryRun: false,
      })
      expect(fsPromises.readFile).toHaveBeenCalledTimes(2)
      expect(fsPromises.readFile.mock.calls).toEqual([
        [toRelativeInput('nav.jsx')],
        [toRelativeInput('nested/Heading.jsx')],
      ])
    })
    it('should write the JSX file from the correct path', async () => {
      const componentAttrs = toComponentAttrsWithDefaults(
        {
          path: 'nav.jsx',
          hydrate: 'eager',
        },
        {
          path: 'nested/Heading.jsx',
          hydrate: 'eager',
        },
      )
      const dir = {
        input: 'src',
        output: '_site',
      }
      const toRelativeOutput = (componentPath) => join(dir.output, componentPath)
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <${SLINKITY_REACT_MOUNT_POINT}>
  <nav>
    <a href="/home">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      await toHydrationLoadersApplied({
        content,
        componentAttrs,
        dir,
        isDryRun: false,
      })
      expect(fileHelpers.writeFileRec).toHaveBeenCalledTimes(2)
      expect(fileHelpers.writeFileRec.mock.calls).toEqual([
        [toRelativeOutput('nav.jsx'), READ_FILE_CALLED],
        [toRelativeOutput('nested/Heading.jsx'), READ_FILE_CALLED],
      ])
    })
  })
})
