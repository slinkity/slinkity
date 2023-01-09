# create-slinkity

## 2.0.1

### Patch Changes

- 1c9c753: Fix missing pieces of the 1.0 canary refactor:

  - Fix `ReactDemo` reference on preact page
  - Fix unused `hydrate` prop across Slinky components
  - Add `sass` as a dependency. This is no longer bundled with Slinkity.
  - Move `hydrate` flags to `island` export across pages

## 2.0.0

### Major Changes

- 802843c: Finalize API for Slinkity 1.0. This comes with a number of improvements, including:

  - A new `{% island %}` shortcode with reimagined methods for hydration and prop passing
  - Bump to Vite 3.0 🚀
  - A new `island` export for component pages to better separate hydration from your frontmatter
  - Removing old APIs, including the Slinkity CLI

  See our new Slinkity canary docs to get started: https://slinkity.dev/docs

## 1.2.0

### Minor Changes

- 5cc17e1: Update for new Slinkity configuration in v0.8. This removes all references to the slinkity CLI, and writes the new 11ty plugin into your generated 11ty config
