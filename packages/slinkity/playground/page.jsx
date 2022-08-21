export const frontmatter = {
  title: 'Slinkity 1.0',
  layout: 'layout.njk',
}

export default function Page({ title }) {
  return <h1>{title}</h1>
}
