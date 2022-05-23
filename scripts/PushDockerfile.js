
//const { exec } = require("child_process");

//const isDirEmpty = require("./lib/isDirEmpty")

const ShellExec = require('./lib/ShellExec.js')
const fs = require('fs')
const path = require('path')

function getTagPrefix(config) {
  let prefix = config.deploy.docker_image_tag_prefix

  if (!prefix) {
    return
  }

  prefix = prefix.toLowerCase()
  prefix = prefix.replace(/[^a-zA-Z0-9\-]/g, "")

  return prefix
}

module.exports = async function (config) {
  if (fs.existsSync('./build_tmp/Dockerfile') === false) {
    console.error('./build_tmp/Dockerfile is not found. Skip build and push.')
    return false
  }

  let REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  console.log(`QUAY REPO: ${REPO}`)

  let TAG = process.env.CI_COMMIT_SHORT_SHA
  let prefix = getTagPrefix(config)
  if (prefix && prefix !== '') {
    TAG = prefix + '-' + TAG
  }

  // ----------------------------------------------------------------
  // setup QUAY token

  //fs.mkdirSync('~/.docker')
  await ShellExec(`mkdir -p ~/.docker`) 
  await ShellExec(`cp ./deploy/token/quay-token.json ~/.docker/config.json`)
  
  // ------------------------
  
  let QUAY_PREFIX = config.environment.build.quay_prefix
  await ShellExec(`docker build -f ./build_tmp/Dockerfile -t ${QUAY_PREFIX}/${REPO}:app-${TAG} .`)
  await ShellExec(`docker push ${QUAY_PREFIX}/${REPO}:app-${TAG}`)

  // fs.mkdirSync('./ci.tmp/')
  // fs.writeFileSync('./ci.tmp/TAG_APP.txt', TAG, 'utf8')

  console.log('============================================================')
  console.log(`APP TAG UPDATED: app-${TAG}`)
  console.log('============================================================')
  
  return TAG
}