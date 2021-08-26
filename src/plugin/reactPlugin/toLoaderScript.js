const toClientImportStatement = require('./toClientImportStatement')
const { sep } = require('path')

module.exports = function toLoaderScript({
  componentPath = '',
  type = 'lazy',
  instance = '',
  stringifiedProps = '',
}) {
  // TODO: abstract "props" to some other file, instead of stringifying in-place
  // We could be generating identical, large prop blobs
  const componentImportStatement = JSON.stringify('/' + componentPath.split(sep).join('/'))
  if (type === 'eager') {
    return `<script type="module">
    import Component from ${componentImportStatement};
    import eagerLoader from ${toClientImportStatement('_eager-loader.js')};
  
    eagerLoader({ 
      Component,
      componentPath: ${JSON.stringify(componentPath)},
      instance: "${instance}",
      props: ${stringifiedProps},
    });
  </script>`
  } else if (type === 'lazy') {
    return `<script type="module">
    import lazyLoader from ${toClientImportStatement('_lazy-loader.js')};
  
    lazyLoader({ 
      componentImporter: async () => await import(${componentImportStatement}),
      componentPath: ${JSON.stringify(componentPath)},
      instance: "${instance}",
      props: ${stringifiedProps},
    });
  </script>`
  } else {
    throw 'Unsupported loader'
  }
}
