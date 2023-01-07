import { execa } from "execa";
// @ts-ignore
import { default as Eleventy } from "@11ty/eleventy/src/Eleventy.js";
import { fileURLToPath } from "url";

export const clientLoaders = [
  "client:load",
  "client:idle",
  "client:visible",
  "client:media",
] as const;

export type ClientLoader = typeof clientLoaders[number];

export function timeout(ms: number): Promise<true> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
}

let portIncr = 8080;

export function serverSetup({ fixturePath }: { fixturePath: string | URL }) {
  const port = portIncr++;
  const fixtureUrl = new URL(fixturePath, import.meta.url);
  const eleventy = new Eleventy(
    fileURLToPath(new URL("./src", fixtureUrl)),
    fileURLToPath(new URL("./_site", fixtureUrl)),
    {
      quietMode: true,
      configPath: fileURLToPath(new URL("eleventy.config.cjs", fixtureUrl)),
    }
  );

  return {
    startServer: async (): Promise<{ close: () => void }> => {
      eleventy.setRunMode("serve");
      await eleventy.watch();
      await eleventy.serve(port);
      return {
        close: () => {
          eleventy.watcher.close();
          eleventy.eleventyServe.close();
        },
      };
    },
    baseUrl: `http://localhost:${port}/`,
  };
}
