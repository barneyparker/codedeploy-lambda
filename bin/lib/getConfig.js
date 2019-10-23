const commandLineArgs = require('command-line-args')

const fs = require('fs')
const displayHelp = require('./displayHelp')

const FileDetails = filename => {
  return {
    name: filename,
    exists: fs.existsSync(filename)
  }
}

const configDefenition = [
  { name: 'app',     alias: 'a', type: String, defaultValue: 'undefined' },
  { name: 'group',   alias: 'g', type: String, defaultValue: 'undefined' },
  { name: 'alias',   alias: 'A', type: String, defaultValue: 'undefined' },
  { name: 'bundle',  alias: 'b', type: FileDetails, defaultValue: { name: '', exists: false} },
  { name: 'target',  alias: 't', defaultValue: 0 },
  { name: 'console', alias: 'c', type: Boolean, defaultValue: false},
  { name: 'function', defaultOption: true},
  { name: 'help', alias: 'h', type: Boolean, defaultValue: false}
]

module.exports = getConfig = () => {
  const config = commandLineArgs(configDefenition)

  if (config.help) {
    displayHelp()
  }

  return config
}