
//const { exec } = require("child_process");

//const isDirEmpty = require("./lib/isDirEmpty")

const ShellExec = require('./lib/ShellExec.js')
const fs = require('fs')
const path = require('path')
const LoadYAMLConfig = require('./lib/LoadYAMLConfig.js')

const BuildTag = require('./BuildTag.js')

async function setupQuay () {
  let config = await LoadYAMLConfig()
  // ----------------------------------------------------------------
  // setup QUAY token

  //fs.mkdirSync('~/.docker')
  await ShellExec(`mkdir -p ~/.docker`) 
  let token = {
    "auths": {}
  }
  token.auths[config.environment.build.quay_auth_host] = {
    "auth": config.environment.build.quay_auth_token,
    "email": ""
  }
  fs.writeFileSync(process.env['HOME'] + '/.docker/config.json', JSON.stringify(token), 'utf8')
  //await ShellExec(`mv /tmp/config.json ~/.docker/`)
  // await ShellExec(`cat ~/.docker/config.json`)

}

const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)

module.exports = async function (config) {
  if (fs.existsSync('./build_tmp/Dockerfile') === false) {
    console.error('./build_tmp/Dockerfile is not found. Skip build and push.')
    return false
  }

  let REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  console.log(`QUAY REPO: ${REPO}`)

  let TAG = await BuildTag()

  // ------------------------
  
  let QUAY_PREFIX = config.environment.build.quay_prefix
  await setupQuay()  
  console.log('============================================================')
  console.log(`Build Dockerfile...`)
  console.log('============================================================')
  try {
    await ShellExec(`docker build -f ./build_tmp/Dockerfile -t ${QUAY_PREFIX}/${REPO}:app-${TAG} .`)
  }
  catch (e) {
    console.log('== [ Source: Dockerfile ] =======================================')
    console.log(fs.readFileSync(`./build_tmp/Dockerfile`, 'utf8'))
    console.log('============================================================')
    throw e
  }
  
  console.log('============================================================')
  console.log(`Push docker image...`)
  console.log('============================================================')
  await ShellExec(`docker push ${QUAY_PREFIX}/${REPO}:app-${TAG}`, {retry: 3})

  // fs.mkdirSync('./ci.tmp/')
  // fs.writeFileSync('./ci.tmp/TAG_APP.txt', TAG, 'utf8')

  console.log('============================================================')
  console.log(`APP TAG UPDATED: app-${TAG}`)
  console.log('============================================================')
  
  return TAG
}