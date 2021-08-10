const { parse } = require('shell-quote')

module.exports = function parseSimpleShellCmd(command, env = process.env) {
  const argv = parse(command, env)

  for (const token of argv) {
    if (typeof token !== 'string') {
      const errorMsgPrefix = `couldn't parse command line \`${command}\` as simple command: `
      if (token.op !== undefined) {
        throw new Error(
          errorMsgPrefix +
            `bash operators like \`${token.op}\` are not supported`
        )
      }
      if (token.comment) {
        throw new Error(errorMsgPrefix + 'please do not include comments')
      }
      throw new Error(
        errorMsgPrefix + `unrecognized token found when parsing: ${token}`
      )
    }
  }

  return argv
}
