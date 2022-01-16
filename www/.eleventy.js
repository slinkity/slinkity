const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const yaml = require('js-yaml')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const convertEmojiToAccessibleProgress = require('./src/utils/feature-progress-shortcode')

module.exports = function config(eleventyConfig) {
  // Render headline anchors in the most accessible way, according to Amber Wilson: https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/#accessibility-check
  const linkAfterHeader = markdownItAnchor.permalink.linkAfterHeader({
    style: 'visually-hidden',
      assistiveText: title => `Section titled "${title}"`,
      visuallyHiddenClass: 'sr-only',
      symbol: '🔗'
  })
  const markdownItAnchorSettings = {
    level: [2],
    permalink (slug, opts, state, idx) {
      // this is necessary to wrap the headings in an element
      state.tokens.splice(idx, 0, Object.assign(new state.Token('div_open', 'div', 1), {
        attrs: [['class', 'heading-wrapper']],
        block: true
      }))
  
      state.tokens.splice(idx + 4, 0, Object.assign(new state.Token('div_close', 'div', -1), {
        block: true
      }))
      linkAfterHeader(slug, opts, state, idx +1)
    }
  }
  const markdownConfigured = markdownIt({ html: true }).use(markdownItAnchor, markdownItAnchorSettings)

  eleventyConfig.addShortcode('featureProgress', convertEmojiToAccessibleProgress)

  eleventyConfig.setLibrary('md', markdownConfigured)
  eleventyConfig.addPassthroughCopy('public')
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents))
  eleventyConfig.addPlugin(
    syntaxHighlight,
    {
      preAttributes: {
        tabindex: 0
	  }
    }
  )

  return {
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'src',
      layouts: '_layouts',
    },
  }
}
