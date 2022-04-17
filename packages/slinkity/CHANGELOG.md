# slinkity

## 0.8.1

### Patch Changes

- Fix: export "plugin" on slinkity package to access from eleventy configs

## 0.8.0

### Minor Changes

- 72a3594

## Slinkity as a plugin

Now, you ditch the `slinkity` CLI and apply Slinkity as a standard 11ty plugin. This includes a few major changes:

- no need for a separate `slinkity.config.js` for configuration options. These are now configured on the plugin itself
- custom dev server middleware can now work alongside Slinkity. This includes 11ty serverless! Note: Vite will not run on serverless routes yet
- we no longer target 11ty at a temporary directory during builds. More in the next section

## Improved production builds - new temporary directory

This changes the game for Vite production builds. Here's the new step-by-step build process:

1. Keep building 11ty to your intended output directory. This way, we don't need wacky output overrides when using the plugin setup, and we can drop the process.env requirement for 11ty image.
2. Rename this 11ty output directory to .eleventy-temp-build
3. Run Vite's production build with .eleventy-temp-build as the input, and your configured 11ty output as the output
