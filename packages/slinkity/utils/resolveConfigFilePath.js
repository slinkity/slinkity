const { resolve } = require('path')
const { readFile } = require('fs').promises

/**
 * Find the absolute path to the user's config file from a possible set of file names
 * @param {string[]} files All file names to check
 * @returns {Promise<string | undefined>} If a user config is found, return the absolute file path to that config. Otherwise return nothing
 */
async function resolveConfigFilePath(files) {
  for (const file of files) {
    try {
      const path = resolve(file)
      await readFile(path)
      return path
    } catch {
      /* if this fails, try the next ext */
    }
  }

  return undefined
}

module.exports = {
  resolveConfigFilePath,
}
