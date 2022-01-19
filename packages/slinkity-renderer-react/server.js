import { createElement } from 'react'
import { renderToStaticMarkup as reactRenderToStaticMarkup, renderToString } from 'react-dom/server'
import StaticHtml from './StaticHtml'

export default async function server({
  toCommonJSModule,
  componentPath,
  props,
  children,
  hydrate,
}) {
  const Component = await toCommonJSModule(componentPath)
  const vnode = createElement(
    Component.default,
    props,
    createElement(StaticHtml, { value: children }),
  )

  if (hydrate === 'static') {
    const html = reactRenderToStaticMarkup(vnode)
    return { html, css: '' }
  } else {
    const html = renderToString(vnode)
    return { html, css: '' }
  }
}
