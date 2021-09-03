const { parse } = require('node-html-parser')
const fsPromises = require('fs').promises
const { join } = require('path')
const { SLINKITY_REACT_MOUNT_POINT, SLINKITY_ATTRS } = require('../../utils/consts')
const toHtmlAttrString = require('../../utils/toHtmlAttrString')
const fileHelpers = require('../../utils/fileHelpers')
const applyHtmlWrapper = require('./applyHtmlWrapper')
const { toHydrationLoadersApplied, webComponentLoader } = require('./toHydrationLoadersApplied')
const { toComponentAttrStore } = require('./componentAttrStore')

const READ_FILE_CALLED = 'readFile called'
function toMountPointAttrs(id) {
  return toHtmlAttrString({
    [SLINKITY_ATTRS.id]: id,
  })
}

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockReturnValue(READ_FILE_CALLED),
  },
}))
jest.mock('../../utils/fileHelpers', () => ({
  writeFileRec: jest.fn().mockResolvedValue(),
}))

describe('toHydrationLoadersApplied', () => {
  describe('with no mount points', () => {
    it('should not modify content when no mount points exist', async () => {
      const content = `<html>
<head>
  <title>I'm already here!</title>
</head>
<body>
  <ul id="list"><li>Hello World</li></ul>
</body>
</html>`
      const componentAttrStore = toComponentAttrStore()

      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrStore,
        isDryRun: true,
      })
      expect(actual).toEqual(content)
    })
    it('should applyHtmlWrapper if none exists', async () => {
      const content = '<ul id="list"><li>Hello World</li></ul>'
      const componentAttrStore = toComponentAttrStore()

      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrStore,
        isDryRun: true,
      })
      const expectedRoot = parse(actual)
      applyHtmlWrapper(expectedRoot)
      expect(actual).toEqual(expectedRoot.outerHTML)
    })
  })
  describe('with mount points', () => {
    it('should apply web component loader', async () => {
      const componentAttrStore = toComponentAttrStore()
      const ids = [
        componentAttrStore.push({
          props: {},
          styles: '',
          path: 'very-cool-component.jsx',
          hydrate: 'eager',
        }),
      ]
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[0])}>
    <ul id="list"><li>Hello World</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrStore,
        isDryRun: true,
      })
      expect(actual).toContain(webComponentLoader)
    })
    test.each(['eager', 'lazy'])(
      'should apply correct hydration loaders when hydrate is %s',
      async (hydrate) => {
        const componentAttrStore = toComponentAttrStore()
        const ids = [
          componentAttrStore.push({
            path: 'not-important.jsx',
            hydrate,
            props: {},
            styles: '',
          }),
          componentAttrStore.push({
            path: 'not-important.jsx',
            hydrate,
            props: {},
            styles: '',
          }),
          componentAttrStore.push({
            path: 'not-important.jsx',
            hydrate,
            props: {},
            styles: '',
          }),
        ]
        const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <h1>My incredible site</h1>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[0])}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[1])}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[2])}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

        const actual = await toHydrationLoadersApplied({
          content,
          componentAttrStore,
          isDryRun: true,
        })
        expect(actual).toMatchSnapshot()
      },
    )
    it('should apply correct props based on componentAttrStore', async () => {
      const componentAttrStore = toComponentAttrStore()
      const ids = [
        componentAttrStore.push({
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
          styles: '',
        }),
        componentAttrStore.push({
          path: 'nested/Heading.jsx',
          hydrate: 'lazy',
          props: {
            text: {
              weight: 'bold',
              content: 'Welcome to the site',
            },
          },
          styles: '',
        }),
        componentAttrStore.push({
          path: 'index.jsx',
          hydrate: 'lazy',
          props: {
            list: ['Have a nice day world'],
          },
          styles: '',
        }),
      ]
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <h1>My incredible site</h1>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[0])}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[1])}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[2])}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentAttrStore,
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
      const componentAttrStore = toComponentAttrStore()
      const ids = [
        componentAttrStore.push({
          path: 'nav.jsx',
          hydrate: 'eager',
          props: {},
          styles: '',
        }),
        componentAttrStore.push({
          path: 'nested/Heading.jsx',
          hydrate: 'eager',
          props: {},
          styles: '',
        }),
      ]
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
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[0])}>
  <nav>
    <a href="/home">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[1])}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      await toHydrationLoadersApplied({
        content,
        componentAttrStore,
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
      const componentAttrStore = toComponentAttrStore()
      const ids = [
        componentAttrStore.push({
          path: 'nav.jsx',
          hydrate: 'eager',
          props: {},
          styles: '',
        }),
        componentAttrStore.push({
          path: 'nested/Heading.jsx',
          hydrate: 'eager',
          props: {},
          styles: '',
        }),
      ]
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
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[0])}>
  <nav>
    <a href="/home">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toMountPointAttrs(ids[1])}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      await toHydrationLoadersApplied({
        content,
        componentAttrStore,
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
