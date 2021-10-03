const { stringify } = require('javascript-stringify')
const toClientImportStatement = require('./toClientImportStatement')
const toUnixPath = require('../../../utils/toUnixPath')

/**
 * Generate the `<script>` necessary to load a Component into a given mount point
 * On the client, this script should:
 * - import the Component from the correct path
 * - import the correct loader based on the `hydrate` mode
 * - apply the `props` correctly stringified
 * - call the loader at the correct time
 * @param {{
 *   componentPath: string,
 *   hydrate: 'eager' | 'lazy',
 *   id: number,
 *   props: Object.<string, any>
 * }} params
 * @returns {string} String of HTML to run loader in the client
 */
module.exports = function toLoaderScript({ componentPath, hydrate, id, props = {} }) {
  // TODO: abstract "props" to some other file, instead of stringifying in-place
  // We could be generating identical, large prop blobs
  const componentImportStatement = JSON.stringify('/' + toUnixPath(componentPath))
  if (hydrate === 'eager') {
    return `<script type="module">
    import Component from ${componentImportStatement};
    import eagerLoader from ${toClientImportStatement('_eager-loader.js')};
  
    eagerLoader({ 
      id: "${id}",
      Component,
      props: ${stringify(props)},
    });
  </script>`
  } else if (hydrate === 'lazy') {
    return `<script type="module">
    import lazyLoader from ${toClientImportStatement('_lazy-loader.js')};
  
    lazyLoader({ 
      id: "${id}",
      componentImporter: async () => await import(${componentImportStatement}),
      props: ${stringify(props)},
    });
  </script>`
  } else {
    throw 'Unsupported loader'
  }
}
