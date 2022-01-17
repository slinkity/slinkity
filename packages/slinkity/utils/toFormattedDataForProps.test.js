const toFormattedDataForProps = require('./toFormattedDataForProps')

describe('toFormattedDataForProps', () => {
  it('should throw without valid eleventyData', () => {
    const message = 'must pass valid eleventyData to toFormattedDataForProps'
    const error = new TypeError(message)
    const args = [true, 1, '', null, undefined, {}, { someProp: 'someValue' }]

    expect(() => toFormattedDataForProps()).toThrowError(error)
    args.forEach((arg) => {
      expect(() => toFormattedDataForProps(arg)).toThrowError(error)
    })
  })

  test.todo('should return eleventyData with formatted collections')
})
