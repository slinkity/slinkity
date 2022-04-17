---
title: Quick start
---

{% include 'npm-init-slinkity-snippet.md' %}

It includes:
- component(s) embedded into a static `.md` template → [more on component shortcodes here](/docs/component-shortcodes/)
- route(s) built using a component framework as a templating language → [more on component pages here](/docs/component-pages-layouts/)
- a `netlify.toml` configured to deploy in a flash → [more on deployment here](/docs/deployment/)
- an eleventy config with a few recommended defaults → [more on config here](/docs/config/#recommended-config-options)

## Add to your existing 11ty project

Want to bring Slinkity to your current 11ty project? No sweat! Slinkity is built to slot into your existing workflow 😁

### Installation

First, install Slinkity + the latest 11ty into your project:

```bash
npm i --save-dev slinkity @11ty/eleventy
```

> Slinkity requires Node v14 and up. You can check your version by running `node -v` in your terminal before trying Slinkity.

### Apply Slinkity as a plugin

Slinkity is an [11ty plugin](https://www.11ty.dev/docs/plugins/) you can add and configure in your existing 11ty config:

```js
// .eleventy.js or eleventy.config.js
const slinkity = require('slinkity')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(slinkity.plugin, slinkity.defineConfig({
    // optional: use slinkity.defineConfig
    // for some handy autocomplete in your editor
  }))
}
```

You may want one of our pre-built component renderers for React, Vue, or Svelte support too. To setup those config options, jump to the ["add your first component shortcode" section](#add-your-first-component-shortcode).

### Development server

Slinkity attaches Vite to 11ty's built-in development server [as middleware](https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server), so you can keep using the `--serve` CLI flag as you'd expect. Still, we recommend starting your server with the following CLI flags:

```bash
eleventy --serve --incremental --quiet
```

- **--incremental** will prevent any [flashes of unstyled content (FOUC)](https://webkit.org/blog/66/the-fouc-problem/#:~:text=FOUC%20stands%20for%20Flash%20of,having%20any%20style%20information%20yet.&text=When%20a%20browser%20loads%20a,file%20from%20the%20Web%20site.) during Vite's page reloads. It'll also show your changes in the browser much faster!
- **--quiet** will hide extraneous logs in your console. Since Vite already describes changes with informative live reload and HMR logs, it's best to silence duplicate information from 11ty.

For more configuration details, head to:

**[The Slinkity configuration guide →](/docs/config)**

### Production builds

With Slinkity in the mix, your production builds will now complete in 2 steps:
1. 11ty's standard production build
2. Vite's production build to bundle JS and CSS assets

Don't worry, your output directory and build config options won't be affected! Though you may need to move static assets to a separate `/public` directory (including your `robots.txt`, sitemap, and other related assets). To learn more about asset handling, head to:

**[Managing assets for production builds →](/docs/asset-management)**

### Add your first component shortcode

Let's try adding components to your 11ty project. Say you have a project directory with just 1 file: `index.njk`. That file might look like this:

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

If you run this using the `eleventy --serve --incremental` command, you'll just see the gloriously static text "Look ma, it's Slinkity!"

But what if we want something... interactive? For instance, say we're tracking how many glasses of water we've had today (because [hydration is important](https://www.gatsbyjs.com/docs/conceptual/react-hydration/)!). If we know a little JavaScript, we can whip up a counter using our favorite flavor of components.

First, we'll need one of our "renderers" to handle React, Vue, and/or Svelte. Don't worry, this is definitely a set-it-and-forget-it step 😁

{% include 'prereqs.md' %}

Now, we can write a component under the `_includes/` directory like so:

{% slottedComponent "Tabs.svelte", hydrate="eager", id="prereqs", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// _includes/GlassCounter.jsx
import { useState } from 'react'

function GlassCounter() {
  const [count, setCount] = useState(0)
  return (
    <>
      <p>You've had {count} glasses of water 💧</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
    </>
  )
}

export default GlassCounter
```

Finally, let's place this component onto our page with a [component shortcode](/docs/component-shortcodes):

```html
...
<body>
  <h1>Look ma, it's Slinkity!</h1>
  {% component 'GlassCounter.jsx', hydrate='eager' %}
</body>
```
</section>
<section hidden>

```html
<!--_includes/GlassCounter.vue-->
<template>
  <p>You've had {{ count }} glasses of water 💧</p>
  <button @click="add()">Add one</button>
</template>

<script>
import { ref } from "vue";

export default {
  setup() {
    const count = ref(0);

    function add() {
      count.value += 1;
    }

    return { count, add };
  },
};
</script>
```

Finally, let's place this component onto our page with a [component shortcode](/docs/component-shortcodes):

```html
...
<body>
  <h1>Look ma, it's Slinkity!</h1>
  {% component 'GlassCounter.vue', hydrate='eager' %}
</body>
```
</section>
<section hidden>

```html
<!--_includes/GlassCounter.svelte-->
<script>
  let count = 0;

  function add() {
    count += 1;
  }
</script>

<p>You've had {count} glasses of water 💧</p>
<button on:click={add}>Add one</button>
```

Finally, let's place this component onto our page with a [component shortcode](/docs/component-shortcodes):

```html
...
<body>
  <h1>Look ma, it's Slinkity!</h1>
  {% component 'GlassCounter.svelte', hydrate='eager' %}
</body>
```
</section>
{% endrenderTemplate %}
{% endslottedComponent %}

This will do a few things:
1. Find `_includes/GlassCounter.*`. Note that we'll always look inside the `_includes` directory to find your components.
2. [Prerender](https://jamstack.org/glossary/pre-render/) your component at build time. This means you'll always see your component, even when disabling JS in your browser ([try it!](https://developer.chrome.com/docs/devtools/javascript/disable/)).
3. ["Hydrate"](/docs/partial-hydration/) that prerendered component with JavaScript. This is thanks to our `hydrate='eager'` flag.

Now in your browser preview, clicking "Add one" should increase your counter 🎉

**[Learn more about component shortcodes →](/docs/component-shortcodes)**
