---
title: Component pages
---

> Vue and Svelte support is coming soon! For now, these docs will be React-specific.

## Prerequisites

Make sure you have `react` and `react-dom` installed in your project like so:

```bash
npm i react react-dom --save-dev
```

With this in place, your Vite server can find any necessary React dependencies.

## Creating a component page

Think of component pages like any other template on your 11ty site. For instance, say we wanted to create an `/about` page with an interactive image carousel. We can create an `about.jsx` file alongside the other pages on our site:

```jsx
index.html
about.jsx
blog.md
```

...And we're ready to go! If you're following along at home, you likely received an error message that `about.jsx` doesn't export anything. Let's change that:

```jsx
import React from 'react'
// yes, this import is still necessary
// we plan to remove this requirement soon!

function About() {
  return (
    <p>Did YOU ever hear the Tragedy of Darth Plagueis the Wise?</p>
  )
}

export default About
```

Now, you should see our tragic tale on `/about/`

> Note: You will need to include that trailing slash `/` for our Vite server to find the page. This is because our JS bundle lives on `/about`, which trips up the Vite development server. But don't worry, that trailing slash isn't necessary in your production build if your hosting solution handles that for you!

## Applying layouts

Now, let's wrap our page in a layout template. You may have noticed we're wrapping your component with some `html` and `body` tags automatically, because we're nice like that 🙃. But you may have some metadata or extra wrapper elements to include!

Let's build on our example by creating a `layout.html` under our `_includes` directory.

```
_includes 📁
 | layout.html
about.jsx
```

You can learn more about layout chaining [from the 11ty docs](https://www.11ty.dev/docs/layouts/). Now, let's populate our `layout.html` with some content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About me</title>
</head>
<body>
  <h1>A tragic tale</h1>
  {% raw %}{{ content }}{% endraw %}
</body>
</html>
```

We should expect our component to get rendered at that {% raw %}`{{ content }}`{% endraw %} block. To wire up our layout, we need to use the `getProps` method from our component like so:

```jsx
export function getProps() {
  return { layout: 'layout.html' }
}

function About() {...
```

We'll explore `getProps` more in the next section. For now, just know that anything returned from this function gets picked up by 11ty!

Will all this in place, we should see a build output like this under our output directory:

```html
<!--_site/about/index.html-->
<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About me</title>
</head>

<body>
  <h1>A tragic tale</h1>
  <!--components are placed inside a custom web component-->
  <!--that handles all the JS fetching and loading-->
  <slinkity-react-renderer data-s-path="about.jsx" data-s-page="true">
    <p data-reactroot="">
      Did YOU ever hear the Tragedy of Darth Plagueis the Wise?
    </p>
  </slinkity-react-renderer>

  <script type="module" async="">
    // React loaders go here
  </script>
</body>
</html>
```

## Using "getProps"

Let's understand that `getProps` function from earlier. For instance, say we want to access 3 pieces of data from our component's props:
- The `date` object [supplied by 11ty](https://www.11ty.dev/docs/data-eleventy-supplied/)
- The page `title` we specify from our component page
- Some CMS data supplied by [a `.11tydata.js` helper](https://www.11ty.dev/docs/data-template-dir/)

Using a "regular" 11ty template, this information would be available to us as variables:

```html
<!--roll-call.html-->
---
title: 'Roll Call'
---{% raw %}
<h1>{{ title }}</h1>
<p>Today's date {{ page.date.toISOString() }}</p>
<ul>
  {%- for name in cmsData.names -%}
  <li>{{ name }}</li>
  {%- endfor -%}
</ul>
{% endraw %}
```

So how could we pull off something similar in React? Well, let's see how our `getProps` function should look:

```jsx
export function getProps(eleventyData) {
  return {
    date: eleventyData.page.date,
    names: eleventyData.cmsData.names,
    title: 'Roll Call',
  }
}
```

### Important takeaways

Firstly, **you manually specify why parts of `eleventyData` your component needs.** This because eleventy data isn't automatically passed to your component as props.

For efficiency reasons, it wouldn't make sense for us to pass _all_ possible data to your component when it only needs a small subset. Remember that we're sending your component to the browser as a JS bundle. If we sent all that `eleventyData` up-front, the user would have to download that huge data blob for every component on your site!

Second, **the return value of `getProps` is doing double duty.** The object returned by `getProps` serves 2 purposes:
1. The object gets passed to your component as props
2. The object is _also_ passed to 11ty as part of the data cascade. For instance, that `title` prop would now be accessible from any wrapper layouts as well 😮

That second piece is where things get interesting, since it lets you _pass data upstream to the levels above._ So if you're tired of solutions like React Helmet, rejoice!

Here's how we'd rewrite that `roll-call.html` as a component:

```jsx
export function getProps(eleventyData) {
  return {
    date: eleventyData.page.date,
    names: eleventyData.cmsData.names,
    title: 'Roll Call',
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

### [Learn the different ways to render components →](/docs/rendering-eager-lazy-static/)