// these imports are "documented" here:
// https://github.com/open-cli-tools/concurrently/blob/v6.2.1/index.js#L50-L60
const {
  concurrently,
  Logger,
  InputHandler,
  KillOnSignal,
  KillOthers,
  LogError,
  LogExit,
  LogOutput,
  RestartProcess,
} = require('concurrently')

const spawn = require('cross-spawn')

/**
 * @typedef {Object} IHasArgv
 * @property {string[]} argv A command and its arguments.
 */

/**
 * @typedef {Omit<import('concurrently').CommandObj, 'command'> & IHasArgv} CommandObj
 */

/**
 * @param {CommandObj[]} commands
 * @param {concurrently.Options} options
 */
module.exports = function concurrentlyByArgvs(commands, options = {}) {
  const keyedCommands = commands.map(({ argv, ...commandInfo }, i) => ({
    ...commandInfo,
    command: `${i}`,
  }))

  const keyedSpawn = (key, options) => {
    const {
      argv: [file, ...args],
    } = commands[+key]
    return spawn(file, args, options)
  }

  // the following comes directly from:
  // https://github.com/open-cli-tools/concurrently/blob/v6.2.1/index.js#L13-L47
  // with the exception of two lines, which are annotated below

  const logger = new Logger({
    outputStream: options.outputStream || process.stdout,
    prefixFormat: options.prefix,
    prefixLength: options.prefixLength,
    raw: options.raw,
    timestampFormat: options.timestampFormat,
  })

  return concurrently(
    // this is `commands` in the original code, but we want to pass our own
    // `keyedCommands` for our custom `keyedSpawn` function to handle
    keyedCommands,

    {
      // define our own spawn function in place of [npm] spawn-command. see:
      // https://github.com/open-cli-tools/concurrently/blob/v6.2.1/src/concurrently.js#L47
      // https://github.com/open-cli-tools/concurrently/blob/v6.2.1/src/command.js#L15
      // https://github.com/open-cli-tools/concurrently/blob/v6.2.1/src/command.js#L26
      spawn: keyedSpawn,

      maxProcesses: options.maxProcesses,
      raw: options.raw,
      successCondition: options.successCondition,
      cwd: options.cwd,
      controllers: [
        new LogError({ logger }),
        new LogOutput({ logger }),
        new LogExit({ logger }),
        new InputHandler({
          logger,
          defaultInputTarget: options.defaultInputTarget,
          inputStream:
            options.inputStream || (options.handleInput && process.stdin),
          pauseInputStreamOnFinish: options.pauseInputStreamOnFinish,
        }),
        new KillOnSignal({ process }),
        new RestartProcess({
          logger,
          delay: options.restartDelay,
          tries: options.restartTries,
        }),
        new KillOthers({
          logger,
          conditions: options.killOthers,
        }),
      ],
    }
  )
}
