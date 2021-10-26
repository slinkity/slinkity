---
title: Configuring Slinkity
---

It's worth reiterating what Slinkity _really_ is here: the glue between [the 11ty SSG](https://www.11ty.dev/) and the [Vite bundler](https://vitejs.dev/). So as you might expect, there's 3 things you could configure:
- **11ty** via the Slinkity CLI, a `.eleventy.js` at the base of your project, or whatever config you specify using the `--config` CLI flag
- **Vite** via a `vite.config.*` at the base of your project
- **Slinkity** via a `slinkity.config.*` at the base of your project

Let's break down configuration for each.

## The Slinkity CLI

For the most part, our CLI adds very little on top of the plain `eleventy` command you might be used to. We expose all of 11ty's existing flags without any changes! Our CLI merely exists to spin up Vite at the right time, and wire up everyone's configurations accordingly. Here are the main flags we support. Be sure to check `slinkity --help` in your CLI for the full list of options:

- **`--input "input-dir"` Sets the input directory for your project.** This is the base of your project's directory by default, which means 11ty _could_ pick up on files you don't want in your output (like your `README.md`!). We recommend using a directory like `--input "src"`, but the decision's up to you.
- **`--output` "output-dir" Sets the output / build directory for your project.** Defaults to `_site`
- **`--watch` Spins up 11ty _without_ the dev server.** Note: Vite won't process your components, styles, etc when running in this mode! If you're using Vite in any capacity, you probably want to run `--serve` instead.
- **`--serve` Spins up 11ty with a dev server [using Browsersync](https://browsersync.io/).** Vite will run as a middleware, listening for page visits in your browser and compiling resources on-the-fly. This keeps your builds fast when working in development.
- **`--port XXXX` Sets the port for your dev server when using `--serve`.** Defaults to `8080` in keeping with 11ty's default. 
- **`--incremental` Tells 11ty to only reprocess the pages that changed between builds.** We _highly_ recommend using this flag with Vite to prevent any [FOUC](https://webkit.org/blog/66/the-fouc-problem/#:~:text=FOUC%20stands%20for%20Flash%20of,having%20any%20style%20information%20yet.&text=When%20a%20browser%20loads%20a,file%20from%20the%20Web%20site.).
- **`--formats` Whitelists only certain template types for 11ty to process.** Note this will _not_ be applied to Vite. So if you're worried `--formats="html"` will prevent React of `scss` from working, fear not!
- **`--quiet`** Tones down 11ty's console output during builds.
- **`--config "/path/to/config/file"` Sets the location of your 11ty-specific config file (`.eleventy.js`).** No, you can't set the path for your Vite or Slinkity configs. We hope to add this soon!

## 11ty's `.eleventy.js`

**[Configuration file format here](https://www.11ty.dev/docs/config/)**

You'll configure all 11ty-specific options in this file. There are quite a few configurable options here, but to name a few:

- 📁 [Directories](https://www.11ty.dev/docs/config/#input-directory) for build input, output, "_includes," and layouts using `dir`. To clarify: **yes, Slinkity respects any directories you set in your 11ty config 🏆**
- 🚒 [Default template engines](https://www.11ty.dev/docs/config/#default-template-engine-for-markdown-files) for markdown and HTML files. If you noticed the nicer Nunjucks / `.njk` syntax we use and want to replace liquid as the default, look no further!
- ⚙️ [Filters or shortcodes](https://www.11ty.dev/docs/filters/) to augment your static templates. Think of these like any other JS function, accepting arguments and returning content for your pages.

[Head to their docs](https://www.11ty.dev/docs/config/#default-template-engine-for-markdown-files) for the full list of options. And yes, everything should work as expected with Slinkity.

## Vite's `vite.config.*`

**[Configuration file format here](https://vitejs.dev/config/)**

You'll configure all bundler-specific options in this file. If you aren't _quite_ sure which options belong here over an 11ty or Slinkity config, here's a common set of use cases:

- **Configuring CSS compilation** with [CSS modules](https://vitejs.dev/config/#css-modules), [PostCSS](https://vitejs.dev/config/#css-postcss), [SCSS or Tailwind preprocessing](https://vitejs.dev/config/#css-preprocessoroptions), etc
- **JS import resolution** with [aliases](https://vitejs.dev/config/#resolve-alias) (i.e. `@components` -> `src/components`) or [preferred JS file extensions](https://vitejs.dev/config/#resolve-extensions)
- **Bundler-specific settings** for [ESBuild](https://vitejs.dev/config/#esbuild) and [Rollup](https://vitejs.dev/config/#build-rollupoptions). A common use case is the `jsxInject` option, which auto-applies `import React from 'react'` to the top of every `.jsx` file.

**🚨 Note:** We run Vite in "[middleware mode](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server)" as part of our Browsersync server. This means server-specific options like `server.watch` and `server.port` will not take effect! 

## Slinkity's `slinkity.config.*`

You'll configure everything relating to 11ty ↔️ Vite communication here. There aren't many options to configure at the moment, but we expect this list to grow in the future.

### Configuration file format

We closely mirror [Vite's config file](https://vitejs.dev/config/) format. You can write your config in any flavor of JS you want, including ESM:

```js
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

### Configurable options

#### ⚙️ `eleventyIgnores`

Expects: `string[]` or `(ignores: string[]) => string[]`

By default, Slinkity will [ask 11ty to ignore](https://www.11ty.dev/docs/ignores/#configuration-api) certain files (or globs of files) to prevent unnecessary reloads during development. These should be files that Vite _and Vite alone_ is in charge of processing.

The full list of ignores will vary as we add more renderers beyond React. So to make configuration easier, we expose all our ignores using a helper function like so:

```js
module.exports = defineConfig({
  eleventyIgnores(ignores) {
    // to check which ignores are applied
    console.log({ ignores })

    // we discover 11ty will ignore all `.css` files in our `_includes` folder
    // we don't want that to happen, so we filter that ignore out of the list:
    return ignores.filter(ignore => ignore.endsWith('css'))
  }
})
```

You can also apply a string array without using this helper function. However, we expect _most_ people will use `eleventyIgnores` to `filter` out ignores when they run into build troubles, so use the code snippet above as your guide!