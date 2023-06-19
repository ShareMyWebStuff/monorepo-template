#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as yaml from 'js-yaml'
import {BuildConfig} from '../lib/build-config'
import * as fs from 'fs'
import * as path from 'path'
import { CertificateStack } from '../lib/certificate';

const app = new cdk.App();

console.log ('App')
console.log (app)
console.log ('Config get context')
console.log (app.node.tryGetContext('setup'))
console.log ('Dev get context')
console.log (app.node.tryGetContext('env'))

const ensureString: (object: { [name: string]: any }, propName: string)=>string = (object, propName) => {
  if (!object[propName] || object[propName].trim().length === 0){
    throw new Error(propName + ' does not exist or is empty')
  }
  return object[propName]
}

const getConfig = () => {

  // Check the config parameter is set
  let setup = app.node.tryGetContext('setup')
  let env = app.node.tryGetContext('env')
  console.log ('Env')
  console.log (env)
  // 
  if (( !setup && !env ) || (setup && ['dev', 'stg', 'prd'].includes(env))){
    throw new Error("Need to pass in either `-c setup=true` or `-c env=dev|stg|prd`")
    process.exit(1)
  } 

  let unparsedEnv = yaml.load(fs.readFileSync(path.resolve("./config/"+(!env?'setup':env)+'.yaml'), "utf8"))
  console.log (JSON.stringify(unparsedEnv))

  let buildConfig: BuildConfig = {
    App: ensureString(unparsedEnv as object, 'App'),
    Prefix: ensureString(unparsedEnv as object, 'Prefix'),
    DomainName: ensureString(unparsedEnv as object, 'DomainName')
  }

  console.log ('buildConfig')
  console.log (buildConfig)

  return buildConfig
}

const main = async () => {
  let buildConfig: BuildConfig = getConfig();

  cdk.Tags.of(app).add('App', buildConfig.App)

  const stackProps: cdk.StackProps = {
    env: {
      region: 'us-east-1',
    },
  };

  // Create initial stack of items we need for all environments
  let initialStackName = buildConfig.Prefix + '-setup-cert'
  const mainStack = new CertificateStack( app, initialStackName, buildConfig, stackProps)

}

main()
