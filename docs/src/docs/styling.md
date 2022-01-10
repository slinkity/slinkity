---
title: Styling
---

You may be used to setting up SCSS compilers or PostCSS pipelines by hand in 11ty. With Slinkity, we say... no more! Let's learn how to wire up your favorite flavor of CSS using little-to-no config with Vite.

## Load stylesheets

We recommend using [Vite](https://vitejs.dev/) to process all styles in your project. For instance, say our project directory looks like this:

```bash
src/
  index.html
styles/
  global.scss
```

Goal: load `styles/global.scss` into our `index.html`. We'll start by installing the `sass` package into our project:

```bash
npm i -D sass
```

Then, we'll apply our stylesheet using a single `<link>` tag in our document's `<head>`. It's similar to how we load any stylesheet on the web 🙃

```html
<!--src/index.html-->
<html>
<head>
  <link rel="stylesheet" href="/@root/styles/global.scss">
</head>
<body>...</body>
</html>
```

You'll notice 2 interesting pieces here:

1. **We start our `href` with `/@root`.** This is one of several [import aliases](/docs/import-aliases) we include out of the box with Slinkity. These make importing from directories _outside_ your build output as easy as possible. In this case, we're importing from the `styles` directory at the "root" of our project. See our [import alias docs](/docs/import-aliases) for a full list of preincluded import aliases and ways to add our own.
2. **We keep the `.scss` file extension.** As long as Vite understands a file extension you're trying to use (`scss` works out-of-the-box), it's happy to process that file into something browsers can understand. [See Vite's docs on styling](https://vitejs.dev/guide/features.html#css) for all preprocessors they support, and ways to use your favorite one.

As long as you understand [import aliases](/docs/import-aliases) and keep [Vite's style configuration docs](https://vitejs.dev/guide/features.html#css) bookmarked, you're ready to rock with Slinkity 🎸

### Nested CSS imports

Say your stylesheet imports a number of extra chunks:

```css
/* styles/global.scss */
/* relative imports */
@import url('./variables.css')
@import url('./mixins.css')
/* import aliases */
@import url('/@root/utils/normalize.css')
@import url('/@root/utils/base.css')

...
```

**As long as you're using a) a relative import path or b) an import alias,** these imports will just work™️. Vite is smart enough to resolve these nested imports and include them in the final build output. These imports will also be bundled in-line for production builds using `postcss-import` ([see Vite's docs for more details](https://vitejs.dev/guide/features.html#import-inlining-and-rebasing)).

### PostCSS config

Slinkity supports everything Vite supports for PostCSS. You can happily:
- Add a `postcss.config.js` file at the base of your project for Vite to find
- Add extra resources (ex. a `tailwind.config.js`) to extend your config further. Following Tailwind's docs should cover that use case without any trouble, but you can [find a Tailwind + Slinkity example here](https://github.com/holben888/spookity) for a copy / paste solution 🙃
- Install any necessary plugins using a Vite config at the base of your project. [More on config here](/docs/config/#vite's-vite.config.js)

## Importing styles from JavaScript (ESM)

Slinkity + Vite will handle CSS import statements and CSS modules out-of-the-box, as long as you include a slinkified data prop in your document `head` (more in the next section). A common use case is pairing CSS modules with React's JSX-based components. Some examples:

```js
// works with modules
import styles from './component.module.scss'
// works with import aliases
import '/@root/styles/theme.scss'
// works with CSS from your node_modules
import 'npm-package/global-styles.css'
```

🚨 To get these working in your document, you'll need one extra piece in your document's `head`:

### The `__slinkity.head`

This data prop denotes where style imports should be injected onto your page. This gives you total control of where and when styles imported by components will be applied.

> Note we say "components" here. `__slinkity.head` is specifically for styles imported by [component shortcodes](/docs/component-shortcodes/) and [component pages](/docs/component-pages-layouts/). It's not necessary for other stylesheets loaded in your project!

We recommend applying this prop in your project's base layout to ensure it's applied wherever your components are used ([see 11ty's docs](https://www.11ty.dev/docs/layouts/) on creating and applying layouts). **Note this prop is HTML rather than plain text,** so you'll need to insert as HTML using your templating language of choice.

**Nunjucks example** - note the `safe` filter:

```html
<!--_includes/base-layout.njk-->
<html>
    <head>
      {% raw %}{{ __slinkity.head | safe }}{% endraw %}
    </head>
</html>
```

**Liquid example**

```html
<!--_includes/base-layout.liquid-->
<html>
    <head>
      {% raw %}{{ __slinkity.head }}{% endraw %}
    </head>
</html>
```

## Dev and production outputs

You might be wondering: what does Vite _actually do_ with my processed stylesheets when I build my site? This will depend on whether your `--serve`ing or building for production.

### Dev server

If you're using the dev server, all files (styles, scripts, etc) are stored in Vite's internal cache and served on request. This means stylesheets will only be compiled **for the given page you're viewing in your browser.** So:
1. No more waiting on a build process to bundle _every_ stylesheet in your project. It only builds the resources necessary for the page you're viewing.
2. You get hot module reloading (HMR) whenever you edit your stylesheets. This means no more browser refreshes; you'll see your styling changes instantly, while keeping any JavaScript state intact.

### Production builds

If you're building your site for deployment, all stylesheets will be processed to plain CSS files under Vite's configured assets directory. This is `/assets` by default, but [can be configured via a Vite config](/docs/config/#vite's-vite.config.js).

Let's see how a production build may look. For this input:

📂 **Input folder structure**

```bash
index.html
styles/
  global.scss
  something-imported-by-global.scss
```

📄 **Input `index.html`**

```html
<html>
<head>
  <link rel="stylesheet" href="/@root/styles/global.scss">
</head>
<body>...</body>
</html>
```

You'll get an output similar to this (using default settings):

📂 **Output folder structure**

```bash
_site
  assets/
    # note: something-imported-by-global.scss was bundled in-line
    index.[random-hash].css
  index.html
```

📄 **Output `index.html`**

```html
<html>
<head>
  <link rel="stylesheet" href="/assets/index.[random-hash].css">
</head>
<body>...</body>
</html>
```