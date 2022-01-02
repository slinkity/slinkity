const { isStyleImport, collectCSS } = require('./toViteSSR')

const cssExtensions = ['css', 'scss', 'sass', 'less', 'stylus']

function toConvincingUrl(fileName) {
  return `/@fs/Users/person/project/${fileName}`
}

describe('toViteSSR', () => {
  describe('isStyleImport', () => {
    it.each(cssExtensions)('should be true on the .%s extension', (extension) => {
      expect(isStyleImport(`/super/cool/path.${extension}`)).toEqual(true)
    })
    it.each(cssExtensions)('should be true with query params after .%s extension', (extension) => {
      // Rollup can append query params like ?used to its modules
      // Yes, it's annoying. Let's test for it!
      expect(isStyleImport(`very/neat/path.${extension}?used`)).toEqual(true)
    })
    it('should be false for invalid paths', () => {
      expect(isStyleImport('im not a path....')).toEqual(false)
    })
    it('should be false for non-CSS extensions', () => {
      expect(isStyleImport('cool/path.jsx')).toEqual(false)
    })
  })
  describe('collectCSS', () => {
    it('should generate set of CSS imports from flat module set', () => {
      const expected = ['base.css', 'scoped.module.scss', 'fancy.stylus'].map(toConvincingUrl)
      const mod = {
        url: toConvincingUrl('base.js'),
        importedModules: new Set([
          {
            url: expected[0],
            importedModules: new Set(),
          },
          {
            url: expected[1],
            importedModules: new Set(),
          },
          {
            url: expected[1],
            importedModules: new Set(),
          },
          {
            url: expected[2],
            importedModules: new Set(),
          },
          {
            url: toConvincingUrl('ImageCarousel.svelte'),
            importedModules: new Set(),
          },
          {
            url: toConvincingUrl('Component.jsx'),
            importedModules: new Set(),
          },
        ]),
      }
      /** @type {Set<string>} */
      const collectedCSS = new Set()
      collectCSS(mod, collectedCSS)
      expect(collectedCSS).toEqual(new Set(expected))
    })
    it('should generate set of CSS imports from nested module sets', () => {
      const expected = ['global.css', 'NestedStyles.module.scss'].map(toConvincingUrl)
      /** @type {import('vite').ModuleNode} */
      const mod = {
        url: toConvincingUrl('base.js'),
        importedModules: new Set([
          {
            url: toConvincingUrl('NestedComponent.jsx'),
            importedModules: new Set([
              {
                url: expected[0],
                importedModules: new Set(),
              },
              {
                url: expected[1],
                importedModules: new Set(),
              },
            ]),
          },
          {
            url: toConvincingUrl('OtherNestedComponent.jsx'),
            importedModules: new Set(),
          },
          {
            url: toConvincingUrl('ImageCarousel.svelte'),
            importedModules: new Set([
              {
                url: expected[1],
                importedModules: new Set(),
              },
              {
                url: toConvincingUrl('NestedComponent.aardvark'),
                importedModules: new Set(),
              },
            ]),
          },
        ]),
      }
      /** @type {Set<string>} */
      const collectedCSS = new Set()
      collectCSS(mod, collectedCSS)
      expect(collectedCSS).toEqual(new Set(expected))
    })
    it('should ignore null or undefined modules', () => {
      const expected = ['global.css', 'NestedStyles.module.scss'].map(toConvincingUrl)
      /** @type {import('vite').ModuleNode} */
      const mod = {
        url: toConvincingUrl('base.js'),
        importedModules: new Set([
          {
            url: toConvincingUrl('NestedComponent.jsx'),
            importedModules: new Set([
              {
                url: expected[0],
                importedModules: new Set(),
              },
              {
                url: expected[1],
                importedModules: new Set(),
              },
              null,
              undefined,
            ]),
          },
          {
            url: toConvincingUrl('OtherNestedComponent.jsx'),
            importedModules: new Set(),
          },
          undefined,
        ]),
      }
      /** @type {Set<string>} */
      const collectedCSS = new Set()
      collectCSS(mod, collectedCSS)
      expect(collectedCSS).toEqual(new Set(expected))
    })
  })
})
