---
title: How we build your site
---

We know 11ty users _love_ full transparency over their site's build process. In a typical 11ty build process, all assets are passthrough copied manually, and all resources are compiled, transpiled, etc by hand.

Slinkity is a bit different. By introducing Vite into the equation, we automate quite a few of these processes.
- See [styling](/docs/styling) to understand how we process your CSS.
- See [import aliases](/docs/import-aliases) to automate your passthrough file copying.

...but you might be wonder how this is even possible. So let's explore how development and production builds work with Slinkity!

## Dev server

If you're using the dev server, all files (styles, scripts, etc) are stored in Vite's internal cache and served on request. This means stylesheets will **only be compiled for the given page you're viewing** in your browser. So:
- No more waiting on a build process to bundle every stylesheet and JS resource in your project. It only builds the resources necessary for the page you're viewing.
- You get hot module reloading (HMR) whenever you edit stylesheets in particular. This means no more browser refreshes; you'll see your styling changes instantly, while keeping any JavaScript state intact.

This is accomplished through Vite's "middleware mode" option on a Browsersync server. This ensures your dev server _closely_ mirrors the server 

## Production builds

In a typical Slinkity build, we:

1. Process your site with 11ty and dumping the result into a temporary build folder (e.g., `.11ty-build-DcNVBN`).
2. Process the temporary build folder with Vite to bundle assets on the pages that reference them.
3. Write the temporary build folder to your 11ty output directory (e.g., `_site`)
4. Delete the temporary build folder.

Vite is very strict about where it wants you to place your static assets—in a [dedicated `public` folder](https://vitejs.dev/guide/assets.html#the-public-directory). This allows it to distinguish static assets from ones that are referenced by your pages (like stylesheets) and to bundle the referenced assets while leaving the static ones alone.
