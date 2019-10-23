#!/usr/bin/env node

const getConfig = require('./lib/getConfig')
const uploadBundle = require('./lib/uploadBundle')
const getAliasVersion = require('./lib/getAliasVersion')
const buildAppSpec = require('./lib/buildAppSpec.js')
const createDeployment = require('./lib/createDeployment')
const monitorDeployment = require('./lib/monitorDeployment')

const deployer = async () => {
  try {
    // Get the cli parameters
    const config = getConfig()

    // Upload the bundle if we need to
    config.target = await uploadBundle(config)

    // Get our current version
    config.source = await getAliasVersion(config.function, config.alias)

    // Build the AppSpec
    const appspec = await buildAppSpec(config)

    // Report what we're doing
    console.log(`Updating Version v${config.source} => v${config.target}`)


    // Create the deployment!
    let deployment = await createDeployment(config.app, config.group, appspec)

    // Monitor the deployment
    await monitorDeployment(deployment, config)
  } catch(err) {
    console.log(err)
  }

}

deployer()
