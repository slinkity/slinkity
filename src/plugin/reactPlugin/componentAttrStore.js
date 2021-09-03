/**
 * The componentAttrStore is the bridge between page + shortcode components
 * And our HTML transform that *hydrates* those components.
 * - component mount points are ID'd by their index in the DOM (first, second, etc)
 * - by passing in an index, you'll receive all values necessary to hydrate that mount point
 *
 * @typedef {{
 *   path: string,
 *   props: Object.<string, any>,
 *   styles: string,
 *   hydrate: 'eager' | 'lazy' | 'static'
 * }} ComponentAttrs
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
