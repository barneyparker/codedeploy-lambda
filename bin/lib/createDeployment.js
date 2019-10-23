const AWS = require('aws-sdk')

module.exports = createDeployment = (app, group, appspec) => new Promise(async (resolve, reject) => {
  const codedeploy = new AWS.CodeDeploy({ region: 'eu-west-1'})

  try {
    const deployment = await codedeploy.createDeployment({
      applicationName: app,
      deploymentGroupName: group,
      revision: {
        revisionType: 'AppSpecContent',
        appSpecContent: {
          content: appspec,
        }
      }
    }).promise()

    resolve(deployment)
  } catch (err) {

    switch (err.code) {
      case 'ApplicationDoesNotExistException':
        reject({
          function: 'createDeployment',
          message:`Invalid CodeDeploy Application: ${app}`
        })
      case 'DeploymentGroupDoesNotExistException':
        reject({
          function: 'createDeployment',
          message: `Invalid CodeDeploy Application Group: ${group}`
        })
      default:
        reject({
          function: 'createDeployment',
          message: err.code
        })
    }
  }
})