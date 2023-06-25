import { Stack } from 'aws-cdk-lib';
import { ARecord, RecordTarget, IAliasRecordTarget } from 'aws-cdk-lib/aws-route53';
import {BuildConfig} from '../lib/build-config'

/**
 * Crates the alias routes. Points a subdomain to apigateway or cloudfront
 * 
 * @param scope 
 * @param buildConfig 
 * @param subDomain 
 * @param aliasRec 
 * @returns 
 */
export const setRoute53Alias = (scope: Stack, buildConfig: BuildConfig, subDomain: string, aliasRec: IAliasRecordTarget ) => {

    return new ARecord(scope, `${subDomain} Alias Cloudfront`, {
        zone: buildConfig.hostedZone!,
        recordName: (!subDomain ? '' :  subDomain + '.' ) + buildConfig.DomainName,
        target: RecordTarget.fromAlias( aliasRec ),
    });
}
