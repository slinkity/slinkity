import React from 'react'

export const getProps = () => ({ layout: 'base' })

const Layout = ({ layout, children }) => (
  <main>
    <p>Check out this layout you requested: {layout}</p>
    {children}
  </main>
)

export default Layout
