const portScanner = require('portscanner')
const { readFile } = require('fs/promises')

const isPortInUse = (port) =>
  new Promise((resolve, reject) => {
    portScanner.checkPortStatus(port, '127.0.0.1', (error, status) => {
      if (error) reject(error)

      resolve(status === 'open')
    })
  })

const getServerPort = async (serverPortPath = '') => {
  try {
    return Number((await readFile(serverPortPath)).toString())
  } catch (e) {
    return undefined
  }
}

module.exports = {
  isPortInUse,
  getServerPort,
}
