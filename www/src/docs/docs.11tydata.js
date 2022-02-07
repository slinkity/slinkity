const { join } = require('path')

// Add new docs here to update navbar 👇
const navSlugSortOrderGuides = [
  '',
  'quick-start',
  'config',
  'component-shortcodes',
  'component-pages-layouts',
  'partial-hydration',
  'styling',
  'asset-management',
  'import-aliases',
  'deployment',
]

const navSlugSortOrderReference = ['partial-hydration', 'styling', 'import-aliases', 'deployment']

const trimSlashes = (s) => s.replace(/^\/|\/$/g, '')
const toUrl = (slug) => trimSlashes(join('docs/', slug))

module.exports = {
  layout: 'docs',
  title: 'Docs',
  tags: 'docs',
  eleventyComputed: {
    navLinksSorted: ({ collections: { docs } }) => {
      const guides = navSlugSortOrderGuides.map((slug) => {
        const matchingDocInfo = docs.find((doc) => trimSlashes(doc.data.page.url) === toUrl(slug))

        return {
          href: matchingDocInfo && matchingDocInfo.data.page.url,
          title: matchingDocInfo && matchingDocInfo.data.title,
        }
      })
      const reference = navSlugSortOrderReference.map((slug) => {
        const matchingDocInfo = docs.find((doc) => trimSlashes(doc.data.page.url) === toUrl(slug))

        return {
          href: matchingDocInfo && matchingDocInfo.data.page.url,
          title: matchingDocInfo && matchingDocInfo.data.title,
        }
      })

      return {
        guides: {
          label: 'Guides',
          links: guides,
        },
        reference: {
          label: 'Reference',
          links: reference,
        },
      }
    },
  },
}
