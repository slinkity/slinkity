import { Island } from '@slinkity/preact/server'

export const frontmatter = {
  title: 'Slinkity 1.0',
  layout: 'layout.njk',
}

export default function Page({ title }) {
  return (
    <section>
      <h1>{title}</h1>
      <hr style={{ marginTop: '100vh' }} />
      <Island name="Counter.jsx" on="visible" props={{ initialCount: 50 }} />
    </section>
  )
}
