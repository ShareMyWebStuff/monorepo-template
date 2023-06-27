import { Stack, aws_route53_targets } from 'aws-cdk-lib';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import {BuildConfig} from '../lib/build-config'
import * as path from 'path';
import { setRoute53Alias } from './route53'

/**
 * Create cloudfront function
 * @param scope 
 * @param functionName 
 * @param relPath 
 * @returns 
 */
const createCloudfrontFn = (scope: Stack, functionName: string, relPath: string ) => {

    // Create cloudfront function
    return new cloudfront.Function(
        scope,
        functionName,
        {
          functionName,
          code: cloudfront.FunctionCode.fromFile({
            filePath: path.join(__dirname, relPath),
          }),
        }
    )
}

/**
 * Create cloudfront distribution
 * 
 * @param scope 
 * @param bucketName 
 * @param buildConfig 
 * @returns 
 */

export const createCloudfront = (scope: Stack, buildConfig: BuildConfig, env: 'dev' | 'stg' | 'prd') => {

    // Set to production bucket by default
    let bkt: S3.IBucket = buildConfig.cfPrdBucket!;
    let domainName = buildConfig.DomainName;
    let longEnv = 'Production';

    if (env === 'dev') {
        bkt = buildConfig.cfDevBucket!;
        domainName = `dev.${buildConfig.DomainName}`;
        longEnv = 'Development';
    } else if (env === 'stg') {
        bkt = buildConfig.cfStgBucket!;
        domainName = `stg.${buildConfig.DomainName}`;
        longEnv = 'Staging';
    }

    const cf = new cloudfront.Distribution(scope, `${longEnv} Distribution`, {
        defaultBehavior: {
            origin: new origins.S3Origin(bkt, {
                originAccessIdentity: new cloudfront.OriginAccessIdentity(scope, `${longEnv} OriginAccessIdentity`, {
                    comment: `OAI for ${env}.${buildConfig.DomainName}`,
                })
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            functionAssociations: [
                {
                    function: createCloudfrontFn(scope, `html-mapper-${env}-fn`, '../dist/src/html-mapper-fn/index.js'),
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                },
            ],
        },
        domainNames: [ domainName ],
        certificate: buildConfig.cloudfrontCert!,
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
      
      const cfTarget = new aws_route53_targets.CloudFrontTarget(cf);

      setRoute53Alias ( scope, buildConfig, (env === 'prd' ? '' : env), cfTarget)

    return cf;
}


// const devOAI = new cloudfront.OriginAccessIdentity(this, 'Development OriginAccessIdentity', {
//     comment: `OAI for dev.${buildConfig.DomainName}`,
//   });

//   const cfDevDist = new cloudfront.Distribution(this, 'Development Distribution', {
//     defaultBehavior: {
//       origin: new origins.S3Origin(cfDevBucket, {
//         originAccessIdentity: devOAI
//       }),
//       viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
//       functionAssociations: [
//         {
//           function: htmlMapperFn,
//           eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
//         },
//       ],
//     },
//     domainNames: [`dev.${buildConfig.DomainName}`],
//     certificate: cert,
//     minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
//     httpVersion: cloudfront.HttpVersion.HTTP2,
//     enableIpv6: true,
//     defaultRootObject: 'index.html',
//     errorResponses: [
//       // {
//       //   httpStatus: 403,
//       //   responsePagePath: '/index.html',
//       //   responseHttpStatus: 200,
//       //   ttl: cdk.Duration.minutes(0),
//       // },
//       {
//         httpStatus: 404,
//         responseHttpStatus: 404,
//         responsePagePath: '/404.html',
//       },
//     ],
//   });

//   const cfDevTarget = new cdk.aws_route53_targets.CloudFrontTarget(cfDevDist);

//   new cdk.aws_route53.ARecord(this, 'Dev Alias Cloudfront', {
//     zone: hostedZone,
//     recordName: 'dev.'+buildConfig.DomainName,
//     target: cdk.aws_route53.RecordTarget.fromAlias( cfDevTarget ),
//   });

