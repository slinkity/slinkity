/** @param {{ options: string }} */
export default function media({ options }) {
  const mql = window.matchMedia(options);
  return new Promise(function (resolve) {
    if (mql.matches) {
      resolve();
    } else {
      mql.addEventListener('change', resolve, { once: true });
    }
  });
}
