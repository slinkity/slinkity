const { stringify } = require('javascript-stringify')
const { normalizePath } = require('vite')
const { SLINKITY_MOUNT_POINT } = require('../utils/consts')

/** @type {(client: import('../@types').ComponentLoader['client'], id: string) => string} */
function toComponentLoaderImport(client, id) {
  if (typeof client === 'undefined') {
    return ''
  } else if (typeof client === 'string') {
    return `import loader${id} from ${JSON.stringify(client)};`
  } else {
    return `import { ${client.name} as loader${id} } from ${JSON.stringify(client.mod)};`
  }
}

function toLoaderNameAndArgs(loader) {
  if (loader === true) {
    // special case: a flag with a value of true (ex. hydrate=true)
    // should match to "onClientLoad"
    return ['onClientLoad', '']
  } else if (typeof loader !== 'string') {
    return ['none', '']
  }

  const loaderWithArgs = loader.match(/^(\w+)\((.+)\)$/)
  if (loaderWithArgs && loaderWithArgs.length) {
    return [loaderWithArgs[1], loaderWithArgs[2]]
  } else {
    return [loader, '']
  }
}

/**
 * Generate the `<script>` necessary to load a Component into a given mount point
 * @typedef LoaderScriptParams
 * @property {string} componentPath - path to the component itself, used for the import statement
 * @property {string} id - the unique id for a given mount point
 * @property {Record<string, import('../@types').ComponentLoader>} componentLoaderMap
 * @property {string} loader - the raw loader value as a string (ex. "onClientMedia(...)")
 * @property {Record<string, any>} props - data used when hydrating the component
 * @property {string} children - Stringified HTML children
 * @param {LoaderScriptParams}
 * @returns {string} String of HTML to run loader in the client
 */
module.exports = function toLoaderScript({
  componentPath,
  componentLoaderMap,
  loader,
  id,
  props,
  clientRenderer,
  children,
}) {
  const [loaderName, loaderArgs] = toLoaderNameAndArgs(loader)
  const componentLoader = componentLoaderMap[loaderName]
  console.log(componentLoaderMap)

  if (!componentLoader) return ''

  const targetSelector = `document.querySelector(\`${SLINKITY_MOUNT_POINT}[data-s-id="${id}"]\`)`
  const componentImportPath = JSON.stringify(normalizePath(componentPath))
  const rendererImportPath = JSON.stringify(normalizePath(clientRenderer))
  // TODO: investigate faster and lighter-weight alternatives to the "stringify" lib
  const stringifiedProps = stringify(props)
  let script = ''

  if (componentLoader.client) {
    script = `
${toComponentLoaderImport(componentLoader.client, id)}

const props = ${stringifiedProps};
const children = \`
${children ?? ''}\`;
const target = ${targetSelector};

loader${id}({
  loaderName: ${JSON.stringify(loaderName)},
  loaderArgs: ${JSON.stringify(loaderArgs)},
  target,
  props,
  children,
}).then(async function() {
  const [renderer, Component] = await Promise.all([
    import(${rendererImportPath}),
    import(${componentImportPath}),
  ]);
  renderer.default({ Component: Component.default, target, props, children });
});`
  } else {
    script = `
import Component${id} from ${componentImportPath};
import renderer${id} from ${rendererImportPath};

renderer${id}({
  Component: Component${id},
  target: ${targetSelector},
  props: ${stringifiedProps},
  children: \`
  ${children ?? ''}\`,
});
`
  }

  return ['<script type="module">', script, '</script>'].join('\n')
}
