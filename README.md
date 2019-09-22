# CodeDeploy-Lambda

CodeDeploy-Lambda is a simple script to upload lambda code, publish a new version and deploy it to a Lambda Alias using AWS CodeDeploy.

In order for this command to work, the Lambda function, its Alias, a CodeDeploy Application and Deployment Group must already exist.

The utility was created to replace a few AWS Cli commands I would normally use to deploy functions from the desktop, or in a custom CI/CD solution.

## Installation

```
npm install --global codedeploy-lambda
```

## Examples

```
codedeploy-lambda -z ./lambda-bundle.zip -a demo-app -g demo-group -t myAlias demo-lambda --console
```

## Usage

```
codedeploy-lambda -a <app> -g <group> -t <alias name> [-z <bundle path>] [-v <Lambda Version>] <function name>
  Required Parameters
    -a: CodeDeploy Application Name
    -g: CodeDeploy Deployment Group Name
    -t: Lambda Alias Name
  Option Parameters
    -z: path to zip containing updated function code
    -v: Target Lambda Version ($LATEST if not provided)
  --console: show AWS CodeDeploy Console on deploy
  --help: show these instructions
```

## Contributing

Pull requests are always welcome!  This tool was originally made for my own use, but has turned out to be useful for others.  Any potential improvements are gratefully recieved.

## License

CodeDeploy-Lambda is [MIT Licensed](/LICENSE)
