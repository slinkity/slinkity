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

## Shortcode syntax

Using the `react` [shortcode](https://www.11ty.dev/docs/shortcodes/), you can insert components into any static template that 11ty supports. You'll just need to pass the path to your component like so:

```html
<!--for nunjucks and liquid templates -->
{% raw %}{% react 'components/path/to/Component' %}{% endraw %}

<!--for handlebars templates --> 
{% raw %}{{{ react 'components/path/to/Component' }}}{% endraw %}
```

Let's say we're using `_includes` as our includes folder (yes, you can [override this here](https://www.11ty.dev/docs/config/#directory-for-includes)). Using this path, Slinkity will go fetch the React component found at:

```
_includes/components/path/to/Component.jsx
```

Note that `_includes` and `.jsx` are optional in our shortcode. Passing {% raw %}`{% react '_includes/components/path/to/Component.jsx' %}`{% endraw %} works just as well!

### Where your components should live

> ⚠️ You may have noticed we're using a `components` directory inside our "includes." **This is where all your imported components should live.** Slinkity will always copy the contents of `_includes/components/` to the build for Vite to pick up. If you place your components anywhere outside of here, Vite won't be able to find them!

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

### [Learn about page-level components →](/docs/component-pages-layouts)