const LoadYAMLConfig = require('./LoadYAMLConfig.js')
const sleep = require('./sleep.js');

const axios = require('axios')
const axiosRetry = require('axios-retry')
axiosRetry(axios, { retries: 10 })
axiosRetry(axios, { retryDelay: (retryCount) => {
    return retryCount * 1000;
}})

let queryPassed = ['added', 'reset', 'timeout']
let name = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE

async function getKey (keySuffix) {
  let config = await LoadYAMLConfig()

  let key = config.environment.project.domain_suffix
  key = key + '_' + keySuffix

  return key
}

async function waitForLock (keySuffix = '', retry = 0) {
  let key = await getKey(keySuffix)
  
  let result = await axios.get(`https://script.google.com/macros/s/AKfycbwFrwCzBPXQa9XFY1_TwdibIJkfv-Z7Ilwxcn3piaO8NFnIBIeDGHZD2fBh3Hz2AKJU/exec?key=${key}&name=${name}&action=query`)
  let data = result.data.result
  
  if (queryPassed.indexOf(data) === -1) {
    if (retry === 500) {
      throw new Error(`
==================
Wait for lock error. 
Please check locker: https://docs.google.com/spreadsheets/d/11U6a_gZTz0Gq3nmO2e_1qfLkhqd9Q70j5M1COzndKZA/edit?usp=sharing
==================
`)
    }

    await sleep(10000 * (retry + 1))

    retry++
    return await waitForLock(keySuffix, retry)
  }
}

async function unlock (keySuffix = '') {
  let key = await getKey(keySuffix)
  await axios.get(`https://script.google.com/macros/s/AKfycbwFrwCzBPXQa9XFY1_TwdibIJkfv-Z7Ilwxcn3piaO8NFnIBIeDGHZD2fBh3Hz2AKJU/exec?key=${key}&name=${name}&action=remove`)
}

module.exports = {
  lock: waitForLock,
  unlock
}
