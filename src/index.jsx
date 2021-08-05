import React from 'react'
import Counter from './_includes/components/Counter'
import Logo from './_includes/components/Logo'

export const data = {
  render: 'lazy',
  layout: 'base',
}

const Home = () => (
  <main>
    <Logo />
    <h1>Reac11ty ⚛️</h1>
    <Counter />
  </main>
)

export default Home
