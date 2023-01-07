import Slinky from "/@islands/Slinky";
import { useFunctions } from "@slinkity/preact/server";

export const frontmatter = {
  title: "Slinkity 1.0",
  layout: "layout.njk",
};

export default function Page({ title }) {
  const { slugify } = useFunctions();
  return (
    <section>
      <h1>{slugify(title)}</h1>
      <Slinky />
    </section>
  );
}
