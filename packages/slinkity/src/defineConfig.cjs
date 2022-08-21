const { z } = require('zod')

// Recreation of types in `@types`
// TODO: refactor to "ts-to-zod" when ESM is support
const rendererSchema = z.object({
  name: z.string(),
  extensions: z.array(z.string()),
  clientEntrypoint: z.string(),
  // TODO: type when stable
  ssr: z.any(),
  viteConfig: z.any().optional(),
  page: z.function(z.tuple([z.any()]), z.any()).optional(),
})

const userConfigSchema = z.object({
  renderers: z.array(rendererSchema).optional().default([]),
  islandsDir: z.string().optional().default('_islands'),
})

/** @param {import('./@types').UserConfig} userConfig */
function defineConfig(userConfig) {
  return userConfigSchema.parse(userConfig)
}

module.exports = {
  rendererSchema,
  userConfigSchema,
  defineConfig,
}
