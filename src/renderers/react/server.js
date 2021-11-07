import { createElement } from 'react'
import { renderToStaticMarkup as reactRenderToStaticMarkup, renderToString } from 'react-dom/server'
import StaticHtml from './StaticHtml'

/**
 * @type {import('../../main').ServerRenderer['renderToStaticMarkup']}
 */
export function renderToStaticMarkup({ Component, props, children, hydrate }) {
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
