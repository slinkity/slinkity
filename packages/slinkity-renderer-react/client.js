import React from 'react'
import ReactDOM from 'react-dom'

export default function renderComponent({ Component, target, props = {} }) {
  ReactDOM.render(React.createElement(Component, props, null), target)
}
