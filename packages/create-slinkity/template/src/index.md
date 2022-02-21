---
title: It's Slinkity time
layout: layout
---

If you're reading this from your browser... congrats! You just built (or dev server-ed) you're first Slinkity site 👊

## Component shortcodes

<!--insert-component-shortcodes-here-->

With [component shortcodes](https://www.11ty.dev/docs/shortcodes/), you can insert components into any static template that 11ty supports. Just tell us the path to the component and how / if we should <a href="https://slinkity.dev/docs/partial-hydration/">"hydrate" that component with JS</a>, and you're off to the interactivity races.

## Styling

Did you see that grid background fade into view? Yeah, we think it's pretty cool too. We pulled it off using a few lines of CSS under the `/styles` directory.

We invite you to head over there and start breaking things! You'll see near-instant feedback to your changes thanks to Vite's hot module reloading setup.

<details>
  <summary>H-M-What now?</summary>
  <p>
    This is a new way to send file changes to the browser. When using the dev server, we'll <em>avoid refreshing the page</em> when you edit HMR-supported file types (styles for instance). Instead, we'll tell the browser to just reload that single resoruce and immediately show you your changes. More on this in <a href="https://vitejs.dev/guide/features.html#hot-module-replacement">Vite's documentation.</a>
  </p>
  <p>
    This is especially useful when styling stateful components. For instance, say you're editing a dropdown's styles for when it's in the "open" state.
  </p>
  <ul>
    <li>Without HMR: the page refreshes, causing the dropdown to close on each style edit 😢</li>
    <li>With HMR: our stylesheet reloads without refreshing the page. This means our dropdown stays open as we tweak our styles ❤️</li>
  </ul>
</details>

<details>
  <summary>How are those stylesheets applied?</summary>
  <p>
    Each stylesheet is loaded onto the page from a layout file (<code>src/_includes/layout.njk</code>) using a regular <code>link</code> tag like so: <code>link rel="stylesheet" href="/@root/styles/index.scss"</code>
  </p>
  <p>
    Theres 2 important takeaways here:
  </p>
  <ol>
    <li>We use the <code>@root</code> import alias to import from the root of our project. Check out <a href="https://slinkity.dev/docs/import-aliases/">our docs on import aliases</a> for more details.</li>
    <li>We leave that <code>.scss</code> extension as-is. Vite scans through our html files for exotic file extensions like this. If it knows how to process an extension, it'll transform that file on-the-fly into something the browser can understand. And if you're looking around for some SCSS plugin we're applying, no need! SCSS support comes out-the-box with Vite. You can also configure your CSS setup of choice by following <a href="https://vitejs.dev/guide/features.html#css">Vite's styling docs.</a></li>
  </ol>
</details>