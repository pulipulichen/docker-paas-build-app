let cache = {}

const fs = require('fs')
const path = require('path')
const parser = require('docker-file-parser')
const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
const commands = parser.parse(fs.readFileSync(path.join(BUILD_DIR, '/config/Dockerfile'), 'utf8'))

const getAttr = function (attr, defaultValue) {
  if (cache[attr]) {
    return cache[attr]
  }

  for (let i = commands.length - 1; i > -1; i--) {
    let {name, args} = commands[i]

    if (name === attr) {
      cache[attr] = args
      if (Array.isArray(cache[attr])) {
        cache[attr] = cache[attr].join(' ').trim()
      }
      break
    }
  }

  if (!cache[attr] && defaultValue) {
    cache[attr] = defaultValue
  }
  return cache[attr]
}


function setAPPDockerfile (config) {
  if (!config.environment) {
    config.environment = {}
  }

  if (!config.environment.app) {
    config.environment.app = {}
  }

  if (!config.environment.app.app) {
    config.environment.app.app = {}
  }

  if (!config.environment.app.app.Dockerfile) {
    config.environment.app.app.Dockerfile = {}
  }

  config.environment.app.app.Dockerfile.EXPOSE = getEXPOSE()
  config.environment.app.app.Dockerfile.USER = getUSER()
  config.environment.app.app.Dockerfile.WORKDIR = getWORKDIR()
  config.environment.app.app.Dockerfile.CMD = getCMD()
  config.environment.app.app.Dockerfile.ENV = getENV()

  // console.log(config.environment.app.app.Dockerfile)
}



const getUSER = function () {
  return getAttr('USER', 'root')
}

const getCMD = function () {
  return getAttr('CMD', '')
}

const getEXPOSE = function () {
  return getAttr('EXPOSE', 80)
}

const getWORKDIR = function () {
  return getAttr('WORKDIR', '/app')
}


const getENV = function () {
  let attr = 'ENV'
  if (cache[attr]) {
    return cache[attr]
  }

  cache[attr] = {}
  for (let i = 0; i < commands.length; i++) {
    let {name, args} = commands[i]

    if (name === attr) {
      Object.keys(args).forEach(envName => {
        let envValue = args[envName]
        cache[attr][envName] = envValue
      })
    }
  }

  return cache[attr]
}


module.exports = {
  getUSER,
  getCMD,
  getEXPOSE,
  getWORKDIR,
  getENV,
  setAPPDockerfile
}