// TODO: use this once shortcode children are supported
// Yes, this is copy / pasted from the Astro repo for now
// Source: https://github.com/withastro/astro/blob/main/packages/renderers/renderer-vue/static-html.js
import { h, defineComponent } from 'vue'

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * This is the Vue + JSX equivalent of using `<div v-html="value" />`
 */
const StaticHtml = defineComponent({
  props: {
    value: String,
  },
  setup({ value }) {
    if (!value) return () => null
    return () => h('slinkity-fragment', { innerHTML: value })
  },
})

export function toComponentByShortcode({ unnamedArgs, shortcode }) {
  return defineComponent({
    props: {
      hydrate: String,
      // TODO: support any props
    },
    setup(namedArgs) {
      if (!namedArgs) return () => null
      const innerHTML = shortcode(...unnamedArgs, namedArgs)
      console.log({ innerHTML, unnamedArgs, namedArgs })
      return () => h('slinkity-fragment', { innerHTML })
    },
  })
}

/**
 * Other frameworks have `shouldComponentUpdate` in order to signal
 * that this subtree is entirely static and will not be updated
 *
 * Fortunately, Vue is smart enough to figure that out without any
 * help from us, so this just works out of the box!
 */

export default StaticHtml
