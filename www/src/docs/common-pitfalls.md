---
title: Common pitfalls
---

For the most part, you should be able to seamlessly migrate your site from 11ty to Slinkity with minimal reconfiguration. But there are a few changes that may catch you off guard. These gotchas are summarized below.

## Static files disappeared from my production build output folder

In an 11ty site, you are free to structure your project however you like. You can put your static assets in a `public` folder outside your [11ty input directory]((https://www.11ty.dev/docs/config/#input-directory)), an `assets` folder in your input directory, a `banana` folder in your `_includes`... You get the idea. **As long as you tell 11ty how and where to copy assets to the build output,** you're good to go.

Now that Slinkity brings [Vite](https://vitejs.dev/) into the equation, the days of manual passthrough copying are no more 😮 Let's learn how this works.

### What gets included in my production build?

✅ If a resource (stylesheet, image, font, etc) is referenced by an HTML page using:
- a relative path to an asset
- an absolute path to a passthrough copied asset
- [an import aliased path](/docs/import-aliases)

...it'll be included in the build. We recommend that last option when referencing assets outside your build folder; aka anything _not_ passthrough copied. 

For example, suppose you have a project structure that looks like this:

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

Say we want to reference our font from that `styles/index.scss`. We can use relative paths:

```css
/* styles/index.css */
@font-face {
  font-family: Atkinson;
  src: url('../fonts/Atkinson-Hyperlegible-Regular.woff2');
}
```

Leverage import aliases:

```css
/* styles/index.css */
@font-face {
  font-family: Atkinson;
  src: url('/@root/fonts/Atkinson-Hyperlegible-Regular.woff2');
}
```

_Or_ use an absolute URL + a passthrough copy on our `fonts/`:

```css
/* styles/index.css */
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

- Permalinked files that aren't HTML. Ex. a `sitemap.njk` permalinked to a `sitemap.xml`
- Non-HTML resources that aren't referenced elsewhere. Ex. a passthrough copied `robots.txt

### Permalinked files

Suppose you're using 11ty to auto-generate a `sitemap.xml` for your site. In 11ty, you'd create this file using your chosen templating language extension and set a root-relative permalink in its front matter, like so:

```liquid
<!-- src/sitemap.liquid -->
---
permalink: /sitemap.xml
---
```

When _plain_ 11ty builds your site, it processes this template file and spits out a file named `_site/sitemap.xml`.

⚠️ **This won't work in Slinkity production builds!** [Since we build to a temporary output](/docs/how-we-build-your-site), the sitemap will get written to `.11ty-build-<hash>/sitemap.xml`. In the follow-up steps, Vite will:

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

#### Approach 2: Passthrough-copying a `public` folder

Maybe you don't want Vite to static resources for you, and all you want is to dump them into your build output folder and reference them statically in your layouts using root-relative paths. In that case, place your static resources in a `public` folder outside your input directory and tell Eleventy to passthrough-copy them.

In this case, your project structure might look like this:

```plaintext
├── public
│   └── fonts
│       └── Atkinson-Hyperlegible-Regular.woff2
├── src
│   ├── _includes
│   │   └── layout.njk
│   └── index.md
└── styles
    └── index.css
```

Now, instead of using a relative path or an import alias to the font files, your CSS would use a root-relative path to the font files:

```css
/* styles/index.css */
@font-face {
  font-family: Atkinson;
  src: url('/fonts/Atkinson-Hyperlegible-Regular.woff2');
  font-display: swap;
}
```

And you'd pass-through copy the entire `public` directory:

```js
// .eleventy.js
eleventyConfig.addPassthroughCopy('public')
```

Once you build your site for production, the final output will contain the passthrough-copied subdirectories (in this case, `fonts`):

```plaintext
_site
├── assets
│   └── index.8790d40e.css
├── fonts
│   └── Atkinson-Hyperlegible-Regular.woff2
└── index.html
```

Notice that the font file no longer has a unique hash appended to its name; this is because Vite did not process that file and merely copied the `public` directory's contents over to the build output folder. This may not be desirable if you want to take advantage of hashes for cache-busting static assets.
