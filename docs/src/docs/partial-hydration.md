---
title: Partial hydration
---

Slinkity lets you control _how_ and _when_ your JS-laden components are rendered. Let's understand the options available to you.

## Setting the "render" prop

To choose how a given component is rendered, you'll need to pass the `render` prop.

```jsx
// Page.jsx
export const frontMatter = {
  render: 'eager';
}

function Page() {...}
```

[More on page components](/docs/component-pages-and-layouts)

```html
<!-- page-with-shortcode.html -->
<body>
  {% raw %}{% react 'components/Example' 'render' 'lazy' %}{% endraw %}
</body>
```

[More on shortcodes](/docs/component-shortcodes)

## "eager" - the default for all components

This mirrors how "traditional" component-based frameworks operate. An eagerly loaded component will be rendered to static HTML, _and_ shipped to the client as a JavaScript bundle.

Say we have an eagerly loaded component like this:

```html
<!-- page-with-shortcode.html -->
<body>
  {% raw %}{% react 'components/Example' 'render' 'eager' %}{% endraw %}
</body>
```

Whenever we visit `page-with-shortcode.html`, we'll import React and our `components/Example.jsx` JS bundle as soon as the page is done parsing (see [MDN's docs on scripts with `type="module"`](https://v8.dev/features/modules#browser)). This ensures our component is interactive as soon as possible.

## "lazy"

This is very similar to eager, but with a twist: we **only load the necessary JavaScript when your component is scrolled into view.** This uses the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to figure out whether your component is on the page. Once it is, we quickly grab the necessary dependencies to hydrate your component.

> No, you won't see an empty box while we download your component! All components are pre-rendered at build time so the user can have some placeholder content. Once all resources are downloaded, your component will become interactive.

## "static"

Static components are rendered to HTML at build time, **but no JavaScript is shipped to the client.** This means no interactivity, no state management, nothing. Use this option if you want to use component languages like React as a templating language only.