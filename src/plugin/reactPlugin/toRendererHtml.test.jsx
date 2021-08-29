const toRendererHtml = require('./toRendererHtml')
const React = require('react')
const {parse} = require('node-html-parser')
const { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } = require('../../utils/consts')

describe('toRendererHtml', () => {
  describe('render: static', () => {
    it('should generate HTML without a mount point', () => {
      const Component = () => (
        <>
          <h2>This test file is:</h2>
          <ul>
            <li>Very cool</li>
            <li>Extremely helpful</li>
          </ul>
        </>
      )
  
      expect(toRendererHtml({Component, render: 'static'})).toMatchSnapshot()
    })
  })
  describe('render: eager', () => {
    it('should wrap HTML in mount point', () => {
      const Component = () => (
        <section>
          <h2>Our eager hydration</h2>
          <p>Is extremely useful</p>
          <p>Learn more about it <a href="https://slinkity.dev/docs/partial-hydration/">here</a></p>
        </section>
      )
      const componentPath = '/very/cool.jsx'
  
      expect(toRendererHtml({Component, render: 'eager', componentPath })).toMatchSnapshot()
    })
    it('should apply props as additional data attributes', () => {
      const Component = ({ logo, links }) => (
        <nav>
          <img src={logo.src} alt={logo.alt} />
          {links.map(({href, label}) => <a key={href} href={href}>{label}</a>)}
        </nav>
      )
      const componentPath = '_includes/components/nice-nav.jsx'
      const props = {
        logo: {
          src: 'accessible-logo.png',
          alt: 'Great logo',
        },
        links: [{
          href: '/home',
          label: 'Home',
        }, {
          href: '/about',
          label: 'About',
        }, {
          href: '/contact',
          label: 'Contact',
        }]
      }
  
      expect(toRendererHtml({Component, render: 'eager', componentPath, props })).toMatchSnapshot()
    })
  })
  describe('render: lazy', () => {
    it('should add lazy as a data attribute', () => {
      const Component = () => <p>Not important</p>

      const output = toRendererHtml({Component, render: 'lazy' })
      const mountPoint = parse(output).querySelector(SLINKITY_REACT_MOUNT_POINT)

      expect(mountPoint.getAttribute(SLINKITY_ATTRS.lazy)).toEqual('true')
    })
  })
})