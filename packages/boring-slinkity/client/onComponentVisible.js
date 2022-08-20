const intersectionObserverOptions = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
}

/** @type {(params: import('../@types').ComponentLoaderClientParams) => void} */
export default function loader({ target }) {
  return new Promise(function (resolve) {
    const observer = new IntersectionObserver(async function (entries) {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect()
          resolve()
        }
      }
    }, intersectionObserverOptions)
    observer.observe(target)
  })
}
