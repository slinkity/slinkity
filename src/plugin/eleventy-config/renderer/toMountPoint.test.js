const { toMountPoint } = require('./toMountPoint')
const { parse } = require('node-html-parser')
const { SLINKITY_REACT_MOUNT_POINT, SLINKITY_ATTRS } = require('../../../utils/consts')

describe('toMountPoint', () => {
  describe('without hydration', () => {
    const hydrate = 'static'
    it('should not apply mount point wrapper', () => {
      const root = parse(toMountPoint({ id: 0, hydrate }))
      expect(root.firstChild.rawTagName).toEqual('div')
    })
    it('should apply props to wrapper div', () => {
      const id = 11
      const root = parse(toMountPoint({ id, hydrate }))
      expect(root.firstChild.getAttribute(SLINKITY_ATTRS.id)).toEqual(`${id}`)
      expect(root.firstChild.getAttribute(SLINKITY_ATTRS.ssr)).toEqual('true')
    })
  })
  describe('with hydration', () => {
    const hydrate = 'eager'
    it('should apply mount point wrapper', () => {
      const root = parse(toMountPoint({ id: 0, hydrate }))
      expect(root.firstChild.rawTagName).toEqual(SLINKITY_REACT_MOUNT_POINT)
    })
    it('should apply props to wrapper mount point', () => {
      const id = 11
      const root = parse(toMountPoint({ id, hydrate }))
      expect(root.firstChild.getAttribute(SLINKITY_ATTRS.id)).toEqual(`${id}`)
      expect(root.firstChild.getAttribute(SLINKITY_ATTRS.ssr)).toEqual('true')
    })
  })
})
