const { v4: uuidv4 } = require('uuid');

/**
 * A store of data to be used and updated on the client
 * @type {import('../types').SlinkityStore}
 */
function SlinkityStore(initialValue, options) {
  this.isSlinkityStoreFactory = true;
  this.id = uuidv4();
  this.value = initialValue;
  this.get = function() {
    return this.value;
  }
}

/**
 * Create a store of data to be used and updated on the client
 * @type {import('../types').SlinkityStore}
 */
function store(initialValue, options) {
  return new SlinkityStore(initialValue, options);
}

module.exports.SlinkityStore = SlinkityStore
module.exports.store = store