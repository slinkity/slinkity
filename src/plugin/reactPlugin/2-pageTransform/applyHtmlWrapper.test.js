const { parse } = require('node-html-parser')
const applyHtmlWrapper = require('./applyHtmlWrapper')

describe('applyHtmlWrapper', () => {
  it('should apply missing <html>,<head>, and <body> to fragment', () => {
    const root = parse('<ul id="list"><li>Hello World</li></ul>')
    applyHtmlWrapper(root)
    expect(root.outerHTML).toMatchSnapshot()
  })
  it('should not apply <body> when <body> is already present', () => {
    const root = parse('<body><p>Content!</p></body>')
    applyHtmlWrapper(root)
    expect(root.outerHTML).toMatchSnapshot()
  })
  it('should not apply <head> when <head> is already present', () => {
    const root = parse(`<head>
  <title>I'm already here!</title>
</head>
<body>
  <ul id="list"><li>Hello World</li></ul>
</body>`)
    applyHtmlWrapper(root)
    expect(root.outerHTML).toMatchSnapshot()
  })
  it('should not do anything when <html> is already present', () => {
    const root = parse(`<html>
<head>
  <title>I'm already here!</title>
</head>
<body>
  <ul id="list"><li>Hello World</li></ul>
</body>
</html>`)

    applyHtmlWrapper(root)
    expect(root.outerHTML).toMatchSnapshot()
  })
})
