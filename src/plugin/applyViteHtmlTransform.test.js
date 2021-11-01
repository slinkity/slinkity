const { applyViteHtmlTransform } = require('./applyViteHtmlTransform')
const { toComponentAttrStore } = require('./componentAttrStore')

describe('reactPlugin', () => {
  it('should not try and parse files that are not html', async () => {
    const componentAttrStore = toComponentAttrStore()
    const content = '<?xml version="1.0" encoding="utf-8"?>';
    const actual = await applyViteHtmlTransform({
      content,
      outputPath: 'feed.xml',
      componentAttrStore,
    })
    expect(actual).toBe(content)
  })
})