const fs = require('fs')
const ShellExec = require('./lib/ShellExec.js')

// async function appendPathToGitignore(data_path) {
//   if (!data_path || 
//        typeof(data_path) !== 'string' ||
//        !data_path.startsWith('/app/')) {
//          return true
//   }

//   let ignorePath = data_path.slice(5) 
  
//   await ShellExec(`echo "${ignorePath}" >> /tmp/git-deploy/${REPO_NAME}/.gitignore`)
// }

// async function appendDataPathToGitignore(config) {

//   if (config.app && config.app.data_path) {
//     await appendPathToGitignore(config.app.data_path)
//   }
//   if (config.app && Array.isArray(config.app.share_data_path)) {
//     for (let i = 0; i < config.app.share_data_path.length; i++) {
//       await appendPathToGitignore(config.app.share_data_path[i])
//     }
//   }
// }

async function main (config) {
  if (config.environment.app.app.only_update_app !== true) {
    console.log('Git mode is disabled.')
    return
  }

  const BUILD_DIR = process.cwd()
  console.log("BUILD_DIR: " + BUILD_DIR)

  let tmpGitPath = '/tmp/git-deploy'
  fs.mkdirSync(tmpGitPath)
  process.chdir(tmpGitPath)

  const REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  console.log("REPO: " + REPO)

  if (REPO === '-') {
    throw new Error('CI_PROJECT_NAME and CI_PROJECT_NAMESPACE is unknown.')
  } 

  // -----------------------------

  // if (!process.env.DEPLOY_GIT_URL) {
  //   throw new Error('DEPLOY_GIT_URL is unknown.')
  // }
  
  const DEPLOY_GIT_URL = config.environment.build.app_git_url
  await ShellExec(`git clone -b ${REPO} ${DEPLOY_GIT_URL} --no-checkout || git clone ${DEPLOY_GIT_URL}`, {retry: 3})

  let REPO_NAME = DEPLOY_GIT_URL.slice(DEPLOY_GIT_URL.lastIndexOf('/') + 1)
  REPO_NAME = REPO_NAME.slice(0, REPO_NAME.lastIndexOf('.'))
  process.chdir(tmpGitPath + '/' + REPO_NAME)

  // -----------------------------
  // 設定global name and email
  
  let {username, host} = new URL(DEPLOY_GIT_URL)

  await ShellExec(`git config --global user.email "${username}@${host}"`)
  await ShellExec(`git config --global user.name "${username}"`)

  await ShellExec(`git checkout -b ${REPO} || git checkout ${REPO}`, {retry: 3})

  // -------------------------------

  await ShellExec(`cd /tmp/git-deploy/${REPO_NAME}/; git clean -fxd`)
  await ShellExec(`cp -pr ${BUILD_DIR}/app/.[^.]* /tmp/git-deploy/${REPO_NAME}`)
  // await appendDataPathToGitignore(config)
  // await ShellExec(`rsync -a −−delete ${BUILD_DIR}/app/ /tmp/git-deploy/${REPO_NAME}/`)
  
  // -------------------------------

  await ShellExec(`git add .`)
  await ShellExec(`git commit -m "CI TAG: ${process.env.CI_COMMIT_SHORT_SHA}" --allow-empty`)
  await ShellExec(`git push -f ${DEPLOY_GIT_URL}`, {retry: 3})

}

module.exports = main