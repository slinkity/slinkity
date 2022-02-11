const { join } = require('path')

// Add new docs here to update navbar 👇
const navSlugSortOrderGuides = [
  '',
  'quick-start',
  'component-shortcodes',
  'component-pages-layouts',
  'partial-hydration',
  'deployment',
]

const navSlugSortOrderReference = ['config', 'styling', 'asset-management', 'import-aliases']

const trimSlashes = (s) => s.replace(/^\/|\/$/g, '')
const toUrl = (slug) => trimSlashes(join('docs/', slug))
/**
 * Map a given page slug to a link based on a given collection
 * @param {any[]} docs All docs from the "docs" 11ty collection
 * @param {string} slug Page slug to match with titles and links
 * @returns {{
 *  href: string;
 *  title: string;
 * }}
 */
const mapToLinks = (docs, slug) => {
  const matchingDocInfo = docs.find((doc) => trimSlashes(doc.data.page.url) === toUrl(slug))

  return {
    href: matchingDocInfo && matchingDocInfo.data.page.url,
    title: matchingDocInfo && matchingDocInfo.data.title,
  }
}

module.exports = {
  layout: 'docs',
  title: 'Docs',
  tags: 'docs',
  eleventyComputed: {
    navLinksSorted: ({ collections: { docs } }) => {
      const guides = navSlugSortOrderGuides.map((slug) => mapToLinks(docs, slug))
      const reference = navSlugSortOrderReference.map((slug) => mapToLinks(docs, slug))

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
