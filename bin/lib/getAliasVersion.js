const AWS = require('aws-sdk')

module.exports =  getAliasVersion = (function_name, alias) => new Promise(async (resolve, reject) => {

  const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: 'eu-west-1' })

  const params = {
    FunctionName: function_name,
    Name: alias //needs to be more dynamic
  }

  try {
    const result = await lambda.getAlias(params).promise()

    resolve(parseInt(result.FunctionVersion))
  } catch (err) {
    reject({
      function: 'getAliasVersion',
      message: err.message,
      params
    })
  }
})