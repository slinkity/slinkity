const { isStyleImport } = require('./toViteSSR')

const cssExtensions = ['css', 'scss', 'sass', 'less', 'stylus']

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
})
