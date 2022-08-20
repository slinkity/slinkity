function SlinkityStore(initialValue) {
  const subscribers = []

  this.value = initialValue;
  this.get = function() {
    return this.value
  }
  this.set = function(newValue) {
    this.value = newValue
    subscribers.forEach(subCallback => subCallback(newValue))
  }
  this.subscribe = function(callback) {
    const id = subscribers.length
    subscribers.push(callback)
    return function unsubscribe() {
      subscribers.splice(id, 1)
    }
  }
}
