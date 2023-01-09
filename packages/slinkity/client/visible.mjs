const intersectionObserverOptions = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
};

/** @param {{ target: HTMLElement }} */
export default function visible({ target }) {
  return new Promise(function (resolve) {
    const observer = new IntersectionObserver(function (entries) {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          resolve();
        }
      }
    }, intersectionObserverOptions);
    observer.observe(target);
  });
}
