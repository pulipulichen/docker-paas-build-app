

const fs = require('fs')
const path = require('path')

const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)

function getGitCommitMessage () {
  let message = ''

  let filePathList = [
    'config/git_commit_message.txt',
    'commit_message.txt'
  ]

  for (let i = 0; i < filePathList.length; i++) {
    let filePath = filePathList[i]

    if (fs.existsSync(path.join(BUILD_DIR, filePath))) {
      message = fs.readFileSync(path.join(BUILD_DIR, filePath), 'utf8')
      return message
    }
  }
  return ''
}

module.exports = getGitCommitMessage