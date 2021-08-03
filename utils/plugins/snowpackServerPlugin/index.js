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
    devOptions: {
      // same defaults as `snowpack dev`
      // https://github.com/snowpackjs/snowpack/blob/002f863d3583b0c75d150b15a330fe1439a306ed/snowpack/src/commands/dev.ts#L1042-L1046
      output: 'dashboard',
      open: 'default',
      hmr: true,
    }
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
      { isWatch: true }
    )

    // write the current snowpack port to a file
    // this prevents saved changes to your .eleventy config from spinning up a new server
    await writeFileRec(SNOWPACK_PORT_PATH, `${snowpackServer.port}`)
  })

  // TODO: handle production builds
}
