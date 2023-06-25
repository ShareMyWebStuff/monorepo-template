import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import {BuildConfig} from '../lib/build-config'

export enum BucketType {
    PUBLIC = 'public',
    PRIVATE = 'private',
    CLOUDFRONT_HOSTING = 'cloudfront-hosting'
}

/**
 * Sets the bucket parameters for upload buckets (public and private)
 * - Photos
 * - Videos
 * - Secure documents
 * 
 * @param bucketName 
 * @param buildConfig 
 * @returns 
 */
const setUploadBucketProps = (bucketName: string, buildConfig: BuildConfig ) => {
    return {
        bucketName: bucketName,
        objectOwnership: S3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        blockPublicAccess: S3.BlockPublicAccess.BLOCK_ACLS,
        accessControl: S3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
        // removalPolicy: cdk.RemovalPolicy.RETAIN,
        // autoDeleteObjects: false,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: false,
        publicReadAccess: false,
        encryption: S3.BucketEncryption.S3_MANAGED,
        cors: [
          {
            allowedMethods: [
              S3.HttpMethods.GET,
              S3.HttpMethods.POST,
              S3.HttpMethods.PUT,
              S3.HttpMethods.DELETE,
            ],
            // This can be made later to use localhost
            allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
            // allowedOrigins: ['http://localhost:3000'],
            allowedHeaders: ['*'],
          },
        ],
    }
}

/**
 * Sets the bucket props for the cloudfront hosting bucket
 * @param bucketName 
 * @returns 
 */
const setCloudfrontHostingBucketProps = (bucketName: string ) => {
    return {
        bucketName,
        blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        objectOwnership: S3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        accessControl: S3.BucketAccessControl.PRIVATE,
        versioned: false,
        publicReadAccess: false,
        encryption: S3.BucketEncryption.S3_MANAGED,
    }
}

/**
 * 
 * Creates a bucket based on the type of bucket we want to create
 * - Public bucket
 * - Private bucket
 * - Cloudfront hosting bucket
 * 
 * @param scope         - The scope of the stack
 * @param bucketType    - The type of bucket
 * @param bucketName    - The name of the bucket
 * @param buildConfig   - The build config
 * @returns             - The bucket
 */
export const createBucket = (scope: Stack, bucketType: BucketType, bucketName: string, buildConfig: BuildConfig) => {

    let bucketProps: S3.BucketProps = { };

    switch (bucketType) {
        case BucketType.PUBLIC:
        case BucketType.PRIVATE:
            bucketProps = setUploadBucketProps(bucketName, buildConfig);
            break;
        case BucketType.CLOUDFRONT_HOSTING:
            bucketProps = setCloudfrontHostingBucketProps(bucketName);
            break;
    }

    const bucket = new S3.Bucket(scope, bucketName, bucketProps);

    if ( bucketType === BucketType.PUBLIC ) {
        bucket.grantRead(new iam.AnyPrincipal());
    }

    return new S3.Bucket(scope, bucketName, bucketProps);

}


// /**
//  * 
//  * @param scope        - The scope of the stack
//  * @param bucketName   - The name of the bucket
//  * @param buildConfig  - The build config
//  * @returns            - The bucket
//  */
// export const createPublicUploadBucket = (scope: Stack, bucketName: string, buildConfig: BuildConfig) => {

//     return new S3.Bucket(scope, bucketName, {
//         bucketName: bucketName,
//         objectOwnership: S3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
//         blockPublicAccess: S3.BlockPublicAccess.BLOCK_ACLS,
//         accessControl: S3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
//         // removalPolicy: cdk.RemovalPolicy.RETAIN,
//         // autoDeleteObjects: false,
//         removalPolicy: RemovalPolicy.DESTROY,
//         autoDeleteObjects: true,
//         versioned: false,
//         publicReadAccess: false,
//         encryption: S3.BucketEncryption.S3_MANAGED,
//         cors: [
//           {
//             allowedMethods: [
//               S3.HttpMethods.GET,
//               S3.HttpMethods.POST,
//               S3.HttpMethods.PUT,
//               S3.HttpMethods.DELETE,
//             ],
//             // This can be made later to use localhost
//             allowedOrigins: [buildConfig.CorsServer, `https://${buildConfig.DomainName}`],
//             // allowedOrigins: ['http://localhost:3000'],
//             allowedHeaders: ['*'],
//           },
//         ],
//       });
// }


