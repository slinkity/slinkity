import React from 'react'
import ReactDOM from 'react-dom'
import StaticHtml from './StaticHtml'

export default function renderComponent({ Component, target, props, children, isSSR }) {
  const element = React.createElement(
    Component,
    props,
    React.createElement(StaticHtml, { value: children }),
  )
  if (isSSR) {
    ReactDOM.hydrate(element, target)
  } else {
    ReactDOM.render(element, target)
  }
}
