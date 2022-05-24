const LoadYAMLConfig = require('./lib/LoadYAMLConfig.js')

function getTagPrefix(config) {
  let prefix = config.deploy.tag_prefix

  if (!prefix) {
    return
  }

  prefix = prefix.toLowerCase()
  prefix = prefix.replace(/[^a-zA-Z0-9\-]/g, "")

  return prefix
}

async function buildTag () {
  let config = await LoadYAMLConfig()

  let TAG = process.env.CI_COMMIT_SHORT_SHA
  let prefix = getTagPrefix(config)
  if (prefix && prefix !== '') {
    TAG = prefix + '-' + TAG
  }

  if (config.deploy.only_update_app === true) {
    TAG = TAG + '-git'
  }
  return TAG
}

module.exports = buildTag