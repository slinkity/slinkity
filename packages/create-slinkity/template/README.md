![Slinkity starter project banner](./public/images/og-image-banner.jpg)

# Welcome to your splendid Slinkity starter 👋

This demos [Slinkity's](https://slinkity.dev) core functionality while staying as lean as possible, making it the perfect launchpad for new projects 🚀

It includes:

- component(s) embedded into a static `.md` template → [more on component shortcodes here](https://slinkity.dev/docs/component-shortcodes/)
- route(s) built using a component framework as a templating language → [more on component pages here](https://slinkity.dev/docs/component-pages-layouts/)
- a `netlify.toml` configured to deploy in a flash → [more on deployment here](https://slinkity.dev/docs/deployment/)
- an eleventy config with a few recommended defaults → [more on config here](https://slinkity.dev/docs/config/#recommended-config-options)


## Install dependencies and start the dev server

```bash
npm i
npm run dev
```

`npm run dev` runs `slinkity --serve --incremental` to start [a Vite server](https://vitejs.dev/guide/#index-html-and-project-root) pointed at your 11ty build. The `--incremental` flag prevents flashes of unstyled content during development.

Open [localhost:8080](http://localhost:8080/) to view your site. Vite's development server enables processing a range of resources including SCSS and your favorite component framework.

## Build for production

```bash
npm run build
```

This runs the `slinkity` command to kick off a 2 step build process:
- Use 11ty to build your routes and copy over static assets
- Use Vite to bundle, minify, and optimize your styles and JS resources

Your new site will appear in the `_site` folder, or [wherever you tell 11ty to build your site](https://www.11ty.dev/docs/config/#output-directory).

## Config

Our `.eleventy.js` file includes a few niceties we'd recommend for any Slinkity project, including:

- Setting an input directory
- Copying static assets to the build from a `/public` directory
- Using Nunjucks for shortcode processing in markdown

To see the full "what" and "why," head to the [.eleventy.js](.eleventy.js) file.

## How does the `slinkity` command differ from `eleventy`?

You can view `slinkity` as the "glue" between 11ty and Vite. When using the `slinkity` command, all arguments are passed directly to the `eleventy` CLI, except `serve` and `port`:
- `serve` starts the [11ty dev server in `--watch` mode](https://www.11ty.dev/docs/usage/#re-run-eleventy-when-you-save) to listen for file changes.
- `port` is passed to Slinkity's independent server instead of 11ty's Browsersync server.

The CLI checks for Eleventy configs and will look for any custom directories returned, such as input or output. If found, those are passed off to the Vite server so it can look in the right place.

Here's a the full step-by-step for those curious!

![01-slinkity-architecture](https://raw.githubusercontent.com/slinkity/slinkity/main/assets/architecture-diagram.jpg)

## 🤝 Contributing

Slinkity contributions, issues and feature requests are welcome! Feel free to check the [issues page](https://github.com/slinkity/slinkity-starter/issues). 

***

_This README was generated with ❤️ by Ben with [readme-md-generator](https://github.com/kefranabg/readme-md-generator) (and then heavily edited by Anthony)._
