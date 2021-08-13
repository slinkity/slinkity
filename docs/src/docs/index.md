---
title: Overview
---

> 🚧 **This project is heavily under construction!** 🚧 As excited as you may be, we don't recommend this early alpha for production use. Still, give it a try if you want to have some fun and don't mind [logging bugs](https://github.com/Holben888/slinkity/issues) along the way :)

## In brief

Slinkity is a tool for bringing dynamic, clientside interactions to your static 11ty site. Once installed, this:

- 🚀 **Unlocks component frameworks** (like React) for writing page templates and layout templates. So, you can turn an existing `.html` or `.liquid` file into a `.jsx` file, and immediately start building routes using React.
- 🔖 **Includes powerful shortcodes** to insert components into existing pages. Add a line like this to your markdown, HTML, Nunjucks, etc, and watch the magic happen: {% raw %}`{% react './path/to/component.jsx' %}`{% endraw %}
- 💧 **Hydrates these component-driven pages** on the client. In other words, all your dynamic state management will work in development and production with 0 extra setup.

### [📣 Find our full announcement post here →](/)

### [🐣 Jump in with our "quick start" guide →](/docs/quick-start)

## Technologies used

Slinkity stands on the shoulders of giants. You can think of Slinkity like the "glue" holding 2 services together:

1. [**Eleventy:**](https://www.11ty.dev) a static site generator with a rich feature set for fetching data, composing layouts, and inserting content with "shortcodes."
2. [**Vite:**](https://vitejs.dev) a bundler that takes the boilerplate out of JavaScript development. It'll spin up a dev server for you, re-process components on the fly using [hot module replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement), and optimize your production build using Rollup.

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