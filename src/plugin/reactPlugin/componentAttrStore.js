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

 * @typedef {{
 *  push: (componentAttrs: ComponentAttrs) => number;
 *  get: (index: number) => ComponentAttrs;
 *  clear: () => void;
 * }} ComponentAttrStore
 * @returns {ComponentAttrStore}
 */
function toComponentAttrStore() {
  let componentAttrStore = []

  /**
   * Add a new item to the store, and receive an index used for later get() calls
   * @param {ComponentAttrs} componentAttrs
   * @returns {number} the index used to get() whatever was pushed
   */
  function push(componentAttrs) {
    const currentIndex = componentAttrStore.length
    componentAttrStore.push(componentAttrs)
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
   * Clear contents of the store
   * Should be used to reset between builds
   */
  function clear() {
    componentAttrStore = []
  }

  return {
    push,
    get,
    clear,
  }
}

module.exports = {
  toComponentAttrStore,
}
