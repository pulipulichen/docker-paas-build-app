const fs = require('fs')
const ShellExec = require('./lib/ShellExec.js')

async function main (config) {
  
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
  await ShellExec(`git clone ${DEPLOY_GIT_URL}`)

  const REPO_NAME = DEPLOY_GIT_URL.slice(DEPLOY_GIT_URL.lastIndexOf('/') + 1)
      .slice(0, DEPLOY_GIT_URL.lastIndexOf('.'))
  process.chdir(tmpGitPath + REPO_NAME)

  // -----------------------------
  // 設定global name and email
  
  let {username, host} = new URL(DEPLOY_GIT_URL)

  ShellExec(`git config --global user.email "${username}@${host}"`)
  ShellExec(`git config --global user.name "${username}"`)

  ShellExec(`git checkout -b ${REPO} || git checkout ${REPO}`)

  // -------------------------------

  await ShellExec(`cp -r $BUILD_DIR/app/* /tmp/git-deploy/${REPO_NAME}`)
  
  // -------------------------------

  await ShellExec(`git add .`)
  await ShellExec(`git commit -m "CI TAG: ${process.env.CI_COMMIT_SHORT_SHA}"`)
  await ShellExec(`git push -f ${DEPLOY_GIT_URL}`)

  throw new Error('ok嗎？')
}

module.exports = main