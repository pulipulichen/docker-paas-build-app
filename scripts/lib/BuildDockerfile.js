const fs = require('fs')
const path = require('path')
const unzipper = require('unzipper')

module.exports = function (config) {

  // 這是Gitlab CI Runner的路徑
  const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)

  
  // 解壓縮
  // https://www.npmjs.com/package/unzipper
  let targetDir = './paas_backup/'
  let containerBackupFolder = '/paas_backup/'

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir)

  let zipPath = `./data/app.zip`
  let copyCmd = ''
  if (fs.existsSync(zipPath)) {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: targetDir }))
    copyCmd = `COPY ${targetDir} /backup/`

    if (system_user) {
      copyCmd += `\nRUN chown ${system_user}:${system_user} -R /backup/`
    }
  }

  // 建立 build-init.sh
  let script = fs.readFileSync('/app/scripts/build-init.sh', 'utf8')
  script = script + '\n' + cmd + '\n\n'
  fs.writeFileSync('build-init.sh', script, 'utf8')

  console.log('====================')
  console.log(path.join(BUILD_DIR + '/build-init.sh'))
  console.log('====================')
  console.log(script)
  console.log('====================\n\n')

  // ------------------------

  dockerfile = `FROM ${dockerImage}

ENV DATA_PATH=${dataPath}

${copyCmd}
COPY build-init.sh /backup/build-init.sh
RUN chmod 777 /backup/build-init.sh

CMD ["sh", "/backup/build-init.sh"]


${setSystemUser}
`
  
  console.log('====================')
  console.log(dockerfile)
  console.log('====================\n\n')

  fs.writeFileSync('Dockerfile', dockerfile, 'utf8')
  console.log('created')
}