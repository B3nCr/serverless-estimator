import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { DOMAIN_NAME } from './dns-stack';

export const APP_SUBDOMAIN = 'estimator.b3ncr.uk';

export class CertificateStack extends cdk.Stack {
  readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: DOMAIN_NAME,
    });

    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: APP_SUBDOMAIN,
      subjectAlternativeNames: [`*.${APP_SUBDOMAIN}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    cdk.Tags.of(this).add('project', 'serverless-cost');
  }
}
