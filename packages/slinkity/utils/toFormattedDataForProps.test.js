const toFormattedDataForProps = require('./toFormattedDataForProps')

describe('toFormattedDataForProps', () => {
  it('should return eleventyData with formatted collections', () => {
    const eleventyData = {
      collections: {
        someCollection: [
          {
            data: {},
            date: new Date().toString(),
            filePathStem: 'some/file/path/stem',
            fileSlug: 'some-file-slug',
            inputPath: 'src',
            outputPath: 'dist',
            templateContent: 'some content',
            url: 'some url',
          },
        ],
      },
    }
    const expected = {
      ...eleventyData,
    }

    expect(toFormattedDataForProps(eleventyData)).toEqual(expected)
  })
})
