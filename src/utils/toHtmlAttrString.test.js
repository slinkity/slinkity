const toHtmlAttrString = require('./toHtmlAttrString')

describe('toHtmlAttrString', () => {
  it('should stringify objects with a single value', () => {
    const props = {
      ['data-s-slinkity']: 'is great',
    }

    const expected = 'data-s-slinkity="is great"'

    expect(toHtmlAttrString(props)).toEqual(expected)
  })
  it('should stringify objects with multiple string values joined by spaces', () => {
    const props = {
      ['data-s-slinkity']: 'is great',
      ['data-s-who']: 'could deny',
      ['data-s-how']: 'good it is',
    }

    const expected = 'data-s-slinkity="is great" data-s-who="could deny" data-s-how="good it is"'

    expect(toHtmlAttrString(props)).toEqual(expected)
  })
  it('should stringify objects with multiple mixed values joined by spaces', () => {
    const props = {
      ['data-s-string']: 'nice string',
      ['data-s-number']: 4420000,
      ['data-s-boolean']: true,
      ['data-s-another-boolean']: false,
      ['data-s-another-number']: 42,
    }

    const expected =
      'data-s-string="nice string" data-s-number="4420000" data-s-boolean="true" data-s-another-boolean="false" data-s-another-number="42"'

    expect(toHtmlAttrString(props)).toEqual(expected)
  })
  it('should escape invalid Html characters', () => {
    const props = {
      ['data-angular']: '<neat>',
      ['data-quotacious']: '"I\'m a value!"',
      ['data-yes-and']: 'Yes &',
      ['data-all-together-now']: '<cool> I\'m ready to "rock & roll"',
    }

    const expected =
      'data-angular="&lt;neat&gt;" data-quotacious="&quot;I&#39;m a value!&quot;" data-yes-and="Yes &amp;" data-all-together-now="&lt;cool&gt; I&#39;m ready to &quot;rock &amp; roll&quot;"'

    expect(toHtmlAttrString(props)).toEqual(expected)
  })
})
