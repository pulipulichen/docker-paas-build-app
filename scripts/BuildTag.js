const LoadYAMLConfig = require('./lib/LoadYAMLConfig.js')
const getTagPrefix = require('./lib/getTagPrefix')

async function buildTag () {
  let config = await LoadYAMLConfig()

  let TAG = process.env.CI_COMMIT_SHORT_SHA
  let prefix = await getTagPrefix()
  if (prefix && prefix !== '') {
    TAG = prefix + '-' + TAG
  }

  if (config.deploy.only_update_app === true) {
    TAG = TAG + '-git'
  }
  return TAG
}

module.exports = buildTag