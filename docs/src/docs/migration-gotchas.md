---
title: Common pitfalls when migrating from 11ty
---

For the most part, you should be able to seamlessly migrate your site from 11ty to Slinkity with minimal reconfiguration. But there are a few changes that may catch you off guard. These gotchas are summarized below.

## Multi-Step Processing and Vite's `public` Folder

In an 11ty site, you are free for the most part to structure your project however you like. You can put your static assets in a `public` folder outside your [11ty input directory]((https://www.11ty.dev/docs/config/#input-directory)) and pass-through copy them, but you don't need to—you could also store all of your assets inside your 11ty input directory. It doesn't matter which approach you take, so long as you configure your 11ty project accordingly and write your files to the correct locations. However, you need to take a slightly different approach in Slinkity due to the standards enforced by Vite.

First, we need to understand that a Slinkity build consists of multiple steps:

1. Processing your site with 11ty and dumping the result into a temporary build folder (e.g., `.11ty-build-DcNVBN`).
2. Processing the temporary build folder with Vite to bundle assets on the pages that reference them.
3. Writing the temporary build folder to your 11ty output directory (e.g., `_site`)
4. Deleting the temporary build folder.

Vite is very strict about where it wants you to place your static assets—in a [dedicated `public` folder](https://vitejs.dev/guide/assets.html#the-public-directory). This allows it to distinguish static assets from ones that are referenced by your pages (like stylesheets) and to bundle the referenced assets while leaving the static ones alone. Any static asset that isn't referenced by a page and isn't in the `public` directory will be removed from the final build output. For this reason, you may find that certain files disappear from production builds, even though they were technically processed correctly by 11ty.

Below are some scenarios where you may encounter this pitfall:

- Self-hosted font files
- Static images (both processed and passthrough-copied)
- Miscellaneous static files (`sitemap.xml`, `robots.txt`, and the like)

Let's look at an example.

### The Old Approach (11ty)

Suppose you're using 11ty to auto-generate a `sitemap.xml` for your site. In 11ty, you'd create this file using your chosen templating language extension and set a permalink in its front matter relative to the output directory, like so:

{% raw %}
```liquid
{% comment %}src/sitemap.liquid{% endcomment %}
---
permalink: /sitemap.xml
---
```
{% endraw %}

When 11ty builds your site, it'll process this template file and spit out a file named `_site/sitemap.xml`.

Unfortunately, this won't work in Slinkity. In the first step, the sitemap will get written to `.11ty-build-DcNVBN/sitemap.xml`. In the follow-up steps, Vite will process this temporary build directory, see that `sitemap.xml` is not referenced by any other file and isn't in the dedicated `public` folder, and exclude it from the final output that it writes to `_site`.

### The New Approach (Slinkity)

To fix this problem, you need to prefix the static file's permalink with `/public`.

So instead of this:

{% raw %}
```liquid
{% comment %}src/sitemap.liquid{% endcomment %}
---
permalink: /sitemap.xml
---
```
{% endraw %}

You would do this:

{% raw %}
```liquid
{% comment %}src/sitemap.liquid{% endcomment %}
---
permalink: /public/sitemap.xml
---
```
{% endraw %}

Now, this happens:

1. 11ty processes the template and writes it to a `public` folder nested inside the temporary build folder: `.11ty-build-DcNVBN/public/sitemap.xml`.
2. Vite sees the `public` folder and copies it into your final build output directory, giving you `_site/public/sitemap.xml`.

Similarly, if you're using font files on your site, you'll need to store them in a `public` folder outside your input directory and tell Eleventy to passthrough-copy them. This ensures that they make it into the temporary build folder, get picked up by Vite, and get written to the final output directory.
