const portScanner = require('portscanner')

const isPortInUse = (port) =>
  new Promise((resolve, reject) => {
    portScanner.checkPortStatus(port, '127.0.0.1', (error, status) => {
      if (error) reject(error)

      resolve(status === 'open')
    })
  })

module.exports = {
  isPortInUse,
}
