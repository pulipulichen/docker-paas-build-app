const fs = require('fs')
const path = require('path')

const yaml = require('js-yaml')
const fg = require('fast-glob')

module.exports = async function () {

  // 這是Gitlab CI Runner的做法
  const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)

  process.chdir(BUILD_DIR);
  //console.log("BUILD_DIR", BUILD_DIR)
  /*
  const valuesPath = BUILD_DIR + '/deploy/values.yaml'
  //const valuesPath = path.resolve('./values.yaml')
  //console.log("valuesPath", valuesPath)
  if (fs.existsSync(valuesPath) === false) {
    console.error('values.yaml is not found: ', valuesPath)
    process.exit()
  }
  const valuesStr = fs.readFileSync(valuesPath, 'utf8')
  //console.log(valuesStr)
  const config = yaml.load(valuesStr)
  */
  const entries = await fg([
    path.join(BUILD_DIR, 'deploy/values.yaml'), 
    path.join(BUILD_DIR, 'deploy/values/**/*.yaml'), 
  ], { dot: true });

  let config = {}

  entries.forEach(entry => {
    let localConfig = yaml.load(fs.readFileSync(entry, 'utf8'))
    
    Object.keys(localConfig).forEach(key => {
      config[key] = localConfig[key]
    })
  })

  console.log(config)

  if (Object.keys(config).length === 0) {
    throw new Error('values.yaml is not found')
  }

  return config
}