const fs = require('fs')
const path = require('path')
const unzipper = require('unzipper')

const ShellExec = require('./lib/ShellExec.js')
const PraseDockerfile = require('./lib/PraseDockerfile.js')

async function unzip(zipPath, targetDir) {
  return new Promise(resolve => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: targetDir }))
      .on('close', () => {
        resolve()
      })
  })
}

async function setupData ({BUILD_DIR, system_user}) {

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

    await unzip(zipPath, targetDir)
    
    console.log('Unzip app.zip to', targetDir)
    await ShellExec(`ls -l ${targetDir}`)
    if (fs.readdirSync(targetDir).length === 0) {
      throw new Error(`Unzip app.zip to ${targetDir} is failed.`)
    }

    copyCmd = `COPY ${targetDir} ${containerBackupFolder}
RUN chmod -R 777 ${path.join(containerBackupFolder, '/*')}`

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

async function buildEntrypoint ({config, BUILD_DIR, REPO}) {
  let CMD = await PraseDockerfile.getCMD()

  let script = fs.readFileSync('/app/docker-paas-build-app/scripts/entrypoint.sh', 'utf8')

  let scriptGitMode = `
# =================================
# Git Reset

CURRENT_DIR=\`pwd\`

cd /paas_app/app/
echo "==[ls -l /paas_app/app/]========="
ls -l /paas_app/app/
echo "==[ls -l /]========="
ls -l /
echo "==[ls -l /app]========="
ls -l /app
echo "============"
git reset --hard
git pull origin ${REPO}

cd $CURRENT_DIR
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
  let { WORKDIR } = config.environment.app.app.Dockerfile
  let app_path = WORKDIR
  let app_path_parent = path.dirname(app_path)
  while (app_path_parent.startsWith('//')) {
    app_path_parent = app_path_parent.slice(1)
  }
  let app_path_basename = path.basename(app_path)

  const APP_GIT_URL = config.environment.build.app_git_url
  let REPO_NAME = APP_GIT_URL.slice(APP_GIT_URL.lastIndexOf('/') + 1)
  REPO_NAME = REPO_NAME.slice(0, REPO_NAME.lastIndexOf('.'))

  let {username, host} = new URL(APP_GIT_URL)
  let containerAppFolder = '/paas_app/'

  let dockerfileAppGit = `

# APP
RUN rm -rf ${app_path}

# APP GIT
#ENV GIT_MODE=true
RUN mkdir -p ${containerAppFolder}
WORKDIR ${containerAppFolder}
RUN git clone --no-checkout ${APP_GIT_URL} || echo "git is existed"

WORKDIR ${path.join(containerAppFolder,REPO_NAME)}
RUN git config --global user.email "${username}@${host}"
RUN git config --global user.name "${username}"
RUN git checkout -b ${REPO} || git checkout ${REPO}
RUN git config --global pull.rebase true

#RUN ls -l ${path.join(containerAppFolder,REPO_NAME)}

# APP
RUN rm -rf ${path.join(app_path_parent,app_path_basename)} || echo "No folder: ${path.join(app_path_parent,app_path_basename)}"
RUN rm -rf ${path.join('/tmp', REPO_NAME)}
RUN ln -s ${path.join(containerAppFolder, REPO_NAME)} /tmp
RUN mv ${path.join('/tmp', REPO_NAME)} ${path.join(app_path_parent, app_path_basename)} || echo "Same folder name: ${path.join(app_path_parent,app_path_basename)}"

#RUN ls -l ${path.join(app_path_parent)}
#RUN ls -l ${path.join(containerAppFolder, REPO_NAME)}
`

  let dockerfileCopy = `
COPY app/ ${app_path}
`

  if (config.deploy.only_update_app === true) {
    dockerfileCopy = dockerfileAppGit
  }

  return dockerfileCopy
}

async function setupQuay (config) {

  // ----------------------------------------------------------------
  // setup QUAY token

  //fs.mkdirSync('~/.docker')
  await ShellExec(`mkdir -p ~/.docker`) 
  let token = {
    "auths": {}
  }
  token.auths[config.environment.build.quay_auth_host] = {
    "auth": config.environment.build.quay_auth_token,
    "email": ""
  }
  fs.writeFileSync(process.env['HOME'] + '/.docker/config.json', JSON.stringify(token), 'utf8')
  //await ShellExec(`mv /tmp/config.json ~/.docker/`)

}

function filterDockerfile(dockerfile) {
  let lines = dockerfile.split('\n')

  return lines.filter(line => {
    line = line.trim()
    if (line.startsWith('COPY app/') || 
      line.startsWith('COPY ./app/')) {

    }
  })
}

function parseDockerfile() {
  let BaseDockerfile = fs.readFileSync(`./config/Dockerfile`, 'utf8')

  let lines = BaseDockerfile.split('\n')
  let before
  let after

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (line.startsWith('FROM')) {
      // 表示此之前的都是before
      before = lines.slice(0, i + 1).join('\n')
      after = lines.slice(i + 1).join('\n')
    }
  }
  
  return {before, after}
}

// ----------------------------------------------------------------

module.exports = async function (config) {
  await setupQuay(config)

  // 這是Gitlab CI Runner的路徑
  const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)
  process.chdir(BUILD_DIR)

  const REPO = process.env.CI_PROJECT_NAME + '-' + process.env.CI_PROJECT_NAMESPACE
  console.log("REPO: " + REPO)

  let { WORKDIR, USER} = config.environment.app.app.Dockerfile
  let { data_path } = config.app
  let system_user = USER

  fs.mkdirSync('./build_tmp/')
  await ShellExec(`echo build_tmp >> .dockerignore`)

  // ------------------------------------
  // 處理備份檔案問題
  let {copyCmd} = await setupData({BUILD_DIR, system_user})

  // ----------------------------------------------------
  let setSystemUser = setupUser(USER)

  // ----------------------------------------------------
  // 建立 entrypoint.sh
  await buildEntrypoint({config, BUILD_DIR, REPO})

  // ----------------------------------------------------
  // Git

  let dockerfileCopy = setupDockerfileCopy({config, REPO})

  // ------------------------
  // Build Dockerfile
  let BaseDockerfile = parseDockerfile()

  

  //BaseDockerfile = filterDockerfile(BaseDockerfile)

  let TZ = config.environment.app.app.Dockerfile.TZ
  let containerEntrypointFolder = '/paas_data/'

  let dockerfile = `${BaseDockerfile.before}

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

# ============================================

${BaseDockerfile.after}

# ============================================

# ENTRYPOINT
COPY build_tmp/entrypoint.sh ${containerEntrypointFolder}
RUN chmod 777 ${path.join(containerEntrypointFolder, 'entrypoint.sh')}

# ============================================

${dockerfileCopy}

CMD ["sh", "${path.join(containerEntrypointFolder, 'entrypoint.sh')}"]

WORKDIR ${WORKDIR}

# USER 一定要最後設定
${setSystemUser}

# 確保每次都能更新
RUN echo "${new Date()}"
`
  
  console.log('====================')
  console.log(dockerfile)
  console.log('====================\n\n')

  fs.writeFileSync('./build_tmp/Dockerfile', dockerfile, 'utf8')
  console.log('created')
}