import { h, createSSRApp, defineComponent } from 'vue'

export default function client({ Component, target, props }) {
  const children = '<h1>Testing</h1>';
  delete props['class']
  // Expose name on host component for Vue devtools
  const name = Component.name ? `${Component.name} Host` : undefined
  const slots = {}
  if (children != null) {
    slots.default = () => h(SlotWrapper, { value: '' })
  }
  const app = createSSRApp({ name, render: () => h(Component, props, slots) })
  app.mount(target, true)
}


const SlotWrapper = defineComponent({
  props: {
    value: String,
  },
  setup({ value }) {
    if (!value) return () => null
    return () => h('slinkity-fragment', { innerHTML: value })
  },
})