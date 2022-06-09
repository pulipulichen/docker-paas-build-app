const LoadYAMLConfig = require('./LoadYAMLConfig.js')
let config
let USER = false
let CMD = false

const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
var parser = require('docker-file-parser');
const commands = parser.parse(fs.readFileSync(path.join(BUILD_DIR, '/config/Dockerfile'), 'utf8'))

const getUser = async function () {
  if (USER) {
    return USER
  }

  if (!config) {
    config = LoadYAMLConfig()
  }

  for (let i = 0; i < commands.length; i++) {
    let {name, args} = commands[i]

    if (name === 'USER') {
      USER = args.join('').trim()
      break
    }
  }

  if (!USER && 
      config.app && 
      config.app.Dockerfile &&
      config.app.Dockerfile.USER) {
    USER = config.app.Dockerfile.USER
  }

  if (!USER) {
    user = 'root'
  }
  return USER
}

const getCMD = async function () {
  if (CMD) {
    return CMD
  }

  if (!config) {
    config = LoadYAMLConfig()
  }

  for (let i = 0; i < commands.length; i++) {
    let {name, args} = commands[i]

    if (name === 'CMD') {
      CMD = args.join(' ').trim()
      break
    }
  }

  if (!CMD && 
    config.app && 
    config.app.Dockerfile &&
    config.app.Dockerfile.CMD) {
  CMD = config.app.Dockerfile.CMD
}
return CMD
}

module.exports = {
  getUser,
  getCMD
}