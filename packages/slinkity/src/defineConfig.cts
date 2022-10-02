import { z } from "zod";
import type { UserConfig } from "./~types.cjs";

// Recreation of types in `@types`
// TODO: refactor to "ts-to-zod" when ESM is support
export const rendererSchema = z.object({
  name: z.string(),
  extensions: z.array(z.string()),
  clientEntrypoint: z.string(),
  // TODO: type when stable
  ssr: z
    .function()
    .args(
      z.object({
        Component: z.any(),
        props: z.any(),
        ssrLoadModule: z.any(),
        javascriptFunctions: z.record(
          z.function().args(z.any()).returns(z.any())
        ),
      })
    )
    .returns(
      z.union([
        z.object({ html: z.string() }),
        z.promise(z.object({ html: z.string() })),
      ])
    )
    .optional(),
  viteConfig: z.any().optional(),
  page: z.function(z.tuple([z.any()]), z.any()).optional(),
});

export const userConfigSchema = z.object({
  renderers: z.array(rendererSchema).optional().default([]),
  islandsDir: z.string().optional().default("_islands"),
});

export function defineConfig(userConfig: Partial<UserConfig>): UserConfig {
  return userConfigSchema.parse(userConfig);
}
