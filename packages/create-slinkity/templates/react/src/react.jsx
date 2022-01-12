import React from 'react'

export const frontMatter = {
  title: 'Using React for page templates',
  layout: 'layout',
}

function ReactDemo() {
  const [count, setCount] = React.useState(0)

  return (
    <>
      <p>
        To create the <code>/react</code> page you see here, we place an <code>about.jsx</code> file alongside the other pages on our site. That's because component pages are like any other template on your 11ty site, just with 1 extra superpower: <strong>you can hydrate the page with JavaScript.</strong>
      </p>

      <h3>Hydrating this page</h3>

      <p>
        We hydrate component pages by default. To adjust this, you can add a <code>render</code> property to your front matter to decide <em>if and when</em> to ship JavaScript. Learn more on <a href="https://slinkity.dev/docs/partial-hydration/">our partial hydration docs.</a>
      </p>

      <p>
        Tip: try adding <code>render: static</code> to this page's front matter. The counter below should stop working, since we've opted out of shipping JS to the client.
      </p>

      <p className="counter">
        <span>Count: {count}</span>
        <button onClick={() => setCount(count + 1)}>+ 1</button>
      </p>

      <h3>Front matter</h3>

      <p>
        Including <code>frontMatter</code> in <code>about.jsx</code> wires up the layout and passes information "upstream" for other templates to read from.
        It works the same way for component-based pages as it does for <a href="https://www.11ty.dev/docs/data-frontmatter/">11ty's front matter</a>.
        Here, the <code>title</code> key is accessible from any layout templates applied to our page.
      </p>
    </>
  )
}

export default ReactDemo