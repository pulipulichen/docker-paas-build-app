const path = require('path')
const ShellExec = require('./lib/ShellExec')
const LoadYAMLConfig = require('./lib/LoadYAMLConfig')

const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
module.exports = async function (prefixList = []) {


  const config = await LoadYAMLConfig()

  if (typeof(prefixList) === 'string') {
    prefixList = [prefixList]
  }
  
  if (prefixList.length === 0) {
    return (config.deploy.only_update_app === true)
  }

  // const pwd = await ShellExec(`pwd`)
  const pwd = process.cwd()

  process.chdir(BUILD_DIR)
  let filelist = await ShellExec(`git diff-tree --no-commit-id --name-only -r ${process.env.CI_COMMIT_SHA}`)
  filelist = filelist.split('\n')
  // console.log(filelist)
  // throw new Error('test')
  for (let i = 0; i < prefixList.length; i++) {
    let prefix = prefixList[i]
    for (let j = 0; j < filelist; j++) {
      if (filelist[j].startsWith(prefix)) {
        process.chdir(pwd)
        return false
      }
    }
  }

  process.chdir(pwd)
  return (config.deploy.only_update_app === true)
}