/**
 * Format 11ty data to better stringify for use in clientside props
 * @param {Object} eleventyData Data provided by the 11ty data cascade
 * @returns eleventyData formatted for use in clientside props
 */
function toFormattedDataForProps(eleventyData = {}) {
  const formattedCollections = {}
  for (let name of Object.keys(eleventyData.collections)) {
    formattedCollections[name] = eleventyData.collections[name].map((item) => {
      /**
       * Items omitted:
       * - template: reference to the Template class
       *   - reason: this is an unwieldy object that's nearly impossible to stringify for clientside use
       *     It's also undocumented, so we assume developers rarely rely on this field
       * - templateContent setter: method to set rendered templateContent
       *   - reason: components shouldn't be able to set underlying 11ty data
       * - data.collections: a nested, circular reference to the outer collections array
       *   - reason: it's best to remove circular dependencies before stringifying for clientside use
       */
      // eslint-disable-next-line no-unused-vars
      const { collections, ...data } = item.data
      return {
        inputPath: item.inputPath,
        fileSlug: item.fileSlug,
        filePathStem: item.filePathStem,
        date: item.date,
        outputPath: item.outputPath,
        url: item.url,
        data,
        get templateContent() {
          return item.templateContent
        },
      }
    })
  }
  return {
    ...eleventyData,
    collections: formattedCollections,
  }
}

module.exports = toFormattedDataForProps
