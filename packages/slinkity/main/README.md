# 📁 The `main` dir

This is where all import-able modules live. These are modules developers import into their project directly.

Note: Most of the Slinkity framework lives inside our CLI and our plugin (which is auto-applied by our CLI). So the end developer has very little to _actually_ import themselves!

## `index.ts`

This is our barrel export to expose all modules + types via the `slinkity` package. To ensure all exports are compatible with plain JS, we'll generate an `index.js` with a separate `index.d.ts` file using [the Typescript compiler](https://www.typescriptlang.org/docs/handbook/compiler-options.html). See these files for more:

- `/tsconfig.json` - (at root of this project) all typescript compiler options
- `/package.json` - (at root of this project) contains the `build:types` command