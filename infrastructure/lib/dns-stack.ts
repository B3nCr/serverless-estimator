import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export const DOMAIN_NAME = 'b3ncr.uk';

export class DnsStack extends cdk.Stack {
  readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: DOMAIN_NAME,
    });

    cdk.Tags.of(this).add('project', 'serverless-cost');

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers!),
      description: 'Add these NS records to sidedesk.work for b3ncr delegation',
    });
  }
}
