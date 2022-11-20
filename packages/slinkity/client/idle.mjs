export default function idle() {
  return new Promise(function (resolve) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(resolve);
    } else {
      // for browsers that don't support requestIdleCallback
      // wait 200ms to give main thread some time to free up
      setTimeout(resolve, 200);
    }
  })
}
