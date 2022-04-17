---
title: Deployment
layout: layout
---

11ty + Slinkity projects can be hosted with the same `build` command and `publish` directory on any of the common Jamstack hosting providers such as [Netlify](https://ajcwebdev-slinkity.netlify.app/), [Vercel](https://ajcwebdev-slinkity.vercel.app/), or [Cloudflare Pages](https://ajcwebdev-slinkity.pages.dev/). All three of these options allow you to create a custom domain name as well.

### Deploy to Netlify

The `netlify.toml` file includes `npx eleventy` for the build command and `_site` for the publish directory.

```toml
[build]
  command = "npx eleventy"
  publish = "_site"
```