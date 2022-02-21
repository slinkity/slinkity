const { stringify } = require('javascript-stringify')
const { PACKAGES } = require('../utils/consts')
const { normalizePath } = require('vite')

/**
 * Generate the `<script>` necessary to load a Component into a given mount point
 * @typedef LoaderScriptParams
 * @property {string} componentPath - path to the component itself, used for the import statement
 * @property {string} id - the unique id for a given mount point
 * @property {'eager' | 'lazy'} hydrate - which hydration loader to use
 * @property {Record<string, any>} props - data used when hydrating the component
 * @property {string} children - Stringified HTML children
 * @param {LoaderScriptParams}
 * @returns {string} String of HTML to run loader in the client
 */
module.exports = function toLoaderScript({
  componentPath,
  hydrate,
  id,
  props,
  clientRenderer,
  children,
}) {
  // TODO: abstract "props" to some other file, instead of stringifying in-place
  // We could be generating identical, large prop blobs
  const componentImportPath = JSON.stringify(normalizePath(componentPath))
  const rendererImportPath = JSON.stringify(normalizePath(clientRenderer))
  if (hydrate === 'eager') {
    return `<script type="module">
    import Component${id} from ${componentImportPath};
    import renderer${id} from ${rendererImportPath};
    import { eagerLoader as eagerLoader${id} } from "${PACKAGES.client}";
  
    eagerLoader${id}({ 
      id: "${id}",
      Component: Component${id},
      renderer: renderer${id},
      props: ${stringify(props)},
      children: \`
${children ?? ''}\`,
    });
  </script>`
  } else if (hydrate === 'lazy') {
    return `<script type="module">
    import { lazyLoader as lazyLoader${id} } from "${PACKAGES.client}";
  
    lazyLoader${id}({ 
      id: "${id}",
      toComponent: async () => await import(${componentImportPath}),
      toRenderer: async () => await import(${rendererImportPath}),
      props: ${stringify(props)},
      children: \`
${children ?? ''}\`,
    });
  </script>`
  } else {
    return ''
  }
}
