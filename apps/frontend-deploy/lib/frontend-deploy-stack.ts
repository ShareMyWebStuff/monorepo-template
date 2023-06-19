import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BuildConfig} from './build-config'
import * as cm from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';


export class FrontendDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props?: cdk.StackProps) {
    super(scope, id, props);

      // Get the hosted zone
      const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
        domainName: buildConfig.DomainName
      })
  
  
      const importCert = cdk.Fn.importValue(buildConfig.Prefix + "-cert-arn");
      const importBkt = cdk.Fn.importValue(buildConfig.Prefix + "-deploy-arn");
  
      const deployBucket = s3.Bucket.fromBucketArn(this, "DeployBucket", importBkt);
      // const cert = cm.Certificate.fromCertificateArn(this, "Certificate", importCert);
  
      const cert = cm.Certificate.fromCertificateArn(
        this,
        "Certificate",
        "arn:aws:acm:eu-west-2:216211142709:certificate/9d76439b-aeca-43b8-acf9-dc5f6c9f133c"
      );


      console.log ('###############################################')
      console.log ('###############################################')
      console.log('importCert 👉', importCert.toString());
      console.log ('###############################################')
      console.log ('###############################################')
      console.log('importBkt 👉', importBkt.toString());
      console.log ('###############################################')
      console.log ('###############################################')
      console.log('cert 👉', cert.certificateArn);
      console.log ('###############################################')
      console.log ('###############################################')
      console.log ('###############################################')
      console.log ('###############################################')
      console.log ('###############################################')
      console.log ('###############################################')
  
      // 👇 define GET todos function
      // const htmlMapperFn = new lambda.Function(this, 'html-mapper-dev', {
      //   // functionName: 'html-mapper-dev', 
      //   runtime: lambda.Runtime.NODEJS_16_X,
      //   handler: 'index.handler',
      //   code: lambda.Code.fromAsset(path.join(__dirname, '/src/html-mapper-fn')),
      // });
  
      // const poo = cdk.aws_cloudfront.FunctionDefinitionVersion.fromFunctionArn(this, 'html-mapper-dev', htmlMapperFn.functionArn);
      const wee = new cdk.aws_cloudfront.Function(
        this,
        'html-mapper-dev-wee',
        {
          functionName: 'html-mapper-dev-wee',
          code: cdk.aws_cloudfront.FunctionCode.fromFile({
            filePath: path.join(__dirname, '../dist/lib/src/html-mapper-fn/index.js'),
          }),
        }
      )
      const sf = new cdk.aws_cloudfront.Distribution(this, 'Distribution', {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(deployBucket),
          viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [
            {
              function: wee,
              eventType: cdk.aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        domainNames: [`www.${buildConfig.DomainName}`],
        certificate: cert,
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 404,
            responsePagePath: '/404.html',
          },
        ],
      });
  
      const cfRecord = new cdk.aws_route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: buildConfig.DomainName,
        target: cdk.aws_route53.RecordTarget.fromAlias(
          new cdk.aws_route53_targets.CloudFrontTarget(sf)
        ),
      });
  
  }
}
