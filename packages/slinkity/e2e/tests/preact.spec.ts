import { test, expect, Locator, Page } from "@playwright/test";
import { serverSetup, timeout } from "./~utils.js";

async function testSlinkyInteraction(
  container: Locator,
  opts: { shouldUpdate?: boolean } = { shouldUpdate: true }
) {
  await container.getByRole("button").click();
  await expect(container.locator("svg")).toHaveClass(
    opts.shouldUpdate ? "slinky right" : "slinky left"
  );
}

const fixturePath = "../fixtures/preact/";
let baseUrl: string;
let server: { close: () => void };

test.beforeAll(async () => {
  const setup = serverSetup({
    fixturePath,
  });
  server = await setup.startServer();
  baseUrl = setup.baseUrl;
});

test.afterAll(async () => {
  server.close();
});

test.describe("shortcodes", () => {
  test("serverOnlyIsland", async ({ page }) => {
    await page.goto(baseUrl + "shortcodes/serverOnlyIsland");
    const container = page.getByTestId("serverOnlyIsland");
    await testSlinkyInteraction(container, { shouldUpdate: false });
  });

  for (const shortcodeSlug of ["island", "clientOnlyIsland"]) {
    test.describe(shortcodeSlug, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(baseUrl + `shortcodes/` + shortcodeSlug);
      });

      test("client:load", async ({ page, browserName }) => {
        const clientLoad = page.getByTestId("client:load");
        await testSlinkyInteraction(clientLoad);
      });

      test("client:idle", async ({ page, browserName }) => {
        const clientIdle = page.getByTestId("client:idle");
        // Webkit doesn't support idlecallback,
        // so we wait 200ms internally (see `client/idle.mjs`)
        await timeout(200);
        await testSlinkyInteraction(clientIdle);
      });

      test("client:media", async ({ page, browserName }) => {
        const clientMedia = page.getByTestId("client:media");
        // satisfy `max-width: 400px`
        await page.setViewportSize({ width: 399, height: 200 });
        await testSlinkyInteraction(clientMedia);
      });

      test("client:visible", async ({ page, browserName }) => {
        const clientVisible = page.getByTestId("client:visible");
        // scroll down to element
        await page.getByTestId("scroll-anchor").scrollIntoViewIfNeeded();
        await testSlinkyInteraction(clientVisible);
      });
    });
  }
});
