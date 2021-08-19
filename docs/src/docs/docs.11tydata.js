const { join } = require('path')

// Add new docs here to update navbar 👇
const navSlugSortOrder = [
  '',
  'quick-start',
  'component-shortcodes',
  'component-pages-layouts',
  'partial-hydration',
]

const trimSlashes = (s) => s.replace(/^\/|\/$/g, '')
const toUrl = (slug) => trimSlashes(join('docs/', slug))

module.exports = {
  layout: 'docs/layout',
  title: 'Docs',
  tags: 'docs',
  eleventyComputed: {
    navLinksSorted: ({ collections: { docs } }) => {
      return navSlugSortOrder.map((slug) => {
        const matchingDocInfo = docs.find(
          (doc) => trimSlashes(doc.data.page.url) === toUrl(slug)
        )

        return {
          href: matchingDocInfo && matchingDocInfo.data.page.url,
          title: matchingDocInfo && matchingDocInfo.data.title,
        }
      })
    },
  },
}
