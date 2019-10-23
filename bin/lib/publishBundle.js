const AWS = require('aws-sdk')

module.exports = publishBundle = (bundle, function_name) => new Promise(async (resolve, reject) => {

  const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: 'eu-west-1' })

  const params = {
    FunctionName: function_name,
    Publish: true,
    ZipFile: bundle
  }

  try {
    //publish it!
    const update = await lambda.updateFunctionCode(params).promise()

    resolve(update)
  } catch (err) {
    reject({
      function: 'publishBundle',
      message: err.message,
      params
    })
  }
})