const { PACKAGES } = require('../utils/consts')

/** @type {import('../@types').ComponentLoader[]} */
module.exports = [
  {
    name: 'onClientLoad',
    isDynamicComponentImport: false,
    client: {
      mod: PACKAGES.client,
      name: 'onClientLoad',
    },
  },
  {
    // TODO: remove for 1.0
    name: 'eager',
    isDynamicComponentImport: false,
    client: {
      mod: PACKAGES.client,
      name: 'onClientLoad',
    },
  },
  {
    name: 'onComponentVisible',
    isDynamicComponentImport: true,
    client: {
      mod: PACKAGES.client,
      name: 'onComponentVisible',
    },
  },
  {
    // TODO: remove for 1.0
    name: 'lazy',
    isDynamicComponentImport: true,
    client: {
      mod: PACKAGES.client,
      name: 'onComponentVisible',
    },
  },
  {
    name: 'onClientIdle',
    isDynamicComponentImport: true,
    client: {
      mod: PACKAGES.client,
      name: 'onClientIdle',
    },
  },
  {
    name: 'onClientMedia',
    isDynamicComponentImport: true,
    client: {
      mod: PACKAGES.client,
      name: 'onClientMedia',
    },
  },
]
