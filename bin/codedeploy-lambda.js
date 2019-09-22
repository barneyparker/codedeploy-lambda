#!/usr/bin/env node

const fs = require('fs')

const AWS = require('aws-sdk')
const minimist = require('minimist')

const open = require('open')

// AWS Resources
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: 'eu-west-1' })
const codedeploy = new AWS.CodeDeploy({ region: 'eu-west-1'})

// monitor of deployment:
let monitor = null

const getConfig = () => {
  const args = minimist(process.argv.filter(param => {
    if (param.endsWith('codedeploy-lambda') || param.endsWith('/node')) {
      return false
    }

    return true
  }))

  const config = {
    zip: args.z,
    app: args.a,
    group: args.g,
    alias: args.t,
    target: args.v || 0,
    lambda: args._[0],
    console: args.console | false
  }

  if (args.help || (!config.app || !config.group || !config.lambda || !config.alias)) {
    console.log('codedeploy-lambda -a <app> -g <group> -t <alias name> [-z <bundle path>] [-v <Lambda Version>] <function name>')
    console.log()
    console.log('  Required Parameters')
    console.log('    -a: CodeDeploy Application Name')
    console.log('    -g: CodeDeploy Deployment Group Name')
    console.log('    -t: Lambda Alias Name')
    console.log()
    console.log('  Option Parameters')
    console.log('    -z: path to zip containing updated function code')
    console.log('    -v: Target Lambda Version ($LATEST if not provided)')
    console.log()
    console.log('  --console: show AWS CodeDeploy Console on deploy')
    console.log('  --help: show these instructions')
    process.exit()
  }

  return config
}

const getBundle = (bundle_path) => {
  try {
    // Upload the zip file
    return fs.readFileSync(bundle_path)
  } catch(err) {
    return null
  }

}

const deployBundle = async (bundle_path, function_name) => {

  const bundle = bundle_path

  try {
    //publish it!
    return await lambda.updateFunctionCode({
      FunctionName: function_name,
      Publish: true,
      ZipFile: bundle
    }).promise()
  } catch(err) {
    return null
  }
}

const getLatestVersion = async (function_name) => {
  try {
    let marker
    const all_versions = []

    do {
      const params = {
        FunctionName: function_name,
        MaxItems: 1000
      }

      if(marker) {
        params.Marker = marker
      }

      const versions = await lambda.listVersionsByFunction(params).promise()

      marker = versions.NextMarker

      versions.Versions.forEach(version => {
        all_versions.push(version.Version)
      })
    } while (marker !== null)

    return all_versions.reduce((acc, version) => version === '$LATEST' ? acc : Math.max(acc, version), 0)
  } catch(err) {
    console.log(err)
    return 0
  }
}

const getCurrentVersion = async (function_name, alias) => {
  try {
    const result = await lambda.getAlias({
      FunctionName: function_name,
      Name: alias //needs to be more dynamic
    }).promise()

    return parseInt(result.FunctionVersion)
  } catch(err) {
    return 0
  }
}

const getAppSpec = (config) => {
  return `version: 0.0
Resources:
  - LambdaFunction:
      Type: AWS::Lambda::Function
      Properties:
        Name: "${config.lambda}"
        Alias: "${config.alias}"
        CurrentVersion: "${config.source}"
        TargetVersion: "${config.target}"
`
}

const reportDeployProgress = async (function_name, alias_name, percentage, target) => {
  try {
    const alias = await lambda.getAlias({
      FunctionName: function_name,
      Name: alias_name
    }).promise()

    if (alias.RoutingConfig) {
      const newPercentage = parseFloat(alias.RoutingConfig.AdditionalVersionWeights[target.toString()])
      if(newPercentage !== percentage) {
        const src_perc = Math.trunc((1.0 - newPercentage) * 100) + '%'
        const dst_perc = Math.trunc(newPercentage * 100) + '%'
        console.log(alias.FunctionVersion, ' => ', src_perc, ' :: ', alias.FunctionVersion, ' => ', dst_perc)
        return newPercentage
      }
    }
  } catch(err) {
    console.error(err)
  }

  return percentage
}

const deployer = async () => {
  const config = getConfig()

  // Update function code if requested
  if(config.zip) {
    const bundle = getBundle(config.zip)
    if(bundle === null) {
      console.log('Invalid Bundle File: ', config.zip)
      process.exit()
    }

    const publish = await deployBundle(bundle, config.lambda)
    if(publish === null) {
      console.log('Invalid Lambda Function:', config.lambda)
      process.exit()
    }
    config.target = parseInt(publish.Version)
  }

  // If necessary, get the latest published version number as out target
  if(config.target === 0) {
    config.target = await getLatestVersion(config.lambda)
    if(config.target === 0) {
      console.log('Invalid Lambda Function: ', config.lambda)
      process.exit()
    }
  }

  // Get our current version
  config.source = await getCurrentVersion(config.lambda, config.alias)
  if(config.source === 0) {
    console.log('Invalid Alias Configuration: ', config.alias)
    process.exit()
  }

  // Confirm our versions arent the same
  if(config.source === config.target) {
    console.error('Alias already targets: v', config.target)
    process.exit()
  } else {
    console.log('Updating Version v', config.source, ' => v', config.target)
  }

  // Build the AppSpec
  const appspec = getAppSpec(config)

  let deployment = null
  try {
    deployment = await codedeploy.createDeployment({
      applicationName: config.app,
      deploymentGroupName: config.group,
      revision: {
        revisionType: 'AppSpecContent',
        appSpecContent: {
          content: appspec,
        }
      }
    }).promise()
  } catch(err) {

    switch(err.code) {
      case 'ApplicationDoesNotExistException':
        console.log('Invalid CodeDeploy Application: ', config.app)
        break
      case 'DeploymentGroupDoesNotExistException':
        console.log('Invalid CodeDeploy Application Group: ', config.group)
        break
      default:
        console.log('Error: ', err.code)
        break
    }
    process.exit()
  }

  let current_state = 'NotStarted'

  let percentage = 0.0

  monitor = setInterval(async () => {
    const progress = await codedeploy.getDeployment(deployment).promise()

    // Ensure we transition to the latest state
    if (current_state !== progress.deploymentInfo.status) {
      current_state = progress.deploymentInfo.status
      console.log('Deployment Status: ', current_state)

      if(current_state === 'InProgress' && config.console) {
        await open(`https://eu-west-1.console.aws.amazon.com/codesuite/codedeploy/deployments/${deployment.deploymentId}?region=eu-west-1`)
      }
    }

    switch (progress.deploymentInfo.status) {
      case 'Created':
      case 'Queued':
      case 'Ready':
        break
      case 'InProgress':
        percentage = await reportDeployProgress(config.lambda, config.alias, percentage, config.target)
        break
      case 'Succeeded':
      case 'Failed':
      case 'Stopped':
        clearInterval(monitor)
        break
    }
  }, 1000)
}

deployer()