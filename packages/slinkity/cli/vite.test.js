const { getConfigFile, getResolvedAliases } = require('./vite')
const { resolve } = require('path')

describe('vite', () => {
  it('getConfigFile', async () => {
    expect(await getConfigFile()).toBeUndefined()
  })

  it('getResolvedAliases', () => {
    const empty = {
      input: '',
      includes: '',
      layouts: '',
    }
    const emptyExpected = {
      root: resolve(''),
      input: resolve(''),
      includes: resolve(''),
      layouts: resolve(''),
    }
    const config = {
      input: 'input',
      includes: 'includes',
      layouts: 'layouts',
    }
    const configExpected = {
      root: resolve(''),
      input: resolve(config.input),
      includes: resolve(config.input, config.includes),
      layouts: resolve(config.input, config.layouts),
    }
    expect(getResolvedAliases(empty)).toStrictEqual(emptyExpected)
    expect(getResolvedAliases(config)).toStrictEqual(configExpected)
  })
})
