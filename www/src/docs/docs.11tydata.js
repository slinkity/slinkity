const { join } = require('path')

// Add new docs here to update navbar 👇
const navSlugSortOrder = [
  '',
  'quick-start',
  'config',
  'component-shortcodes',
  'component-pages-layouts',
  'partial-hydration',
  'styling',
  'import-aliases',
  'deployment',
]

const trimSlashes = (s) => s.replace(/^\/|\/$/g, '')
const toUrl = (slug) => trimSlashes(join('docs/', slug))

module.exports = {
  layout: 'docs',
  title: 'Docs',
  tags: 'docs',
  eleventyComputed: {
    navLinksSorted: ({ collections: { docs } }) => {
      return navSlugSortOrder.map((slug) => {
        const matchingDocInfo = docs.find((doc) => trimSlashes(doc.data.page.url) === toUrl(slug))

        return {
          href: matchingDocInfo && matchingDocInfo.data.page.url,
          title: matchingDocInfo && matchingDocInfo.data.title,
        }
      })
    },
  },
}
