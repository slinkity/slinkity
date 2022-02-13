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

{% slottedComponent "Tabs.svelte", hydrate="lazy", tabs=["React", "Vue", "Svelte"] %}
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

> Before frantically Googling "state variables don't work in Slinkity template," This is intentional! We _avoid_ hydrating your component clientside by default. To opt-in to using `useState`, vue `ref`s, and the like, jump to our hydration section 💧

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

{% slottedComponent "Tabs.svelte", hydrate="lazy", tabs=["React", "Vue", "Svelte"] %}
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

In short, we need to **"opt in" by choosing the pieces of data our component needs.** Say we want to grab 3 pieces of data as props:
- The `date` object [supplied by 11ty](https://www.11ty.dev/docs/data-eleventy-supplied/)
- The page `title` we specified as front matter earlier
- Some CMS data supplied by [a `.11tydata.js` function](https://www.11ty.dev/docs/data-template-dir/)

Using a "regular" 11ty template, all this information would be available right away as variables:

```html
<!--roll-call.html-->
{% raw %}
<h1>{{ title }}</h1>
<p>Today's date {{ page.date.toISOString() }}</p>
<ul>
  {%- for name in cmsData.names -%}
  <li>{{ name }}</li>
  {%- endfor -%}
</ul>
{% endraw %}
```

So how could we pull off something similar in React? Well, let's "request" that data by exporting a `getProps` function:

```jsx
// roll-call.jsx
// note: getProps can also be asynchronous
export function getProps(eleventyData) {
  return {
    // map eleventy's generated Date to a "date" prop
    date: eleventyData.page.date,
    // map our cmsData to a "names" prop
    names: eleventyData.cmsData.names,
    // map the "title" passed down
    title: eleventyData.title,
  }
}
export default function RollCall({ date, names, title }) {
  return ({% raw %}
    <>
      <h1>{title}</h1>
      <p>Today's date {date.toISOString()}</p>
      <ul>
        {names.map(name => <li>{name}</li>)}
      </ul>
    </>
  ){% endraw %}
}
```

A few takeaways here:

1. We export a `getProps` function from our component file
2. Slinkity finds this function _at build time_ and passes in all the 11ty data available
3. We choose the pieces of `eleventyData` we want as props

Then, our component has access to everything `getProps` returns. Nothing more, nothing less.

### 🚨 (Important!) Being mindful about your data

You may be wondering, "why can't _all_ the `eleventyData` get passed to my component as props? This seems like an extra step."

Well, it all comes down to the end user's experience. Remember that we're sending your JS-driven component to the browser so pages can be interactive ([unless you say otherwise](/docs/partial-hydration/)). If we sent all that `eleventyData` along with it, **the user would have to download that huge data blob for every component on your site.** 😮

So, we added `getProps` as a way to pick the data that you need, and "filter out" the data that you don't.

[11ty's collections object](https://www.11ty.dev/docs/collections/) is a prime example of where `getProps` shines. This object contains references to _every_ page on your site, plus all the data those pages receive. Needless to say, that blob can get pretty big! We suggest you:

```jsx
// ❌ Don't pass everything
function getProps({ collections }) {
  return { collections }
}
// ✅ Map out the pieces you need
function getProps({ collections }) {
  return {
    blogPostUrls: collections.blogPosts.map(
      blogPost => blogPost.page.url
    )
  }
}
```

### Can I call `getProps` inside my components?

_Technically_ yes, but we wouldn't recommend it! Note that Slinkity calls `getProps` at _build-time_ to figure out which resources to bundle. This means your `getProps` function is _not_ sent to the browser; it's only run by that shiny CLI command. This is very similar to [NextJS' `getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) or [NuxtJS' data fetchers](https://nuxtjs.org/docs/2.x/features/data-fetching).

## Accessing shortcodes

If you want to replace some existing 11ty templates with component-ified pages, you might be thinking "okay, but how can I access my shortcodes?"

Well, you can't go writing shortcodes within the component itself. But you _can_ access shortcodes at the build step using `getProps`! As long a shortcode is accessible either as a "global" shortcode or a "javascript function:"

```js
// .eleventy.js
module.exports = function(eleventyConfig) {
  // either this...
  eleventyConfig.addJavaScriptFunction('make10xEngineer', (eng) => eng * 10)
  // ...or this
  eleventyConfig.addShortcode('make10xEngineer', (eng) => eng * 10)
}
```

You can access it from the `shortcodes` key like so:

```js
function getProps(eleventyData) {
  const oneXEngineer = 1
  return {
    tenXEngineer: eleventyData.shortcodes.make10xEngineer(oneXEngineer)
  }
}
// -> { tenXEngineer: 10 }
```

**[Learn the different ways to render components →](/docs/partial-hydration/)**