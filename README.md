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

You'll need an existing 11ty site to get started. If you're new to 11ty, you can make your first project using the lovely guide + community resources [over here](https://www.11ty.dev/docs/getting-started/).

Then, you can install Slinkity into your project repo like so:

```bash
npm i --save-dev slinkity
```

...and run our CLI command to spin up the dev server:

```bash
npx slinkity --serve
# Also consider the --incremental flag for faster builds during development
```

Now you're off to the races! This command will:

1. Start up [11ty in `--watch` mode](https://www.11ty.dev/docs/usage/#re-run-eleventy-when-you-save) to listen for file changes
2. Start up [a Vite server](https://vitejs.dev/guide/#index-html-and-project-root) pointed at your 11ty build. This helps us process all sorts of file types, including SASS styles, React components, and more 🚀

### [📚 Find our full documentation here →](https://slinkity.dev/)

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