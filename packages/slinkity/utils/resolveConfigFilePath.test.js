const { resolveConfigFilePath } = require('./resolveConfigFilePath')
const { resolve } = require('path')

describe('resolveConfigFilePath', () => {
  it('returns undefined if no file is found', async () => {
    expect(await resolveConfigFilePath([])).toBeUndefined()
    expect(await resolveConfigFilePath(['path/to/nothing'])).toBeUndefined()
  })

  it('returns the first found file path', async () => {
    expect(await resolveConfigFilePath(['README.md'])).toBe(resolve('README.md'))
    expect(
      await resolveConfigFilePath([
        'path/to/nothing',
        'README.md',
        'package.json',
        'another/path/to/nothing',
      ]),
    ).toBe(resolve('README.md'))
  })
})
