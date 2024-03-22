[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/slinkity/slinkity/blob/main/LICENSE.md)
[![Twitter: slinkitydotdev](https://img.shields.io/twitter/follow/slinkitydotdev.svg?style=social)](https://twitter.com/slinkitydotdev)

# Slinkity

> ⚠️ **This project is no longer maintained.** The project owner ([@bholmesdev](https://github.com/bholmesdev)) now works on [Astro](https://astro.build) full-time. If you want to build component-driven content sites, give Astro a try! If you're committed to 11ty and want to use client components, consider [11ty's WebC project](https://www.11ty.dev/docs/languages/webc/).

## About

[Slinkity](https://slinkity.dev) is a simple way to handle styles and component frameworks on your 11ty site. Once installed, this:

- 🚀 **Unlocks component frameworks** like React for writing page templates and layout templates. Turn an existing `.html` or `.liquid` file into a `.jsx` file, and you're off to the componentized races.
- 🔖 **Includes powerful shortcodes** to insert components into existing pages. Add a line like this to your markdown, HTML, Nunjucks, etc, and watch the magic happen: `{% react 'path/to/component' %}`
- 💧 **Hydrates these components** when and how you want. Use component frameworks as a static template to start, and opt-in to shipping JS as needed with our [partial hydration helpers](https://slinkity.dev/docs/partial-hydration/).
- 💅 **Bundles all your resources** with the power of Vite. Use your favorite CSS preprocessor, JS minifier, and more with minimal config.

## Technologies used

Slinkity stands on the shoulders of giants. You can think of Slinkity as the "glue" binding 2 tools together:

1. [**Eleventy:**](https://www.11ty.dev) a static site generator with a rich feature set for fetching data, composing layouts, and inserting content with "shortcodes."
2. [**Vite:**](https://vitejs.dev) a bundler that takes the boilerplate out of your set up. It'll compile JS component frameworks, handle CSS preprocessors with little-to-no config (say, SCSS and PostCSS), and show dev changes on-the-fly using [hot module replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement).

## Getting started

Use our handy CLI command to spin up a Slinkity site: `npm init slinkity`. This demos our core functionality while staying as lean as possible, making it the perfect launchpad for new projects 🚀

To learn more, and explore adding Slinkity to _existing_ 11ty projects...

### [🐣 See our "quick start" guide →](https://slinkity.dev/docs/quick-start)

## Feature set

This project is still in early alpha, so we have many features soon to come! [This demo](https://www.youtube.com/watch?v=X_zp6CodHjc&t=493s) covers a majority of features we support today. For reference, here's our complete roadmap of current and upcoming features:

| Feature                                                                               | Status    |
|---------------------------------------------------------------------------------------|-----------|
| CLI to run 11ty and Vite simultaneously                                               | ✅         |
| Plugin ecosystem for your favorite component framework (React, Vue, Svelte, etc)      | ✅         |
| Component pages                                                                       | ✅         |
| Component shortcodes                                                                  | ✅         |
| SCSS and SASS                                                                         | ✅         |
| PostCSS config (ex. Tailwind)                                                         | ✅         |
| CSS imports via ESM (including CSS modules)                                           | ✅         |
| Shared state between any component shortcode                                          | ⏳         |

- ✅ = Ready to use
- ⏳ = In progress

## Have an idea? Notice a bug?

We'd love to hear your feedback! Feel free to log an issue on our [GitHub issues page](https://github.com/slinkity/slinkity/issues). If your question is more personal, [our Twitter DMs](https://twitter.com/slinkitydotdev) are always open as well.
