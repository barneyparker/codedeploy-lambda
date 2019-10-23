const AWS = require('aws-sdk')
const open = require('open')

const reportDeployProgress = require('./reportDeploymentProgress')

module.exports = monitorDeployment = (deployment, config) => new Promise((resolve, reject) => {
  let current_state = 'NotStarted'

  let percentage = 0.0

  const codedeploy = new AWS.CodeDeploy({ region: 'eu-west-1'})

  let monitor = setInterval(async () => {
    const progress = await codedeploy.getDeployment(deployment).promise()

    // Ensure we transition to the latest state
    if (current_state !== progress.deploymentInfo.status) {
      current_state = progress.deploymentInfo.status

      console.log(`Deployment Status: ${current_state}`)

      if (current_state === 'InProgress' && config.console) {
        await open(`https://eu-west-1.console.aws.amazon.com/codesuite/codedeploy/deployments/${deployment.deploymentId}?region=eu-west-1`)
      }
    }

    switch (progress.deploymentInfo.status) {
      case 'Created':
      case 'Queued':
      case 'Ready':
        break
      case 'InProgress':
        percentage = await reportDeployProgress(config.function, config.alias, percentage, config.target)
        break
      case 'Succeeded':
      case 'Failed':
      case 'Stopped':
        clearInterval(monitor)
        console.log()
        break
    }
  }, 1000)
})