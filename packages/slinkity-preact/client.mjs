import { h, render, hydrate } from 'preact'

export default function client({ Component, target, props, isSSR }) {
  const element = h(Component, props)
  if (isSSR) {
    hydrate(element, target)
  } else {
    render(element, target)
  }
}
