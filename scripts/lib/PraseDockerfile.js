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

  if (!config.environment.app.Dockerfile) {
    config.environment.app.Dockerfile = {}
  }

  config.environment.app.Dockerfile.EXPOSE = getEXPOSE()
  config.environment.app.Dockerfile.USER = getUSER()
  config.environment.app.Dockerfile.WORKDIR = getWORKDIR()
  config.environment.app.Dockerfile.CMD = getCMD()
  config.environment.app.Dockerfile.ENV = getENV()
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
  for (let i = commands.length - 1; i > -1; i--) {
    let {name, args} = commands[i]

    if (name === attr) {
      let arg = args.join(' ').trim()
      let pos = arg.indexOf('=')
      let envName = arg.slice(0, pos).trim()
      let envValue = arg.slice(pos+1).trim()
      cache[attr][envName] = envValue
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