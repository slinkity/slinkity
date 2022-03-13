/**
 * Builder to optimize calls to a given build function
 * - Prevent duplicate calls based on a build "id"
 * - Cache values for retrieval based on the "shouldUseCache" property
 *
 * @typedef {string | number} ID
 * @typedef BuilderOptions
 * @property {boolean} shouldUseCache
 * @typedef {(id: ID, buildCallbackOptions: any, builderOptions: BuilderOptions) => Promise<void>} Build
 * @param {(id: string | number, options: any)} buildCallback Function to call on build() request
 * @return {{ build: Build }}
 */
module.exports.toBuilder = function (buildCallback) {
  const awaitingBuild = {}
  const buildCache = {}

  /**
   *
   * @param {ID} id
   * @param {any} buildCallbackOptions
   */
  function startBuild(id, buildCallbackOptions) {
    buildCallback(id, buildCallbackOptions).then((buildResult) => {
      for (const cb of awaitingBuild[id]) {
        buildCache[id] = buildResult
        cb(buildResult)
      }
      delete awaitingBuild[id]
    })
  }

  return {
    /** @type {Build} */
    build(id, buildCallbackOptions, { shouldUseCache } = { shouldUseCache: true }) {
      return new Promise(function (resolve) {
        if (shouldUseCache && buildCache[id]) {
          resolve(buildCache[id])
          return
        }
        if (!awaitingBuild[id]) {
          awaitingBuild[id] = []
          startBuild(id, buildCallbackOptions)
        }
        awaitingBuild[id].push((result) => {
          resolve(result)
        })
      })
    },
  }
}
