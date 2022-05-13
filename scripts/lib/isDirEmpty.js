/**
 * OKOKO
 * this is my function
 * @param {*} dirname 
 * @returns 
 */
module.exports = function (dirname) {
  let files = fs.readdirSync(dirname)
  return (files.length === 0)
}
