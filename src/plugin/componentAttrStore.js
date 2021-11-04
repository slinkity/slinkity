/**
 * The componentAttrStore is the bridge between page + shortcode components
 * and our HTML transform that *hydrates* those components.
 * - component mount points are ID'd by their index in the DOM for a given page (first, second, etc)
 * - by passing in an id, you'll receive all values necessary to hydrate that mount point (see ComponentAttrs type def)
 *
 * @typedef {string} ID
 * @typedef ComponentAttrs
 * @property {Record<string, string>} styleToFilePathMap - map of all files imported by a
 * given component as ES modules (ex. all CSS module imports)
 * @property {string} path - the component's file path
 * @property {Record<string, any>} props - all props passed to the component
 * @property {'eager' | 'lazy' | 'static'} hydrate - mode to use when hydrating the component
 * @property {string} pageOutputPath - the page where this component lives, based on 11ty's inputPath property (ex. src/index.html)
 * @property {ID} id - a unique identifier for later retrieval from the store
 * @property {string} rendererName - name of renderer to use for SSR and clientside hydration
 *
 * @typedef {{
 *  getAllByPage: (pageOutputPath: string) => ComponentAttrs[];
 *  push: (componentAttrs: ComponentAttrs) => number;
 *  clear: () => void;
 * }} ComponentAttrStore
 * @returns {ComponentAttrStore}
 */
function toComponentAttrStore() {
  /**
   * @type {Record<string, ComponentAttrs[]>}
   */
  let componentAttrStore = {}

  /**
   * Add a new item to the store, and receive an index used for later get() calls
   * @param {Omit<ComponentAttrs, 'id'>} componentAttrs
   * @returns {string} the id of the new componentAttrs entry
   */
  function push(componentAttrs) {
    const { pageOutputPath } = componentAttrs
    if (!componentAttrStore[pageOutputPath]) {
      componentAttrStore[pageOutputPath] = []
    }
    const id = `${componentAttrStore[pageOutputPath].length}`
    componentAttrStore[pageOutputPath].push({ ...componentAttrs, id })
    return id
  }

  /**
   * Get attributes for all components on a given page
   * @param {string} pageOutputPath - the page where these components live, based on 11ty's outputPath property (ex. _site/index.html)
   * @returns {ComponentAttrs[]} list of attributes for all components on the page
   */
  function getAllByPage(pageOutputPath) {
    return componentAttrStore[pageOutputPath] ?? []
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
