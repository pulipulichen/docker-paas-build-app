const fs = require('fs')
const path = require('path')

const LoadYAMLConfig = require('./lib/LoadYAMLConfig.js')


// const BUILD_DIR = path.join('/webapp-build/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
// if (config.database.init === false || 
//   fs.existsSync(BUILD_DIR + '/database/database-pvc.zip') === false) {
//   console.log('Do not initialized.', )
//   process.exit()
// }

//const UnzipDatabasePVC = require('./lib/UnzipDatabasePVC.js')
const BuildDockerfile = require('./lib/BuildDockerfile.js')
const PushDockerfile = require('./lib/PushDockerfile.js')

const main = async function () {
  // if (config.backup.persist_data === true) {
  //   console.log('config.backup.persist_data is true. Update is skipped.')
  //   return true
  // }
  const config = await LoadYAMLConfig()

  console.log(config)
  throw new Error('Test finish')

  //await UnzipDatabasePVC(config)
  BuildDockerfile(config)
  await PushDockerfile(config)
}

main()
