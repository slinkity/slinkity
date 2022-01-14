---
title: Deployment
---

Slinkity projects can be hosted on any of the common Jamstack hosting providers such as [Netlify](https://netlify.com/) and [Vercel](https://vercel.com/). If you're already hosting your site using 11ty, deploying with Slinkity should be quite similar!

## `netlify.toml`

Create a `netlify.toml` file.

```bash
touch netlify.toml
```

Include `npx slinkity` for the build command and `_site` for the publish directory.

```toml
[build]
  command = "npx slinkity"
  publish = "_site"
```
