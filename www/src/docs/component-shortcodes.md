---
title: Component shortcodes
---

You can embed React, Vue, Svelte, and more into your existing templates. Let's learn how!

## Prerequisites

{% include 'prereqs.md' %}

## Basic usage

Using the `component` [shortcode](https://www.11ty.dev/docs/shortcodes/), you can insert components into any static template that 11ty supports.

First, ensure your component is **located in your includes directory** This defaults to `_includes` for new 11ty projects, but you can [override this from your eleventy config](https://www.11ty.dev/docs/config/#directory-for-includes).

For instance, say you've written a Vue component under `_includes/Component.vue`. You can insert this component into your templates like so:

{% slottedComponent 'Tabs.svelte', hydrate='eager', id='shortcode-basics', store='templates', tabs=['nunjucks', 'liquid'] %}
{% renderTemplate 'md' %}
<section>

```html
{% component 'Component.vue' %}
```
</section>
<section hidden>

```html
{% component 'Component.vue' %}
```
</section>
{% endrenderTemplate %}
{% endslottedComponent %}

> These examples work from markdown (`.md`) and HTML (`.html`) files as well! You can use liquid syntax within either of these by default, though we recommend using Nunjucks instead. See [our recommend config options](/docs/config/#recommended-config-options) for more.

This will do a few things:
1. Find `_includes/GlassCounter.*`. Note that we'll always look inside the `_includes` directory to find your components.
2. [Prerender](https://jamstack.org/glossary/pre-render/) your component at build time. This means you'll always see your component, even when disabling JS in your browser ([try it!](https://developer.chrome.com/docs/devtools/javascript/disable/)).

One feature we _won't_ provide automatically: hydrating on the client. In other words, your React `useState`, Vue `refs`, or Svelte stores won't work immediately. You'll need to opt-in to sending JavaScript to the browser, which brings us to our next section...

## Choose how and when to hydrate

Slinkity requires a special `hydrate` prop to ship JavaScript alongside your components. This lets you use your favorite component framework for templating guilt-free, and opt-in to JS bundles when the need arises.

To hydrate that `Component.vue` from earlier, you can apply the `hydrate='eager'` flag:

{% slottedComponent 'Tabs.svelte', hydrate='eager', id='shortcode-basics', store='templates', tabs=['nunjucks', 'liquid'] %}
{% renderTemplate 'md' %}
<section>

```html
{% component 'Component.vue', hydrate='eager' %}
```

> If you prefer the syntax available in nunjucks templates, we do too! We recommend configuring nunjucks as the default templating language for HTML and markdown files to access this syntax everywhere. [Head to our configuration docs](/docs/config/#11ty's-.eleventy.js) for more details.

</section>
<section hidden>

```html
{% component 'Component.vue' 'hydrate' 'eager' %}
```

> Liquid doesn't handle inline objects very well. So, we recommend passing each key-value pair as separate arguments as shown above. Each pair (ex. `'hydrate' 'eager'`) will be joined on our end (ex. `hydrate='eager'`).

</section>
{% endrenderTemplate %}
{% endslottedComponent %}

For a full list of options to fine-tune how and when JavaScript is loaded on the client...

**[💧 Learn more about partial hydration →](/docs/partial-hydration)**

## Pass props to shortcodes

You can also pass data to your components as key / value pairs.

Let's say you have a date component written in your favorite framework (`_includes/Date.jsx|vue|svelte`) that wants to use [11ty's supplied `date` object](https://www.11ty.dev/docs/data-eleventy-supplied/). You can pass this "date" prop like so:

{% slottedComponent 'Tabs.svelte', hydrate='eager', id='shortcode-basics', store='templates', tabs=['nunjucks', 'liquid'] %}
{% renderTemplate 'md' %}
<section>

```html
{% component 'Date.jsx|vue|svelte', data=page.date %}
```
</section>
<section hidden>

```html
{% component 'Date.jsx|vue|svelte' 'date' page.date %}
```
</section>
{% endrenderTemplate %}
{% endslottedComponent %}

"date" is the key for our prop here, and `page.date` is the value passed by 11ty. You can access that `date` inside your component like so:

{% slottedComponent "Tabs.svelte", hydrate="eager", id="component-props", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
export default function ViewDate({ date }) {
  return (
    <span>{date}</span>
  )
}
```
</section>
<section hidden>

```html
<template>
  <span>{{ date }}</span>
</template>

<script>
export default {
  props: ["date"],
}
</script>
```
</section>
<section hidden>

```html
<script>
  export let date = '';
</script>

<span>{date}</span>
```
</section>
{% endrenderTemplate %}
{% endslottedComponent %}

### Passing multiple props

You're free to pass as many key / value pairs as you want! The names and ordering of your keys shouldn't matter.

```html
<!--for nunjucks templates-->
{% raw %}{% react 'components/DisplayAllTheThings', date=page.date,
url=page.url, fileSlug=page.fileSlug %}{% endraw %}

<!--for liquid templates-->
{% raw %}{% react 'components/DisplayAllTheThings' 'date' page.date
'url' page.url 'fileSlug' page.fileSlug %}{% endraw %}
```

Injecting components into templates is nice... but what if we want to build the entire route using a component framework?

**[Learn about page-level components →](/docs/component-pages-layouts)**