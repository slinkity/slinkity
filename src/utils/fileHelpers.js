const { writeFile, mkdir } = require('fs/promises')
const { dirname } = require('path')

const writeFileRec = async (outputPath = '', contents = '') => {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, contents)
}

module.exports = {
  writeFileRec,
}
