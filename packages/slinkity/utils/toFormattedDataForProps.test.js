const toFormattedDataForProps = require('./toFormattedDataForProps')

describe('toFormattedDataForProps', () => {
  it('should throw without valid eleventyData', () => {
    const error = new TypeError('must pass valid eleventyData')
    const args = [true, 1, '', null, undefined, {}, { someProp: 'someValue' }]

    expect(() => toFormattedDataForProps()).toThrowError(error)
    args.forEach((arg) => {
      expect(() => toFormattedDataForProps(arg)).toThrowError(error)
    })
  })

  test.todo('should return eleventyData with formatted collections')
})
