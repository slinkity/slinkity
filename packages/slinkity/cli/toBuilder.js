module.exports.toBuilder = function (buildCallback) {
  const awaitingBuild = {}
  const buildCache = {}

  function startBuild(id, options) {
    buildCallback(id, options).then((buildResult) => {
      for (const cb of awaitingBuild[id]) {
        buildCache[id] = buildResult
        cb(buildResult)
      }
      delete awaitingBuild[id]
    })
  }

  return {
    build(id, options) {
      return new Promise(function (resolve) {
        if (buildCache[id]) {
          resolve(buildCache[id])
          return
        }

        if (!awaitingBuild[id]) {
          awaitingBuild[id] = []
          startBuild(id, options)
        }
        awaitingBuild[id].push((result) => {
          resolve(result)
        })
      })
    },
  }
}
