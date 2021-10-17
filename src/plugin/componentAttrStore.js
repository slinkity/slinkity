// md5 + md4 sited as faster (but less secure) compared to sha1
// https://www.geeksforgeeks.org/difference-between-md5-and-sha1/
const { hash } = require('node-object-hash')({ alg: 'md4' })

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
 * @typedef {ComponentAttrs & {id: string}} ComponentAttrsWithId
 *
 * @typedef {{
 *  getAllByPage: (pageInputPath: string) => ComponentAttrsWithId[];
 *  push: (componentAttrs: ComponentAttrs) => string;
 *  get: (id: string) => ComponentAttrs;
 *  clear: () => void;
 * }} ComponentAttrStore
 * @returns {ComponentAttrStore}
 */
function toComponentAttrStore() {
  /**
   * Generate a unique identifier based on component attrs
   * @param {ComponentAttrs} componentAttrs
   * @returns {string}
   */
  function toHash(componentAttrs) {
    return hash(componentAttrs)
  }

  /**
   * @type {Record<string, ComponentAttrs>}
   */
  let componentAttrStore = {}
  /**
   * @type {Record<string, string>[]}
   */
  let pageToIdMap = {}

  /**
   * Add a new item to the store, and receive an index used for later get() calls
   * @param {ComponentAttrs} componentAttrs
   * @returns {string} the index used to get() whatever was pushed
   */
  function push(componentAttrs) {
    const id = toHash(componentAttrs)
    componentAttrStore[id] = componentAttrs
    const idsForPage = pageToIdMap[componentAttrs.pageInputPath] ?? []
    pageToIdMap[componentAttrs.pageInputPath] = [...idsForPage, id]
    return id
  }

  /**
   * Get an item from the store by index
   * @param {string} id
   * @return {ComponentAttrs | undefined}
   */
  function get(id) {
    return componentAttrStore[id]
  }

  /**
   * Get attributes for all components on a given page
   * @param {string} pageInputPath - the page where these components live, based on 11ty's inputPath property (ex. src/index.html)
   * @returns {ComponentAttrsWithId[]} list of attributes (including the component's ID) for all components
   */
  function getAllByPage(pageInputPath) {
    return (pageToIdMap[pageInputPath] ?? []).map((index) => ({
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
    pageToIdMap = {}
  }

  return {
    push,
    get,
    getAllByPage,
    clear,
  }
}

module.exports = { toComponentAttrStore }
