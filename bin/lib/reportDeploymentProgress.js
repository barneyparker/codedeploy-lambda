const AWS = require('aws-sdk')

module.exports = reportDeployProgress = async (function_name, alias_name, percentage, target) => {
  const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: 'eu-west-1' })

  try {
    const alias = await lambda.getAlias({
      FunctionName: function_name,
      Name: alias_name
    }).promise()

    if (alias.RoutingConfig) {
      const newPercentage = parseFloat(alias.RoutingConfig.AdditionalVersionWeights[target.toString()])
      if (newPercentage !== percentage) {
        const src_perc = Math.trunc((1.0 - newPercentage) * 100) + '%'
        const dst_perc = Math.trunc(newPercentage * 100) + '%'
        process.stdout.clearLine()
        process.stdout.cursorTo(0)
        process.stdout.write(`${alias.FunctionVersion} => v${src_perc} :: ${target} => v${dst_perc}`)
        return newPercentage
      }
    }
  } catch (err) {
    PromiseRejectionEvent({
      function: 'reportDeployProgress',
      message: err.message
    })
  }

  return percentage
}