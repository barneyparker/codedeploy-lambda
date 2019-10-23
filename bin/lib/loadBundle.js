const fs = require('fs')

module.exports = loadBundle = (bundle) => new Promise((resolve, reject) => {
  try {
    // Upload the zip file
    resolve(fs.readFileSync(bundle))
  } catch (err) {
    reject({
      function: 'loadBundle',
      message: err.message
    })
  }
})