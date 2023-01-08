const { EleventyRenderPlugin } = require("@11ty/eleventy");
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const yaml = require('js-yaml')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const toc = require('eleventy-plugin-nesting-toc')
const convertEmojiToAccessibleProgress = require('./src/utils/feature-progress-shortcode')

const slinkity = require('slinkity')
const svelte = require('@slinkity/svelte')

module.exports = function config(eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [svelte()],
    })
  )

  // Render headline anchors in the most accessible way, according to Amber Wilson: https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/#accessibility-check
  const linkAfterHeader = markdownItAnchor.permalink.linkAfterHeader({
    style: 'visually-hidden',
      assistiveText: title => `Section titled "${title}"`,
      visuallyHiddenClass: 'sr-only',
      symbol: '🔗'
  })
  const markdownItAnchorSettings = {
    level: [2,3],
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

  eleventyConfig.addPlugin(
    toc,
    {
      wrapper: 'nav',
      tags: ['h2', 'h3', 'h4', 'h5', 'h6']
    }
  )

  eleventyConfig.addShortcode('featureProgress', convertEmojiToAccessibleProgress)

  eleventyConfig.setLibrary('md', markdownConfigured)
  eleventyConfig.addPassthroughCopy('public')
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents))
  eleventyConfig.addPlugin(EleventyRenderPlugin)
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
    markdownTemplateEngine: 'njk',
    dir: {
      input: 'src',
      layouts: '_layouts',
    },
  }
}
