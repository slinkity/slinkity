<script context="module">
  export const frontMatter = {
    title: "Seriously Svelte",
    layout: "layout",
    hydrate: "eager",
  };
</script>

<script>
  let count = 0;
  function add() {
    count += 1;
  }
</script>

<p>
  To create the page you see here, we placed a
  <code>svelte-page.svelte</code> file alongside the other pages on our site.
  That's because component pages are like any other template on your 11ty site,
  just with 1 extra superpower:
  <strong>you can hydrate the page with JavaScript.</strong>
</p>

<h2>Hydrating this page</h2>

<p>
  We opted-in to shipping JavaScript using the <code>hydrate</code> key in our
  <code>frontMatter</code>. Learn more on
  <a href="https://slinkity.dev/docs/partial-hydration/"
    >our partial hydration docs.</a
  >
</p>

<p>
  Tip: try setting <code>hydrate</code> to <code>"none"</code>, or removing the
  key entirely. The counter below should stop working! This is because we're no
  longer sending our component to the client, effectively turning Svelte into
  just another templating language.
</p>
<p class="counter-example">
  <span>Count: {count}</span>
  <button class="counter-example-button" on:click={add}>+ 1</button>
</p>

<h2>Front matter</h2>

<p>
  Our included <code>frontMatter</code> wires up the layout and passes
  information "upstream" for other templates to read from. It works the same way
  for component-based pages as it does for
  <a href="https://www.11ty.dev/docs/data-frontmatter/">11ty's front matter</a>.
  Here, the <code>title</code> key is accessible from any layout templates applied
  to our page.
</p>

<style>
  .counter-example {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .counter-example-button {
    border: 1px solid var(--pink);
    border-radius: 0.5rem;
    padding: 0.2rem 0.6rem;
    font-weight: 700;
  }
</style>
