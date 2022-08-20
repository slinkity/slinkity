/** @type {(params: import('../@types').ComponentLoaderClientParams) => void} */
export default function loader({ loaderArgs }) {
  const mql = window.matchMedia(loaderArgs)
  return new Promise(function (resolve) {
    if (mql.matches) {
      resolve()
    } else {
      mql.addEventListener('change', resolve, { once: true })
    }
  })
}
