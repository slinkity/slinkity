import React from 'react'
import Counter from './_includes/components/Counter'
import Logo from './_includes/components/Logo'

export const getProps = (eleventyData) => ({ layout: 'layout', render: 'lazy' })

const Home = () => (
  <>
    <Logo />
    <h1>Reac11ty ⚛️</h1>
    <Counter />
  </>
)

export default Home
