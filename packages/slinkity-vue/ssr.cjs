const { h, createSSRApp, defineComponent } = require('vue');
const { renderToString } = require('vue/server-renderer');
const pkg = require('./package.json');

module.exports = async function ssr({ Component, props }) {
  const children = null;
  const slots = {};
  if (children) {
    slots.default = () => h(SlotWrapper, { value: children });
  }
  const app = createSSRApp({ render: () => h(Component.default, props, slots) });
  const html = await renderToString(app);
  return { html, css: undefined };
};

const SlotWrapper = defineComponent({
  props: {
    value: String,
  },
  setup({ value }) {
    if (!value) return () => null;
    return () => h('slinkity-fragment', { innerHTML: value });
  },
});
