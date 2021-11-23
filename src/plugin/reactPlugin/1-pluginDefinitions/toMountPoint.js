const {
  SLINKITY_ATTRS,
  SLINKITY_REACT_MOUNT_POINT,
  toSSRComment,
} = require('../../../utils/consts')
const toHtmlAttrString = require('../../../utils/toHtmlAttrString')

/**
 * Generates an empty mount point with expected data attrs applied
 * @typedef MountPointParams
 * @property {number} id - Identifier used for mapping hydration scripts
 * @property {'static' | 'eager' | 'lazy'} hydrate - Decides whether to apply mount point web component or a simplified `div`
 * @param {MountPointParams}
 * @returns {string} Stringified HTML
 */
function toMountPoint({ id, hydrate }) {
  const attrs = toHtmlAttrString({
    [SLINKITY_ATTRS.id]: id,
  })
  if (hydrate === 'static') {
    return `<div ${attrs}>
  ${toSSRComment(id)}
</div>`
  } else {
    return `<${SLINKITY_REACT_MOUNT_POINT} ${attrs}>
  ${toSSRComment(id)}
</${SLINKITY_REACT_MOUNT_POINT}>`
  }
}

module.exports = { toMountPoint }
