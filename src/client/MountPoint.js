export default class SlinkityReactMountPoint extends HTMLElement {
  async disconnectedCallback() {
    const { unmountComponentAtNode } = await import('react-dom')
    unmountComponentAtNode(this)
  }
}
