# 11ty + React template

[![Netlify Status](https://api.netlify.com/api/v1/badges/848d6eb2-f789-4f7c-9910-d4ac208f7122/deploy-status)](https://app.netlify.com/sites/eloquent-montalcini-1f5644/deploys)

This is the repo for our landing site, [slinkity.dev](https://slinkity.dev). This is just our announcement + demo video for now, but could be the home to documentation in the future!

## Building locally

This is a static site built on [eleventy](https://11ty.dev). To spin up the dev server, run:

```
npm i
npm run dev
```

This will use `eleventy --watch` to start up the 11ty server, and `snowpack dev` to start [Snowpack](https://snowpack.dev).

For production builds, run:

```
npm run build
```