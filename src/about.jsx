import React from 'react'
import Counter from './_includes/components/Counter'
import Logo from './_includes/components/Logo'

export const data = {
  layout: 'base',
}

const Home = () => (
  <main>
    <Logo />
    <h1>About ⚛️</h1>
    <Counter />
  </main>
)

export default Home
