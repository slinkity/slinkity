/** @type {(params: import('../@types').ComponentLoaderClientParams) => void} */
export default function loader({ target, renderer, component: { mod, props, children } }) {
  renderer({ Component: mod, target, props, children })
}
