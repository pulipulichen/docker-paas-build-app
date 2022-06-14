
const ShellExec = require('./lib/ShellExec.js')
const fs = require('fs')
const path = require('path')
const CheckOnlyUpdateApp = require('./CheckOnlyUpdateApp')

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

const REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE

async function main (config) {
  
  fs.mkdirSync(tmpGitPath, { recursive: true})
  process.chdir(tmpGitPath)

  
  console.log("REPO: " + REPO)

  const DEPLOY_GIT_URL = config.environment.build.deploy_git_url
  await ShellExec(`git clone -b ${REPO} ${DEPLOY_GIT_URL} || git clone ${DEPLOY_GIT_URL}`, {retry: 3})

  const REPO_NAME = getRepoName(config)
  process.chdir(tmpGitPath + '/' + REPO_NAME)

  await setUserNameEmail(config)
  await ShellExec(`git checkout -b ${REPO} || git checkout ${REPO}`, {retry: 3})


  // ----------------------------------------------------------------

  let tagPath = path.join(tmpGitPath + '/' + REPO_NAME, 'TAG_APP.txt')
  let lastTagIsGit = false
  let lastTag = ''
  if (fs.existsSync(tagPath) === false) {
    fs.writeFileSync(tagPath, '', 'utf8')
  }
  lastTag = fs.readFileSync(tagPath, 'utf8')
  lastTagIsGit = lastTag.trim().endsWith('-git')
    

  if (lastTagIsGit !== config.environment.app.app.only_update_app) {
    let tag = await BuildTag()
    console.log({
      lastTag,
      tag
    })
    fs.writeFileSync('FORCE_DEPLOY.txt', tag, 'utf8')
    console.log(`
================================================
FORCE_DEPLOY.txt is created.
================================================
`)
  }
  // else if (config.deploy.only_update_app === true) {
  else if (await CheckOnlyUpdateApp([
    'config/Dockerfile'
  ])) {
    console.log('only_update_app')
    return false
  }

  return true
}

async function push (config) {
  console.log(`
============================================================
push
============================================================
`)

  const REPO_NAME = getRepoName(config)
  // await ShellExec(`pwd`)

  // console.log(tmpGitPath + '/' + REPO_NAME, fs.existsSync(tmpGitPath + '/' + REPO_NAME))
  process.chdir(tmpGitPath + '/' + REPO_NAME)
  // await ShellExec(`cd ${tmpGitPath + '/' + REPO_NAME}`)

  const DEPLOY_GIT_URL = config.environment.build.deploy_git_url
  // -------------------

  let tag = await BuildTag()
  // fs.writeFileSync('TAG_APP.txt', tag, 'utf8')

  // await ShellExec(`pwd`)
  // await ShellExec(`ls`)
  // console.log(tmpGitPath + '/' + REPO_NAME, fs.existsSync(tmpGitPath + '/' + REPO_NAME))
  // await ShellExec(`ls ${tmpGitPath + '/' + REPO_NAME}`)

  let createForceDeployCMD = `echo "${tag}" > FORCE_DEPLOY.txt`

  let lastTag = fs.readFileSync(path.join(tmpGitPath + '/' + REPO_NAME, 'TAG_APP.txt'), 'utf8')
  let lastTagIsGit = lastTag.trim().endsWith('-git')

  if (lastTagIsGit === config.environment.app.app.only_update_app) {
    createForceDeployCMD = `echo "Skip force deploy."`
  }

  // ----------------------------------------------------------------
  console.log(tag)
  await ShellExec([
    `cd ${tmpGitPath + '/' + REPO_NAME}`, 
    createForceDeployCMD,
    `echo "${tag}" > TAG_APP.txt`,
    `ls -l`,
    `pwd`,
    `git add .`,
    `git commit -m "CI TAG: ${tag}" --allow-empty`
  ])

  await ShellExec([
    `cd ${tmpGitPath + '/' + REPO_NAME}`, 
    `git push -f ${DEPLOY_GIT_URL}`
  ], {retry: 3})

  if (config.environment.app.app.only_update_app === false) {
    await showReadyForImportMessage(config)
  }
}

async function showReadyForImportMessage (config) {
  let tag = await BuildTag()
  let {WORKDIR, CMD, USER, EXPOSE, ENV} = config.environment.app.app.Dockerfile

  let envString = Object.keys(ENV).map(key => `ENV ${key}=${ENV[key]}`).join('\n')

  console.log(`============================
██████╗ ███████╗ █████╗ ██████╗ ██╗   ██╗       
██╔══██╗██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝       
██████╔╝█████╗  ███████║██║  ██║ ╚████╔╝        
██╔══██╗██╔══╝  ██╔══██║██║  ██║  ╚██╔╝         
██║  ██║███████╗██║  ██║██████╔╝   ██║          
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝          
                                                
███████╗ ██████╗ ██████╗                        
██╔════╝██╔═══██╗██╔══██╗                       
█████╗  ██║   ██║██████╔╝                       
██╔══╝  ██║   ██║██╔══██╗                       
██║     ╚██████╔╝██║  ██║                       
╚═╝      ╚═════╝ ╚═╝  ╚═╝                       
                                                
██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗
██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   
██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   
██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   
╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
                                                
You can use following Dockerfile:
${"````"}
FROM ${config.environment.build.quay_prefix}/${REPO}:${tag}

# ------------------
# Following configuration will be used within CI/CD for Kubernetes. Please keep them at the bottom of file.

COPY app/ ${WORKDIR}
USER ${USER}
EXPOSE ${EXPOSE}
${envString}
WORKDIR ${WORKDIR}
CMD ${CMD}
${"````"}

`)
}

module.exports = {
  clone: main,
  push: push
}