const { v4: uuidv4 } = require('uuid')

/**
 * Slinkity-specific data attributes
 * Applied to mount points and associated scripts
 *
 * @typedef SlinkityAttrs
 * @property {string} id - ID to identify mount points in the DOM for hydration

 * @type {SlinkityAttrs}
 */
const SLINKITY_ATTRS = {
  id: 'data-s-id',
}

const ELEVENTY_TEMP_BUILD_DIR = '.eleventy-temp-build'

/**
 * @type {import('../@types').ImportAliases}
 */
const IMPORT_ALIASES = {
  root: '/@root',
  input: '/@input',
  includes: '/@includes',
  layouts: '/@layouts',
}

const PACKAGES = {
  client: 'slinkity/client',
}

/**
 * Name for the web component used to mount React
 */
const SLINKITY_MOUNT_POINT = 'slinkity-mount-point'

/**
 * File name for user slinkity config files
 */
const SLINKITY_CONFIG_FILE_NAME = 'slinkity.config'

const BUILD_HASH = uuidv4()

/**
 * Returns an SSR comment with build hash and ID.
 *
 * @param  {string} id ID.
 * @return {string}    SSR comment.
 */
function toSSRComment(id) {
  return `<!--slinkity-ssr ${BUILD_HASH} ${id}-->`
}

const SLINKITY_HEAD_STYLES = toSSRComment('styles')

module.exports = {
  SLINKITY_ATTRS,
  ELEVENTY_TEMP_BUILD_DIR,
  SLINKITY_CONFIG_FILE_NAME,
  SLINKITY_MOUNT_POINT,
  IMPORT_ALIASES,
  SLINKITY_HEAD_STYLES,
  PACKAGES,
  BUILD_HASH,
  toSSRComment,
}
