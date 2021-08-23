/**
 * Slinkity-specific data attributes
 * Applied to mount points and associated scripts
 * path: Relative path to the component associated with a given mount point
 * instance: The numeric position of a mount point in the DOM
 *  (i.e. the second mount point has an instance of 2)
 * lazy: Boolean for whether to load a mount point's scripts lazily
 * type: Whether the mount point is for a page ("page") or a shortcode ("shortcode")
 */
const SLINKITY_ATTRS = {
  path: 'data-s-path',
  instance: 'data-s-instance',
  lazy: 'data-s-lazy',
  type: 'data-s-type',
}

/**
 * Name for the web component used to mount React
 */
const SLINKITY_REACT_MOUNT_POINT = 'slinkity-react-mount-point'

module.exports = {
  SLINKITY_ATTRS,
  SLINKITY_REACT_MOUNT_POINT,
}
