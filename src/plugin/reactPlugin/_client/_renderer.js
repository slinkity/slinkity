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

  ReactDOM.render(React.createElement(Component, props, null), mountPoint)
}
