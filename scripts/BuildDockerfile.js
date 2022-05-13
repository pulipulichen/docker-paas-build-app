const fs = require('fs')
const path = require('path')
const unzipper = require('unzipper')

module.exports = function (config) {

  // 這是Gitlab CI Runner的路徑
  const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
  
  let { USER, CMD } = config.app.Dockerfile
  let system_user = USER

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
    copyCmd = `COPY ${targetDir} ${containerBackupFolder}`

    if (system_user) {
      copyCmd += `\nRUN chown ${system_user}:${system_user} -R ${containerBackupFolder}`
    }
  }

  // ----------------------------------------------------
  let setSystemUser = ''
  if (USER && USER !== 'root') {
    setSystemUser = `USER ${USER}`
  }

  // ----------------------------------------------------
  // 建立 entrypoint.sh
  let script = fs.readFileSync('/app/docker-paas-build-app/scripts/entrypoint.sh', 'utf8')
  script = script + '\n' + CMD + '\n\n'
  fs.writeFileSync('entrypoint.sh', script, 'utf8')

  console.log('====================')
  console.log(path.join(BUILD_DIR + '/entrypoint.sh'))
  console.log('====================')
  console.log(script)
  console.log('====================\n\n')

  // ------------------------

  dockerfile = `FROM ${dockerImage}

# WEBSSH
RUN apt update
RUN apt-get install -y openssh-server
RUN systemctl enable ssh
RUN echo "PermitRootLogin yes" >> /etc/ssh/sshd_config

# DATA
ENV DATA_PATH=${dataPath}
${copyCmd}

COPY entrypoint.sh ${containerBackupFolder}
RUN chmod 777 ${containerBackupFolder}entrypoint.sh

CMD ["sh", "${containerBackupFolder}entrypoint.sh"]


${setSystemUser}
`
  
  console.log('====================')
  console.log(dockerfile)
  console.log('====================\n\n')

  fs.writeFileSync('Dockerfile', dockerfile, 'utf8')
  console.log('created')
}