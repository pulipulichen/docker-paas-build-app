const LoadYAMLConfig = require('./LoadYAMLConfig.js')
const ShellExec = require('./ShellExec.js')
const fs = require('fs')
const path = require('path')

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
  fs.writeFileSync(path.join(process.env['HOME'], '/.docker/config.json'), JSON.stringify(token), 'utf8')
  //await ShellExec(`mv /tmp/config.json ~/.docker/`)
  // await ShellExec(`cat ~/.docker/config.json`)

}

module.exports = setupQuay