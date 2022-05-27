const { exec } = require("child_process")
const sleep = require("./sleep.js")

module.exports = async function (cmd, options = {}) {
  if (Array.isArray(cmd)) {
    cmd = cmd.join(' && ')
  }

  let {stderrHandler, errorHandler, retry} = options
  
  if (typeof(stderrHandler) !== 'function') {
    stderrHandler = function (stderr) {
      console.log(`[STDERR] ${stderr}`);
    }
  }

  if (typeof(errorHandler) !== 'function') {
    errorHandler = function (error, reject) {
      console.error(`[ERROR]\n${error.message}`)
      reject(error)
      return
    }
  }

  let currentRetry = 0
  let run = async () => {
    return new Promise(function (resolve, reject) {

      exec(cmd , async (error, stdout, stderr) => {
        if (error) {
          if (currentRetry === retry) {
            return errorHandler(error, reject)
          }
          currentRetry++
          await sleep((retry + 1) * 5 * 1000)
          resolve(await run())
        }
        if (stderr) {
          stderrHandler(stderr);
        }

        if (stdout.trim() !== '') {
          console.log(`[STDOUT] ${stdout}`)
        }
        
        resolve(`[STDOUT]\n${stdout}`)
      });
    })     
  }

  return await run()
}