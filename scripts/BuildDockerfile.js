const fs = require('fs')
const path = require('path')
const unzipper = require('unzipper')

const ShellExec = require('./lib/ShellExec.js')

module.exports = async function (config) {

  // 這是Gitlab CI Runner的路徑
  const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
  process.chdir(BUILD_DIR)

  const REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  console.log("REPO: " + REPO)

  let { USER, CMD } = config.app.Dockerfile
  let { app_path, data_path } = config.app
  let app_path_parent = path.dirname(app_path)
  let system_user = USER

  fs.mkdirSync('./build_tmp/')
  await ShellExec(`echo build_tmp >> .dockerignore`)

  // ------------------------------------
  // 處理備份檔案問題

  // 解壓縮
  // https://www.npmjs.com/package/unzipper
  let targetDir = `${BUILD_DIR}/build_tmp/data`
  let containerBackupFolder = '/paas_data/'

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, {recursive: true})

  let zipPath = `${BUILD_DIR}/data/app.zip`
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

  let scriptGitMode = `
# =================================
# Git Reset

if [ $\{GIT_MODE\} ]; then
  CURRENT_DIR=\`pwd\`

  cd /paas_app/app/
  git reset --hard
  git pull

  cd $CURRENT_DIR
fi
`
  if (config.deploy.git_mode === 'true') {
    script += scriptGitMode
  }
  

  let scriptCMD = `

# =================================
# Original Command:
${CMD}

`

  script += scriptCMD

  fs.writeFileSync('./build_tmp/entrypoint.sh', script, 'utf8')

  console.log('====================')
  console.log(path.join(BUILD_DIR, '/build_tmp/entrypoint.sh'))
  console.log('====================')
  console.log(script)
  console.log('====================\n\n')

  // ----------------------------------------------------
  // Git

  const APP_GIT_URL = config.environment.build.app_git_url
  let REPO_NAME = APP_GIT_URL.slice(APP_GIT_URL.lastIndexOf('/') + 1)
  REPO_NAME = REPO_NAME.slice(0, REPO_NAME.lastIndexOf('.'))

  let {username, host} = new URL(APP_GIT_URL)
  let containerAppFolder = '/paas_app/'

  let dockerfileAppGit = `
# APP GIT
ENV GIT_MODE=true
RUN mkdir ${containerAppFolder}
WORKDIR ${containerAppFolder}
RUN git clone ${APP_GIT_URL}

WORKDIR ${containerAppFolder}${REPO_NAME}/
RUN git config --global user.email "${username}@${host}"
RUN git config --global user.name "${username}"
RUN git checkout -b ${REPO} || git checkout ${REPO}

# APP
RUN rm -rf ${app_path}
RUN ln -s ${containerAppFolder}${REPO_NAME} ${app_path_parent}
`

  let dockerfileCopy = `
COPY app/ ${app_path}
`

  if (config.deploy.git_mode === 'true') {
    dockerfileCopy = dockerfileAppGit
  }


  // ------------------------
  // Base Dockerfile
  let BaseDockerfile = fs.readFileSync(`./deploy/Dockerfile`, 'utf8')

  // ------------------------

  let dockerfile = `${BaseDockerfile}

# WEBSSH
RUN apt update
RUN apt-get install -y openssh-server
RUN systemctl enable ssh
RUN echo "PermitRootLogin yes" >> /etc/ssh/sshd_config

# DATA
ENV DATA_PATH=${data_path}
${copyCmd}

${dockerfileCopy}

# ENTRYPOINT
COPY build_tmp/entrypoint.sh ${containerBackupFolder}
RUN chmod 777 ${containerBackupFolder}entrypoint.sh

CMD ["sh", "${containerBackupFolder}entrypoint.sh"]

WORKDIR ${app_path}

# USER 一定要最後設定
${setSystemUser}
`
  
  console.log('====================')
  console.log(dockerfile)
  console.log('====================\n\n')

  fs.writeFileSync('./build_tmp/Dockerfile', dockerfile, 'utf8')
  console.log('created')
}