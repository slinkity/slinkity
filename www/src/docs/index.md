---
title: What is Slinkity?
---

{% include 'value-props.md' %}

### [📣 Find our full announcement post here →](/)

## Technologies used

Slinkity stands on the shoulders of giants. You can think of Slinkity as the "glue" binding 2 tools together:

1. [**Eleventy:**](https://www.11ty.dev) a static site generator with a rich feature set for fetching data, composing layouts, and inserting content with "shortcodes."
2. [**Vite:**](https://vitejs.dev) a bundler that takes the boilerplate out of your set up. It'll compile JS component frameworks, handle CSS preprocessors with little-to-no config (say, SCSS and PostCSS), and show dev changes on-the-fly using [hot module replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement).

## Getting started

{% include 'npm-init-slinkity-snippet.md' %}

To learn more, and explore adding Slinkity to _existing_ 11ty projects...

### [🐣 See our "quick start" guide →](/docs/quick-start)

## Feature set

This project is still in early alpha, so we have many features soon to come! [This demo](https://www.youtube.com/watch?v=X_zp6CodHjc&t=493s) covers a majority of features we support today. For reference, here's our complete roadmap of current and upcoming features:

| Feature                                                                               | Status                    |
|---------------------------------------------------------------------------------------|---------------------------|
| CLI to run 11ty and Vite simultaneously                                               | {% featureProgress '✅' %} |
| React component pages & layouts                                                       | {% featureProgress '✅' %} |
| React component shortcodes                                                            | {% featureProgress '✅' %} |
| SCSS and SASS                                                                         | {% featureProgress '✅' %} |
| PostCSS config (ex. Tailwind)                                                         | {% featureProgress '✅' %} |
| CSS imports via ESM (including CSS modules) *                                         | {% featureProgress '⏺' %} |
| Plugin ecosystem for your favorite component framework<br />(Vue, Svelte, Solid, etc) | {% featureProgress '⏳' %} |
| Eleventy serverless compatibility                                                     | {% featureProgress '❌' %} |
| Shared state between component shortcodes                                             | {% featureProgress '❌' %} |
| Styled components & Emotion                                                           | {% featureProgress '❌' %} |

_*CSS imports will work today, but with one caveat: stylesheets will bleed to other routes on your site. We're actively working on a fix!_

- ✅ = Ready to use
- ⏺ = Partial support
- ⏳ = In progress
- ❌ = Not started, but on roadmap

## Have an idea? Notice a bug?

We'd love to hear your feedback! Feel free to log an issue on our [GitHub issues page](https://github.com/slinkity/slinkity/issues). If your question is more personal, [our Twitter DMs](https://twitter.com/slinkitydotdev) are always open as well.