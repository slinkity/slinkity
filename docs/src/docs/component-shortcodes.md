---
title: Component shortcodes
---

> Vue and Svelte support is coming soon! For now, these docs will be React-specific.

## Prerequisites

Make sure you have `react` and `react-dom` installed in your project like so:

```bash
npm i react react-dom --save-dev
```

With this in place, your Vite server can find any necessary React dependencies.

## Basic usage

Using the `react` [shortcode](https://www.11ty.dev/docs/shortcodes/), you can insert components into any static template that 11ty supports. First, ensure your component is:
- **located in your includes directory** - defaults to `_includes`, but you can [override this from your eleventy config](https://www.11ty.dev/docs/config/#directory-for-includes)
- **exports your component as a default export** (aka `export default ComponentName`) - named exports currently aren't supported

Now, you can add a component shortcode to your template of choice:

```html
<!--for nunjucks and liquid templates -->
{% raw %}{% react 'path/to/Component' %}{% endraw %}

<!--for handlebars templates --> 
{% raw %}{{{ react 'path/to/Component' }}}{% endraw %}
```

This will do a few things:
1. Find `_includes/path/to/Component.jsx` (notice the file extension is optional)
2. [Prerender](https://jamstack.org/glossary/pre-render/) your component at build time. This means you'll always see your component, even when disabling JS in your browser ([try it!](https://developer.chrome.com/docs/devtools/javascript/disable/)).
3. ["Hydrate"](/docs/partial-hydration/) that prerendered component with JavaScript

## Choose how and when to hydrate

Slinkity assumes you'll hydrate your component by default. In other words, we ship your component as a JavaScript bundle to ensure your stateful variables work on the client. But what if you _don't_ need to ship any interactivity?

To opt-out of shipping JS, you can render your component as "static" HTML and CSS like so:

```html
{% raw %}
<!--for nunjucks templates -->
{% react 'components/Date', render="static" %}

<!--for liquid templates (note we can't use the "=" sign here!) -->
{% react 'components/Date' 'render' 'static' %}

<!--for handlebars templates --> 
{{{ react 'components/Date', 'render', 'static' }}}
{% endraw %}
```

For a full list of options to fine-tune how and when JavaScript is loaded on the client...

### [💧 Learn more about partial hydration →](/docs/partial-hydration)

## Passing props to shortcodes

You can also pass data to your components as key / value pairs.

Let's say you have a date component that wants to use [11ty's supplied `date` object](https://www.11ty.dev/docs/data-eleventy-supplied/). You can pass this "date" prop like so:

```html
<!--for nunjucks templates -->
{% raw %}{% react 'components/Date', date=page.date %}{% endraw %}

<!--for liquid templates (note we can't use the "=" sign here!) -->
{% raw %}{% react 'components/Date' 'date' page.date %}{% endraw %}

<!--for handlebars templates --> 
{% raw %}{{{ react 'components/Date', 'date', page.date }}}{% endraw %}
```

> If you prefer the syntax available in nunjucks templates, we do too! We recommend configuring nunjucks as the default templating language for HTML and markdown files to access this syntax everywhere. [Head to our configuration docs](/docs/config/#11ty's-.eleventy.js) for more details.

"date" is the key for our prop here, and `page.date` is the value passed by 11ty. We can access our prop inside `components/Date.jsx` like so:

```jsx
// _includes/Date.jsx
import React from 'react'

function ViewDate({ date }) {
  return (
    <span>{date}</span>
  )
}

export default ViewDate
```

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

### [Learn about page-level components →](/docs/component-pages-layouts)