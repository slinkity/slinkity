const { applyViteHtmlTransform } = require('./applyViteHtmlTransform')
const { toComponentAttrStore } = require('./componentAttrStore')
const nodeHtmlParser = require('node-html-parser')

const nodeHtmlParserSpy = jest.spyOn(nodeHtmlParser, 'default')

describe('reactPlugin', () => {
  const environments = ['prod', 'dev']
  it.each(environments)(
    'should not try and parse files that are not html for %s',
    async (environment) => {
      const componentAttrStore = toComponentAttrStore()
      const content = '<?xml version="1.0" encoding="utf-8"?>'
      const actual = await applyViteHtmlTransform(
        {
          content,
          outputPath: 'feed.xml',
          componentAttrStore,
        },
        {
          environment,
        },
      )
      expect(nodeHtmlParserSpy).not.toHaveBeenCalled()
      expect(actual).toBe(content)
    },
  )
})
