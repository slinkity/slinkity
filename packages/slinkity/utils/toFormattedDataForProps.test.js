const toFormattedDataForProps = require('./toFormattedDataForProps')

describe('toFormattedDataForProps', () => {
  it('should return eleventyData with formatted collections', () => {
    const someEleventyData = {
      someProperty: 'some value',
    }
    const someCollectionItem = {
      data: {},
      date: new Date().toString(),
      filePathStem: 'some/file/path/stem',
      fileSlug: 'some-file-slug',
      inputPath: 'src',
      outputPath: 'dist',
      templateContent: 'some content',
      url: 'some url',
    }
    const eleventyData = {
      ...someEleventyData,
      collections: {
        someCollection: [
          {
            ...someCollectionItem,
            data: { collections: [{}] },
            template: 'some-template',
          },
        ],
      },
    }

    const output = toFormattedDataForProps(eleventyData)

    // Has eleventyData.
    Object.entries(someEleventyData).forEach(([property, value]) => {
      expect(output).toHaveProperty(property, value)
    })

    // Has collections.
    expect(output).toHaveProperty('collections')

    /*
     * Each collection item has the correct data, but does not include
     * collections, template, or templateContent setter.
     */
    Object.values(output.collections).forEach((collection) => {
      collection.forEach((item) => {
        expect(item).toStrictEqual(someCollectionItem)
        expect(item).not.toHaveProperty('data.collections')
        expect(item).not.toHaveProperty('template')
        const templateContentProp = Object.getOwnPropertyDescriptor(item, 'templateContent')
        expect(templateContentProp.set).toBeUndefined()
      })
    })
  })
})
