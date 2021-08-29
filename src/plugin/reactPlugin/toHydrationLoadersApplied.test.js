const { parse } = require('node-html-parser')
const { SLINKITY_REACT_MOUNT_POINT, SLINKITY_ATTRS } = require('../../utils/consts')
const toHtmlAttrString = require('../../utils/toHtmlAttrString')
const applyHtmlWrapper = require('./applyHtmlWrapper')
const { toHydrationLoadersApplied, webComponentLoader } = require('./toHydrationLoadersApplied')
const fsPromises = require('fs').promises

jest.mock('fs/promises')
jest.mock('../../utils/fileHelpers')

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
      const componentToPropsMap = {}

      const actual = await toHydrationLoadersApplied({
        content,
        componentToPropsMap,
        isDryRun: true,
      })
      expect(actual).toEqual(content)
    })
    it('should applyHtmlWrapper if none exists', async () => {
      const content = '<ul id="list"><li>Hello World</li></ul>'
      const componentToPropsMap = {}

      const actual = await toHydrationLoadersApplied({
        content,
        componentToPropsMap,
        isDryRun: true,
      })
      const expectedRoot = parse(actual)
      applyHtmlWrapper(expectedRoot)
      expect(actual).toEqual(expectedRoot.outerHTML)
    })
  })
  describe('with mount points', () => {
    it('should apply web component loader', async () => {
      const componentToPropsMap = {}
      const props = {
        [SLINKITY_ATTRS.path]: '/very/cool/path.jsx',
      }
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(props)}>
    <ul id="list"><li>Hello World</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentToPropsMap,
        isDryRun: true,
      })
      expect(actual).toContain(webComponentLoader)
    })
    it('should apply instance attributes to all mount points in chronological order', async () => {
      const componentToPropsMap = {}
      const props = {
        [SLINKITY_ATTRS.path]: '/very/cool/path.jsx',
      }
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(props)}>
    <ul id="list"><li>Hello World</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(props)}>
    <ul id="list"><li>Goodbye World</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(props)}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentToPropsMap,
        isDryRun: true,
      })
      const root = parse(actual)
      const mountPoints = root.querySelectorAll(SLINKITY_REACT_MOUNT_POINT)
      const instancesPerMountPoint = mountPoints.map((mountPoint) =>
        mountPoint?.getAttribute(SLINKITY_ATTRS.instance),
      )
      expect(instancesPerMountPoint).toEqual(['0', '1', '2'])
    })
    test.each(['true', 'false'])(
      'should apply correct hydration loaders when isLazy is %s',
      async (isLazy) => {
        const componentToPropsMap = {}
        const toProps = (componentPath) => ({
          [SLINKITY_ATTRS.path]: componentPath,
          [SLINKITY_ATTRS.lazy]: isLazy,
        })
        const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <h1>My incredible site</h1>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(toProps('/nice.jsx'))}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(toProps('/more/Nested.jsx'))}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(toProps('/index.jsx'))}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

        const actual = await toHydrationLoadersApplied({
          content,
          componentToPropsMap,
          isDryRun: true,
        })
        expect(actual).toMatchSnapshot()
      },
    )
    it('should apply correct props based on componentToPropsMap', async () => {
      const componentToPropsMap = {
        ['/nav.jsx']: {
          firstProp: 'nice',
          secondProp: 42,
          thirdProp: false,
          helper() {
            return 'Testing non-JSON properties'
          },
        },
        ['/nested/Heading.jsx']: {
          text: {
            weight: 'bold',
            content: 'Welcome to the site',
          },
        },
        ['/index.jsx']: {
          list: ['Have a nice day world'],
        },
      }
      const toProps = (componentPath, isLazy = false) => ({
        [SLINKITY_ATTRS.path]: componentPath,
        [SLINKITY_ATTRS.lazy]: isLazy,
      })
      const content = `<html>
<head>
  <title>It's hydration time</title>
</head>
<body>
  <h1>My incredible site</h1>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(toProps('/nav.jsx', true))}>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(toProps('/nested/Heading.jsx'))}>
    <h2>Welcome to the site</h2>
  </${SLINKITY_REACT_MOUNT_POINT}>
  <${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(toProps('/index.jsx', true))}>
    <ul id="list"><li>Have a nice day world</li></ul>
  </${SLINKITY_REACT_MOUNT_POINT}>
</body>
</html>`

      const actual = await toHydrationLoadersApplied({
        content,
        componentToPropsMap,
        isDryRun: true,
      })
      expect(actual).toMatchSnapshot()
    })
  })
})
