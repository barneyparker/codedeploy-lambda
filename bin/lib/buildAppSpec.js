module.exports = buildAppSpec = (config) => new Promise((resolve, reject) => {

  if (config.source === config.target) {
    reject({
      function: 'buildAppSpec',
      message: `Alias already targets: v${config.target}`
    })
  }

  resolve(`version: 0.0
Resources:
  - LambdaFunction:
      Type: AWS::Lambda::Function
      Properties:
        Name: "${config.function}"
        Alias: "${config.alias}"
        CurrentVersion: "${config.source}"
        TargetVersion: "${config.target}"
`)
})
