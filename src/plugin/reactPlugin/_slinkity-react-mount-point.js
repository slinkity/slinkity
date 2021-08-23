import React from 'react'
import ReactDOM from 'react-dom'
import { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } from '../../utils/consts'

export const renderComponent = ({
  Component = () => {},
  props = {},
  componentPath = '',
  instance = 1,
}) => {
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

export default class SlinkityReactMountPoint extends HTMLElement {
  connectedCallback() {
    const options = {
      rootMargin: '0px 0px 0px 0px',
      threshold: 0,
    }
    const isLazy = Boolean(this.getAttribute(SLINKITY_ATTRS.lazy))
    if (isLazy) {
      const componentPath = this.getAttribute(SLINKITY_ATTRS.path)
      const instance = this.getAttribute(SLINKITY_ATTRS.instance)
      const template = document.querySelector(
        `template[${SLINKITY_ATTRS.path}="${componentPath}"][${SLINKITY_ATTRS.instance}="${instance}"]`,
      )
      const observer = new IntersectionObserver(function (entries) {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            document.body.appendChild(template.content.cloneNode(true))
          }
        }
      }, options)
      observer.observe(this)
    }
  }
  disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this)
  }
}
