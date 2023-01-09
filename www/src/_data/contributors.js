const Cache = require('@11ty/eleventy-fetch')

const usernameToCustomTitleMap = {
  Holben888: 'Supreme Slinkity Stan',
  ajcwebdev: 'Maintainer',
  nachtfunke: 'Cascading Style Slinky',
  BenDMyers: 'Accessibili-Slinky',
}

function toTitleByUsername(username) {
  return usernameToCustomTitleMap[username] ?? 'Contributor'
}

module.exports = async function contributors() {
  // note: failure to fetch *will* throw and stop the build
  const rawContributors = await Cache(
    'https://api.github.com/repos/slinkity/slinkity/contributors',
    {
      duration: '1d',
      type: 'json',
    },
  )
  /**
   * @typedef Contributor
   * @property {string} username
   * @property {string} url
   * @property {string} imageUrl
   * @property {string} title
   * @property {number} numContributions
   */

  /** @type {Contributor[]} */
  const contributors = rawContributors
    .map((contributor) => ({
      username: contributor.login ?? '',
      url: contributor.html_url ?? '',
      imageUrl: contributor.avatar_url ?? '',
      title: toTitleByUsername(contributor.login),
      numContributions: contributor.contributions ?? 0,
    }))
    .sort((contributor) => contributor.numContributions)
  return contributors
}
