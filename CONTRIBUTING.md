# Hey there fellow contributor 👋

Glad to see you here. We're open to contributions of all kinds, including:

- Improvements to our docs (new tutorials, phrasing, CSS styling, etc)
- Core bug fixes
- Core features and performance enhancements
- New Slinkity tutorials, example projects, and more!

## Table of contents

- [Table of contents](#table-of-contents)
- [Before diving into the code...](#before-diving-into-the-code)
- [Git etiquette](#git-etiquette)
- [🚏 Repository structure](#-repository-structure)
- [Working in the Slinkity Framework](#working-in-the-slinkity-framework)
  - ["Framework" vs. "Project"](#framework-vs-project)
  - [Architecture](#architecture)
  - [Setting up linters](#setting-up-linters)
  - [Running our test suites](#running-our-test-suites)
  - [Running the framework against tester projects](#running-the-framework-against-tester-projects)
    - [Build a production preview](#build-a-production-preview)
- [Automated test suites](#automated-test-suites)

## Before diving into the code...

We ask that you follow this little pre-flight checklist:

1. **Have I checked the [community discord](https://discord.gg/GBkBy9u#plugin-slinkity) and [existing issue logs](https://github.com/slinkity/slinkity/issues) first?** We've built strong communication channels to help our userbase. Sparking a discussion on Discord or sharing in issues threads related to your problem is a great starting point!
2. **Have I reviewed [the existing documentation](https://slinkity.dev/docs/)?** You may find your problem or feature request already nestled in our existing featureset. And if you're contributing to the docs themselves, it's good to get a lay of the land first.
3. **Is my problem or feature request [documented as an issue](https://github.com/slinkity/slinkity/issues) before I start working?** We love to see pull requests that immediately resolve whatever issue you're having. But before you get to work, we ask that you grab one of our lovely issue templates to explain what you're looking to do. You can tag this issue in your PR later using the "Resolves #[issue-number]" description.

☝️ Got it? Good. Now let's talk crafting your first PR 😁

## Git etiquette

We believe that good contributions should _also_ follow a couple guidelines.

First, **the PR is clearly scoped to resolving a single issue** in our issue logs. If it happens to resolve multiple, clarify this in your PR comments and in the name of your branch.

Second, **commits should have clear messaging** on the work you've done. We considered writing some tips here, but this excerpt from [Hugo's contributing guide](https://github.com/gohugoio/hugo/blob/master/CONTRIBUTING.md) does it best!

> This [blog article](http://chris.beams.io/posts/git-commit/) is a good resource for learning how to write good commit messages, the most important part being that each commit message should have a title/subject in imperative mood starting with a capital letter and no trailing period: "Return error on wrong use of the Paginator", NOT "returning some error."

## 🚏 Repository structure

We use a monorepo structure, so you won't find our core Slinkity code in the base directory. Here's where you can go to contribute:
- **docs + homepage →** head to `www/`
- **slinkity framework →** head to `packages/slinkity`
- **the slinkity starter (aka `npm init slinkity`) →** head to `packages/create-slinkity`

## Working in the Slinkity Framework

Note: This section is specifically for `packages/slinkity`.

### "Framework" vs. "Project"

To clarify, we'll be using 2 different terms from here on out:

- **Slinkity framework:** The core Slinkity framework you can find in this repository
- **Slinkity project:** Any project that _uses_ Slinkity as a dependency

So if you see the word "project" and wonder "wait, which project does that mean?", there's your answer!

### Architecture

You can learn more about how Slinkity _really_ works under-the-hood in our ARCHITECTURE doc!

[**Go explore** 🚀](/ARCHITECTURE.md)

### Setting up linters

We use [ESLlint](https://eslint.org/) alongside their [Prettier](https://prettier.io/) plugin to format our code. You'll also notice we don't use semicolons around here. If that scares you... too bad 😈

And if you use VS Code, **we include a settings.json based on Wes Bos' setup guide [over here](https://github.com/wesbos/eslint-config-wesbos#with-vs-code)**. This will save you a lot of hassle wrestling with `formatOnSave` 😁 We also recommend installing an [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) if you haven't already.

You can also validate and fix lint errors by running either of these commands:

```bash
npm run lint # validate and find lint errors
npm run lint:fix # (attempt to) fix any errors found
```

### Running our test suites

We use a combination of [Jest](https://jestjs.io/) unit tests and snapshots across the framework. We plan to introduce e2e tests soon as well!

Here's a few commands for running our tests locally:

```bash
# run all the tests
npm run test
# run a specific test file. This uses fuzzy find for matching, so need to copy the whole relative path!
npm run test -- -t=toHtmlAttrString
# update all snapshots
npm run test -- -u
# update all snapshots for a specific test file
npm run test -- -t=toRendererHtml -u
```

### Running the framework against tester projects

We think most changes to the core Slinkity framework will be debugged against a local Slinkity project. Don't worry, we've thought about this! If you're looking for a nice test project to debug against, try running `npm init slinkity` to generate a new one.

Next, run this command from your local copy of the Slinkity framework (not your tester project!):

```bash
# from within packages/slinkity
npm run dev
```

This will spin up an [esbuild-powered](https://esbuild.github.io/) process in "watch" mode. Any changes you make to the framework should appear in the `lib/` directory, complete with live reloading.

Now, let's preview these changes in your tester project. We recommend using [pnpm](https://pnpm.io/) for a nicer debugging experience here. Head to their docs for [installation options](https://pnpm.io/installation).

Now, from your tester project's `package.json`, add an "overrides" entry like so:

```json
{
  "pnpm": {
    "overrides": {
      "slinkity": "~/my-repositories/slinkity/packages/slinkity",
      /** optional - include these if you're using React: */
      "react": "~/my-repositories/slinkity/packages/slinkity/node_modules/react",
      "react-dom": "~/my-repositories/slinkity/packages/slinkity/node_modules/react-dom"
    }
  }
}
```

This is similar to an `npm link`, but with a couple added conveniences:
1. You don't need to run `npm link` from the Slinkity framework
2. You won't hit any peer dependency issues

Now you're ready to install your project's dependencies using `pnpm`. **Be sure to run this command from your tester project and _not_ the Slinkity framework ⚠️**

```bash
pnpm install
```

Now you're free to run any project scripts as normal. Just be sure to use the `pnpm` equivalent (aka `pnpm start` instead of `npm start` or `yarn start`).

Some notes while debugging:

1. You'll need 2 terminal windows open: one from the Slinkity framework running `npm run dev`, and another from your Slinkity project running your script of choice (ex. `slinkity --serve --incremental`).
2. You _do not_ need to relaunch the `slinkity --serve` command when editing client-facing files. For instance, `client/eagerLoader.js`. Vite is smart enough to reload for these 😁
3. You _do_ need to relaunch the `slinkity --serve` command when editing other framework files.

#### Build a production preview

To bundle this framework into a production-ready preview, go ahead and run this at the base directory:

```bash
npm pack
```

This will build everything in `src/` into a `lib/` folder, and compress the contents into a zip file. If you're on MacOS or Linux, you'll find a generated file named `slinkity-X.X.X.tgz`. Windows should be similar, but with a different file extension.

## Automated test suites

All PRs need to pass these tests before they're ready to merge.

1. **Does the project build?** We'll run our `npm run build` command to ensure everything bundles without errors.
2. **Are there any lint errors?** We'll use the same `npm run lint` command detailed in the [linter setup section](#setting-up-linters).
3. **Do all our tests pass?** We'll run `npm run test` over all tests found in `packages/**`, as detailed in the [test suite section](#running-our-test-suites).
4. **Do our docs deploy successfully?** We use [Netlify](https://www.netlify.com/)'s GitHub extension to generate deploy previews on every PR. If you didn't work on the docs, don't worry! Netlify will skip the deploy preview if there aren't any changes.

☝️ If you're seeing green checks across the board, congrats! We'll review your PR as soon as we can 😁
