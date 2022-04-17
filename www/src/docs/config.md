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
3. If you're using our [component shortcodes](/docs/component-shortcodes), **set nunjucks to your default templating language** for markdown (`.md`) and html (`.html`) files. Nunjucks offers a nicer shortcode syntax for passing data to your components as props. You can find side-by-side comparisons in our [component shortcode documentation](/docs/component-shortcodes/#choose-how-and-when-to-hydrate). If you like what you see, add this to your 11ty config:

```js
// .eleventy.js or eleventy.config.js
module.exports = function(eleventyConfig) {
  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  }
}
```

## Slinkity plugin configuration

You can apply Slinkity-specific configuration (component `renderers` namely) as 11ty plugin options. We recommend using the `slinkity.defineConfig` function for handy autocomplete in your editor:

```js
const slinkity = require('slinkity')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(slinkity.plugin, slinkity.defineConfig({
    // config options here. For example:
    renderers: [...],
  }))
}
```

### renderers

These are the bread and butter of your component pages and shortcodes. You can pass our first party renderers as an array like so. Be sure to install associated dependencies for each of these as described in [our prereqs](/docs/component-shortcodes#prerequisites): 

```js
const slinkity = require('slinkity')
const react = require('@slinkity/renderer-react')
const vue = require('@slinkity/renderer-vue')
const svelte = require('@slinkity/renderer-svelte')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(slinkity.plugin, slinkity.defineConfig({
    renderers: [react, vue, svelte],
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
  /** path to module used for clientside hydration - browser code */
  client: string;
  /** path to module used for server rendering - NodeJS code */
  server: string;
  /** inject CSS imported by component module into document head */
  injectImportedStyles: boolean;
  /** config to append to Vite server and production builds */
  viteConfig?(): UserConfigExport | Promise<UserConfigExport>;
  /** config to render as a component page */
  page({ toCommonJSModule }: {
    toCommonJSModule: ViteSSR['toCommonJSModule'];
  }): PageReturn | Promise<PageReturn>;
  /** NOT YET SUPPORTED: Adds polyfills to Node's global object */
  polyfills: never;
  /** NOT YET SUPPORTED: List of imports to add as scripts on the client */
  hydrationPolyfills: never;
}
```

You can also [follow the source code](https://github.com/slinkity/slinkity/tree/main/packages) of our existing renderer packages. Don't worry, the code is fairly simple!

### eleventyIgnores

Expects: `string[]` or `(ignores: string[]) => string[]`

By default, Slinkity will [ask 11ty to ignore](https://www.11ty.dev/docs/ignores/#configuration-api) certain files (or globs of files) to prevent unnecessary reloads during development. These should be files that Vite _and Vite alone_ is in charge of processing.

The full list of ignores will vary as you add renderers to your project. So to make configuration easier, we expose all our ignores using a helper function like so:

```js
// slinkity.config.js
module.exports = defineConfig({
  eleventyIgnores(ignores) {
    // to check which ignores are applied
    console.log({ ignores })

    // we discover 11ty will ignore all `.css` files in our `_includes` folder
    // say we don't want that to happen, so we filter that ignore out of the list:
    return ignores.filter(ignore => !ignore.endsWith('css'))
  }
})
```

You can also apply a string array without using this helper function. However, we expect _most_ people will use `eleventyIgnores` to `filter` out ignores when they run into build troubles, so use the code snippet above as your guide!

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

## ⚠ Deprecated: The Slinkity CLI

> 🚨 This CLI is deprecated in Slinkity v0.8+. Expect this CLI to be removed in v1.0!

Before Slinkity could be applied as a plugin, we implemented a thin CLI wrapper around 11ty to apply our configuration. We maintain this documentation for legacy users only. **Do _not_ attempt to run the Slinkity CLI if Slinkity is also applied as a plugin.**

For the most part, our CLI adds very little on top of the plain `eleventy` command you might be used to. We expose all of 11ty's existing flags without any changes! Our CLI merely exists to spin up Vite at the right time, and wire up everyone's configurations accordingly. Here are the main flags we support. Be sure to check `slinkity --help` in your CLI for the full list of options:

- **`--input="input-dir"` Sets the input directory for your project.** 11ty defaults to the base of your project directory, which could cause 11ty to accidentally process config files, your `README.md`, etc (unless you [update your 11ty ignores](https://www.11ty.dev/docs/ignores/)). We recommend using a directory like `--input="src"`, but the decision's up to you.
- **`--output="output-dir"` Sets the output / build directory for your project.** Defaults to `_site`
- **`--watch` Spins up 11ty _without_ the dev server.** Note: Vite won't process your components, styles, etc when running in this mode! If you're using Vite in any capacity, you probably want to run `--serve` instead.
- **`--serve` Spins up 11ty with a dev server [using Browsersync](https://browsersync.io/).** Vite will run as a middleware, listening for page visits in your browser and compiling resources on-the-fly. This keeps your builds fast when working in development.
- **`--port XXXX` Sets the port for your dev server when using `--serve`.** Defaults to `8080` in keeping with 11ty's default. 
- **`--incremental` Tells 11ty to only reprocess the pages that changed between builds.** We _highly_ recommend using this flag with Vite to prevent any [flashes of unstyled content (FOUC)](https://webkit.org/blog/66/the-fouc-problem/#:~:text=FOUC%20stands%20for%20Flash%20of,having%20any%20style%20information%20yet.&text=When%20a%20browser%20loads%20a,file%20from%20the%20Web%20site.) while working. It'll also speed up your reloads quite a bit!
- **`--formats` Whitelists only certain template types for 11ty to process.** Note this will _not_ be applied to Vite. So if you're worried `--formats="html"` will prevent React or `scss` from working, fear not!
- **`--quiet`** Tones down 11ty's console output during builds.
- **`--config "/path/to/config/file"` Sets the location of your 11ty-specific config file (`.eleventy.js`).** No, you can't set the path for your Vite or Slinkity configs. We hope to add this soon!

### ⚠ Deprecated: configuring with `slinkity.config.js`

To configure your project when using the `slinkity` CLI, you'll need a separate `slinkity.config.js` file. **No, `slinkity.config.js` options will not apply when using Slinkity as a plugin.**

You can write this config in any flavor of JS you want, including ESM:

```js
// slinkity.config.js
// export either an object
export default {
  ...config,
}
// or a function (asynchronous works too!)
export default async function() {
  return {
    ...config,
  }
}
```

or CommonJS:

```js
// slinkity.config.js
// either an object
module.exports = {
  ...config,
}
// or a function
module.exports = async function() {
  return {
    ...config,
  }
}
```

#### Autocomplete / Intellisense in your editor

We include a few handy tools for autocomplete as well. You can import our `defineConfig` function for suggestions + documentation as you apply configuration keys.

ESM:

```js
// slinkity.config.js
import { defineConfig } from 'slinkity'

export default defineConfig({
  ...config
})
```

CommonJS:

```js
// slinkity.config.js
const { defineConfig } = require('slinkity')

module.exports = defineConfig({
  ...config,
})
```

You can also apply a [TypeScript](https://www.typescriptlang.org/) type for the same effect. Feel free to use a `.ts` file extension here. Note that CommonJS is _not_ supported for this format:

```ts
// slinkity.config.ts
import { UserSlinkityConfig } from 'slinkity'

const config: UserSlinkityConfig = {
  ...config,
}

export default config
```