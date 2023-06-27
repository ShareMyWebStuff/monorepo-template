import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BuildConfig} from './build-config'
import * as cm from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';


export class FrontendDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    const cfDistId = cdk.Fn.importValue(buildConfig.Prefix + `-cf-${buildConfig.Environment}-dist-id`);

    const cfBktArn = cdk.Fn.importValue(buildConfig.Prefix + `-cf-bucket-${buildConfig.Environment}-arn`);

    const cfBkt = s3.Bucket.fromBucketArn(this, `cf${buildConfig.Environment}BktArn`, cfBktArn);

      // const cfDevBktArn = cdk.Fn.importValue(buildConfig.Prefix + "-cf-bucket-dev-arn");
      // const cfStgBktArn = cdk.Fn.importValue(buildConfig.Prefix + "-cf-bucket-stg-arn");
      // const cfProdBktArn = cdk.Fn.importValue(buildConfig.Prefix + "-cf-bucket-prod-arn");
  
      // const cfDevBkt = s3.Bucket.fromBucketArn(this, "cfDevBktArn", cfDevBktArn);
      // const cfStgBkt = s3.Bucket.fromBucketArn(this, "cfStgBktArn", cfStgBktArn);
      // const cfProdBkt = s3.Bucket.fromBucketArn(this, "cfProdBktArn", cfProdBktArn);

      const cdDistId = cloudfront.Distribution.fromDistributionAttributes(this, `cd${buildConfig.Environment}DistId`, {
        distributionId: cfDistId,
        domainName: buildConfig.DomainName,
      })

      new s3deploy.BucketDeployment(this, `S3BucketDeploy-${buildConfig.Environment}`, {
        sources: [s3deploy.Source.asset('../frontend/out')],
        destinationBucket: cfBkt,
        distribution: cdDistId,
        distributionPaths: ['/*'],
      });

      let exportName = buildConfig.Prefix + "-" + buildConfig.Environment + "-deploy-url" 
      new cdk.CfnOutput(this, exportName, { value: `https.${buildConfig.DomainName}`, exportName }); 
  }
}
