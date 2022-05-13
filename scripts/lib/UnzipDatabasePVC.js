const fs = require('fs')
const path = require('path')
const { exec } = require("child_process");

module.exports = function (config) {
  const BUILD_DIR = path.join('/builds/', process.env.CI_PROJECT_NAMESPACE, process.env.CI_PROJECT_NAME)

  return new Promise(function (resolve, reject) {
    exec(`unzip ${BUILD_DIR}/data/database.zip -d ./database`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        reject(error)
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        //resolve(`stderr: ${stdout}`)
        //reject(error)
        //return;
      }
      console.log(`stdout: ${stdout}`);
      resolve(`stdout: ${stdout}`)
    });
  })
}