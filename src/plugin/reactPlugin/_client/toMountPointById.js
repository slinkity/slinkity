import { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } from '../../../utils/consts'

export function toMountPointById(id, index) {
  const mountPoints = document.querySelectorAll(
    `${SLINKITY_REACT_MOUNT_POINT}[${SLINKITY_ATTRS.id}="${id}"]`,
  )
  return mountPoints[index]
}
