const toSlashesTrimmed = require('./toSlashesTrimmed')

describe('toSlashesTrimmed', () => {
  it('returns a URL with slashes trimmed', () => {
    expect(toSlashesTrimmed('url')).toBe('url')
    expect(toSlashesTrimmed('/url')).toBe('url')
    expect(toSlashesTrimmed('url/')).toBe('url')
    expect(toSlashesTrimmed('/url/')).toBe('url')
    expect(toSlashesTrimmed('https://example.com')).toBe('https://example.com')
    expect(toSlashesTrimmed('https://example.com/')).toBe('https://example.com')
    expect(toSlashesTrimmed('https://example.com/path/')).toBe('https://example.com/path')
  })
})
