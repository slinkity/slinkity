---
title: Configuring your project
---

It's worth reiterating what Slinkity _really_ is here: the glue between [the 11ty SSG](https://www.11ty.dev/) and the [Vite bundler](https://vitejs.dev/). So, as you might expect, there are 3 things you could configure:

- **Slinkity** via our 11ty plugin options
- **11ty** via the standard `.eleventy.js` / `eleventy.config.js` at the base of your project, or whatever config path you specify using the `--config` CLI flag
- **Vite** via a `vite.config.js` at the base of your project

Let's break down configuration for each.

## Recommended config options

Read the rest of this doc for all options available to you! In our experience though, there are few easy recommendations we can make:

1. **Use the `--incremental` and `--quiet` CLI flags** when running the development server via `--serve`. "Incremental" will prevent any [flashes of unstyled content (FOUC)](https://webkit.org/blog/66/the-fouc-problem/#:~:text=FOUC%20stands%20for%20Flash%20of,having%20any%20style%20information%20yet.&text=When%20a%20browser%20loads%20a,file%20from%20the%20Web%20site.) while working, and "quiet" will silence duplicate logs from 11ty that Vite already handles
2. **Specify an input directory** for 11ty to work from. 11ty defaults to the base of your project directory, which could cause 11ty to accidentally process config files, your `README.md`, etc (unless you [update your 11ty ignores](https://www.11ty.dev/docs/ignores/)). You can do so using the `--input="[dir]"` CLI flag, or [by exporting a `dir` from your `.eleventy.js` config](https://www.11ty.dev/docs/config/):

```js
// .eleventy.js or eleventy.config.js
module.exports = function(eleventyConfig) {
  return { dir: { input: '[dir]' } }
}
```

## Slinkity plugin configuration

You can apply Slinkity-specific configuration (component `renderers` namely) as 11ty plugin options. We recommend using the `slinkity.defineConfig` function for handy autocomplete in your editor:

```js
const slinkity = require('slinkity')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [...],
    })
  )
}
```

### renderers

These are the bread and butter of your component pages and shortcodes. You can pass our first party renderers as an array like so. Be sure to install associated dependencies for each of these as described in [our prereqs](/docs/component-shortcodes#prerequisites): 

```js
const slinkity = require('slinkity')
const preact = require('@slinkity/preact')
const vue = require('@slinkity/vue')
const svelte = require('@slinkity/svelte')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(slinkity.plugin, slinkity.defineConfig({
    renderers: [preact(), vue(), svelte()],
  }))
}
```

Each renderer should implement the `Renderer` interface. If you plan to write your own, we recommend following our `Renderer` type as a guide:

```ts
type Renderer = {
  /** name of renderer - used for diff-ing renderers internally */
  name: string;
  /** file extensions this renderer can handle */
  extensions: string[];
  /** path to module used for clientside hydration - ESM */
  clientEntrypoint: string;
  /** server code used for SSR - CommonJS */
  ssr: string;
  /** config to append to Vite server and production builds */
  viteConfig?(): UserConfigExport | Promise<UserConfigExport>;
  /** config to render as a component page */
  page({ Component }): PageReturn | Promise<PageReturn>;
}
```

You can also [follow the source code](https://github.com/slinkity/slinkity/tree/main/packages) of our existing renderer packages.

### `islandsDir`

Type: `string`

Default: `_islands`

The directory where all {%raw%}`{% island %}`{%endraw%} shortcode components should live. Any value set **will be relative to your input directory,** similar to `_includes`.

> The `islandsDir` must be a unique directory. This means you cannot use your includes directory or `.`.

### `buildTempDir`

Type: `string`

Default: `.eleventy-temp-build`

During production builds, Slinkity will build your 11ty output to a temporary directory that is deleted once the build is component. This acts as the input during Vite's client-side build. You can override the name of this directory using `buildTempDir`.

## 11ty's `.eleventy.js` / `eleventy.config.js`

**[Full 11ty documentation here](https://www.11ty.dev/docs/config/)**

Like any 11ty site, you'll configure all 11ty-specific options in this file. There are quite a few configurable options here, but to name a few:

- 📁 [Directories](https://www.11ty.dev/docs/config/#input-directory) for build input, output, "_includes," and layouts using `dir`. To clarify: **yes, Slinkity respects any directories you set in your 11ty config 🏆**
- 🚒 [Default template engines](https://www.11ty.dev/docs/config/#default-template-engine-for-markdown-files) for markdown and HTML files. If you noticed the nicer Nunjucks / `.njk` syntax we use and want to replace liquid as the default, look no further!
- ⚙️ [Filters or shortcodes](https://www.11ty.dev/docs/filters/) to augment your static templates. Think of these like any other JS function, accepting arguments and returning content for your pages.

[Head to their docs](https://www.11ty.dev/docs/config/#default-template-engine-for-markdown-files) for the full list of options. And yes, everything should work as expected with Slinkity.

## Vite's `vite.config.js`

**[Full Vite documentation here](https://vitejs.dev/config/)**

You'll configure all bundler-specific options in this file. If you aren't _quite_ sure which options belong here over an 11ty or Slinkity config, here's a common set of use cases:

- **Configuring CSS compilation** with [CSS modules](https://vitejs.dev/config/#css-modules), [PostCSS](https://vitejs.dev/config/#css-postcss), [SCSS or Tailwind preprocessing](https://vitejs.dev/config/#css-preprocessoroptions), etc
- **JS import resolution** with [aliases](https://vitejs.dev/config/#resolve-alias) (i.e. `@components` -> `src/components`) or [preferred JS file extensions](https://vitejs.dev/config/#resolve-extensions)
- **Bundler-specific settings** for [ESBuild](https://vitejs.dev/config/#esbuild) and [Rollup](https://vitejs.dev/config/#build-rollupoptions). A common use case is the `jsxInject` option, which auto-applies `import React from 'react'` to the top of every `.jsx` file.

**🚨 Note:** We run Vite in "[middleware mode](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server)" as part of our Browsersync server. This means server-specific options like `server.watch` and `server.port` will not take effect! 
