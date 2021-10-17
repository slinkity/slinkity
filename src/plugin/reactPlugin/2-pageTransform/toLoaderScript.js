const { stringify } = require('javascript-stringify')
const toClientImportStatement = require('./toClientImportStatement')
const toUnixPath = require('../../../utils/toUnixPath')

/**
 * Generate the `<script>` necessary to load a Component into a given mount point
 * Note: id + index = unique pairing of a mount point to its hydration loader
 * @typedef LoaderScriptParams
 * @property {string} componentPath - path to the component itself, used for the import statement
 * @property {string} id - the id for a given mount point (note: must be paired with the "index" to yield a unique match!)
 * @property {number} index - the associated mount point's index in the DOM, used for de-duping (i.e. the first, second, third, etc for a given id)
 * @property {'eager' | 'lazy'} hydrate - which hydration loader to use
 * @property {Record<string, any>} props - data used when hydrating the component
 * @param {LoaderScriptParams}
 * @returns {string} String of HTML to run loader in the client
 */
module.exports = function toLoaderScript({ componentPath, hydrate, id, index, props = {} }) {
  // TODO: abstract "props" to some other file, instead of stringifying in-place
  // We could be generating identical, large prop blobs
  const componentImportStatement = JSON.stringify('/' + toUnixPath(componentPath))
  if (hydrate === 'eager') {
    return `<script type="module">
    import Component from ${componentImportStatement};
    import eagerLoader from ${toClientImportStatement('_eager-loader.js')};
  
    eagerLoader({ 
      id: "${id}",
      index: "${index}",
      Component,
      props: ${stringify(props)},
    });
  </script>`
  } else if (hydrate === 'lazy') {
    return `<script type="module">
    import lazyLoader from ${toClientImportStatement('_lazy-loader.js')};
  
    lazyLoader({ 
      id: "${id}",
      index: "${index}",
      componentImporter: async () => await import(${componentImportStatement}),
      props: ${stringify(props)},
    });
  </script>`
  } else {
    throw 'Unsupported loader'
  }
}
