import React from 'react'
import ReactDOM from 'react-dom'
import { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } from '../../../utils/consts'

export default function renderComponent({
  Component = () => {},
  props = {},
  componentPath = '',
  instance = 1,
}) {
  const mountPoint = document.querySelector(
    `${SLINKITY_REACT_MOUNT_POINT}[${SLINKITY_ATTRS.path}="${componentPath}"][${SLINKITY_ATTRS.instance}="${instance}"]`,
  )
  const innerReactEl = mountPoint.querySelector(
    `${SLINKITY_REACT_MOUNT_POINT}[${SLINKITY_ATTRS.type}="page"]`,
  )

  let children
  if (innerReactEl) {
    const childrenProps = {
      dangerouslySetInnerHTML: { __html: innerReactEl.innerHTML },
    }
    for (const attribute of innerReactEl.attributes) {
      childrenProps[attribute.name] = attribute.value
    }
    children = React.createElement(innerReactEl.tagName, childrenProps)
  }

  ReactDOM.render(React.createElement(Component, props, children), mountPoint)
}
