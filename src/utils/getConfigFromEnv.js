module.exports = function getConfigFromEnv() {
  return JSON.parse(process.env.SLINKITY_CONFIG)
}
