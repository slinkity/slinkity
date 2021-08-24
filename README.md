![Slinkity - To eleventy and beyond](https://slinkity.dev/assets/og-image-banner.jpg)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Holben888/slinkity/blob/main/LICENSE.md)
[![Twitter: slinkitydotdev](https://img.shields.io/twitter/follow/slinkitydotdev.svg?style=social)](https://twitter.com/slinkitydotdev)

# Slinkity

> 🚧 **This project is heavily under construction!** 🚧 As excited as you may be, we don't recommend this early alpha for production use. Still, give it a try if you want to have some fun and don't mind [logging bugs](https://github.com/Holben888/slinkity/issues) along the way :)

Slinkity is a tool for bringing dynamic, clientside interactions to your static 11ty site. Once installed, this:

- 🚀 **Unlocks component frameworks** (like React) for writing page templates and layout templates. So, you can turn an existing `.html` or `.liquid` file into a `.jsx` file, and immediately start building routes using React.
- 🔖 **Includes powerful shortcodes** to insert components into existing pages. Add a line like this to your markdown, HTML, Nunjucks, etc, and watch the magic happen: `{% react './path/to/component.jsx' %}`
- 💧 **Hydrates these component-driven pages** on the client. In other words, all your dynamic state management will work in development and production with 0 extra setup.

### [📣 Find our full announcement post here →](https://slinkity.dev/)

## Quick start

All you need is an empty directory to get started! But if you prefer a starter project with some pre-populated content, you can use the lovely guide + community resources [over on the 11ty docs](https://www.11ty.dev/docs/getting-started/).

### Installation

First, install Slinkity + the latest 11ty into your project repo like so:

```bash
npm i --save-dev slinkity @11ty/eleventy@1.0.0-canary.41
```

> Slinkity relies on 11ty's [latest 1.0 canary build](https://www.npmjs.com/package/@11ty/eleventy/v/1.0.0-canary.41) to work properly. Yes, this could involve some gotchas with existing 11ty plugins! If anything unexpected happens, let us know on our [GitHub issues page](https://github.com/Holben888/slinkity/issues).

...and run our CLI command to spin up the dev server:

```bash
npx slinkity --serve
# Also consider the --incremental flag
# for faster builds during development
```

Now you're off to the races! This command will:

1. Start up [11ty in `--watch` mode](https://www.11ty.dev/docs/usage/#re-run-eleventy-when-you-save) to listen for file changes
2. Start up [a Vite server](https://vitejs.dev/guide/#index-html-and-project-root) pointed at your 11ty build. This helps us process all sorts of file types, including SASS styles, React components, and more 🚀

When you're ready for a production build, just run:

```bash
npx slinkity
```

...and your shiny new site will appear in the `_site` folder (or [wherever you tell 11ty to build your site](https://www.11ty.dev/docs/config/#output-directory)).

### [📚 Dive in to the docs here →](https://slinkity.dev/docs/quick-start/)

## Feature set

This project is still in early alpha, so we have many features soon to come! [This demo](https://twitter.com/BHolmesDev/status/1404427102032740353?s=20) covers a majority of features we plan to support. For reference, here's our tentative roadmap to version 1.0:

| Feature                                         | Status |
| ----------------------------------------------- | ------ |
| CLI to run 11ty and Vite simultaneously         | ✅ | 
| React component pages & layouts                 | ✅ | 
| React component shortcodes                      | ✅ |
| SASS support                                    | ✅ |
| CSS module support*                             | ⏺ |
| First-class page transition library             | ⏳ |
| Single page app capabilities                    | ⏳ |
| Vue component pages, layouts and shortcodes     | ❌ |
| Svelte component pages, layouts and shortcodes  | ❌ |
| Tailwind support                                | ❌ |
| Styled components & Emotion support             | ❌ |

_*CSS modules **will** work with JavaScript enabled. However, disabling JavaScript or rendering your components as "static" will break this behavior._

- ✅ = Ready to use
- ⏺ = Partial support
- ⏳ = In progress
- ❌ = Not started (but on roadmap)

## Have an idea? Notice a bug?

We'd love to hear your feedback! Feel free to log an issue on our [GitHub issues page](https://github.com/Holben888/slinkity/issues). If your question is more personal, [our Twitter DMs](https://twitter.com/slinkitydotdev) are always open as well.
