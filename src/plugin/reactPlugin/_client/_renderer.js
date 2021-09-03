import React from 'react'
import ReactDOM from 'react-dom'
import { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } from '../../../utils/consts'

export default function renderComponent({ id, Component = () => {}, props = {} }) {
  const mountPoint = document.querySelector(
    `${SLINKITY_REACT_MOUNT_POINT}[${SLINKITY_ATTRS.id}="${id}"]`,
  )

  ReactDOM.render(React.createElement(Component, props, null), mountPoint)
}
