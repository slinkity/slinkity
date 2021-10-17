import { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } from '../../../utils/consts'

export function toMountPointById(id) {
  return document.querySelector(`${SLINKITY_REACT_MOUNT_POINT}[${SLINKITY_ATTRS.id}="${id}"]`)
}
