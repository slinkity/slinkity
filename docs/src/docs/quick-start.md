---
title: Quick start
---

All you need is an empty directory to get started! But if you prefer a starter project with some pre-populated content, you can use the lovely guide + community resources [over on the 11ty docs](https://www.11ty.dev/docs/getting-started/).

## Installation

If you're starting from a new directory, be sure to create a new `package.json` like so:

```bash
npm init -y
```

Then, install Slinkity + the latest 11ty into your project:

```bash
npm i --save-dev slinkity @11ty/eleventy@beta
```

> Slinkity relies on 11ty's [latest 1.0 beta build](https://www.npmjs.com/package/@11ty/eleventy/v/beta) to work properly. Yes, this could involve some gotchas with existing 11ty plugins! If anything unexpected happens, let us know on our [GitHub issues page](https://github.com/slinkity/slinkity/issues).

...and run our CLI command to spin up the dev server:

```bash
npx slinkity --serve
# Also consider the --incremental flag
# for faster builds during development
```

Now you're off to the races! This command will:

1. Start up [11ty in `--watch` mode](https://www.11ty.dev/docs/usage/#re-run-eleventy-when-you-save) to listen for file changes
2. Start up [a Vite server](https://vitejs.dev/guide/#index-html-and-project-root) pointed at your 11ty build. This helps us process all sorts of file types, including SASS styles, React components, and more 🚀

When you're ready for a production build, just run:

```bash
npx slinkity
```

...and your shiny new site will appear in the `_site` folder (or [wherever you tell 11ty to build your site](https://www.11ty.dev/docs/config/#output-directory)).

But wait, you might not have any templates to build yet! Let's change that.

## Adding your first component shortcode

Alright, now let's do something... Slinkity-ish. Say you have a project directory with just 1 file: `index.html`. That file might look like this:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slinkity time</title>
</head>
<body>
  <h1>Look ma, it's Slinkity!</h1>
</body>
</html>
```

If you run this using the `slinkity --serve` command, you'll just see the gloriously static text "Look ma, it's Slinkity!"

Now, let's add something _interactive._ Say we're keeping track of how many glasses of water we've had today (because [hydration is important](https://www.gatsbyjs.com/docs/conceptual/react-hydration/)!). If we know a little [ReactJS](https://reactjs.org/docs/getting-started.html), we can whip up a counter component under the `_includes/components/` directory like so:

```jsx
// _includes/components/GlassCounter.jsx
import React, { useState } from 'react'

function GlassCounter() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>You've had {count} glasses of water 💧</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
    </div>
  )
}

export default GlassCounter
```

_**Note:** Make sure this file is under `_includes/components`. Slinkity will copy this directory over to your build._

Next, go ahead and install `react` and `react-dom` as project dependencies. This will help your Vite server compile your component.

```bash
npm i --save-dev react react-dom
```

Now how do we use this component on our `index.html` page? Let's reach for a [shortcode](https://www.11ty.dev/docs/shortcodes/):

```html
...
<body>
  <h1>Look ma, it's Slinkity!</h1>
  {% raw %}{% react 'components/GlassCounter' %}{% endraw %}
</body>
```

This will do a few things:
1. Go find `_includes/component/GlassCounter.jsx` (notice the `_includes` and `.jsx` are optional)
2. "Statically" render the component and insert it as HTML. This means you'll always see your component, even when disabling JS in your browser ([go try it!](https://developer.chrome.com/docs/devtools/javascript/disable/)).
3. ["Hydrate"](/docs/partial-hydration/) that HTML we just rendered with our JavaScript component

Now in your browser preview, clicking the button should increase your counter 🎉

### [Learn more about component shortcodes →](/docs/component-shortcodes)
