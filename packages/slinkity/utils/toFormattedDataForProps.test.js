const toFormattedDataForProps = require('./toFormattedDataForProps')

describe('toFormattedDataForProps', () => {
  it('should throw without valid eleventyData', () => {
    const message = 'must pass valid eleventyData'
    const args = [true, 1, '', null, undefined, {}, { someProp: 'someValue' }]

    expect(() => toFormattedDataForProps()).toThrowError(new TypeError(message))
    args.forEach((arg) => {
      expect(() => toFormattedDataForProps(arg)).toThrowError(new TypeError(message))
    })
  })

  test.todo('should return eleventyData with formatted collections')
})
