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

      // Get the hosted zone
      const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
        domainName: buildConfig.DomainName
      })
  
      const importCert = cdk.Fn.importValue(buildConfig.Prefix + "-cert-arn");
      // const cfDevBktArn = cdk.Fn.importValue(buildConfig.Prefix + "-cd-bucket-dev-arn");
      const cfStgBktArn = cdk.Fn.importValue(buildConfig.Prefix + "-cd-bucket-stg-arn");
      const cfProdBktArn = cdk.Fn.importValue(buildConfig.Prefix + "-cd-bucket-prod-arn");
  
      // const cfDevBkt = s3.Bucket.fromBucketArn(this, "cfDevBktArn", cfDevBktArn);
      const cfStgBkt = s3.Bucket.fromBucketArn(this, "cfStgBktArn", cfStgBktArn);
      const cfProdBkt = s3.Bucket.fromBucketArn(this, "cfProdBktArn", cfProdBktArn);

      const cert = cm.Certificate.fromCertificateArn(
        this,
        "Certificate",
        buildConfig.CertificateARN
      );

      const htmlMapperFn = new cloudfront.Function(
        this,
        'html-mapper-dev-fn',
        {
          functionName: 'html-mapper-dev-dev',
          code: cdk.aws_cloudfront.FunctionCode.fromFile({
            filePath: path.join(__dirname, '../dist/lib/src/html-mapper-fn/index.js'),
          }),
        }
      )


      // Deployment bucket
      const depBucketName = buildConfig.Prefix + "-dep"
    
      const cfDevBkt = new s3.Bucket(this, depBucketName, {
        bucketName: depBucketName,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        accessControl: s3.BucketAccessControl.PRIVATE,
        versioned: false,
        publicReadAccess: false,
        encryption: s3.BucketEncryption.S3_MANAGED,
      });

      const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
        comment: `OAI for ${buildConfig.DomainName}`,
      });

      const sf = new cloudfront.Distribution(this, 'Distribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(cfDevBkt, {
            originAccessIdentity: originAccessIdentity
          }),
          viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [
            {
              function: htmlMapperFn,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        domainNames: [`dev.${buildConfig.DomainName}`],
        certificate: cert,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        enableIpv6: true,
        defaultRootObject: 'index.html',
        errorResponses: [
          // {
          //   httpStatus: 403,
          //   responsePagePath: '/index.html',
          //   responseHttpStatus: 200,
          //   ttl: cdk.Duration.minutes(0),
          // },
          {
            httpStatus: 404,
            responseHttpStatus: 404,
            responsePagePath: '/404.html',
          },
        ],
      });

      const policy = new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [cfDevBkt.bucketArn + "/*"],
        principals: [
            new iam.ServicePrincipal('cloudfront.amazonaws.com')
        ],
        conditions: [
            {
                "StringEquals": {
                    "AWS:SourceArn": sf
                }
            }
        ]
    });

    cfDevBkt.addToResourcePolicy(policy);
  
      const cfRecord = new cdk.aws_route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: 'dev.'+buildConfig.DomainName,
        target: cdk.aws_route53.RecordTarget.fromAlias(
          new cdk.aws_route53_targets.CloudFrontTarget(sf)
        ),
      });
  
      new s3deploy.BucketDeployment(this, 'S3BucketDeploy', {
        sources: [s3deploy.Source.asset('../frontend/out')],
        destinationBucket: cfDevBkt,
        distribution: sf,
        distributionPaths: ['/*'],
      });

      let exportName = buildConfig.Prefix + "-deploy-url" 
      new cdk.CfnOutput(this, exportName, { value: `https.${buildConfig.DomainName}`, exportName }); 
  }
}
