const chalk = require('chalk')

module.exports = {
  /**
   * Log to the server console with color coating
   * - info = blue
   * - warning = yellow
   * - error = red
   * @param {{
   *   type: 'info' | 'warning' | 'error',
   *   message?: string,
   * }} params
   */
  log({ type = 'info', message = '' }) {
    if (type === 'error') {
      console.log(chalk.red(`[Error] ${message}`))
    } else if (type === 'warning') {
      console.log(chalk.yellow(`[Warning] ${message}`))
    } else {
      console.log(chalk.blue(`[Info] ${message}`))
    }
  },
}
