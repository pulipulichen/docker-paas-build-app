const fs = require('fs')
const path = require('path')
const unzipper = require('unzipper')

const ShellExec = require('./lib/ShellExec.js')

function setupData ({BUILD_DIR, system_user}) {

  // 解壓縮
  // https://www.npmjs.com/package/unzipper
  let targetDir = `./build_tmp/data`
  let containerBackupFolder = '/paas_data/app/'

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, {recursive: true})

  let zipPath = `${BUILD_DIR}/data/app.zip`
  let copyCmd = ''
  if (fs.existsSync(zipPath)) {

    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: targetDir }))
    
    console.log('Unzip app.zip to', targetDir)

    copyCmd = `COPY ${targetDir} ${containerBackupFolder}
RUN chmod -R 777 ${containerBackupFolder}/*`

    if (system_user) {
      copyCmd += `\nRUN chown ${system_user}:${system_user} -R ${containerBackupFolder}`
    }
  }

  return {copyCmd, containerBackupFolder}
}

function setupUser (USER) {
  let setSystemUser = ''
  if (USER && USER !== 'root') {
    setSystemUser = `USER ${USER}`
  }
  return setSystemUser
}

function buildEntrypoint ({config, BUILD_DIR, REPO}) {
  let {CMD} = config.app.Dockerfile

  let script = fs.readFileSync('/app/docker-paas-build-app/scripts/entrypoint.sh', 'utf8')

  let scriptGitMode = `
# =================================
# Git Reset

#if [ $\{GIT_MODE\} ]; then
  CURRENT_DIR=\`pwd\`

  cd /paas_app/app/
  git reset --hard
  git pull origin ${REPO}

  cd $CURRENT_DIR
#fi
`
  if (config.deploy.only_update_app === true) {
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
}

function setupDockerfileCopy ({config, REPO}) {
  let { app_path } = config.app
  let app_path_parent = path.dirname(app_path)
  let app_path_basename = path.basename(app_path)

  const APP_GIT_URL = config.environment.build.app_git_url
  let REPO_NAME = APP_GIT_URL.slice(APP_GIT_URL.lastIndexOf('/') + 1)
  REPO_NAME = REPO_NAME.slice(0, REPO_NAME.lastIndexOf('.'))

  let {username, host} = new URL(APP_GIT_URL)
  let containerAppFolder = '/paas_app/'

  let dockerfileAppGit = `
# APP GIT
#ENV GIT_MODE=true
RUN mkdir ${containerAppFolder}
WORKDIR ${containerAppFolder}
RUN git clone --no-checkout ${APP_GIT_URL}

WORKDIR ${containerAppFolder}${REPO_NAME}/
RUN git config --global user.email "${username}@${host}"
RUN git config --global user.name "${username}"
RUN git checkout -b ${REPO} || git checkout ${REPO}
RUN git config --global pull.rebase true

# APP
RUN rm -rf ${app_path}
RUN ln -s ${containerAppFolder}${REPO_NAME} ${app_path_parent}
RUN mv ${app_path_parent}/${REPO_NAME} ${app_path_parent}/${app_path_basename}
`

  let dockerfileCopy = `
COPY app/ ${app_path}
`

  if (config.deploy.only_update_app === true) {
    dockerfileCopy = dockerfileAppGit
  }

  return dockerfileCopy
}

// ----------------------------------------------------------------

module.exports = async function (config) {

  // 這是Gitlab CI Runner的路徑
  const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
  process.chdir(BUILD_DIR)

  const REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  console.log("REPO: " + REPO)

  let { USER, CMD } = config.app.Dockerfile
  let { app_path, data_path } = config.app
  let system_user = USER

  fs.mkdirSync('./build_tmp/')
  await ShellExec(`echo build_tmp >> .dockerignore`)

  // ------------------------------------
  // 處理備份檔案問題
  let {copyCmd} = setupData({BUILD_DIR, system_user})

  // ----------------------------------------------------
  let setSystemUser = setupUser(USER)

  // ----------------------------------------------------
  // 建立 entrypoint.sh
  buildEntrypoint({config, BUILD_DIR, REPO})

  // ----------------------------------------------------
  // Git

  let dockerfileCopy = setupDockerfileCopy({config, REPO})

  // ------------------------
  // Build Dockerfile
  let BaseDockerfile = fs.readFileSync(`./deploy/Dockerfile`, 'utf8')
  let TZ = config.environment.app.app.Dockerfile.TZ
  let containerEntrypointFolder = '/paas_data/'

  let dockerfile = `${BaseDockerfile}

# Timezone
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=${TZ}
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata
    
RUN TZ=${TZ} \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata 
ENV TIMEZONE=${TZ}

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
COPY build_tmp/entrypoint.sh ${containerEntrypointFolder}
RUN chmod 777 ${containerEntrypointFolder}entrypoint.sh

CMD ["sh", "${containerEntrypointFolder}entrypoint.sh"]

WORKDIR ${app_path}

# USER 一定要最後設定
${setSystemUser}

RUN echo "${new Date()}"
`
  
  console.log('====================')
  console.log(dockerfile)
  console.log('====================\n\n')

  fs.writeFileSync('./build_tmp/Dockerfile', dockerfile, 'utf8')
  console.log('created')
}