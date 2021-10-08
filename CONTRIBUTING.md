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
- [Working in the Slinkity Framework](#working-in-the-slinkity-framework)
  - ["Framework" vs. "Project"](#framework-vs-project)
  - [Architecture](#architecture)
  - [Setting up linters](#setting-up-linters)
  - [Running our test suites](#running-our-test-suites)
  - [Building and packing the framework](#building-and-packing-the-framework)
- [Automated test suites](#automated-test-suites)

## Before diving into the code...

We ask that you follow this little pre-flight checklist:

1. **Have I checked the [community discord](https://discord.gg/AfZMRCg8) and [existing issue logs](https://github.com/slinkity/slinkity/issues) first?** We've built strong communication channels to help our userbase. Sparking a discussion on Discord or sharing in issues threads related to your problem is a great starting point!
2. **Have I reviewed [the existing documentation](https://slinkity.dev/docs/)?** You may find your problem or feature request already nestled in our existing featureset. And if you're contributing to the docs themselves, it's good to get a lay of the land first.
3. **Is my problem or feature request [documented as an issue](https://github.com/slinkity/slinkity/issues) before I start working?** We love to see pull requests that immediately resolve whatever issue you're having. But before you get to work, we ask that you grab one of our lovely issue templates to explain what you're looking to do. You can tag this issue in your PR later using the "Resolves #[issue-number]" description.

☝️ Got it? Good. Now let's talk crafting your first PR 😁

## Git etiquette

We believe that good contributions should _also_ follow a couple guidelines.

First, **the PR is clearly scoped to resolving a single issue** in our issue logs. If it happens to resolve multiple, clarify this in your PR comments and in the name of your branch.

Second, **commits should have clear messaging** on the work you've done. We considered writing some tips here, but this excerpt from [Hugo's contributing guide](https://github.com/gohugoio/hugo/blob/master/CONTRIBUTING.md) does it best!

> This [blog article](http://chris.beams.io/posts/git-commit/) is a good resource for learning how to write good commit messages, the most important part being that each commit message should have a title/subject in imperative mood starting with a capital letter and no trailing period: "Return error on wrong use of the Paginator", NOT "returning some error."

## Working in the Slinkity Framework

### "Framework" vs. "Project"

To clarify, we'll be using 2 different terms from here on out:

- **Slinkity framework:** The core Slinkity framework you can find in this repository
- **Slinkity project:** Any project that _uses_ Slinkity as a dependency

So if you see the word "project" and wonder "wait, which project does that mean?", there's your answer!

### Architecture

You can learn more about how Slinkity _really_ works under-the-hood on our ARCHITECTURE doc!

[**Go explore** 🚀](/ARCHITECTURE.md)

### Setting up linters

We use [ESLlint](https://eslint.org/) alongside their [Prettier](https://prettier.io/) plugin to format our code. You'll also notice we don't use semicolons around here. If that scares you... too bad 😈

And if you use VS Code, **we highly recommend following Wes Bos' setup guide [over here](https://github.com/wesbos/eslint-config-wesbos#with-vs-code)**. This will save you a lot of hassle wrestling with `formatOnSave` 😁 We also recommend installing an [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) if you haven't already.

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


### Building and packing the framework

To bundle this framework into something useable, go ahead and run this at the base directory:

```bash
npm pack
```

This will build everything in `src/` into a `lib/` folder, and compress the contents into a zip file. If you're on MacOS or Linux, you'll find a generated file named `slinkity-X.X.X.tgz`. Windows should be similar (but with a different file extension)!

Now, you can install this zip file into _any_ existing project using npm. For instance, say I have a Slinkity example project in a neighboring folder to this framework:

```
/my-repositories
  /slinkity
  /my-slinkity-starter
```

We can run this command to install our zip file:

```bash
# Enter our project directory
cd ./my-slinkity-starter
# Install using a relative file path
npm i ../slinkity/slinkity-X.X.X.tgz
```

Now, you can run the `slinkity` CLI command just like a "real" npm package 👍

_**Note:** Yes, this does mean you'll need to rerun `npm pack` + `npm i ../slinkity/slinkity-X.X.X.tgz` any time you tweak framework code. We plan to improve this process with some live reloading!_

## Automated test suites

All PRs need to pass these tests before they're ready to merge.
1. **Does the project build?** We'll just run our `npm run build` command to ensure everything bundles without errors.
2. **Are there any lint errors?** We'll use the same `npm run lint` command detailed in the [linter setup section](#setting-up-linters).
3. **Do all our tests pass?** We'll run `npm run test` over all tests found in `src`, as detailed in the [test suite section](#running-our-test-suites).
4. **Do our docs deploy successfully?** We use [Netlify](https://www.netlify.com/)'s GitHub extension to generate deploy previews on every PR. If you didn't work on the docs, don't worry! Netlify will skip the deploy preview if there aren't any changes.

☝️ If you're seeing green checks across the board, congrats! We'll review your PR as soon as we can 😁
