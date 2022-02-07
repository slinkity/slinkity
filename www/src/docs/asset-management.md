---
title: Asset management
---

In an 11ty site, you're free to structure your project however you like. You can put your static assets in a `public` folder outside your [11ty input directory]((https://www.11ty.dev/docs/config/#input-directory)), an `assets` folder in your input directory, a `banana` folder in your `_includes`... You get the idea. **As long as you tell 11ty how and where to copy assets to the build output,** you're good to go.

Now that Slinkity brings [Vite](https://vitejs.dev/) into the equation, the days of manual passthrough copying are no more 😮 Let's learn how this works.

## What gets included in my production build?

✅ Resources like CSS, images, fonts, etc. will be included in the build if they are referenced by an HTML page using:

- A relative path to an asset,
- An absolute path to a passthrough-copied asset, or
- [An import alias path](/docs/import-aliases).

For example, suppose we have a project structure that looks like this:

```plaintext
├── fonts
│   └── Atkinson-Hyperlegible-Regular.woff2
├── src
│   ├── _includes
│   │   └── layout.njk
│   └── index.md
└── styles
    └── index.scss
```

We want to reference our font from that `styles/index.scss`.

We can use relative paths:

```css
/* styles/index.scss */
@font-face {
  font-family: Atkinson;
  src: url('../fonts/Atkinson-Hyperlegible-Regular.woff2');
}
```

Leverage import aliases:

```css
/* styles/index.scss */
@font-face {
  font-family: Atkinson;
  src: url('/@root/fonts/Atkinson-Hyperlegible-Regular.woff2');
}
```

_Or_ use an absolute URL + a passthrough copy on our `fonts` directory:

```css
/* styles/index.scss */
@font-face {
  font-family: Atkinson;
  src: url('/fonts/Atkinson-Hyperlegible-Regular.woff2');
}
```

```js
// eleventy.js
module.exports = function(eleventyConfig) {
  // see 11ty's passthrough copy docs for more: https://www.11ty.dev/docs/copy/
  eleventyConfig.addPassthroughCopy('fonts')
}
```

As long as this stylesheet is later referenced somewhere in your layouts, Vite will handle the rest for you:

{% raw %}
```html
<!-- src/_includes/layout.njk -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- other tags omitted for brevity -->
    <link rel="stylesheet" href="/@root/styles/index.scss">
  </head>
  <body>{{ content | safe }}</body>
</html>
```
{% endraw %}

> ⚠️ One downside to relative paths and import aliases: Vite can't resolve relative paths or import aliases from `preload` tags. If you need these for a particular resource, we recommend absolute URLs + passthrough copying.

## What gets stripped from my production build?

❌ If a resource is _not_ referenced by an HTML page in any way (no `link`, image `src`, script `src` etc), **it will be stripped from the build by default.** This is because Vite ignores anything that's 1. not an HTML file and 2. not loaded into any other HTML file.

There are two situations where you may encounter this pitfall:

1. Permalinked files that aren't HTML. Example: a `sitemap.njk` permalinked to a `sitemap.xml`.
2. Non-HTML resources that aren't referenced in templates using relative paths or import aliases. Example: a passthrough-copied OpenGraph image.

This is where the `public/` directory comes in!

### The `public/` directory

In short, anything nested inside a `public/` directory is off-limits for Vite to strip. You can also treat it as a "disappearing" directory since the directory itself gets flattened in the build output. In other words, `_site/public/robots.txt` simply becomes `_site/robots.txt` without any further processing.

[See Vite's documentation](https://vitejs.dev/guide/assets.html#the-public-directory) for more details and configuration options.

### Scenario 1: Permalinked files

Suppose you're using 11ty to auto-generate a `sitemap.xml` for your site. In 11ty, you'd create this file using your chosen templating language extension and set a root-relative permalink in its front matter, like so:

```liquid
<!-- src/sitemap.liquid -->
---
permalink: /sitemap.xml
---
```

When _plain_ 11ty builds your site, it processes this template file and spits out a file named `_site/sitemap.xml`.

⚠️ **This won't work in Slinkity production builds!** Since we build to a temporary output, the sitemap will get written to `.11ty-build-<hash>/sitemap.xml`. In the follow-up steps, Vite will:

1. Process this temporary build directory.
2. See that a) `sitemap.xml` is not referenced by any other file and b) isn't in the dedicated `public` folder.
3. Exclude it from the final output that it writes to `_site`.

#### Solution

To fix this problem, you need to prefix the static file's permalink with `/public`:

```liquid
<!-- src/sitemap.liquid -->
---
permalink: /public/sitemap.xml
---
```

Now this happens:

1. 11ty processes the template and writes it to a `public` folder: `.11ty-build-<hash>/public/sitemap.xml`.
2. Vite sees the `public` folder and copies it into your final build output directory, giving you `_site/sitemap.xml`. Note that the nested `/public` directory disappears from the final build output!

### Scenario 2: Passthrough-copied files

Now, say we want to add an OpenGraph image to our site to get some nice social media previews. Maybe those images are stored under an assets directory:

```plaintext
├── assets
│   └── og-thumbnail.jpg
├── src
│   └── ...
```

Unfortunately, OpenGraph images need to be absolute URLs, like this:

```html
<meta property="og:image" content="https://my-awesome-site.com/assets/og-thumbnail.jpg">
```

Because we're no longer using relative paths or import aliases when referencing this image, Vite won't correctly identify it as a dependency and copy it over to the build output folder. Moreover, as described before, passthrough-copying `assets` directly will _not_ preserve the thumbnail.

#### Solution

To fix this, we'll need to nest our assets under the special `public` directory:

```plaintext
├── public
│   └── assets
│       └── og-thumbnail.jpg
├── src
│   └── ...
```

... and then update our 11ty config to passthrough-copy this `public` directory instead of `assets`:

```js
// eleventy.js
module.exports = function(eleventyConfig) {
  // see 11ty's passthrough copy docs for more: https://www.11ty.dev/docs/copy/
  eleventyConfig.addPassthroughCopy('public')
}
```

Note that the `public` directory should be **at the root level of your passthrough copy**.
