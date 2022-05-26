const fs = require('fs')
const path = require('path')

const LoadYAMLConfig = require('./scripts/lib/LoadYAMLConfig.js')


// const BUILD_DIR = path.join('/webapp-build/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
// if (config.database.init === false || 
//   fs.existsSync(BUILD_DIR + '/database/database-pvc.zip') === false) {
//   console.log('Do not initialized.', )
//   process.exit()
// }

//const UnzipDatabasePVC = require('./lib/UnzipDatabasePVC.js')
const AppCommitToGit = require('./scripts/AppCommitToGit.js')
const BuildDockerfile = require('./scripts/BuildDockerfile.js')
const PushDockerfile = require('./scripts/PushDockerfile.js')

const ArgocdHelpers = require('./scripts/argocd/ArgocdHelpers.js')
const UpdateDeployTag = require('./scripts/UpdateDeployTag.js')
const ShellExec = require('./scripts/lib/ShellExec.js')

const main = async function () {
  // if (config.backup.persist_data === true) {
  //   console.log('config.backup.persist_data is true. Update is skipped.')
  //   return true
  // }
  const config = await LoadYAMLConfig()

  if (config.deploy.enable !== true) {
    console.log('Build is disabled.')
    return
  }

  if (config.deploy.only_update_app !== true) {
    console.log('only_update_app = false')
    return false
  }

  await AppCommitToGit(config)
  //await UnzipDatabasePVC(config)
  
  const appName = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  if (!appName || appName === '-') {
    throw Error('App name should be specified.')
    process.exit()
  }
  const token = await ArgocdHelpers.getCookieToken()
  await ArgocdHelpers.restartResource(appName, token, 'app')
}

main()
