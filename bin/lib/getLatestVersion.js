const AWS = require('aws-sdk')

module.exports = getLatestVersion = (function_name) => new Promise(async (resolve, reject) => {
  const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: 'eu-west-1' })

  const params = {
    FunctionName: function_name,
    MaxItems: 1000
  }

  try {
    let marker
    const all_versions = []

    do {

      if (marker) {
        params.Marker = marker
      }

      const versions = await lambda.listVersionsByFunction(params).promise()

      marker = versions.NextMarker

      versions.Versions.forEach(version => {
        all_versions.push(version.Version)
      })
    } while (marker !== null)

    resolve(all_versions.reduce((acc, version) => version === '$LATEST' ? acc : Math.max(acc, version), 0))
  } catch (err) {
    reject({
      function: 'getLatestVersion',
      message: err.message,
      params
    })
  }
})