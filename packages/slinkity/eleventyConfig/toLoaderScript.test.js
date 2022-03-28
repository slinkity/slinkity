const loaders = require('./loaders')
const toLoaderScript = require('./toLoaderScript')

const loaderMap = Object.fromEntries(loaders.map((loader) => [loader.name, loader]))

function toFakeArgs(loader) {
  if (loader === 'onClientMedia') {
    return 'screen (max-width: 500px)'
  } else {
    return ''
  }
}

describe('toLoaderScript', () => {
  let id = 0

  afterEach(() => {
    id += 1
  })
  it.each(Object.keys(loaderMap))('Should generate hydration script for "%s"', (loader) => {
    const fakeArgs = toFakeArgs(loader)
    expect(
      toLoaderScript({
        componentPath: `/component/using/${loader}/index.jsx`,
        componentLoaderMap: loaderMap,
        loader: fakeArgs ? `${loader}(${fakeArgs})` : loader,
        id,
        props: { hydrate: loader },
        isSSR: true,
        clientRenderer: '@slinkity/renderer-react',
        children: `<p>I love the ${loader} loader!</p>`,
      }),
    ).toMatchSnapshot()
  })
})
