import React from 'react'
import ReactDOM from 'react-dom'

export const renderComponent = ({
  Component = () => {},
  componentPath = '',
  props = {},
}) => {
  const mountPoint = document.querySelector(
    `slinkity-react-renderer[data-s-path="${componentPath}"]`
  )
  const innerReactEl = mountPoint.querySelector(
    'slinkity-react-renderer[data-s-page="true"]'
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

export default class SlinkityReactRenderer extends HTMLElement {
  connectedCallback() {
    const options = {
      rootMargin: `0px 0px 0px 0px`,
      threshold: 0,
    }
    const isLazy = Boolean(this.getAttribute('data-s-lazy'))
    if (isLazy) {
      const path = this.getAttribute('data-s-path')
      const template = document.querySelector(`template[data-s-path="${path}"]`)
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
