const { isSupportedOutputPath } = require('./applyViteHtmlTransform')

/**
 * The componentAttrStore is the bridge between page + shortcode components
 * and our HTML transform that *renders* those components.
 * - component mount points are ID'd by their index in the DOM for a given page (first, second, etc)
 * - by passing in an id, you'll receive all values necessary to render that mount point (see ComponentAttrs type def)
 *
 * @typedef ComponentLookupId
 * @property {'url' | 'outputPath'} type
 * @property {string} id
 *
 * @typedef {string} ID
 * @typedef ComponentAttrs
 * @property {string} path - the component's file path
 * @property {string} rendererName - name of renderer to use for component
 * @property {Record<string, any>} props - all props passed to the component
 * @property {string} children - stringified HTML children
 * @property {string} loader - name of component loader for rendering or hydration
 * @property {boolean} isSSR - whether or not to SSR
 * @property {string} pageOutputPath - the page where this component lives, based on 11ty's page.outputPath property (ex. _site/about.html)
 * @property {string} pageUrl - the output URL where this component is served, based on 11ty's page.url property (ex. /about/)
 * @property {ID} id - a unique identifier for later retrieval from the store
 *
 * @typedef {{
 *  getAllByPage: (componentLookupId: ComponentLookupId) => ComponentAttrs[];
 *  push: (componentAttrs: ComponentAttrs) => number;
 *  clear: () => void;
 * }} ComponentAttrStore
 * @returns {ComponentAttrStore}
 */
function toComponentAttrStore() {
  /** @type {Record<string, ComponentAttrs[]>} */
  let componentAttrStoreByOutputPath = {}

  /** @type {Record<string, ComponentAttrs[]>} */
  let componentAttrStoreByUrl = {}

  /**
   * Add a new item to the store, and receive an index used for later get() calls
   * @param {Omit<ComponentAttrs, 'id'>} componentAttrs
   * @returns {string} the id of the new componentAttrs entry
   */
  function push(componentAttrs) {
    const { pageOutputPath, pageUrl } = componentAttrs
    let id = 0
    if (!isSupportedOutputPath(pageOutputPath) && !pageUrl) {
      throw Error(
        '[Slinkity] You are using a component on an unsupported page. Ensure you are only using components on pages with a .html output extension.',
      )
    }
    if (isSupportedOutputPath(pageOutputPath)) {
      if (!componentAttrStoreByOutputPath[pageOutputPath]) {
        componentAttrStoreByOutputPath[pageOutputPath] = []
      }
      id = componentAttrStoreByOutputPath[pageOutputPath].length
      componentAttrStoreByOutputPath[pageOutputPath].push({ ...componentAttrs, id })
    }
    if (pageUrl) {
      if (!componentAttrStoreByUrl[pageUrl]) {
        componentAttrStoreByUrl[pageUrl] = []
      }
      id = componentAttrStoreByUrl[pageUrl].length
      componentAttrStoreByUrl[pageUrl].push({ ...componentAttrs, id })
    }
    return id
  }

  /**
   * Get attributes for all components on a given page
   * @param {ComponentLookupId} componentLookupId - either the url or outputPath where this page is served
   * @returns {ComponentAttrs[]} list of attributes for all components on the page
   */
  function getAllByPage(componentLookupId) {
    if (componentLookupId.type === 'outputPath') {
      return componentAttrStoreByOutputPath[componentLookupId.id] ?? []
    } else if (componentLookupId.type === 'url') {
      return componentAttrStoreByUrl[componentLookupId.id] ?? []
    }
    return []
  }

  /**
   * Clear contents of the store
   * Should be used to reset between builds
   */
  function clear() {
    componentAttrStoreByOutputPath = {}
    componentAttrStoreByUrl = {}
  }

  return {
    push,
    getAllByPage,
    clear,
  }
}

module.exports = { toComponentAttrStore }
