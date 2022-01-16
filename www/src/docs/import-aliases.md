---
title: Import aliases
---

Slinkity configures a few import aliases out-of-the-box using [Vite's alias feature](https://vitejs.dev/config/#resolve-alias). These allow convenient imports within your ES modules:

```js
// import from a "utils" directory at the base of your project
import slinky from '/@root/utils/slinky'

slinky.goDownStairs()
```

And HTML files:

```html
<head>
  <!--import styles from your "_includes" directory-->
  <link rel="stylesheet" href="/@includes/gorgeous-yellow-pink-gradient.scss">
</head>
```

## List of aliases

- **/@root** - Relative to the base of your project. No, this is _not_ your project's input directory! This is merely based on where you ran the `slinkity` CLI command from. This is often used for `assets` or `utils` that wouldn't make sense as `input` directory routes or `_includes` entries.
- **/@input** - Relative to your project's input directory, as configured using the `--input` CLI flag or 11ty's `dir` config option (see [our config docs](/docs/config) for more details)
- **/@includes** - Relative to your project's `_includes` directory (defaults to `[input-directory]/_includes`, but can be changed [using 11ty's `dir` config option](https://www.11ty.dev/docs/config/#directory-for-includes))
- **/@layouts** - Relative to your project's layouts directory (defaults to your `_includes` directory, but can be changed [using 11ty's `dir` config option](https://www.11ty.dev/docs/config/#directory-for-layouts-(optional)))


## The problem this solves: processing resources outside your `output` directory

Say our project is set up like so:

```bash
_site/ #build output
  index.html
src/ #input
  index.html
styles/
  base.scss
  import1.scss
  import2.scss
  ...
```

Now, say we want to use that `styles/base.scss` in our `src/index.html` file. With a plain 11ty setup, we'd probably do the following:
1. Wire up a `sass` command to compile that `styles/base.scss` file, and output a processed `css` file under `_site/base.css`
2. Wire up an import in our `index.html` like so:

```html
<head>
  <link rel="stylesheet" href="/base.css">
</head>
```

Here, we're thinking in terms of what files _will_ exist in our `output` folder once our build is complete (`/base.css` instead of `/styles/base.scss`). 

### How Vite changes the game

We can get much fancier with [Vite](https://vitejs.dev/) at our disposal. Since `html` files are the bundler's entrypoint, we can use a direct path to our _unprocessed_ `scss` file. Here's what we'd write under that same `src/index.html` file:

```html
<head>
  <link rel="stylesheet" href="../styles/base.scss">
</head>
```

...and bam! Vite will notice that `scss` file extension, and compile it to a browser-ready stylesheet on-the-fly.

However, you'll notice we needed to _back out_ of our output directory to find the file. Relative paths like these can get pretty hairy when we start building nested routes (which could even have a [different permalink](https://www.11ty.dev/docs/permalinks/) between the input and output!). If we want to use absolute paths within our `_site`, we'll need to copy our `scss` file _into_ the output directory using [11ty's `addPassthroughCopy` config option](https://www.11ty.dev/docs/copy/).

However, this can cause a problem for nested dependencies! Say we have a few `scss` fragments imported like so:

```scss
// /styles/base.scss
@use './import1.scss';
@use './import2.scss';
```

These are relative to the `styles` directory, so we'll need to copy `import1` and `import2` to the output directory for these imports to resolve. Heck, we'll probably copy our entire `styles` directory to be safe. I don't know about you, but copying directories of _unprocessed_ resources to the "final" build directory doesn't sit well with me 😕

### Enter import aliases

Let's try using an import alias instead:

```html
<head>
  <link rel="stylesheet" href="/@root/styles/base.scss">
</head>
```

Unlike that relative path from earlier, this resolves to an absolute path on our file system. Here's what Vite will look for on the other side:

```bash
/Users/SlinkityStan/Repositories/import-aliases-demo/styles/base.scss
```

Before you ask: **no, this does not allow for unsafe file access on your machine!** Vite will only process files inside the directory where it is run (aka wherever you run the `slinkity` command, which should be the base of your project).

With this, we can avoid unnecessary file copies to the build output and simplify our asset compilation. We expect many users to start removing `addPassthroughCopy` statements from their 11ty configs once they start using Vite to their advantage. This should speed up live reloading and production builds as well.
