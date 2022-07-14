const path = require('path')
const ShellExec = require('./lib/ShellExec')
const LoadYAMLConfig = require('./lib/LoadYAMLConfig')

const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
let statusChanged = null

module.exports = async function () {
  if (statusChanged !== null) {
    return statusChanged
  }

  let prefixList = [
    '/config/status.yaml'
  ]

  // const pwd = await ShellExec(`pwd`)
  const pwd = process.cwd()

  process.chdir(BUILD_DIR)
  let filelist = await ShellExec(`git diff-tree --no-commit-id --name-only -r ${process.env.CI_COMMIT_SHA}`, {verbose: false})
  filelist = filelist.split('\n')
  // console.log(filelist)
  // throw new Error('test')
  for (let i = 0; i < prefixList.length; i++) {
    let prefix = prefixList[i]
    for (let j = 0; j < filelist.length; j++) {
      // console.log({file: filelist[j], prefix, result: (filelist[j].startsWith(prefix))})
      if (filelist[j].startsWith(prefix)) {
        process.chdir(pwd)
        statusChanged = true
        return true
      }
    }
  }

  process.chdir(pwd)
  statusChanged = false
  return false
}