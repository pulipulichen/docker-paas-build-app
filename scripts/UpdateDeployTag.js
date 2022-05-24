
const ShellExec = require('./lib/ShellExec.js')
const fs = require('fs')

function getRepoName (config) {
  const DEPLOY_GIT_URL = config.environment.build.deploy_git_url
  let REPO_NAME = DEPLOY_GIT_URL.slice(DEPLOY_GIT_URL.lastIndexOf('/') + 1)
  REPO_NAME = REPO_NAME.slice(0, REPO_NAME.lastIndexOf('.'))

  return REPO_NAME
}

async function setUserNameEmail(config) {
  const DEPLOY_GIT_URL = config.environment.build.deploy_git_url
  let {username, host} = new URL(DEPLOY_GIT_URL)

  await ShellExec(`git config --global user.email "${username}@${host}"`)
  await ShellExec(`git config --global user.name "${username}"`)
}

const BuildTag = require('./BuildTag.js')
let tmpGitPath = '/tmp/git-deploy'

async function main (config) {
  
  fs.mkdirSync(tmpGitPath, { recursive: true})
  process.chdir(tmpGitPath)

  const REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  console.log("REPO: " + REPO)

  const DEPLOY_GIT_URL = config.environment.build.deploy_git_url
  await ShellExec(`git clone -b ${REPO} ${DEPLOY_GIT_URL} || git clone ${DEPLOY_GIT_URL}`)

  const REPO_NAME = getRepoName(config)
  process.chdir(tmpGitPath + '/' + REPO_NAME)

  await setUserNameEmail(config)
  await ShellExec(`git checkout -b ${REPO} || git checkout ${REPO}`)


  // ----------------------------------------------------------------

  let lastTag = fs.readFileSync('TAG_APP.txt', 'utf8')
  let lastTagIsGit = lastTag.endsWith('-git')

  if (lastTagIsGit !== config.deploy.only_update_app) {
    fs.writeFileSync('FORCE_DEPLOY.txt', 'true', 'utf8')
  }
  else if (config.deploy.only_update_app === true) {
    return false
  }

  return true
}

async function push (config) {
  const REPO_NAME = getRepoName(config)
  process.chdir(tmpGitPath + '/' + REPO_NAME)

  const DEPLOY_GIT_URL = config.environment.build.deploy_git_url
  // -------------------

  let tag = await BuildTag()
  fs.writeFileSync('TAG_APP.txt', tag, 'utf8')

  // ----------------------------------------------------------------

  await ShellExec(`git add .`)
  await ShellExec(`git commit -m "CI TAG: ${tag}" --allow-empty`)
  await ShellExec(`git push -f ${DEPLOY_GIT_URL}`)
}

module.exports = {
  clone: main,
  push: push
}