#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as yaml from 'js-yaml'
import {BuildConfig} from '../lib/build-config'
import * as fs from 'fs'
import * as path from 'path'
import { FrontendDeployStack } from '../lib/frontend-deploy-stack';

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
    CertificateARN: ensureString(unparsedEnv as object, 'CertificateARN'),
    RunSetup: (!setup ? false: true),
    Environment: env,

    AWSAccountID: ensureString(unparsedEnv as object, 'AWSAccountID'),
    AWSProfileName: ensureString(unparsedEnv as object, 'AWSProfileName'),
    AWSProfileRegion: ensureString(unparsedEnv as object, 'AWSProfileRegion'),

    App: ensureString(unparsedEnv as object, 'App'),
    Prefix: ensureString(unparsedEnv as object, 'Prefix'),

    CorsServer: ensureString(unparsedEnv as object, 'CorsServer'),
    ApiDomainName: ensureString(unparsedEnv as object, 'ApiDomainName'),
    DomainName: ensureString(unparsedEnv as object, 'DomainName')
  }

  console.log ('buildConfig')
  console.log (buildConfig)

  return buildConfig
}

const main = async () => {
  let buildConfig: BuildConfig = getConfig();

  cdk.Tags.of(app).add('App', buildConfig.App)

  console.log ('######################################################')
  console.log ('######################################################')
  console.log ('######################################################')
  console.log (buildConfig.AWSProfileRegion)
  console.log (buildConfig.AWSAccountID)

  const stackProps: cdk.StackProps = {
    env: {
      region: buildConfig.AWSProfileRegion,
      account: buildConfig.AWSAccountID,
    },
  };

  // Check is setup has been run if environment is set
  // const a =  s3.Bucket.fromBucketName(app, buildConfig.Prefix + '-dev-upload-private', buildConfig.Prefix + '-dev-upload-private)

  console.log (app);

  if ( ['dev', 'stg', 'prd'].includes(buildConfig.Environment) ){
    let initialStackName = buildConfig.Prefix + "-" + buildConfig.Environment + '-fe-deploy'
    const mainStack = new FrontendDeployStack( app, initialStackName, buildConfig, stackProps)
  }

}

main()
