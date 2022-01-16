---
title: Quick start
---

{% include 'npm-init-slinkity-snippet.md' %}

It includes:
- a React component embedded into a static `.md` template → [more on component shortcodes here](/docs/component-shortcodes/)
- a route built using a component framework as a templating language → [more on component pages here](/docs/component-pages-layouts/)
- a `netlify.toml` configured to deploy in a flash → [more on deployment here](/docs/deployment/)
- an eleventy config with a few recommended defaults → [more on config here](/docs/config/#recommended-config-options)

## Add to your existing 11ty project

Want to bring Slinkity to your current 11ty project? No sweat! Slinkity is built to slot into your existing workflow 😁

### Installation

First, install Slinkity + the latest 11ty into your project:

```bash
npm i --save-dev slinkity @11ty/eleventy@beta
```

> Slinkity requires Node v14 and up. You can check your version by running `node -v` in your terminal before trying Slinkity.

> Slinkity also relies on 11ty's [latest 1.0 beta build](https://www.npmjs.com/package/@11ty/eleventy/v/beta) to work properly. Yes, this could involve some gotchas with existing 11ty plugins! If anything unexpected happens, let us know on our [GitHub issues page](https://github.com/slinkity/slinkity/issues).

### Using the `slinkity` CLI

We supply our own CLI in place of `eleventy`. This spins up Vite and 11ty in a single command, while using the _exact same CLI flags_ you would use with `eleventy` today. So if you have any `"scripts"` in your `package.json`, [feel free to find-and-replace](https://twitter.com/slinkitydotdev/status/1431371307036336128) `eleventy` with `slinkity`.

Let's spin up a dev server for example. This uses the same set of flags as eleventy:

```bash
npx slinkity --serve --incremental
# we recommend the --incremental flag
# for faster builds during development
```

This command will:

1. Start up [11ty in `--watch` mode](https://www.11ty.dev/docs/usage/#re-run-eleventy-when-you-save) to listen for file changes
2. Start up [a Vite server](https://vitejs.dev/guide/#index-html-and-project-root) pointed at your 11ty build. This helps us process all sorts of file types, including SCSS styles, React components, and more.

[See our `slinkity` CLI docs](http://localhost:8080/docs/config/#the-slinkity-cli) for more details on how flags are processed.

### Production builds

When you're ready for a production build, just run:

```bash
npx slinkity
```

...and your shiny new site will appear in the `_site` folder (or [wherever you tell 11ty to build your site](https://www.11ty.dev/docs/config/#output-directory)).

But wait, we haven't tried any of Slinkity's features yet! Let's change that.

### Adding your first component shortcode

Say you have a project directory with just 1 file: `index.html`. That file might look like this:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slinkity time</title>
</head>
<body>
  <h1>Look ma, it's Slinkity!</h1>
</body>
</html>
```

If you run this using the `slinkity --serve --incremental` command, you'll just see the gloriously static text "Look ma, it's Slinkity!"

But what if we want something... interactive? For instance, say we're tracking how many glasses of water we've had today (because [hydration is important](https://www.gatsbyjs.com/docs/conceptual/react-hydration/)!). If we know a little [ReactJS](https://reactjs.org/docs/getting-started.html), we can whip up a counter component under the `_includes/` directory like so:

```jsx
// _includes/GlassCounter.jsx
import React, { useState } from 'react'

function GlassCounter() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>You've had {count} glasses of water 💧</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
    </div>
  )
}

export default GlassCounter
```

_**Note:** Make sure this file is under `_includes`. This is where our component shortcode will look for `GlassCounter` in a moment._

Next, install `react` and `react-dom` as project dependencies. You might need to stop and restart your dev server if it's running:

```bash
npm i react react-dom
```

Finally, let's place this component on our `index.html` with a [component shortcode](/docs/component-shortcodes):

```html
...
<body>
  <h1>Look ma, it's Slinkity!</h1>
  {% raw %}{% react 'GlassCounter' %}{% endraw %}
</body>
```

This will do a few things:
1. Find `_includes/GlassCounter.jsx` (notice the file extension is optional)
2. [Prerender](https://jamstack.org/glossary/pre-render/) your component at build time. This means you'll always see your component, even when disabling JS in your browser ([try it!](https://developer.chrome.com/docs/devtools/javascript/disable/)).
3. ["Hydrate"](/docs/partial-hydration/) that prerendered component with JavaScript

Now in your browser preview, clicking "Add one" should increase your counter 🎉

**[Learn more about component shortcodes →](/docs/component-shortcodes)**
