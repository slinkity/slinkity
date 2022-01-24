const { toEleventyIgnored } = require('./handleTemplateExtensions')
const path = require('path')

const toPathGenerator = (input, includes) => (extension) =>
  path.join(input, includes, `**/*.${extension}`)

describe('toEleventyIgnored', () => {
  const dir = {
    input: 'src',
    output: '_site',
    includes: '_includes',
    layouts: '_layouts',
  }
  const toPath = toPathGenerator(dir.input, dir.includes)
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
    expect(toEleventyIgnored(null, dir, extensions)).toEqual(
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
    expect(toEleventyIgnored(userEleventyIgnores, dir, extensions)).toEqual(userEleventyIgnores)
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
    expect(toEleventyIgnored(userEleventyIgnores, dir, extensions)).toEqual([toPath('css.js')])
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
    expect(toEleventyIgnored(null, dir, [...includedExtensions, ...omittedExtensions])).toEqual(
      includedExtensions.map(({ extension }) => toPath(extension)),
    )
  })
})
