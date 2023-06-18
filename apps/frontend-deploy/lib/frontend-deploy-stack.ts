import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BuildConfig} from './build-config'
import * as cm from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';


export class FrontendDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get the hosted zone
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: buildConfig.DomainName
    })

    // Create the certificate
    const certificate = new cm.Certificate (this, "Certificate", {
      certificateName: buildConfig.Prefix + '-certificate',
      domainName: buildConfig.DomainName,
      subjectAlternativeNames: [`*.${buildConfig.DomainName}`],
      validation: cm.CertificateValidation.fromDns(hostedZone)
    })

        // Create the subdomains
        const devApiDomain = new cdk.aws_apigateway.DomainName(this, buildConfig.Prefix  + '-domain-api-dev', {
          domainName: 'api-dev.' + buildConfig.DomainName,
          certificate: certificate,
          endpointType: cdk.aws_apigateway.EndpointType.REGIONAL,
          securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
        })
    
        const stgApiDomain = new cdk.aws_apigateway.DomainName(this, buildConfig.Prefix + '-domain-api-stg', {
          domainName: 'api-stg.' + buildConfig.DomainName,
          certificate: certificate,
          endpointType: cdk.aws_apigateway.EndpointType.REGIONAL,
          securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
        })
    
        const prodApiDomain = new cdk.aws_apigateway.DomainName(this, buildConfig.Prefix + '-domain-api-prod', {
          domainName: 'api.' + buildConfig.DomainName,
          certificate: certificate,
          endpointType: cdk.aws_apigateway.EndpointType.REGIONAL,
          securityPolicy: cdk.aws_apigateway.SecurityPolicy.TLS_1_2,
        })
    
        const devApiDomainRS = new cdk.aws_route53.ARecord(this, buildConfig.Prefix + '-api-dev-route53', {
          zone: hostedZone,
          recordName: 'api-dev.' + buildConfig.DomainName, // devApiDomain.domainName,
          target: cdk.aws_route53.RecordTarget.fromAlias(new ApiGatewayDomain(devApiDomain))
        })
    
        const stgApiDomainRS = new cdk.aws_route53.ARecord(this, buildConfig.Prefix + '-api-stg-route53', {
          zone: hostedZone,
          recordName: 'api-stg.' + buildConfig.DomainName, // stgApiDomain.domainName,
          target: cdk.aws_route53.RecordTarget.fromAlias(new ApiGatewayDomain(stgApiDomain))
        })
    
        const prodApiDomainRS = new cdk.aws_route53.ARecord(this, buildConfig.Prefix + '-api-prod-route53', {
          zone: hostedZone,
          recordName: 'api.' + buildConfig.DomainName, // prodApiDomain.domainName,
          target: cdk.aws_route53.RecordTarget.fromAlias(new ApiGatewayDomain(prodApiDomain))
        })
    
        //  Create buckets
        // removalPolicy - DESTRY FOR PRE PROD, RETAIN FOR PROD
        // autoDeleteObjects : set to true for pre prod as we do not want to keep these objects
        const devPrivateUploadBucketName = buildConfig.Prefix + "-dev-upload-private"
        const devPrivateUploadBucket = new s3.Bucket(this, devPrivateUploadBucketName, {
          bucketName: devPrivateUploadBucketName,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
          accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
          publicReadAccess: false,
          encryption: s3.BucketEncryption.S3_MANAGED,
          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
              ],
              allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
              // allowedOrigins: ['http://localhost:3000'],
              allowedHeaders: ['*'],
            },
          ],
        });
        const devPublicUploadBucketName = buildConfig.Prefix + "-dev-upload"
    
        const devPublicUploadBucket = new s3.Bucket(this, devPublicUploadBucketName, {
          bucketName: devPublicUploadBucketName,
    
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
          accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          encryption: s3.BucketEncryption.S3_MANAGED,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
              ],
              // Thhis can be made later to use localhost
              allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
              // allowedOrigins: ['http://localhost:3000'],
              allowedHeaders: ['*'],
            },
          ],
        });
    
        devPublicUploadBucket.grantRead(new iam.AnyPrincipal());
    
        const stgPrivateUploadBucketName = buildConfig.Prefix + "-stg-upload-private"
        const stgPrivateUploadBucket = new s3.Bucket(this, stgPrivateUploadBucketName, {
          bucketName: stgPrivateUploadBucketName,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
          accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          autoDeleteObjects: true,
          versioned: false,
          publicReadAccess: false,
          encryption: s3.BucketEncryption.S3_MANAGED,
          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
              ],
              allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
              // allowedOrigins: ['http://localhost:3000'],
              allowedHeaders: ['*'],
            },
          ],
        });
        const stgPublicUploadBucketName = buildConfig.Prefix + "-stg-upload"
        const stgPublicUploadBucket = new s3.Bucket(this, stgPublicUploadBucketName, {
          bucketName: stgPublicUploadBucketName,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
          accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
          publicReadAccess: false,
          encryption: s3.BucketEncryption.S3_MANAGED,
          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
              ],
              // Thhis can be made later to use localhost
              allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
              // allowedOrigins: ['http://localhost:3000'],
              allowedHeaders: ['*'],
            },
          ],
        });
        stgPublicUploadBucket.grantRead(new iam.AnyPrincipal());
    
        const prodPrivateUploadBucketName = buildConfig.Prefix + "-upload-private"
        const prodPrivateUploadBucket = new s3.Bucket(this, prodPrivateUploadBucketName, {
          bucketName: prodPrivateUploadBucketName,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
          accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          // removalPolicy: cdk.RemovalPolicy.RETAIN,
          // autoDeleteObjects: false,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
          publicReadAccess: false,
          encryption: s3.BucketEncryption.S3_MANAGED,
          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
              ],
              allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
              // allowedOrigins: ['http://localhost:3000'],
              allowedHeaders: ['*'],
            },
          ],
        });
        const prodPublicUploadBucketName = buildConfig.Prefix + "-upload"
        const prodPublicUploadBucket = new s3.Bucket(this, prodPublicUploadBucketName, {
          bucketName: prodPublicUploadBucketName,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
          accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          // removalPolicy: cdk.RemovalPolicy.RETAIN,
          // autoDeleteObjects: false,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
          publicReadAccess: false,
          encryption: s3.BucketEncryption.S3_MANAGED,
          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
              ],
              // Thhis can be made later to use localhost
              allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
              // allowedOrigins: ['http://localhost:3000'],
              allowedHeaders: ['*'],
            },
          ],
        });
    
        prodPublicUploadBucket.grantRead(new iam.AnyPrincipal());
    
        // Deployment bucket
        const deployBucketName = buildConfig.Prefix + "-deploy"
        const deployBucket = new s3.Bucket(this, deployBucketName, {
          bucketName: deployBucketName,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
          accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
          publicReadAccess: false,
          encryption: s3.BucketEncryption.S3_MANAGED,
          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
              ],
              allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
              // allowedOrigins: ['http://localhost:3000'],
              allowedHeaders: ['*'],
            },
          ],
        });
    
    
    
        // Stack outputs
        // - Certificate ARN
        let exportName = buildConfig.Prefix + '-cert-arn'
        new cdk.CfnOutput(this, exportName, { value: certificate.certificateArn, exportName }); 
    
        // // - Api Dev Domain
        exportName = buildConfig.Prefix + '-dev-api-domain'
        new cdk.CfnOutput(this, exportName, { value: devApiDomain.domainNameAliasDomainName, exportName });
        exportName = buildConfig.Prefix + '-stg-api-domain'
        new cdk.CfnOutput(this, exportName, { value: stgApiDomain.domainNameAliasDomainName, exportName });
        exportName = buildConfig.Prefix + '-prod-api-domain'
        new cdk.CfnOutput(this, exportName, { value: prodApiDomain.domainNameAliasDomainName, exportName });
    
        // // - Api Dev Domain Route 53 Recordset
        exportName = buildConfig.Prefix + '-api-dev-domain-rs'
        new cdk.CfnOutput(this, exportName, { value: devApiDomainRS.domainName, exportName });
        exportName = buildConfig.Prefix + '-api-stg-domain-rs'
        new cdk.CfnOutput(this, exportName, { value: stgApiDomainRS.domainName, exportName });
        exportName = buildConfig.Prefix + '-api-prod-domain-rs'
        new cdk.CfnOutput(this, exportName, { value: prodApiDomainRS.domainName, exportName });
    
        // // Buckets
        exportName = buildConfig.Prefix + "-dev-upload-private-name"
        new cdk.CfnOutput(this, exportName, { value: devPrivateUploadBucket.bucketName, exportName }); 
        exportName = buildConfig.Prefix + "-dev-upload-private-arn"
        new cdk.CfnOutput(this, exportName, { value: devPrivateUploadBucket.bucketArn, exportName }); 
    
        exportName = buildConfig.Prefix + "-dev-upload-name" 
        new cdk.CfnOutput(this, exportName, { value: devPublicUploadBucket.bucketName, exportName }); 
        exportName = buildConfig.Prefix + "-dev-upload-arn" 
        new cdk.CfnOutput(this, exportName, { value: devPublicUploadBucket.bucketArn, exportName }); 
    
        exportName = buildConfig.Prefix + "-stg-upload-private-name"
        new cdk.CfnOutput(this, exportName, { value: stgPrivateUploadBucket.bucketName, exportName }); 
        exportName = buildConfig.Prefix + "-stg-upload-private-arn"
        new cdk.CfnOutput(this, exportName, { value: stgPrivateUploadBucket.bucketArn, exportName }); 
    
        exportName = buildConfig.Prefix + "-stg-upload-name" 
        new cdk.CfnOutput(this, exportName, { value: stgPublicUploadBucket.bucketName, exportName }); 
        exportName = buildConfig.Prefix + "-stg-upload-arn" 
        new cdk.CfnOutput(this, exportName, { value: stgPublicUploadBucket.bucketArn, exportName }); 
    
        exportName = buildConfig.Prefix + "-prod-upload-private-name"
        new cdk.CfnOutput(this, exportName, { value: prodPrivateUploadBucket.bucketName, exportName }); 
        exportName = buildConfig.Prefix + "-prod-upload-private-arn"
        new cdk.CfnOutput(this, exportName, { value: prodPrivateUploadBucket.bucketArn, exportName }); 
    
        exportName = buildConfig.Prefix + "-prod-upload-name" 
        new cdk.CfnOutput(this, exportName, { value: prodPublicUploadBucket.bucketName, exportName }); 
        exportName = buildConfig.Prefix + "-prod-upload-arn" 
        new cdk.CfnOutput(this, exportName, { value: prodPublicUploadBucket.bucketArn, exportName }); 
    
    
        exportName = buildConfig.Prefix + "-deploy-name" 
        new cdk.CfnOutput(this, exportName, { value: deployBucket.bucketName, exportName }); 
        exportName = buildConfig.Prefix + "-deploy-arn" 
        new cdk.CfnOutput(this, exportName, { value: deployBucket.bucketArn, exportName }); 
  
  }
}
