import React from 'react'
import Counter from './_includes/components/Counter'
import Logo from './_includes/components/Logo'

export const getProps = (eleventyData) => ({ layout: 'base', render: 'lazy' })

const Home = () => (
  <>
    <Logo />
    <h1>Reac12ty ⚛️</h1>
    <Counter />
  </>
)

export default Home
