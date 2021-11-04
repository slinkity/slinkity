const { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } = require('../../../utils/consts')
const toHtmlAttrString = require('../../../utils/toHtmlAttrString')

/**
 * Generates an empty mount point with expected data attrs applied
 * @typedef MountPointParams
 * @property {number} id - Identifier used for mapping hydration scripts
 * @property {'static' | 'eager' | 'lazy'} hydrate - Decides whether to apply mount point web component or a simplified `div`
 * @param {MountPointParams}
 * @returns {string} Stringified HTML
 */
module.exports.toMountPoint = function ({ id, hydrate }) {
  const attrs = toHtmlAttrString({
    [SLINKITY_ATTRS.id]: id,
    [SLINKITY_ATTRS.ssr]: true,
  })
  if (hydrate === 'static') {
    return `<div ${attrs}></div>`
  } else {
    return `<${SLINKITY_REACT_MOUNT_POINT} ${attrs}></${SLINKITY_REACT_MOUNT_POINT}>`
  }
}
