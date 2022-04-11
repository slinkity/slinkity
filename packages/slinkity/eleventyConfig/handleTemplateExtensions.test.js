const { toEleventyIgnored } = require('./handleTemplateExtensions')
const path = require('path')

const toPathGenerator = (includes) => (extension) => path.join(includes, `**/*.${extension}`)

describe('toEleventyIgnored', () => {
  const includes = 'src/_includes'
  const toPath = toPathGenerator(includes)
  it('generates ignored paths when userEleventyIgnores is null', () => {
    const extensions = [
      {
        extension: 'css',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
      {
        extension: 'vue',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
    ]
    expect(toEleventyIgnored(null, includes, extensions)).toEqual(
      extensions.map(({ extension }) => toPath(extension)),
    )
  })
  it('generates ignored paths when userEleventyIgnores is an array', () => {
    const userEleventyIgnores = [toPath('jsx'), toPath('scss')]
    const extensions = [
      {
        extension: 'css',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
      {
        extension: 'vue',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
    ]
    expect(toEleventyIgnored(userEleventyIgnores, includes, extensions)).toEqual(
      userEleventyIgnores,
    )
  })
  it('generates ignored paths when userEleventyIgnores is a function', () => {
    function userEleventyIgnores(defaultIgnores) {
      return defaultIgnores.filter((defaultIgnore) => !defaultIgnore.endsWith('css'))
    }
    const extensions = [
      {
        extension: 'css',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
      {
        extension: 'scss',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
      {
        extension: 'css.js',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
    ]
    expect(toEleventyIgnored(userEleventyIgnores, includes, extensions)).toEqual([toPath('css.js')])
  })
  it('omits entries that should not be ignored from includes', () => {
    const includedExtensions = [
      {
        extension: 'css',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
      {
        extension: 'scss',
        isTemplateFormat: false,
        isIgnoredFromIncludes: true,
      },
    ]
    const omittedExtensions = [
      {
        extension: 'css.js',
        isTemplateFormat: false,
        isIgnoredFromIncludes: false,
      },
      {
        extension: 'jsx',
        isTemplateFormat: true,
        isIgnoredFromIncludes: false,
      },
    ]
    expect(
      toEleventyIgnored(null, includes, [...includedExtensions, ...omittedExtensions]),
    ).toEqual(includedExtensions.map(({ extension }) => toPath(extension)))
  })
})
