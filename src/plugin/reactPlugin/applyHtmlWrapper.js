/**
 * Applies missing document wrappers to HTML fragments. This includes:
 * - (If missing) An <html> wrapper with lang="en" and <!DOCTYPE html>
 * - (If missing) A <body> wrapper
 * - (If missing) A <head> with emmett-based defaults
 * @param { import('node-html-parser').HTMLElement } rootElement
 */
module.exports = function applyHtmlWrapper(rootElement) {
  let content = rootElement.innerHTML
  const hasHtmlTag = Boolean(rootElement.querySelector('html'))
  const hasHead = Boolean(rootElement.querySelector('head'))
  const hasBody = Boolean(rootElement.querySelector('body'))
  if (!hasHtmlTag) {
    if (!hasBody) {
      content = toBodyWrapper(content)
    }
    rootElement.innerHTML = toHtmlWrapper(content, !hasHead)
  }
}

/**
 * Apply <body> tag wrapper to HTML string
 * @param {string} content
 * @return {string}
 */
function toBodyWrapper(content) {
  return `<body>
  ${content}
</body>`
}

/**
 * Apply a base <html> + <head> to HTML string
 * @param {string} content
 * @param {boolean} [applyHead]
 * @return {string}
 */
function toHtmlWrapper(content, applyHead = true) {
  const head = `
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>`
  return `<!DOCTYPE html>
<html lang="en">${applyHead ? head : ''}

${content}

</html>`
}
