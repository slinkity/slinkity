const toPropsHash = require('./toPropsHash')

describe('toPropsHash', () => {
  it('should generate unique hashes when all params differ', () => {
    const first = {
      componentPath: './first.jsx',
      props: {
        prevPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
        nextPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
      },
    }
    const second = {
      componentPath: './second.jsx',
      props: {
        url: '/about/',
        date: new Date(1629071299090),
        title: 'Awesome',
      },
    }
    expect(toPropsHash(first)).not.toEqual(toPropsHash(second))
  })
  it('should generate unique hashes for same component path, but different props', () => {
    const first = {
      componentPath: './first.jsx',
      props: {
        prevPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
        nextPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
      },
    }
    const second = {
      componentPath: './first.jsx',
      props: {
        url: '/about/',
        date: new Date(1629071299090),
        title: 'Awesome',
      },
    }
    expect(toPropsHash(first)).not.toEqual(toPropsHash(second))
  })
  it('should generate unique hashes for same props, but different component path', () => {
    const first = {
      componentPath: './first.jsx',
      props: {
        prevPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
        nextPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
      },
    }
    const second = {
      componentPath: './second.jsx',
      props: {
        prevPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
        nextPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
      },
    }
    expect(toPropsHash(first)).not.toEqual(toPropsHash(second))
  })
  it('should generate the same hash when componentPath and props are the same', () => {
    const first = {
      componentPath: './first.jsx',
      props: {
        prevPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
        nextPageLink: { url: '/about/', date: new Date(1629071299090), title: 'Awesome' },
      },
    }
    expect(toPropsHash(first)).toEqual(toPropsHash(first))
  })
})
