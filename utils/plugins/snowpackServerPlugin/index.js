const { startServer, createConfiguration } = require('snowpack')
const { isPortInUse, getSnowpackPort } = require('./snowpackPort')
const { writeFileRec } = require('../../fileHelpers')
const { join } = require('path')

const isUsingWatch = process.argv.includes('--watch')

module.exports = function snowpackServerPlugin(eleventyConfig, { dir }) {
  const SNOWPACK_PORT_PATH = join(process.cwd(), dir.output, '.snowpack-port')
  let snowpackServer = null

  const snowpackConfig = createConfiguration({
    root: join(process.cwd(), dir.output),
    mode: isUsingWatch ? 'development' : 'development',
    plugins: ['@snowpack/plugin-react-refresh'],
  })

  eleventyConfig.on('beforeBuild', async () => {
    // if in --watch mode, we shouldn't spin up a server
    // wait to run snowpack build in the afterBuild lifecycle method
    if (!isUsingWatch) return

    // if snowpackServer is defined, a file may have changed in --watch mode
    // avoid spinning up a new server in this case
    if (snowpackServer) return

    // if the .snowpack-port file is defined and that port is in use,
    // the snowpack server is probably still running
    // this can happen when you save a change to your .eleventy config in --watch mode
    // avoid spinning up a new server in this case
    const snowpackPort = await getSnowpackPort(SNOWPACK_PORT_PATH)
    if (snowpackPort != null && (await isPortInUse(snowpackPort))) return

    snowpackServer = await startServer(
      {
        config: snowpackConfig,
      },
      // TODO: figure out if these variables are required on setting mode to development
      { isDev: true, isWatch: true }
    )

    // write the current snowpack port to a file
    // this prevents saved changes to your .eleventy config from spinning up a new server
    await writeFileRec(SNOWPACK_PORT_PATH, `${snowpackServer.port}`)
  })

  // TODO: handle production builds
}
