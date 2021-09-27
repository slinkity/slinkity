/**
 * The componentAttrStore is the bridge between page + shortcode components
 * and our HTML transform that *hydrates* those components.
 * - component mount points are ID'd by their index in the DOM (first, second, etc)
 * - by passing in an index, you'll receive all values necessary to hydrate that mount point (see ComponentAttrs type def)
 *
 * @typedef ComponentAttrs
 * @property {Record<string, string>} styleToFilePathMap - map of all files imported by a
 * given component as ES modules (ex. all CSS module imports)
 * @property {string} path - the component's file path
 * @property {Record<string, any>} props - all props passed to the component
 * @property {'eager' | 'lazy' | 'static'} hydrate - mode to use when hydrating the component
 * @property {string} pageInputPath - the page where this component lives, based on 11ty's inputPath property (ex. src/index.html)
 *
 * @typedef {ComponentAttrs & {id: number}} ComponentAttrsWithId
 *
 * @typedef {{
 *  getAllByPage: (pageInputPath: string) => ComponentAttrsWithId[];
 *  push: (componentAttrs: ComponentAttrs) => number;
 *  get: (index: number) => ComponentAttrs;
 *  clear: () => void;
 * }} ComponentAttrStore
 * @returns {ComponentAttrStore}
 */
function toComponentAttrStore() {
  /**
   * @type {ComponentAttrs[]}
   */
  let componentAttrStore = []
  /**
   * @type {Record<string, number>[]}
   */
  let pageToComponentIndicesMap = {}

  /**
   * Add a new item to the store, and receive an index used for later get() calls
   * @param {ComponentAttrs} componentAttrs
   * @returns {number} the index used to get() whatever was pushed
   */
  function push(componentAttrs) {
    const currentIndex = componentAttrStore.length
    componentAttrStore.push(componentAttrs)
    const componentIndicesForPage = pageToComponentIndicesMap[componentAttrs.pageInputPath] ?? []
    pageToComponentIndicesMap[componentAttrs.pageInputPath] = [
      ...componentIndicesForPage,
      currentIndex,
    ]
    return currentIndex
  }

  /**
   * Get an item from the store by index
   * @param {number} index
   */
  function get(index) {
    return componentAttrStore[index]
  }

  /**
   * Get attributes for all components on a given page
   * @param {string} pageInputPath - the page where these components live, based on 11ty's inputPath property (ex. src/index.html)
   * @returns {ComponentAttrsWithId[]} list of attributes (including the component's ID) for all components
   */
  function getAllByPage(pageInputPath) {
    return (pageToComponentIndicesMap[pageInputPath] ?? []).map((index) => ({
      ...get(index),
      id: index,
    }))
  }

  /**
   * Clear contents of the store
   * Should be used to reset between builds
   */
  function clear() {
    componentAttrStore = []
  }

  return {
    push,
    get,
    getAllByPage,
    clear,
  }
}

module.exports = { toComponentAttrStore }
