---
title: Component shortcodes
---

You can embed React, Vue, Svelte, and more into your existing templates. Let's learn how!

## Prerequisites

{% include 'prereqs.md' %}

## Basic usage

Using the `component` [shortcode](https://www.11ty.dev/docs/shortcodes/), you can insert components into any static template that 11ty supports.

Components must be placed in the `_islands` directory relative to your input directory. You can override this from the Slinkity plugin config.

Say you've written a Vue component under `_islands/Component.vue`. You can insert this component into your Nunjucks and Liquid templates like so:

```liquid{% raw %}
<!--server-render only-->
{% island 'Component.vue' %}{% endisland %}

<!--server-render and hydrate client-side-->
{% island 'Component.vue', 'client:load' %}{% endisland %}

<!--render client-side only, no server rendering-->
{% clientOnlyIsland 'Component.vue' %}{% endclientOnlyIsland %}{% endraw %}
```

> These examples work from markdown (`.md`) and HTML (`.html`) files as well. Each use Liquid syntax by default, though this can be overridden to Nunjucks using [11ty's template override configuration](https://www.11ty.dev/docs/languages/).

First, this will find and load `_islands/Component.vue`. Note that the file extension is _required_ (`.jsx`, `.tsx`, `.svelte`, etc).

Also note that client-side JS is opt-in using a `client:` directive. This allows you to use components for templating and only ship a JS bundle when the need arises.

**[💧 Learn more about partial hydration →](/docs/partial-hydration)**

## Pass props to shortcodes

You can also pass data to your components using a `{% prop %}` shortcode.

Say you have a blog heading component written in your favorite framework (`_includes/BlogHeading.jsx|vue|svelte`) that uses a title and [11ty's supplied `date` object](https://www.11ty.dev/docs/data-eleventy-supplied/). You can pass these props like so, where `'date'` is the prop name and `page.date` is the prop value:

```liquid
{% raw %}{% island 'Date.jsx|vue|svelte' %}
{% prop 'date', page.date %}
{% prop 'title', 'My Slinktastic Blog' %}
{% endisland %}{% endraw %}
```

You can access this prop inside your component like any other prop:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
export default function BlogHeading({ title, date }) {
  return (
    <heading>
      <h1>{title}</h1>
      <p>Published on:<time datetime={date}>{date}</time></p>
    </heading>
  )
}
```
</section>
<section hidden>

```jsx
export default function BlogHeading({ title, date }) {
  return (
    <heading>
      <h1>{title}</h1>
      <p>Published on:<time datetime={date}>{date}</time></p>
    </heading>
  )
}
```
</section>
<section hidden>

```html
<template>
  <heading>
    <h1>{{ title }}</h1>
    <p>Published on: <time :datetime="date">{{ date }}</time></p>
  </heading>
</template>

<script>
export default {
  props: ["date", "title"],
}
</script>
```
</section>
<section hidden>

```html
<script>
  export let date = '';
  export let title = '';
</script>

<heading>
  <h1>{title}</h1>
  <p>Published on:<time datetime={date}>{date}</time></p>
</heading>
```
</section>
{% endrenderTemplate %}
{% endisland %}

## Pass children / default slots to component

Any HTML inside your {% raw %}`{% island %}`{% endraw %} shortcode will be passed as children, or the default `slot` when using Vue or Svelte.

Say you have a simple component to wrap text with a dropdown toggle:

{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
export default function Dropdown({ heading, children }) {
  return (
    <details>
      <summary>{heading}</summary>
      {children}
    </details>
  )
}
```
</section>
<section hidden>

```jsx
export default function Dropdown({ heading, children }) {
  return (
    <details>
      <summary>{heading}</summary>
      {children}
    </details>
  )
}
```
</section>
<section hidden>

```html
<template>
  <details>
    <summary>{{ heading }}</summary>
    <slot />
  </details>
</template>

<script>
export default {
  props: ["heading"],
};
</script>
```
</section>
<section hidden>

```html
<script>
  export let heading = "";
</script>

<details>
  <summary>{heading}</summary>
  <slot />
</details>
```
</section>
{% endrenderTemplate %}
{% endisland %}

You can pass children alongside your props like so:

```liquid{% raw %}
{% island 'Dropdown.jsx|vue|svelte' %}
{% prop 'heading', 'Full disclosure' %}
<p>"details" and "summary" are kinda confusing element names</p>
{% endisland %}{% endraw %}
```

### Important gotcha: templating in children

You may be rushing to try slotted components in your markdown:

```md{% raw %}
{% island 'FancyBackground.jsx|vue|svelte' %}
### Why I love markdown

- Bulleted lists are easy
- Paragraph and code blocks are even easier

{% endisland %}{% endraw %}
```

🚨 **Careful, this won't work as written!** Paired shortcode content is processed as plain HTML, so markdown syntax won't work as expected.

There is a solution though. Since you _can_ still nest other shortcodes as paired shortcode content, you can use [11ty's handy `renderTemplate`](https://www.11ty.dev/docs/plugins/render/) like so:

```md{% raw %}
{% island 'FancyBackground.jsx|vue|svelte' %}
{% renderTemplate 'md' %}
### Why I love markdown

- Bulleted lists are easy
- Paragraph and code blocks are even easier

{% endrenderTemplate %}
{% endisland %}{% endraw %}
```

> Be sure to set up `renderTemplate` in your 11ty config before trying this. [See their docs](https://www.11ty.dev/docs/plugins/render/) for more.

This will process your markdown, then pass the result to your component.

***

So injecting components into templates is nice... but what if we want to build the entire route using a component framework?

**[Learn about page-level components →](/docs/component-pages-layouts)**