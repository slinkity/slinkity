import type { IslandExport } from "slinkity";
import Slinky from "/@islands/Slinky";

export const frontmatter = {
  title: "Slinkity 1.0",
  layout: "layout.njk",
};

export const island: IslandExport = {
  when: "client:idle",
  props(eleventyData, { slugify }) {
    return {
      title: slugify(eleventyData.title),
    };
  },
};

export default function Page({ title }) {
  return (
    <section>
      <h1>{title}</h1>
      <Slinky />
    </section>
  );
}
