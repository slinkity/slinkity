import React from 'react'
import ReactDOM from 'react-dom'

export default function renderComponent({ mountPoint, loadedModule, props = {} }) {
  ReactDOM.render(React.createElement(loadedModule, props, null), mountPoint)
}
