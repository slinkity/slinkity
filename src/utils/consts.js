/**
 * Slinkity-specific data attributes
 * Applied to mount points and associated scripts
 *
 * @typedef SlinkityAttrs
 * @property {string} id - ID to identify mount points in the DOM for hydration
 * @property {string} ssr - true / false flag to identify mount points that need SSR on server request / on production build
 
 * @type {SlinkityAttrs}
 */
const SLINKITY_ATTRS = {
  id: 'data-s-id',
  ssr: 'data-s-needs-ssr',
}

/**
 * Name for the web component used to mount React
 */
const SLINKITY_REACT_MOUNT_POINT = 'slinkity-react-mount-point'

module.exports = {
  SLINKITY_ATTRS,
  SLINKITY_REACT_MOUNT_POINT,
}
