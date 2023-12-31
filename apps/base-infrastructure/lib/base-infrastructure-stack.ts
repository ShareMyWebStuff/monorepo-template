import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BuildConfig} from './build-config'
import * as cm from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
// import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
// import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
// import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketType, createBucket } from '../helper/s3';
import { createCloudfront } from '../helper/cloudfront';
// import * as path from 'path';


export class BaseInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get the hosted zone
    // const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
    //   domainName: buildConfig.DomainName
    // })
    buildConfig.hostedZone = HostedZone.fromLookup(this, "HostedZone lookup", {
      domainName: buildConfig.DomainName
    })

    // The us-east-1 certificate
    buildConfig.cloudfrontCert = cm.Certificate.fromCertificateArn(
      this,
      "Cloudfront Certificate",
      buildConfig.CertificateARN
    );

    // Create the certificate
    const certificate = new cm.Certificate (this, "Certificate", {
      certificateName: buildConfig.Prefix + '-certificate',
      domainName: buildConfig.DomainName,
      subjectAlternativeNames: [`*.${buildConfig.DomainName}`],
      validation: cm.CertificateValidation.fromDns(buildConfig.hostedZone),
    })


    // Create the subdomains
    const devApiDomain = new cdk.aws_apigateway.DomainName(this, buildConfig.Prefix  + '-domain-api-dev', {
      domainName: 'api-dev.' + buildConfig.DomainName,
      certificate,
      endpointType: cdk.aws_apigateway.EndpointType.REGIONAL,
      securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
    })
    
    const stgApiDomain = new cdk.aws_apigateway.DomainName(this, buildConfig.Prefix + '-domain-api-stg', {
      domainName: 'api-stg.' + buildConfig.DomainName,
      certificate,
      endpointType: cdk.aws_apigateway.EndpointType.REGIONAL,
      securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
    })
    
    const prdApiDomain = new cdk.aws_apigateway.DomainName(this, buildConfig.Prefix + '-domain-api-prd', {
      domainName: 'api.' + buildConfig.DomainName,
      certificate,
      endpointType: cdk.aws_apigateway.EndpointType.REGIONAL,
      securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
    })
    
    const devApiDomainRS = new cdk.aws_route53.ARecord(this, buildConfig.Prefix + '-api-dev-route53', {
      zone: buildConfig.hostedZone,
      recordName: 'api-dev.' + buildConfig.DomainName, // devApiDomain.domainName,
      target: cdk.aws_route53.RecordTarget.fromAlias(new ApiGatewayDomain(devApiDomain))
    })
    
    const stgApiDomainRS = new cdk.aws_route53.ARecord(this, buildConfig.Prefix + '-api-stg-route53', {
      zone: buildConfig.hostedZone,
      recordName: 'api-stg.' + buildConfig.DomainName, // stgApiDomain.domainName,
      target: cdk.aws_route53.RecordTarget.fromAlias(new ApiGatewayDomain(stgApiDomain))
    })
    
    const prdApiDomainRS = new cdk.aws_route53.ARecord(this, buildConfig.Prefix + '-api-prd-route53', {
      zone: buildConfig.hostedZone,
      recordName: 'api.' + buildConfig.DomainName, // prdApiDomain.domainName,
      target: cdk.aws_route53.RecordTarget.fromAlias(new ApiGatewayDomain(prdApiDomain))
    })
    
    //  Create buckets
    const devPublicUploadBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-dev-upload", buildConfig )
    const devPrivateUploadBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-dev-upload-private", buildConfig )

    const stgPublicUploadBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-stg-upload", buildConfig )
    const stgPrivateUploadBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-stg-upload-private", buildConfig )


    const prdPublicUploadBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-upload", buildConfig )
    const prdPrivateUploadBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-upload-private", buildConfig )

    // Deployment bucket
    buildConfig.cfDevBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-cf-dev", buildConfig )
    buildConfig.cfStgBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-cf-stg", buildConfig )
    buildConfig.cfPrdBucket = createBucket (this, BucketType.CLOUDFRONT_HOSTING, buildConfig.Prefix + "-cf-prd", buildConfig )

    const cfDevDist = createCloudfront (this, buildConfig, 'dev')
    const cfStgDist = createCloudfront (this, buildConfig, 'stg')
    const cfPrdDist = createCloudfront (this, buildConfig, 'prd')


    // // Create cloudfront function
    // const htmlMapperFn = new cloudfront.Function(
    //   this,
    //   'html-mapper-dev-fn',
    //   {
    //     functionName: 'html-mapper-dev-dev',
    //     code: cdk.aws_cloudfront.FunctionCode.fromFile({
    //       filePath: path.join(__dirname, '../dist/src/html-mapper-fn/index.js'),
    //     }),
    //   }
    // )

    // const devOAI = new cloudfront.OriginAccessIdentity(this, 'Development OriginAccessIdentity', {
    //   comment: `OAI for dev.${buildConfig.DomainName}`,
    // });

    // const cfDevDist = new cloudfront.Distribution(this, 'Development Distribution', {
    //   defaultBehavior: {
    //     origin: new origins.S3Origin(cfDevBucket, {
    //       originAccessIdentity: devOAI
    //     }),
    //     viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     functionAssociations: [
    //       {
    //         function: htmlMapperFn,
    //         eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
    //       },
    //     ],
    //   },
    //   domainNames: [`dev.${buildConfig.DomainName}`],
    //   certificate: cert,
    //   minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    //   httpVersion: cloudfront.HttpVersion.HTTP2,
    //   enableIpv6: true,
    //   defaultRootObject: 'index.html',
    //   errorResponses: [
    //     // {
    //     //   httpStatus: 403,
    //     //   responsePagePath: '/index.html',
    //     //   responseHttpStatus: 200,
    //     //   ttl: cdk.Duration.minutes(0),
    //     // },
    //     {
    //       httpStatus: 404,
    //       responseHttpStatus: 404,
    //       responsePagePath: '/404.html',
    //     },
    //   ],
    // });

    // const cfDevTarget = new cdk.aws_route53_targets.CloudFrontTarget(cfDevDist);

    // new cdk.aws_route53.ARecord(this, 'Dev Alias Cloudfront', {
    //   zone: hostedZone,
    //   recordName: 'dev.'+buildConfig.DomainName,
    //   target: cdk.aws_route53.RecordTarget.fromAlias( cfDevTarget ),
    // });

    // const stgOAI = new cloudfront.OriginAccessIdentity(this, 'Staging OriginAccessIdentity', {
    //   comment: `OAI for stg.${buildConfig.DomainName}`,
    // });

    // const cfStgDist = new cloudfront.Distribution(this, 'Staging Distribution', {
    //   defaultBehavior: {
    //     origin: new origins.S3Origin(cfStgBucket, {
    //       originAccessIdentity: stgOAI
    //     }),
    //     viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     functionAssociations: [
    //       {
    //         function: htmlMapperFn,
    //         eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
    //       },
    //     ],
    //   },
    //   domainNames: [`stg.${buildConfig.DomainName}`],
    //   certificate: cert,
    //   minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    //   httpVersion: cloudfront.HttpVersion.HTTP2,
    //   enableIpv6: true,
    //   defaultRootObject: 'index.html',
    //   errorResponses: [
    //     // {
    //     //   httpStatus: 403,
    //     //   responsePagePath: '/index.html',
    //     //   responseHttpStatus: 200,
    //     //   ttl: cdk.Duration.minutes(0),
    //     // },
    //     {
    //       httpStatus: 404,
    //       responseHttpStatus: 404,
    //       responsePagePath: '/404.html',
    //     },
    //   ],
    // });

    // const cfStgTarget = new cdk.aws_route53_targets.CloudFrontTarget(cfStgDist);

    // new cdk.aws_route53.ARecord(this, 'Staging Alias Cloudfront', {
    //   zone: hostedZone,
    //   recordName: 'stg.'+buildConfig.DomainName,
    //   target: cdk.aws_route53.RecordTarget.fromAlias( cfStgTarget ),
    // });

    // const prodOAI = new cloudfront.OriginAccessIdentity(this, 'Production OriginAccessIdentity', {
    //   comment: `OAI for ${buildConfig.DomainName}`,
    // });

    // const cfProdDist = new cloudfront.Distribution(this, 'Production Distribution', {
    //   defaultBehavior: {
    //     origin: new origins.S3Origin(cfStgBucket, {
    //       originAccessIdentity: stgOAI
    //     }),
    //     viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     functionAssociations: [
    //       {
    //         function: htmlMapperFn,
    //         eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
    //       },
    //     ],
    //   },
    //   domainNames: [`${buildConfig.DomainName}`],
    //   certificate: cert,
    //   minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    //   httpVersion: cloudfront.HttpVersion.HTTP2,
    //   enableIpv6: true,
    //   defaultRootObject: 'index.html',
    //   errorResponses: [
    //     // {
    //     //   httpStatus: 403,
    //     //   responsePagePath: '/index.html',
    //     //   responseHttpStatus: 200,
    //     //   ttl: cdk.Duration.minutes(0),
    //     // },
    //     {
    //       httpStatus: 404,
    //       responseHttpStatus: 404,
    //       responsePagePath: '/404.html',
    //     },
    //   ],
    // });

    // const cfProdTarget = new cdk.aws_route53_targets.CloudFrontTarget(cfProdDist);

    // new cdk.aws_route53.ARecord(this, 'Production Alias Cloudfront', {
    //   zone: hostedZone,
    //   recordName: buildConfig.DomainName,
    //   target: cdk.aws_route53.RecordTarget.fromAlias( cfProdTarget ),
    // });


    // new s3deploy.BucketDeployment(this, 'S3BucketDeploy', {
    //   sources: [s3deploy.Source.asset('../frontend/out')],
    //   destinationBucket: cfDevBucket,
    //   distribution: sf,
    //   distributionPaths: ['/*'],
    // });

    // Stack outputs
    // - Certificate ARN
    let exportName = buildConfig.Prefix + '-cert-arn'
    new cdk.CfnOutput(this, exportName, { value: certificate.certificateArn, exportName }); 

    // Cloudfront distributuion
    exportName = buildConfig.Prefix + '-cf-dev-dist-id'
    new cdk.CfnOutput(this, exportName, { value: cfDevDist.distributionId, exportName });
    exportName = buildConfig.Prefix + '-cf-dev-dist-domain-name'
    new cdk.CfnOutput(this, exportName, { value: cfDevDist.distributionDomainName, exportName });

    exportName = buildConfig.Prefix + '-cf-stg-dist-id'
    new cdk.CfnOutput(this, exportName, { value: cfStgDist.distributionId, exportName });
    exportName = buildConfig.Prefix + '-cf-stg-dist-domain-name'
    new cdk.CfnOutput(this, exportName, { value: cfStgDist.distributionDomainName, exportName });

    exportName = buildConfig.Prefix + '-cf-prd-dist-id'
    new cdk.CfnOutput(this, exportName, { value: cfPrdDist.distributionId, exportName });
    exportName = buildConfig.Prefix + '-cf-prd-dist-domain-name'
    new cdk.CfnOutput(this, exportName, { value: cfPrdDist.distributionDomainName, exportName });

    // // // - Api Dev Domain
    // exportName = buildConfig.Prefix + '-dev-api-domain'
    // new cdk.CfnOutput(this, exportName, { value: devApiDomain.domainNameAliasDomainName, exportName });
    // exportName = buildConfig.Prefix + '-stg-api-domain'
    // new cdk.CfnOutput(this, exportName, { value: stgApiDomain.domainNameAliasDomainName, exportName });
    // exportName = buildConfig.Prefix + '-prod-api-domain'
    // new cdk.CfnOutput(this, exportName, { value: prodApiDomain.domainNameAliasDomainName, exportName });

    // // // - Api Dev Domain Route 53 Recordset
    // exportName = buildConfig.Prefix + '-api-dev-domain-rs'
    // new cdk.CfnOutput(this, exportName, { value: devApiDomainRS.domainName, exportName });
    // exportName = buildConfig.Prefix + '-api-stg-domain-rs'
    // new cdk.CfnOutput(this, exportName, { value: stgApiDomainRS.domainName, exportName });
    // exportName = buildConfig.Prefix + '-api-prod-domain-rs'
    // new cdk.CfnOutput(this, exportName, { value: prodApiDomainRS.domainName, exportName });

    // // // Buckets
    // exportName = buildConfig.Prefix + "-dev-upload-private-name"
    // new cdk.CfnOutput(this, exportName, { value: devPrivateUploadBucket.bucketName, exportName }); 
    // exportName = buildConfig.Prefix + "-dev-upload-private-arn"
    // new cdk.CfnOutput(this, exportName, { value: devPrivateUploadBucket.bucketArn, exportName }); 

    // exportName = buildConfig.Prefix + "-dev-upload-name" 
    // new cdk.CfnOutput(this, exportName, { value: devPublicUploadBucket.bucketName, exportName }); 
    // exportName = buildConfig.Prefix + "-dev-upload-arn" 
    // new cdk.CfnOutput(this, exportName, { value: devPublicUploadBucket.bucketArn, exportName }); 

    // exportName = buildConfig.Prefix + "-stg-upload-private-name"
    // new cdk.CfnOutput(this, exportName, { value: stgPrivateUploadBucket.bucketName, exportName }); 
    // exportName = buildConfig.Prefix + "-stg-upload-private-arn"
    // new cdk.CfnOutput(this, exportName, { value: stgPrivateUploadBucket.bucketArn, exportName }); 

    // exportName = buildConfig.Prefix + "-stg-upload-name" 
    // new cdk.CfnOutput(this, exportName, { value: stgPublicUploadBucket.bucketName, exportName }); 
    // exportName = buildConfig.Prefix + "-stg-upload-arn" 
    // new cdk.CfnOutput(this, exportName, { value: stgPublicUploadBucket.bucketArn, exportName }); 

    // exportName = buildConfig.Prefix + "-prod-upload-private-name"
    // new cdk.CfnOutput(this, exportName, { value: prodPrivateUploadBucket.bucketName, exportName }); 
    // exportName = buildConfig.Prefix + "-prod-upload-private-arn"
    // new cdk.CfnOutput(this, exportName, { value: prodPrivateUploadBucket.bucketArn, exportName }); 

    // exportName = buildConfig.Prefix + "-prod-upload-name" 
    // new cdk.CfnOutput(this, exportName, { value: prodPublicUploadBucket.bucketName, exportName }); 
    // exportName = buildConfig.Prefix + "-prod-upload-arn" 
    // new cdk.CfnOutput(this, exportName, { value: prodPublicUploadBucket.bucketArn, exportName }); 


    exportName = buildConfig.Prefix + "-cf-bucket-dev-name" 
    new cdk.CfnOutput(this, exportName, { value: buildConfig.cfDevBucket.bucketName, exportName }); 
    exportName = buildConfig.Prefix + "-cf-bucket-dev-arn" 
    new cdk.CfnOutput(this, exportName, { value: buildConfig.cfDevBucket.bucketArn, exportName }); 

    exportName = buildConfig.Prefix + "-cf-bucket-stg-name" 
    new cdk.CfnOutput(this, exportName, { value: buildConfig.cfStgBucket.bucketName, exportName }); 
    exportName = buildConfig.Prefix + "-cf-bucket-stg-arn" 
    new cdk.CfnOutput(this, exportName, { value: buildConfig.cfStgBucket.bucketArn, exportName }); 

    exportName = buildConfig.Prefix + "-cf-bucket-prd-name" 
    new cdk.CfnOutput(this, exportName, { value: buildConfig.cfPrdBucket.bucketName, exportName }); 
    exportName = buildConfig.Prefix + "-cf-bucket-prd-arn" 
    new cdk.CfnOutput(this, exportName, { value: buildConfig.cfPrdBucket.bucketArn, exportName }); 

  }
}
