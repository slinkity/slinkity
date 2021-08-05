import React from 'react'
import Counter from './_includes/components/Counter'
import Logo from './_includes/components/Logo'

export const getProps = (eleventyData) => ({ layout: 'layout' })

const About = () => (
  <>
    <Logo />
    <h1>About ⚛️</h1>
    <Counter />
  </>
)

export default About
