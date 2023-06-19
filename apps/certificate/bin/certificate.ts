#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as yaml from 'js-yaml'
import {BuildConfig} from '../lib/build-config'
import * as fs from 'fs'
import * as path from 'path'
import { CertificateStack } from '../lib/certificate';

const app = new cdk.App();

const ensureString: (object: { [name: string]: any }, propName: string)=>string = (object, propName) => {
  if (!object[propName] || object[propName].trim().length === 0){
    throw new Error(propName + ' does not exist or is empty')
  }
  return object[propName]
}

const getConfig = () => {

  let unparsedEnv = yaml.load(fs.readFileSync(path.resolve("./config/setup.yaml"), "utf8"))

  let buildConfig: BuildConfig = {
    App: ensureString(unparsedEnv as object, 'App'),
    Prefix: ensureString(unparsedEnv as object, 'Prefix'),
    DomainName: ensureString(unparsedEnv as object, 'DomainName'),
    AWSAccountID: ensureString(unparsedEnv as object, 'AWSAccountID'),
    AWSProfileRegion: ensureString(unparsedEnv as object, 'AWSProfileRegion'),
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

  console.log ('app')
  console.log (app)

  // Create initial stack of items we need for all environments
  let initialStackName = buildConfig.Prefix + '-setup-cert'
  const mainStack = new CertificateStack( app, initialStackName, buildConfig, stackProps)

}

main()
