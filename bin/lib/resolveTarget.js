const getLatestVersion = require('./getLatestVersion')

module.exports = resolveTarget = (config) => new Promise(async (resolve, reject) => {
  // If necessary, get the latest published version number as out target
  try {
    if (config.target === '0') {
      // defaulted to zero, so get the $LATEST
      const latest = await getLatestVersion(config.function)
      resolve(latest)
    } else if (isNaN(config.target)) {
      // We've got a source tag to discover the version number
      const version = await getAliasVersion(config.function, config.target)
      resolve(version)
    } else {
      resolve(config.target)
    }
  } catch(err) {
    reject(err)
  }
})