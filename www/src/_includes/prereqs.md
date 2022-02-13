{% slottedComponent "Tabs.svelte", hydrate="eager", id="prereqs", tabs=["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

First, install React's suite of dependencies + the [Slinkity React renderer](https://www.npmjs.com/package/@slinkity/renderer-react):

```bash
npm i -D react react-dom @slinkity/renderer-react
```

Then, add this renderer to a `slinkity.config.js` at the base of your project:

```js
// slinkity.config.js
import { defineConfig } from 'slinkity'
import rendererReact from '@slinkity/renderer-react'

export default defineConfig({
  renderers: [rendererReact()],
})
```
</section>
<section hidden>

First, install Vue 3 + the [Slinkity Vue renderer](https://www.npmjs.com/package/@slinkity/renderer-vue):

```bash
npm i -D vue@3 @slinkity/renderer-vue
```

Then, add this renderer to a `slinkity.config.js` at the base of your project:

```js
// slinkity.config.js
import { defineConfig } from 'slinkity'
import rendererVue from '@slinkity/renderer-vue'

export default defineConfig({
  renderers: [rendererVue()],
})
```
</section>
<section hidden>

First, install Svelte + the [Slinkity Svelte renderer](https://www.npmjs.com/package/@slinkity/renderer-svelte):

```bash
npm i -D svelte @slinkity/renderer-svelte
```

Then, add this renderer to a `slinkity.config.js` at the base of your project:

```js
// slinkity.config.js
import { defineConfig } from 'slinkity'
import rendererSvelte from '@slinkity/renderer-svelte'

export default defineConfig({
  renderers: [rendererSvelte()],
})
```
</section>
{% endrenderTemplate %}
{% endslottedComponent %}