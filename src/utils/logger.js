const chalk = require('chalk')

module.exports = {
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
