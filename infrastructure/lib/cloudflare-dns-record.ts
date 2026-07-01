import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as path from 'path';

export interface CloudflareDnsRecordProps {
  zoneId: string;
  apiTokenSecret: secretsmanager.ISecret;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  content: string;
  proxied?: boolean;
}

export class CloudflareDnsRecord extends Construct {
  constructor(scope: Construct, id: string, props: CloudflareDnsRecordProps) {
    super(scope, id);

    const handler = new lambda.Function(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/cloudflare-dns')),
      timeout: cdk.Duration.seconds(30),
    });

    props.apiTokenSecret.grantRead(handler);

    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler: handler,
    });

    new cdk.CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      properties: {
        zoneId: props.zoneId,
        apiTokenSecretArn: props.apiTokenSecret.secretArn,
        type: props.type,
        name: props.name,
        content: props.content,
        proxied: String(props.proxied ?? false),
      },
    });
  }
}
