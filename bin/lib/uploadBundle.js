const loadBundle = require('./loadBundle')
const publishBundle = require('./publishBundle')
const resolveTarget = require('./resolveTarget')


module.exports = uploadBundle = (config) => new Promise(async (resolve, reject) => {
  try {
    // was a bundle specified
    if (config.bundle.name !== '') {
      // and does it exist?
      if(config.bundle.exists) {
        const bundle = await loadBundle(config.bundle.name)
        const publish = await publishBundle(bundle, config.function)
        resolve(parseInt(publish.Version))
      } else {
        // bundle doesn't exist...
        reject({
          function: 'uploadBundle',
          message: `Bundle "${config.bundle.name}" does not exist`,
        })
      }
    } else {
      // we never asked for one, so just validate what we did ask for....
      resolve(await resolveTarget(config))
    }
  } catch(err) {
    reject(err)
  }
})