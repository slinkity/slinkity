const { isPortInUse, getServerPort } = require('./getServerPort')
const { writeFileRec } = require('../../fileHelpers')
const { join } = require('path')
const { createServer, build } = require('vite')
const { promisify } = require('util')
const glob = promisify(require('glob'))

const isUsingWatch = process.argv.includes('--watch')

module.exports = function viteServerPlugin(eleventyConfig, { dir }) {
  const SERVER_PORT_PATH = join(process.cwd(), dir.output, '.server-port')
  let server = null

  eleventyConfig.on('beforeBuild', async () => {
    // if in --watch mode, we shouldn't spin up a server
    // wait to run "build" in the afterBuild lifecycle method
    if (!isUsingWatch) return

    // if server is defined, a file may have changed in --watch mode
    // avoid spinning up a new server in this case
    if (server) return

    // if the .server-port file is defined and that port is in use,
    // the server is probably still running
    // this can happen when you save a change to your .eleventy config in --watch mode
    // avoid spinning up a new server in this case
    const serverPort = await getServerPort(SERVER_PORT_PATH)
    if (serverPort != null && (await isPortInUse(serverPort))) return

    server = await createServer({
      root: join(process.cwd(), dir.output),
      clearScreen: false,
      server: {
        port: 8080,
      },
    })

    await server.listen()

    // write the current server port to a file
    // this prevents saved changes to your .eleventy config from spinning up a new server
    await writeFileRec(SERVER_PORT_PATH, `${server.config.server.port}`)
  })

  // TODO: handle production builds
  eleventyConfig.on('afterBuild', async () => {
    if (!isUsingWatch) {
      await build({
        root: join(process.cwd(), dir.output),
        build: {
          outDir: '',
          emptyOutDir: true,
          rollupOptions: {
            input: await glob(`${dir.output}/**/*.html`, { absolute: true }),
          },
        },
      })
    }
  })
}
