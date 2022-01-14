![Slinkity starter project banner](./public/images/og-image-banner.jpg)

<h1 align="center">Welcome to Slinkity starter project 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://slinkity.dev/docs/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/slinkity/slinkity-starter/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/slinkity/slinkity-starter/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://twitter.com/slinkitydotdev" target="_blank">
    <img alt="Twitter: slinkitydotdev" src="https://img.shields.io/twitter/follow/slinkitydotdev.svg?style=social" />
  </a>
</p>

<h3 align="center">The all-in-one template for building your first Slinkity project</h3>

[Slinkity](https://slinkity.dev) is a framework that uses Vite to bring dynamic, client side interactions to your static 11ty sites. Slinkity lets you swap out existing templates like `.html` or `.liquid` for component templates like `.jsx`. What's more, it allows you to insert components into pages using shortcodes, like this one: `{% react './path/to/Component.jsx' %}`. And since you can opt-in to hydrating components clientside, dynamic state variables can work in both development and production.

With these capabilities, we aim to unify two competing camps in the web development community:
* **Lean, JavaScript-free static site generators** driven by data and templating languages like Jekyll and Hugo.
* **Dynamic, JavaScript-heavy web apps** powered by data and component frameworks like NextJS and NuxtJS.

## Install dependencies and start development server

`yarn start` runs `slinkity --serve` to start [a Vite server](https://vitejs.dev/guide/#index-html-and-project-root) pointed at your 11ty build. The `--incremental` flag can be used for faster builds during development.

```bash
yarn
yarn start
```

Open [localhost:8080](http://localhost:8080/) to view your site. Vite's development server enables processing a range of resources including SASS and React.

## Build for production

Run the `slinkity` to process your files in a 2 step process:
- Use 11ty to build your routes and copy over static assets
- Use Vite to bundle, minify, and optimize your styles and JS resources

```bash
yarn build
```

Your new site will appear in the `_site` folder, or [wherever you tell 11ty to build your site](https://www.11ty.dev/docs/config/#output-directory).

## `.eleventy.js`

Slinkity relies on 11ty's [latest 1.0 beta build](https://www.npmjs.com/package/@11ty/eleventy/v/beta) to work properly. Our `.eleventy.js` file includes a few niceties we'd recommend for any Slinkity project, including:

- Setting an input directory
- Copying static assets to the build from a `/public` directory
- Using Nunjucks for shortcode processing in markdown

To see the full "what" and "why," head to the [.eleventy.js](.eleventy.js) file.

## How does the `slinkity` command differ from `eleventy`?

You can view `slinkity` as the "glue" between 11ty and Vite. When using the `slinkity` command, all arguments are passed directly to the `eleventy` CLI, except `serve` and `port`:
- `serve` starts the [11ty dev server in `--watch` mode](https://www.11ty.dev/docs/usage/#re-run-eleventy-when-you-save) to listen for file changes.
- `port` is passed to Slinkity's independent Vite server instead of 11ty's Browsersync server.

The CLI checks for Eleventy configs and will look for any custom directories returned, such as input or output. If found, those are passed off to the Vite server so it can look in the right place.

Here's a the full step-by-step for those curious!

![01-slinkity-architecture](https://raw.githubusercontent.com/slinkity/slinkity/main/assets/architecture-diagram.jpg)

## Authors

👤 **Ben Holmes**

* Website: https://bholmes.dev
* Twitter: [@bholmesdev](https://twitter.com/bholmesdev)
* Github: [@Holben888](https://github.com/Holben888)

👤 **Anthony Campolo**

* Twitter: [@ajcwebdev](https://twitter.com/ajcwebdev)
* Github: [@ajcwebdev](https://github.com/ajcwebdev)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/slinkity/slinkity-starter/issues). 

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2021 [Ben Holmes](https://github.com/Holben888). This project is [MIT](https://github.com/slinkity/slinkity-starter/blob/master/LICENSE) licensed.

***

_This README was generated with ❤️ by Ben with [readme-md-generator](https://github.com/kefranabg/readme-md-generator) and then heavily edited by Anthony._
