const { toRendererHtml } = require('./toRendererHtml')
const React = require('react')

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

      expect(toRendererHtml({ Component, render: 'static' })).toMatchSnapshot()
    })
  })
  describe('render: eager or lazy', () => {
    it('should wrap HTML in mount point', () => {
      const Component = () => (
        <section>
          <h2>Our eager hydration</h2>
          <p>Is extremely useful</p>
          <p>
            Learn more about it <a href="https://slinkity.dev/docs/partial-hydration/">here</a>
          </p>
        </section>
      )

      expect(toRendererHtml({ Component, render: 'eager', id: 27 })).toMatchSnapshot()
    })
    it('should apply props to the component', () => {
      const Component = ({ logo, links }) => (
        <nav>
          <img src={logo.src} alt={logo.alt} />
          {links.map(({ href, label }) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
      )
      const props = {
        logo: {
          src: 'accessible-logo.png',
          alt: 'Great logo',
        },
        links: [
          {
            href: '/home',
            label: 'Home',
          },
          {
            href: '/about',
            label: 'About',
          },
          {
            href: '/contact',
            label: 'Contact',
          },
        ],
      }

      expect(toRendererHtml({ Component, render: 'lazy', id: 62, props })).toMatchSnapshot()
    })
  })
})
