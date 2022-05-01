/**
 * The componentAttrStore is the bridge between page + shortcode components
 * and our HTML transform that *renders* those components.
 * - component mount points are ID'd by their index in the DOM for a given page (first, second, etc)
 * - by passing in an id, you'll receive all values necessary to render that mount point (see ComponentAttrs type def)
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
 * @typedef ComponentAttrStoreParams
 * @property {'url' | 'outputPath'} lookupType
 *
 * @typedef {{
 *  getAllByPage: (id: string) => ComponentAttrs[];
 *  push: (componentAttrs: ComponentAttrs) => number;
 *  clear: () => void;
 * }} ComponentAttrStore
 * @param {ComponentAttrStoreParams} params
 * @returns {ComponentAttrStore}
 */
function toComponentAttrStore({ lookupType }) {
  /** @type {Record<string, ComponentAttrs[]>} */
  let componentAttrStore = {}

  /**
   * Add a new item to the store, and receive an index used for later get() calls
   * @param {Omit<ComponentAttrs, 'id'>} componentAttrs
   * @returns {string} the id of the new componentAttrs entry
   */
  function push(componentAttrs) {
    const { pageOutputPath, pageUrl } = componentAttrs
    const pageId = lookupType === 'outputPath' ? pageOutputPath : pageUrl

    if (!componentAttrStore[pageId]) {
      componentAttrStore[pageId] = []
    }
    const id = componentAttrStore[pageId].length
    componentAttrStore[pageId].push({ ...componentAttrs, id })

    return id
  }

  /**
   * Get attributes for all components on a given page
   * @param {string} id - either the url or outputPath where this page is served, depending on the lookupType
   * @returns {ComponentAttrs[]} list of attributes for all components on the page
   */
  function getAllByPage(id) {
    return componentAttrStore[id] ?? []
  }

  /**
   * Clear contents of the store
   * Should be used to reset between builds
   */
  function clear() {
    componentAttrStore = {}
  }

  return {
    push,
    getAllByPage,
    clear,
  }
}

module.exports = { toComponentAttrStore }
