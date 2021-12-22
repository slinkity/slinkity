const { execaCommandSync } = require('execa')
const fs = require('fs')
const path = require('path')
const projectPath = process.argv[2]
const PKG = 'package.json'

const { name, version } = require(`./${PKG}`)

execaCommandSync('npm pack')
fs.copyFileSync(path.join(__dirname, `${name}-${version}.tgz`), projectPath)

const projectPackagePath = path.join(projectPath, PKG)
if (!fs.existsSync(projectPackagePath)) {
  console.log("Couldn't find package.json in project. Are you sure your project path is correct?")
}

const { dependencies } = require()
