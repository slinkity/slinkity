import { IslandExport } from "slinkity";
import { useFunctions } from "@slinkity/preact/server";

export const frontmatter = {
  title: "Slinkity 1.0",
  layout: "layout.njk",
};

export const island: IslandExport = {
  on: ["load"],
  props(eleventyData) {
    return {
      title: eleventyData.title,
    };
  },
};

export default function Page({ title }) {
  const { slugify } = useFunctions();
  return (
    <section>
      <h1>{slugify(title)}</h1>
      <hr style={{ marginTop: "100vh" }} />
    </section>
  );
}
