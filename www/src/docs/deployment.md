---
title: Deployment
---

Slinkity projects can be hosted on any of the common Jamstack hosting providers such as [Netlify](https://netlify.com/) and [Vercel](https://vercel.com/). If you're already hosting your site using 11ty, **there's nothing to update!** Still, we'll include deployment instructions here to be thorough.

## `netlify.toml`

Create a `netlify.toml` file.

```bash
touch netlify.toml
```

Include `npx eleventy` for the build command and `_site` for the publish directory.

```toml
[build]
  command = "npx eleventy"
  publish = "_site"
```
