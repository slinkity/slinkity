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

> Note: You will need to include that trailing slash `/` for our Vite server to find the page. This is because our JS bundle lives on `/about`, which trips up the Vite development server. But don't worry, that trailing slash isn't necessary for production builds if your hosting solution handles that for you!

## Applying front matter

If you're familiar with 11ty, you've likely worked with front matter before. It works the same way for component-based pages as well:

```jsx
// about.jsx
export const frontMatter = {
  title: 'About me'
}

function About() {...
```

You can think of front matter as a way to pass information "upstream" for other templates to read from. For instance, this `title` key is now accessible from any layout templates applied to our page (which we'll explore in the next section!). See [11ty's front matter documentation](https://www.11ty.dev/docs/data-frontmatter/) for more on how the data cascade fits into this.

### Example: Applying layouts

Now, let's wrap our page in a layout template. You may have noticed we're wrapping your component with some `html` and `body` tags automatically, because we're nice like that 🙃. But you may have some metadata or extra wrapper elements to include!

Let's build on our example by creating a `layout.html` under our `_includes` directory.

```
_includes 📁
 | layout.html
about.jsx
```

You can learn more about layout chaining [from the 11ty docs](https://www.11ty.dev/docs/layouts/). Now let's populate our `layout.html` with some content:

```html
{% raw %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
</head>
<body>
  <h1>A tragic tale</h1>
  {{ content }}
</body>
</html>
{% endraw %}
```

What we expect:

1. {% raw %}`{{ title }}`{% endraw %} uses the "title" attribute from our page's front matter
2. {% raw %}`{{ content }}`{% endraw %} renders our component page

To wire up our layout, we just need a little front matter:

```jsx
// about.jsx
export const frontMatter = {
  title: 'About me',
  layout: 'layout.html',
}

function About() {...
```

If all goes well, we should see a build output like this under [our build directory](https://www.11ty.dev/docs/config/):

```html
<!--_site/about/index.html-->
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
  <!--components are placed inside a custom web component-->
  <!--that handles all the JS fetching and loading-->
  <slinkity-react-mount-point>
    <p data-reactroot="">
      Did YOU ever hear the Tragedy of Darth Plagueis the Wise?
    </p>
  </slinkity-react-mount-point>

  <script type="module">
    // React loaders go here
  </script>
</body>
</html>
```

## Using 11ty data as props

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

### [Learn the different ways to render components →](/docs/partial-hydration/)