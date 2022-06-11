const getGitCommitMessage = require('./getGitCommitMessage')
const translate = require('translate')

const tagLengthLimit = 20

function filterEnglish(message) {
  message = message.toLowerCase().trim()
  message = message.replace(/\s+/g, '-').trim()
    .replace(/[^a-zA-Z0-9\-]/g, "").trim()

  while (message !== '' && message.startsWith('-')) {
    message = message.slice(1)
  }
  while (message !== '' && message.endsWith('-')) {
    message = message.slice(0, -1)
  }

  while (message.length > tagLengthLimit && message.indexOf('-') > -1) {
    message = message.slice(0, message.lastIndexOf('-'))
  }

  if (message.length > tagLengthLimit) {
    message = message.slice(0, tagLengthLimit)
  }
  
  return message
}

async function getTagPrefix () {
  let message = getGitCommitMessage()
  if (message === '') {
    return ''
  }  

  let originalMessage = message
  message = filterEnglish(message)
  if (message === '') {
    message = await translate(originalMessage, {from: 'zh', to: "en"})
    console.log('Try to translate', originalMessage, message)
    message = filterEnglish(message)
  }

  // message = message + '-'

  return message
}

module.exports = getTagPrefix