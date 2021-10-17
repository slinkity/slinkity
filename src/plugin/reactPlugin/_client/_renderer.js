import React from 'react'
import ReactDOM from 'react-dom'

export default function renderComponent({ mountPoint, Component = () => {}, props = {} }) {
  ReactDOM.render(React.createElement(Component, props, null), mountPoint)
}
