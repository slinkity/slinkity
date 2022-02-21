import React from 'react'
import ReactDOM from 'react-dom'
import StaticHtml from './StaticHtml'

export default function renderComponent({ Component, target, props, children }) {
  ReactDOM.render(
    React.createElement(Component, props, React.createElement(StaticHtml, { value: children })),
    target,
  )
}
