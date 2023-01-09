{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'store', 'framework' %}
{% prop 'tabs', ["Preact", "React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

First, install Preact + the [Slinkity Preact renderer](https://www.npmjs.com/package/@slinkity/preact):

```bash
npm i -D preact @slinkity/preact
```

Then, add this renderer to a `slinkity.config.js` at the base of your project:

```js
// .eleventy.js or eleventy.config.js
const slinkity = require('slinkity')
const preact = require('@slinkity/preact')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [preact()],
    })
  )
}
```
</section>
<section>

First, install React's suite of dependencies + the [Slinkity React renderer](https://www.npmjs.com/package/@slinkity/react):

```bash
npm i -D react react-dom @slinkity/react
```

Then, add this renderer to a `slinkity.config.js` at the base of your project:

```js
// .eleventy.js or eleventy.config.js
const slinkity = require('slinkity')
const react = require('@slinkity/react')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [react()],
    })
  )
}
```
</section>
<section hidden>

> Slinkity is designed with Vue 3 in mind. Use Vue 2.x at your own risk!

First, install Vue 3 + the [Slinkity Vue renderer](https://www.npmjs.com/package/@slinkity/vue):

```bash
npm i -D vue@3 @slinkity/vue
```

Then, add this renderer to a `slinkity.config.js` at the base of your project:

```js
// .eleventy.js or eleventy.config.js
const slinkity = require('slinkity')
const vue = require('@slinkity/vue')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [vue()],
    })
  )
}
```
</section>
<section hidden>

First, install Svelte + the [Slinkity Svelte renderer](https://www.npmjs.com/package/@slinkity/svelte):

```bash
npm i -D svelte @slinkity/svelte
```

Then, add this renderer to a `slinkity.config.js` at the base of your project:

```js
// .eleventy.js or eleventy.config.js
const slinkity = require('slinkity')
const svelte = require('@slinkity/svelte')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [svelte()],
    })
  )
}
```
</section>
{% endrenderTemplate %}
{% endisland %}