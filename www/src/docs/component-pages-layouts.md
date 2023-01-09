---
title: Component pages
---

You're free to use React, Vue, Svelte, and more to create page-level templates. Let's learn how!

## Prerequisites

{% include 'prereqs.md' %}

## Create a component page

Think of component pages like any other template on your 11ty site. For instance, you can add a component-driven `/about` page alongside your others routes like so:

```bash
index.html
blog.md
about.jsx|.vue|.svelte
```

...And you're ready to start templating. If you're following along at home, you'll want to add some content to this file:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
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
{% endisland %}

Now, you should see a tragic tale on `/about`.

> Before frantically Googling "state variables don't work in Slinkity template," This is intentional! We _avoid_ hydrating your component clientside by default. To opt-in to using `useState`, vue `ref`s, and the like, [jump to our hydration section](#hydrate-your-page) 💧

## Apply front matter

If you're familiar with 11ty, you've likely worked with front matter before. It allows you to associate "data" with your current template, which can be picked up by [layouts](https://www.11ty.dev/docs/layouts/), [11ty's collections API](https://www.11ty.dev/docs/collections/), and more. See [11ty's front matter documentation](https://www.11ty.dev/docs/data-frontmatter/) for full details.

For example, let's say you have a simple layout in your project called `_includes/base.njk`. This layout will:

1. Inject a given route's `title` property into the page `<title>`
2. Apply the content of that layout between some `<body>` tags

```html{% raw %}
<!--_includes/base.njk-->
<html lang="en">
<head>
  <title>{{ title }}</title>
</head>
<body>
  {{ content | safe }}
</body>
</html>
```{% endraw %}

You can apply this layout to your `/about` page using front matter:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
export const frontmatter = {
  title: 'A tragic tale',
  layout: 'base.njk',
}

function About() {...}
```
</section>
<section hidden>

```jsx
// about.jsx
export const frontmatter = {
  title: 'A tragic tale',
  layout: 'base.njk',
}

function About() {...}
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>...</template>

<script>
export default {
  frontmatter: {
    title: "A tragic tale",
    layout: "base.njk",
  },
};
</script>
```
</section>
<section hidden>

> Don't forget `context="module"` here! This allows us to export data from our component. [See the Svelte docs](https://svelte.dev/tutorial/module-exports) for more.

```html
<!--about.svelte-->
<script context="module">
  export const frontmatter = {
    title: "A tragic tale",
    layout: "base.njk",
  };
</script>

<article>...</article>
```
</section>

{% endrenderTemplate %}
{% endisland %}

## Use 11ty data as props

You've pushed data _up_ into the data cascade using front matter. So how do you pull data back _down_ in your components?

Assuming your page isn't hydrated ([see how hydrated props work](#hydrate-your-page)), all 11ty data is magically available as props.

Say you have a list of incredible, amazing, intelligent Slinkity contributors in a global data file called `_data/contributors.json`:

```json
[
  { "name": "Ben Myers", "ghProfile": "https://github.com/BenDMyers" },
  { "name": "Anthony Campolo", "ghProfile": "https://github.com/ajcwebdev" },
  { "name": "Thomas Semmler", "ghProfile": "https://github.com/nachtfunke" }
]
```

Since [all `_data` files are piped into 11ty's data cascade](https://www.11ty.dev/docs/data-global/), this is now available to your component page via the `contributors` prop:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
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
      <a href="{{contributor.ghProfile}}">{{ contributor.name }}</a>
    </li>
  </ul>
</template>

<script>
export default {
  props: ["contributors"],
};
</script>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<script>
  export let contributors = [];
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
{% endisland %}

> To get the most out of these data props, we recommend learning more about the 11ty data cascade. Here's some helpful resources:
>
> - 📝 [**The official 11ty docs**](https://www.11ty.dev/docs/data-cascade/)
> - 🚏 [**A beginner-friendly walkthrough**](https://benmyers.dev/blog/eleventy-data-cascade/) by Ben Myers

## Access shortcodes and filters

All [shortcodes](https://www.11ty.dev/docs/shortcodes/) and [filters](https://www.11ty.dev/docs/filters/) are accessible with the `useFunctions` helper. This includes any shortcode or filter created using the following eleventy config helpers:

```js
// .eleventy.js
module.exports = function(eleventyConfig) {
  // Universal filter
  eleventyConfig.addFilter("capitalize", function(value) { … });

  // Universal shortcode
  eleventyConfig.addShortcode("capitalized", function(value) { … });

  // Universal paired shortcode
  eleventyConfig.addPairedShortcode("capitalized", function(content, value) { … });

  // JavaScript Template Function
  eleventyConfig.addJavaScriptFunction("capitalize", function(value) { … });
};
```

For instance, say you registered a `capitalize` filter like so:

```js
// .eleventy.js
module.exports = function(eleventyConfig) {
    eleventyConfig.addFilter('capitalize', function(value) {
      const firstLetter = value[0]
      const restOfPhrase = value.slice(1)
      return firstLetter.toUpperCase() + restOfPhrase
    })
}
```

You can access this filter across your component pages like so:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
import { useFunctions } from '@slinkity/preact/server';

export default function About({ __functions }) {
  const { capitalize } = useFunctions();
  const name = 'darth Plagueis the Wise'
  return (
    <article>
      <h2>A tragic tale</h2>
      <p>Did YOU ever hear the Tragedy of {capitalize(name)}?</p>
    </article>
  )
}
```
</section>
<section hidden>

```jsx
// about.jsx
import { useFunctions } from '@slinkity/react/server';

export default function About({ __functions }) {
  const { capitalize } = useFunctions();
  const name = 'darth Plagueis the Wise'
  return (
    <article>
      <h2>A tragic tale</h2>
      <p>Did YOU ever hear the Tragedy of {capitalize(name)}?</p>
    </article>
  )
}
```
</section>
<section hidden>

🚧 Vue support in progress

</section>
<section hidden>

🚧 Svelte support in progress

</section>
{% endrenderTemplate %}
{% endisland %}

## Handle dynamic permalinks

[Dynamic permalinks](https://www.11ty.dev/docs/permalinks/#use-data-variables-in-permalink) are useful when generating a URL from 11ty data. You may be used to template strings when using plain 11ty (say, [using Nunjucks](https://www.11ty.dev/docs/permalinks/#use-data-variables-in-permalink) to output a URL). But with Slinkity, you have the power of JavaScript functions at your disposal 😎

### Example - Generate a permalink from a page title

Say you want to generate a blog post's URL from its title. Since front matter is available from the 11ty data object, you can use a `permalink()` function like so:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'frameworks' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
export const frontmatter = {
  title: 'A tragic tale',
  permalink(eleventyData, functions) {
    // note: shortcodes and filters are available
    // from `functions`. We're using 11ty's built-in
    // `slugify` filter here.
    return \`/${functions.slugify(eleventyData.title)}/\`
  },
}

export default function About() {...}
```
</section>
<section hidden>

```jsx
// about.jsx
export const frontmatter = {
  title: 'A tragic tale',
  permalink(eleventyData, functions) {
    // note: shortcodes and filters are available
    // from `functions`. We're using 11ty's built-in
    // `slugify` filter here.
    return \`/${functions.slugify(eleventyData.title)}/\`
  },
}

export default function About() {...}
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>...</template>

<script>
export default {
  frontmatter: {
    title: "A tragic tale",
    permalink(eleventyData, functions) {
      // note: shortcodes and filters are available
      // from `functions`. We're using 11ty's built-in
      // `slugify` filter here.
      return \`/${functions.slugify(eleventyData.title)}/\`
    },
  },
}
</script>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<script context="module">
  export const frontmatter = {
    title: "A tragic tale",
    permalink(eleventyData, functions) {
      // note: shortcodes and filters are available
      // from `functions`. We're using 11ty's built-in
      // `slugify` filter here.
      return \`/${functions.slugify(eleventyData.title)}/\`
    },
  };
</script>

<article>...</article>
```
</section>

{% endrenderTemplate %}
{% endisland %}

Here's how your site's input / output directories will look, assuming `_site` is your output and `src` is your input:

```plaintext
├── _site
│   └── a-tragic-tale
│       └──index.html
├── src
│   └── about.jsx|vue|svelte
```

### Example - Dynamic permalinks with pagination

Pagination is another common use case for dynamic permalinks. We won't go _too_ in depth on 11ty's pagination options ([see their docs for full details](https://www.11ty.dev/docs/pagination/#aliasing-to-a-different-variable)), but we'll cover the primary use case: generate routes from an array of data.

Say that:

1. You have an array of T-shirts to sell on your e-commerce site
2. You want to generate a unique route to preview each T-shirt

That list of T-shirts may look like this (`_data/tshirts.json`):

```json
[
  {
    "name": "Me and the Possum Posse",
    "slug": "possum-posse",
    "image": "assets/possum-posse.jpg"
  },
  {
    "name": "It possumtimes be like that",
    "slug": "possumtimes",
    "image": "assets/possumtimes.jpg"
  }
]
```

You can generate routes for each of these T-shirts using the `pagination` and `permalink` properties like so:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'frameworks' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// tshirt.jsx
export const frontmatter = {
  pagination: {
    // name of your data
    data: 'tshirts',
    // number of routes per array element
    size: 1,
    // variable to access array element values
    // from your permalink fn and your component page
    alias: 'tshirt' 
  },
  // note the trailing "/" here!
  permalink: ({ tshirt }) => \`/${tshirt.slug}/\`
}

export default function Tshirt({ tshirt }) {
  return (
    <article>
      <h1>{tshirt.name}</h1>
      <img src={tshirt.image} alt={tshirt.name} />
    </article>
  )
}
```
</section>
<section hidden>

```jsx
// tshirt.jsx
export const frontmatter = {
  pagination: {
    // name of your data
    data: 'tshirts',
    // number of routes per array element
    size: 1,
    // variable to access array element values
    // from your permalink fn and your component page
    alias: 'tshirt' 
  },
  // note the trailing "/" here!
  permalink: ({ tshirt }) => \`/${tshirt.slug}/\`
}

export default function Tshirt({ tshirt }) {
  return (
    <article>
      <h1>{tshirt.name}</h1>
      <img src={tshirt.image} alt={tshirt.name} />
    </article>
  )
}
```
</section>
<section hidden>

```html
<!--tshirt.vue-->
<template>
  <article>
    <h1>{{ tshirt.name }}</h1>
    <img src="{{ tshirt.image }}" alt="{{ tshirt.name }}" />
  </article>
</template>

<script>
export default {
  frontmatter: {
    pagination: {
      // name of your data
      data: "tshirts",
      // number of routes per array element
      size: 1,
      // variable to access array element values
      // from your permalink fn and your component page
      alias: "tshirt",
    },
    // note the trailing "/" here!
    permalink: ({ tshirt }) => \`/${tshirt.slug}/\`,
  },
  props: ["tshirt"],
};
</script>
```
</section>
<section hidden>

```html
<!--tshirt.svelte-->
<script context="module">
  export const frontmatter = {
    pagination: {
      // name of your data
      data: "tshirts",
      // number of routes per array element
      size: 1,
      // variable to access array element values
      // from your permalink fn and your component page
      alias: "tshirt",
    },
    // note the trailing "/" here!
    permalink: ({ tshirt }) => \`/${tshirt.slug}/\`,
  };
</script>

<script>
  export let tshirt = {};
</script>

<article>
  <h1>{tshirt.name}</h1>
  <img src={tshirt.image} alt={tshirt.name} />
</article>
```
</section>

{% endrenderTemplate %}
{% endisland %}

Here's how your site's input / output directories will look, assuming `_site` is your output and `src` is your input:

```plaintext
├── _site
│   └── possum-posse
│       └── index.html
│   └── possumtimes
│       └── index.html
├── src
│   └── tshirt.jsx|vue|svelte
```

## Hydrate your page

We've used components as build-time templating languages. Now let's add some JavaScript into the mix 🥗

You can enable client-side rendering using the `island` export:

{% include 'examples/hydrate-component-page.md' %}

Like [component shortcodes](/docs/component-shortcodes), you're free to use any of [our `client:` directives](/docs/partial-hydration) (`client:visible`, `client:idle`, and more).

### Handle props on hydrated components

Props work a _bit_ differently now that JS is involved. In order to access 11ty data from your component, you'll need to choose which pieces of data you need.

For instance, say you need to access that same global `contributors` list [from earlier](#use-11ty-data-as-props). You can add a `props` function to your `island` export to access this data and pass the pieces you need to the client:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
export const island = {
  when: 'client:load',
  props: (eleventyData) => ({
    contributors: eleventyData.contributors,
  })
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

```jsx
// about.jsx
export const island = {
  when: 'client:load',
  props: (eleventyData) => ({
    contributors: eleventyData.contributors,
  })
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
      <a href="{{contributor.ghProfile}}">{{ contributor.name }}</a>
    </li>
  </ul>
</template>

<script>
export default {
  props: ["contributors"],
  island: {
    when: 'client:load',
    props: (eleventyData) => ({
      contributors: eleventyData.contributors,
    })
  }
};
</script>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<script context="module">
  export const island = {
    when: 'client:load',
    props: (eleventyData) => ({
      contributors: eleventyData.contributors,
    })
  }
</script>

<script>
  export let contributors = [];
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
{% endisland %}

A few takeaways here:

- We include an `island.props` function for Slinkity to decide which props our component needs
- Slinkity runs this function _at build time_ (not on the client!) to decide which props to generate
- These props are accessible from the browser-rendered component

### 🚨 (Important!) Be mindful about your data

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

Now that we've discussed page hydration, let's learn how to choose if and when that JS loads.

**[Learn about `client:` directives →](/docs/partial-hydration/)**