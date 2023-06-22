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
      const importBkt = cdk.Fn.importValue(buildConfig.Prefix + "-deploy-arn");
  
      const deployBucket = s3.Bucket.fromBucketArn(this, "DeployBucket", importBkt);
      // const cert = cm.Certificate.fromCertificateArn(this, "Certificate", importCert);
  
      const cert = cm.Certificate.fromCertificateArn(
        this,
        "Certificate",
        buildConfig.CertificateARN
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

      const s3Bucket = new s3.Bucket(this, 'S3Bucket', {
        bucketName: `poo-poo-poo-poo-poo-poo-poo-poo-poo`,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      // 
// WORKED WITHOUT THE FUNCTION

      const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
        comment: `OAI for ${buildConfig.DomainName}`,
      });

      // deployBucket.addToResourcePolicy(new iam.PolicyStatement({
      //   actions: ['s3:GetObject'],
      //   resources: [deployBucket.arnForObjects('*')],
      //   principals: [new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      // }));

      // const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersResponseHeaderPolicy', {
      //   comment: 'Security headers response header policy',
      //   securityHeadersBehavior: {
      //     contentSecurityPolicy: {
      //       override: true,
      //       contentSecurityPolicy: "default-src 'self'"
      //     },
      //     strictTransportSecurity: {
      //       override: true,
      //       accessControlMaxAge: cdk.Duration.days(2 * 365),
      //       includeSubdomains: true,
      //       preload: true
      //     },
      //     contentTypeOptions: {
      //       override: true
      //     },
      //     referrerPolicy: {
      //       override: true,
      //       referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
      //     },
      //     xssProtection: {
      //       override: true,
      //       protection: true,
      //       modeBlock: true
      //     },
      //     frameOptions: {
      //       override: true,
      //       frameOption: cloudfront.HeadersFrameOption.DENY
      //     }
      //   }
      // });

      const sf = new cloudfront.Distribution(this, 'Distribution', {
        defaultBehavior: {
          // origin: new cdk.aws_cloudfront_origins.S3Origin(s3Bucket),
          origin: new origins.S3Origin(deployBucket, {
            originAccessIdentity: originAccessIdentity
          }),
          functionAssociations: [
            {
              function: htmlMapperFn,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
          viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          // responseHeadersPolicy: responseHeaderPolicy,
        },
        domainNames: [`${buildConfig.DomainName}`],
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
  
      const cfRecord = new cdk.aws_route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: buildConfig.DomainName,
        target: cdk.aws_route53.RecordTarget.fromAlias(
          new cdk.aws_route53_targets.CloudFrontTarget(sf)
        ),
      });
  
      new s3deploy.BucketDeployment(this, 'S3BucketDeploy', {
        sources: [s3deploy.Source.asset('../frontend/out')],
        destinationBucket: s3Bucket,
        distribution: sf,
        distributionPaths: ['/*'],
      });

      let exportName = buildConfig.Prefix + "-deploy-url" 
      new cdk.CfnOutput(this, exportName, { value: `https.${buildConfig.DomainName}`, exportName }); 
  }
}
