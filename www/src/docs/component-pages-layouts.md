---
title: Component pages
---

You're free to use React, Vue, Svelte, and more to create page-level templates. Let's learn how!

## Prerequisites

{% include 'prereqs.md' %}

## Create a component page

Think of component pages like any other template on your 11ty site. For instance, you can add a `/about` page alongside your others routes like so:

```bash
index.html
blog.md
about.jsx|.vue|.svelte
```

...And you're ready to start templating. If you're following along at home, you'll want to add some content to this file:

{% slottedComponent "Tabs.svelte", hydrate="eager", id="page-templates", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
export default function About() {
  return (
    <article>
      <h2>A tragic tale</h2>
      <p>Did YOU ever hear the Tragedy of Darth Plagueis the Wise?</p>
    </article>
  )
}
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>
  <article>
    <h2>A tragic tale</h2>
    <p>Did YOU ever hear the Tragedy of Darth Plagueis the Wise?</p>
  </article>
</template>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<article>
  <h2>A tragic tale</h2>
  <p>Did YOU ever hear the Tragedy of Darth Plagueis the Wise?</p>
</article>
```
</section>
{% endrenderTemplate %}
{% endslottedComponent %}

Now, you should see a tragic tale on `/about` 👀

> Before frantically Googling "state variables don't work in Slinkity template," This is intentional! We _avoid_ hydrating your component clientside by default. To opt-in to using `useState`, vue `ref`s, and the like, [jump to our hydration section](#hydrate-your-page) 💧

## Apply front matter

If you're familiar with 11ty, you've likely worked with front matter before. It allows you to associate "data" with your current template, which can be picked up by [layouts](https://www.11ty.dev/docs/layouts/), [11ty's collections API](https://www.11ty.dev/docs/collections/), and more (see [11ty's front matter documentation](https://www.11ty.dev/docs/data-frontmatter/) for full details).

For example, let's say you have a simple layout in your project called `_includes/base.njk`. This layout will:
1. Inject a given route's `title` property into the page `<title>`
2. Apply the content of that layout between some `<body>` tags

```html{% raw %}
<!--_includes/base.njk-->
<html lang="en">
<head>
  ...
  <title>{{ title }}</title>
</head>
<body>
  {{ content }}
</body>
</html>
```{% endraw %}

You can apply this layout to your `/about` page using front matter:

{% slottedComponent "Tabs.svelte", hydrate="eager", id="page-frontmatter", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
export const frontMatter = {
  title: 'A tragic tale',
  layout: 'base.njk',
}

function About() {...
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>
  ...
</template>

<script>
  export const frontMatter = {
    title: 'A tragic tale',
    layout: 'base.njk',
  }
</script>
```
</section>
<section hidden>

> Note: don't forget `context="module"` here! This allows us to export data from our component. [See the Svelte docs](https://svelte.dev/tutorial/module-exports) for more.

```html
<!--about.svelte-->
<script context="module">
  export const frontMatter = {
    title: 'A tragic tale',
    layout: 'base.njk',
  }
</script>

<article>
  ...
</article>
```
</section>

{% endrenderTemplate %}
{% endslottedComponent %}

## Use 11ty data as props

We've pushed data _up_ into the data cascade using front matter. So how do you pull data back _down_ in our components?

Assuming your page isn't hydrated ([see how hydrated props work](#hydrate-your-page)), all 11ty data is magically available as props 😁

Say we have a list of incredible, amazing, intelligent Slinkity contributors in a global data file called `_data/contributors.json`:

```json
[
  { "name": "Ben Myers", "ghProfile": "https://github.com/BenDMyers" },
  { "name": "Anthony Campolo", "ghProfile": "https://github.com/ajcwebdev" },
  { "name": "Thomas Semmler", "ghProfile": "https://github.com/nachtfunke" }
]
```

Since [all `_data` files are piped into 11ty's data cascade](https://www.11ty.dev/docs/data-global/), this is now available to your component page via the `contributors` prop:

{% slottedComponent "Tabs.svelte", hydrate="eager", id="page-props", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
export default function About({ contributors }) {
  return (
    <ul>
      {contributors.map(({ name, ghProfile }) => (
        <li><a href={ghProfile}>{name}</a></li>
      ))}
    </ul>
  )
}
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>
  <ul v-for="contributor in contributors">
    <li>
      <a href="{{contributor.ghProfile}}">{{contributor.name}}</a>
    </li>
  </ul>
</template>

<script>
  export default {
    props: ['contributors'],
  }
</script>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<script>
  export let contributors = []
</script>

<article>
  <ul>
    {#each contributors as contributor}
      <li>
        <a href={contributor.ghProfile}>{contributor.name}</a>
      </li>
    {/each}
  </ul>
</article>
```
</section>

{% endrenderTemplate %}
{% endslottedComponent %}

> To get the most out of these data props, we recommend learning more about the 11ty data cascade. Here's some helpful resources:
> - 📝 [**The official 11ty docs**](https://www.11ty.dev/docs/data-cascade/)
> - 🚏 [**A beginner-friendly walkthrough**](https://benmyers.dev/blog/eleventy-data-cascade/) by Ben Myers


## Hydrate your page

We've used components as build-time templating languages. Now let's add some JavaScript into the mix 🥗

You can enable hydration using the `hydrate` front matter prop:

{% slottedComponent "Tabs.svelte", hydrate="eager", id="page-hydrate-frontmatter", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
import { useState } from 'react'

export const frontMatter = {
  hydrate: 'eager',
}

export default function About() {
  const [count, setCount] = useState(0)

  return (
    <>
      <p>You've had {count} glasses of water 💧</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
    </>
  )
}
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>
  <p>You've had {{ count }} glasses of water 💧</p>
  <button @click="add()">Add one</button>
</template>

<script>
  import { ref } from 'vue'
  export default {
    frontMatter: {
      hydrate: 'eager',
    },
    setup() {
      const count = ref(0);
      const add = () => (count.value = count.value + 1);
      return { count, add };
    }
  }
</script>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<script context="module">
  export const frontMatter = {
    hydrate: 'eager',
  }
</script>
<script>
  let count = 0

  function add() {
    count += 1
  }
</script>

<p>You've had {count} glasses of water 💧</p>
<button on:click={add}>Add one</button>
```
</section>

{% endrenderTemplate %}
{% endslottedComponent %}

Like [component shortcodes](/docs/component-shortcodes), you're free to use any of [our partial hydration modes](/docs/partial-hydration) (`eager`, `lazy`, etc).

### Handling props

Props work a _bit_ differently now that JS is involved. In order to access 11ty data from your component, you'll need to choose which pieces of data you need.

For instance, say we need to access that same global `contributors` list [from earlier](#use-11ty-data-as-props). We'll use a special `hydrate.props` function from our front matter like so:


{% slottedComponent "Tabs.svelte", hydrate="eager", id="page-hydrated-props", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
export const frontMatter = {
  hydrate: {
    mode: 'eager',
    // the result of this function
    // will be based to your component as props
    props: (eleventyData) => ({
      contributors: eleventyData.contributors,
    })
  }
}
export default function About({ contributors }) {
  return (
    <ul>
      {contributors.map(({ name, ghProfile }) => (
        <li><a href={ghProfile}>{name}</a></li>
      ))}
    </ul>
  )
}
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>
  <ul v-for="contributor in contributors">
    <li>
      <a href="{{contributor.ghProfile}}">{{contributor.name}}</a>
    </li>
  </ul>
</template>

<script>
  export default {
    props: ['contributors'],
    frontMatter: {
      hydrate: {
        mode: 'eager',
        // the result of this function
        // will be based to your component as props
        props: (eleventyData) => ({
          contributors: eleventyData.contributors,
        })
      }
    }
  }
</script>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<script context="module">
  export const frontMatter = {
    hydrate: {
      mode: 'eager',
      // the result of this function
      // will be based to your component as props
      props: (eleventyData) => ({
        contributors: eleventyData.contributors,
      })
    }
  }
</script>
<script>
  export let contributors = []
</script>

<article>
  <ul>
    {#each contributors as contributor}
      <li>
        <a href={contributor.ghProfile}>{contributor.name}</a>
      </li>
    {/each}
  </ul>
</article>
```
</section>

{% endrenderTemplate %}
{% endslottedComponent %}

A few takeaways here:

1. We update `hydrate: "eager"` to `hydrate: { mode: "eager" }`
2. We include a `hydrate.props` function for Slinkity to decide which props our component needs
3. Slinkity runs this function _at build time_ (not on the client!) to decide which props to generate
4. These props are accessible from your browser-rendered component

### 🚨 (Important!) Being mindful about your data

You may be wondering, "why can't _all_ the `eleventyData` get passed to my component as props? This seems like an extra step."

Well, it all comes down to the end user's experience. Remember that we're sending your JS-driven component to the browser so pages can be interactive. If we sent all that `eleventyData` along with it, **the user would have to download that huge data blob for every component on your site.** 😮

So, we added `hydrate.props` as a way to pick the data that you need, and "filter out" the data that you don't.

[11ty's collections object](https://www.11ty.dev/docs/collections/) is a prime example of where `hydrate.props` shines. This object contains references to _every_ page on your site, plus all the data those pages receive. Needless to say, that blob can get pretty big! We suggest you:

```js
// ❌ Don't pass everything
props({ collections }) {
  return { collections }
}
// ✅ Map out the pieces you need
props({ collections }) {
  return {
    blogPostUrls: collections.blogPosts.map(
      blogPost => blogPost.page.url
    )
  }
}
```

### Can I call `frontMatter.hydrate.props()` inside my components?

_Technically_ yes, but we wouldn't recommend it. Note that Slinkity calls this function at _build-time_ to figure out which resources to bundle. In other words, it's not meant to re-run in the browser. This is very similar to [NextJS' `getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) or [NuxtJS' data fetchers](https://nuxtjs.org/docs/2.x/features/data-fetching).

Oh, and for more on hydration options...

**[Learn the different ways to render components →](/docs/partial-hydration/)**