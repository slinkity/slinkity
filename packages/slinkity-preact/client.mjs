import { h, render, hydrate } from 'preact'

export default function client({ Component, target, props, isClientOnly }) {
  const element = h(Component, props)
  if (isClientOnly) {
    render(element, target)
  } else {
    hydrate(element, target)
  }
}
