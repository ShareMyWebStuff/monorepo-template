import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as cm from 'aws-cdk-lib/aws-certificatemanager';

export interface BuildConfig {
    hostedZone: IHostedZone  | null,
    cloudfrontCert: cm.ICertificate  | null
    cfDevBucket: S3.IBucket | null,
    cfStgBucket: S3.IBucket | null,
    cfPrdBucket: S3.IBucket | null,

    readonly CertificateARN : string
    readonly RunSetup : boolean
    readonly Environment : string

    readonly AWSAccountID : string
    readonly AWSProfileName: string
    readonly AWSProfileRegion: string

    readonly App: string
    readonly Prefix: string

    readonly CorsServer: string
    readonly ApiDomainName: string
    readonly DomainName: string
}

