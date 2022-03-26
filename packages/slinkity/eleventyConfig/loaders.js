const { PACKAGES } = require('../utils/consts')

/** @type {import('../@types').ComponentLoader[]} */
module.exports = [
  {
    name: 'onClientLoad',
    client: undefined,
  },
  {
    // TODO: remove for 1.0
    name: 'eager',
    client: undefined,
  },
  {
    name: 'onComponentVisible',
    client: {
      mod: PACKAGES.client,
      name: 'onComponentVisible',
    },
  },
  {
    // TODO: remove for 1.0
    name: 'lazy',
    client: {
      mod: PACKAGES.client,
      name: 'onComponentVisible',
    },
  },
  {
    name: 'onClientIdle',
    client: {
      mod: PACKAGES.client,
      name: 'onClientIdle',
    },
  },
  {
    name: 'onClientMedia',
    client: {
      mod: PACKAGES.client,
      name: 'onClientMedia',
    },
  },
]
