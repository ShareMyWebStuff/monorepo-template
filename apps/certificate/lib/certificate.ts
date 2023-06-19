import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BuildConfig} from './build-config'
import * as cm from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';


export class CertificateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props?: cdk.StackProps) {
    super(scope, id, {...props, env: { region: "us-east-1" }});

    // Get the hosted zone
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: buildConfig.DomainName
    })

    // Create the certificate
    const certificate = new cm.Certificate (this, "Certificate", {
      certificateName: buildConfig.Prefix + '-certificate',
      domainName: buildConfig.DomainName,
      subjectAlternativeNames: [`*.${buildConfig.DomainName}`],
      validation: cm.CertificateValidation.fromDns(hostedZone),
    })

    // Stack outputs
    // - Certificate ARN
    let exportName = buildConfig.Prefix + '-cert-arn'
    new cdk.CfnOutput(this, exportName, { value: certificate.certificateArn, exportName }); 
    
  }
}
