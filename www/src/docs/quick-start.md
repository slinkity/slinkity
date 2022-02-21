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
2. Start up [a Vite server](https://vitejs.dev/guide/#index-html-and-project-root) pointed at your 11ty build. This helps us process all sorts of file types, including SCSS styles, React, Vue, or Svelte components, and more.

[See our `slinkity` CLI docs](http://localhost:8080/docs/config/#the-slinkity-cli) for more details on how flags are processed.

### Production builds

When you're ready for a production build, just run:

```bash
npx slinkity
```

...and your shiny new site will appear in the `_site` folder (or [wherever you tell 11ty to build your site](https://www.11ty.dev/docs/config/#output-directory)).

But wait, we haven't tried any of Slinkity's features yet! Let's change that.

### Adding your first component shortcode

Say you have a project directory with just 1 file: `index.njk`. That file might look like this:

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

But what if we want something... interactive? For instance, say we're tracking how many glasses of water we've had today (because [hydration is important](https://www.gatsbyjs.com/docs/conceptual/react-hydration/)!). If we know a little JavaScript, we can whip up a counter using our favorite flavor of components.

First, we'll install need one of our "renderers" to handle React, Vue, and/or Svelte. Don't worry, this is definitely a set-it-and-forget-it step 😁

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
