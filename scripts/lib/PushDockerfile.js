
const { exec } = require("child_process");

const isDirEmpty = require("./isDirEmpty")

module.exports = function (config) {
  //console.log(config)
  // let UPDATE_TAG = "false"
  // if (config.backup.persist_data === false) {
  //   UPDATE_TAG = "true"
  // }
  let UPDATE_TAG = "true"

  return new Promise(function (resolve, reject) {
    exec("/app/scripts/build-push.sh " + UPDATE_TAG , (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        reject(error)
        return;
      }
      if (stderr) {
        
        //resolve(`stderr: ${stdout}`)
        //stderr = stderr + ''
        //console.log('============================================================')
        //console.log(stderr.indexOf(' not found:'))
        //console.log(stderr.indexOf('tag does not exist:'))
        if (stderr.indexOf(' not found:') > -1 ||
            stderr.indexOf('tag does not exist:') > -1) {
          reject(stderr)
          throw Error(stderr)
        }
        else {
          console.log(`stderr: ${stderr}`);
        }

        //reject(error)
      }
      console.log(`stdout: ${stdout}`);
      resolve(`stdout: ${stdout}`)

      if (UPDATE_TAG === true) {
        console.log('============================================================')
        console.log(`TAG UPDATED: ${process.env.CI_COMMIT_SHORT_SHA}`)
        console.log('============================================================')
      }
    });
  })
}