import { z } from 'zod';
import type { UserConfig } from './~types.cjs';

// Recreation of types in `@types`
// TODO: refactor to "ts-to-zod" when ESM is support
export const rendererSchema = z.object({
  name: z.string(),
  extensions: z.array(z.string()),
  clientEntrypoint: z.string(),
  ssr: z
    .function()
    .args(
      z.object({
        Component: z.any(),
        props: z.any(),
        slots: z.record(z.string()),
        ssrLoadModule: z.any(),
        javascriptFunctions: z.record(z.function().args(z.any()).returns(z.any())),
      }),
    )
    .returns(z.union([z.object({ html: z.string() }), z.promise(z.object({ html: z.string() }))]))
    .optional(),
  viteConfig: z.record(z.any()).optional(),
  page: z.function(z.tuple([z.any()]), z.any()).optional(),
});

export const userConfigSchema = z.object({
  renderers: z.array(rendererSchema).optional().default([]),
  islandsDir: z.string().default('_islands'),
  buildTempDir: z.string().optional().default('.eleventy-temp-build'),
});

export function defineConfig(userConfig: Partial<UserConfig>): UserConfig {
  const parsed = userConfigSchema.safeParse(userConfig);
  if (parsed.success) {
    return parsed.data;
  } else {
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'renderers') {
        throw new Error(
          "[slinkity] Config invalid. Check that you're using our new component renderer packages (ex. `@slinkity/react` instead of `@slinkity/renderer-react`). See https://slinkity.dev/docs/component-shortcodes#prerequisites",
        );
      }
    }

    throw new Error(
      '[slinkity] Config invalid. See https://slinkity.dev/docs/config/#slinkity-plugin-configuration for all configuration options.',
    );
  }
}
