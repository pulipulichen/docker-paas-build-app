const LoadYAMLConfig = require('./LoadYAMLConfig.js')
const sleep = require('./sleep.js');

const axios = require('axios')
const axiosRetry = require('axios-retry')
axiosRetry(axios, { retries: 10 })
axiosRetry(axios, { retryDelay: (retryCount) => {
    return retryCount * 1000;
}})

let api = `https://script.google.com/macros/s/AKfycbyOJkmPXyKQDIDwKrkCeltOYXUN2zcAt47PCFA7mrkKbplUf_-1_qtHouKbtdbgRsWN/exec`
let view = `https://docs.google.com/spreadsheets/d/11U6a_gZTz0Gq3nmO2e_1qfLkhqd9Q70j5M1COzndKZA/edit?usp=sharing`

let queryPassed = ['added', 'reset', 'timeout']
let name = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
let timeout = 1000 * 30 * 60

async function getKey (keySuffix) {
  let config = await LoadYAMLConfig()

  let key = config.environment.project.domain_suffix
  key = key + '_' + keySuffix

  return key
}

async function waitForLock (keySuffix = '', retry = 0) {
  let key = await getKey(keySuffix)
  
  let result = await axios.get(`${api}?key=${key}&name=${name}&timeout=${timeout}&action=query`)
  let data = result.data.result
  
  if (queryPassed.indexOf(data) === -1) {
    if (retry === 500) {
      throw new Error(`
==================
Wait for lock error. 
Please check locker: ${view}
==================
`)
    }

    console.log(`
wait for ${10*(retry + 1)} seconds ... ` + retry + `
  Check ${view}

`)
    await sleep(10000 * (retry + 1))

    retry++
    return await waitForLock(keySuffix, retry)
  }
}

async function unlock (keySuffix = '') {
  let key = await getKey(keySuffix)
  await axios.get(`${api}?key=${key}&name=${name}&action=remove`)
}

module.exports = {
  lock: waitForLock,
  unlock
}
