## Understanding the CLI

When you run the `slinkity` command, what happens?

1. **All arguments are parsed**. These arguments closely mirror those of eleventy's CLI command to make onboarding as seemless as possible - src/cli/index.js

All args are passed directly to eleventy with 2 exceptions:
- `serve` - this starts eleventy in `--watch` mode instead, so Slinkity can spin up an independent Vite server instead of 11ty's browsersync server ([see here](https://github.com/slinkity/slinkity/blob/main/src/cli/index.js#L69-L71))
- `port` - since we use our own server, we'll need to pick up and pass this port to Vite as well

2. **Check for any eleventy configs in your project**. If we find one, we'll look for any custom directories you've returned (input, output, etc). We'll pass these off to the Vite server so it can look in the right place.

### When using the dev server

We start 2 dev servers in parallel here: an eleventy server to build your templates and watch for file changes, and a Vite server for resource bundling and debugging in your browser.

3. **Start the Vite server pointing to your Eleventy output directory.** If that directory doesn't exist yet, fear not! Vite patiently waits for the directory to get written 😁 - `src/cli/vite.js`
4. **Start Eleventy in `--watch` mode with our custom Slinkity config applied.** Note users _don't_ have to import and apply Slinkity as a plugin directly! Instead, we send our own config file to 11ty with our plugin applied ([see slinkityConfig](https://github.com/slinkity/slinkity/blob/main/src/cli/slinkityConfig.js)), and nest the user's eleventy config (if any) inside of this. Just adds some extra [DX](https://www.netlify.com/blog/2021/01/06/developer-experience-at-netlify/) spice 🌶 - `src/cli/eleventy.js`

### When performing production builds

For production builds, we'll run Eleventy and Vite one-after-the-other. Eleventy takes care of building all your routes, and Vite picks up all the resource bundling, minification, and final optimizations.

3. **Build your project using Eleventy to a temporary directory.** Since we're using a 2-step build process, we can't build your routes to the _final_ output directory just yet! We need to make a temporary bucket for Vite to pull from.
4. **Build from this temporary directory to your intended output using Vite.** We [use a glob to find all the routes in your app](https://github.com/slinkity/slinkity/blob/main/src/cli/vite.js#L39-L58). Otherwise, we don't mess with Vite's defaults too much.

## Understanding our eleventy plugin - shortcodes

Let's say you save a change to a `template.html` in your project, and that template contains a React component shortcode. What does our plugin do?

1. **Your `react` shortcode gets picked up by [our shortcode definition](src/plugin/reactPlugin/addShortcode.js#L39-L58).** This 