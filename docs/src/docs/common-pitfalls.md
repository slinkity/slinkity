---
title: Common pitfalls
---

For the most part, you should be able to seamlessly migrate your site from 11ty to Slinkity with minimal reconfiguration. But there are a few changes that may catch you off guard. These gotchas are summarized below.

## Static files disappeared from my production build output folder

In an 11ty site, you are free to structure your project however you like. You can put your static assets in a `public` folder outside your [11ty input directory]((https://www.11ty.dev/docs/config/#input-directory)), an `assets` folder in your input directory, a `banana` folder in your `_includes`... You get the idea. But now that Slinkity brings [Vite](https://vitejs.dev/) into the equation, there are a couple gotchas to consider.

As described in our docs on [how builds work](/how-we-build-your-site/), Vite requires that you place static assets inside a `public` directory if those assets aren't referenced by any other pages (e.g., in `link` tags on a page). Any static asset that isn't referenced by a page and isn't in the `public` directory will be removed from the final build output. For this reason, you may find that certain files disappear from production builds, even though they were technically processed correctly by 11ty.

There are two situations where you may encounter this pitfall:

- Permalinked static files that aren't HTML (`sitemap.xml`, `robots.txt`, and the like).
- Resources that are passthrough-copied (fonts, images, etc.).

Let's take a closer look at each scenario.

### Permalinked static files that aren't `.html`

Suppose you're using 11ty to auto-generate a `sitemap.xml` for your site. In 11ty, you'd create this file using your chosen templating language extension and set a root-relative permalink in its front matter, like so:

```liquid
<!-- src/sitemap.liquid -->
---
permalink: /sitemap.xml
---
```

When _plain_ 11ty builds your site, it processes this template file and spits out a file named `_site/sitemap.xml`.

⚠️ **However, this won't work in Slinkity production builds!** [Since we build to a temporary output](/docs/how-we-build-your-site), the sitemap will get written to `.11ty-build-<hash>/sitemap.xml`. In the follow-up steps, Vite will:

1. Process this temporary build directory.
2. See that a) `sitemap.xml` is not referenced by any other file and b) isn't in the dedicated `public` folder.
3. Exclude it from the final output that it writes to `_site`.

#### Solution

To fix this problem, you need to prefix the static file's permalink with `/public`, like this:

```liquid
<!-- src/sitemap.liquid -->
---
permalink: /public/sitemap.xml
---
```

Now, this happens:

1. 11ty processes the template and writes it to a `public` folder nested inside the temporary build folder: `.11ty-build-<hash>/public/sitemap.xml`.
2. Vite sees the `public` folder and copies it into your final build output directory, giving you `_site/sitemap.xml`. Note that the nested `/public` directory disappears from the final build output!

### Resources that are passthrough-copied

A typical 11ty site has many static resources, including fonts, images, and more. Some of these may need to be processed manually using 11ty, but others just need to be [passthrough-copied](https://www.11ty.dev/docs/copy/) to the build output directory. Self-hosted font files are a classic example: Once you've copied the files to your build folder, you can safely reference them in your CSS using root-relative absolute paths, like `/fonts/FontFile.woff2`.

In Slinkity, there are two approaches you can take to ensure that static resources correctly make their way to the final build output:

1. Using relative paths or import aliases to the resources on a page.
2. Passthrough-copying the resources to a `/public` folder.

#### Approach 1: Path resolution

In the first approach, we lean on Vite's ability to resolve dependencies and resources referenced by our templates. In this case, if you want your font files to end up in your site's final build output, all you need to do is reference those font files somewhere in your CSS. You can do this using either relative paths (not absolute!) or [import aliases](/docs/import-aliases).

For example, suppose you have a project structure that looks like this:

```
├── fonts
│   └── Atkinson-Hyperlegible-Regular.woff2
├── src
├── _includes
│   │   └── layout.njk
│   ├── index.md
├── styles
│   ├── index.css
```

In the path resolution approach, you can either use relative paths:

```css
/* styles/index.css */
@font-face {
  font-family: Atkinson;
  src: url('../fonts/Atkinson-Hyperlegible-Regular.woff2');
  font-display: swap;
}
```

Or you can leverage import aliases:

```css
/* styles/index.css */
@font-face {
  font-family: Atkinson;
  src: url('/@root/fonts/Atkinson-Hyperlegible-Regular.woff2');
  font-display: swap;
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

In the production build, Vite will generate an `assets` directory containing your font files and CSS, nested in your build output directory:

```
_site
├── assets
│   ├── Atkinson-Hyperlegible-Regular.efe52c57.woff2
│   ├── index.7edd6dae.css
└── index.html
```

The production CSS will then correctly reference the font files using root-relative paths, along with unique hashes that Vite appends to asset file names:

```css
/* _site/assets/index.7edd6dae.css */
@font-face {
  font-family: Atkinson;
  src: url(/assets/Atkinson-Hyperlegible-Regular.efe52c57.woff2);
  font-display: swap;
}
```

#### Approach 2: Passthrough-copying a `public` folder

Maybe you don't want Vite to static resources for you, and all you want is to dump them into your build output folder and reference them statically in your layouts using root-relative paths. In that case, all you need to do is place your static resources in a `public` folder outside your input directory and tell Eleventy to passthrough-copy them.

In this case, your project structure might look like this:

```
├── public
│   └── fonts
│       └── Atkinson-Hyperlegible-Regular.woff2
├── src
│   ├── _includes
│   │   └── layout.njk
│   └── index.md
├── styles
│   └── index.css
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

```
_site
├── assets
│   ├── index.8790d40e.css
├── fonts
│   └── Atkinson-Hyperlegible-Regular.woff2
└── index.html
```

Notice that the font file no longer has a unique hash appended to its name; this is because Vite did not process that file and merely copied the `public` directory's contents over to the build output folder. This may not be desirable if you want to take advantage of hashes for cache-busting static assets.
