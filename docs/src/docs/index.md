---
title: What is Slinkity?
---

{% include 'value-props.md' %}

### [📣 Find our full announcement post here →](/)

## Technologies used

Slinkity stands on the shoulders of giants. You can think of Slinkity as the "glue" holding 2 tools together:

1. [**Eleventy:**](https://www.11ty.dev) a static site generator with a rich feature set for fetching data, composing layouts, and inserting content with "shortcodes."
2. [**Vite:**](https://vitejs.dev) a bundler that takes the boilerplate out of your set up. It'll compile JS component frameworks, handle CSS preprocessors with little-to-no config (say, SCSS and PostCSS), and show dev changes on-the-fly using [hot module replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement).

## Getting started

Use our handy CLI command to spin up a Slinkity site: `npm init slinkity`. This demos our core functionality while keeping as lean as possible, making it the perfect launchpad for new projects.

To learn more, and explore adding Slinkity to _existing_ 11ty projects...

### [🐣 See our "quick start" guide →](/docs/quick-start)

## Feature set

This project is still in early alpha, so we have many features soon to come! [This demo](https://twitter.com/BHolmesDev/status/1404427102032740353?s=20) covers a majority of features we plan to support. For reference, here's our tentative roadmap to version 1.0:

| Feature                                        | Status |
| ---------------------------------------------- | ------ |
| CLI to run 11ty and Vite simultaneously        | ✅      |
| React component pages & layouts                | ✅      |
| React component shortcodes                     | ✅      |
| SASS support                                   | ✅      |
| CSS module support*                            | ⏺      |
| First-class page transition library            | ⏳      |
| Single page app capabilities                   | ⏳      |
| Vue component pages, layouts and shortcodes    | ❌      |
| Svelte component pages, layouts and shortcodes | ❌      |
| Tailwind support                               | ❌      |
| Styled components & Emotion support            | ❌      |

_*CSS modules **will** work with JavaScript enabled. However, disabling JavaScript or rendering your components as "static" will break this behavior._

- ✅ = Ready to use
- ⏺ = Partial support
- ⏳ = In progress
- ❌ = Not started (but on roadmap)

## Have an idea? Notice a bug?

We'd love to hear your feedback! Feel free to log an issue on our [GitHub issues page](https://github.com/slinkity/slinkity/issues). If your question is more personal, [our Twitter DMs](https://twitter.com/slinkitydotdev) are always open as well.