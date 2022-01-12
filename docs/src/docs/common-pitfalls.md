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

Let's take a closer look at each one.

### For permalink extensions _other than_ `.html`

Suppose you're using 11ty to auto-generate a `sitemap.xml` for your site. In 11ty, you'd create this file using your chosen templating language extension and set a permalink in its front matter relative to the output directory, like so:

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
2. Vite sees the `public` folder and copies it into your final build output directory, giving you `_site/public/sitemap.xml`.

### For resources that are passthrough copied

<!-- TODO: lead-in section -->

1. relative path/import alias, OR
2. passthrough copy to a `/public` folder like I mentioned (and this would always work)

#### Path resolution approach

<!-- @Aleksandr pasted my example from the GitHub comments! Feel free to add more clarification -->

```css
/* either relative paths from your stylesheet */
@font-face {
  font-family: Atkinson;
  src: url('./fonts/Atkinson/Atkinson-Hyperlegible-Regular.woff2'),
      url('./fonts/Atkinson/Atkinson-Hyperlegible-Regular.woff'),
      url('./fonts/Atkinson/Atkinson-Hyperlegible-Regular.ttf');
  font-display: swap;
}

/* or import aliases */
@font-face {
  font-family: Atkinson;
  src: url('/@root/fonts/Atkinson/Atkinson-Hyperlegible-Regular.woff2'),
      url('/@root/fonts/Atkinson/Atkinson-Hyperlegible-Regular.woff'),
      url('/@root/fonts/Atkinson/Atkinson-Hyperlegible-Regular.ttf');
  font-display: swap;
}
```

Same goes for `link` references in your HTML:

```html
<link
  rel="preload"
  href="/@root/fonts/Atkinson/Atkinson-Hyperlegible-BoldItalic.woff2"
  as="font"
  type="font/woff2"
  crossorigin="anonymous">
```

#### Passthrough copy approach

<!-- TODO: flesh out details surrounding this-->

Similarly, if you're using font files on your site, you'll need to store them in a `public` folder outside your input directory and tell Eleventy to passthrough-copy them. This ensures that they make it into the temporary build folder, get picked up by Vite, and get written to the final output directory.
