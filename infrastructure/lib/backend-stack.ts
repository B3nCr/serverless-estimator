import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';
import { APP_SUBDOMAIN } from './certificate-stack';
import { CloudflareDnsRecord } from './cloudflare-dns-record';

interface BackendStackProps extends cdk.StackProps {
  cloudflareZoneId: string;
  cloudflareApiTokenSecretArn: string;
}

export class BackendStack extends cdk.Stack {
  readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const cloudflareApiTokenSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'CloudflareApiToken',
      props.cloudflareApiTokenSecretArn,
    );

    const apiDomainName = `api.${APP_SUBDOMAIN}`;

    const certificate = new acm.Certificate(this, 'ApiCertificate', {
      domainName: `*.${APP_SUBDOMAIN}`,
      validation: acm.CertificateValidation.fromDns(),
    });

    const costEstimatorLambda = new lambda.Function(this, 'CostEstimatorFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const api = new apigateway.RestApi(this, 'CostEstimatorApi', {
      restApiName: 'Cost Estimator Service',
      description: 'API for serverless vs Kubernetes cost estimation',
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        throttlingRateLimit: 10,
        throttlingBurstLimit: 50,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(costEstimatorLambda);
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
    });

    const customDomain = api.addDomainName('CustomDomain', {
      domainName: apiDomainName,
      certificate,
      endpointType: apigateway.EndpointType.REGIONAL,
    });

    new CloudflareDnsRecord(this, 'CloudflareDnsRecord', {
      zoneId: props.cloudflareZoneId,
      apiTokenSecret: cloudflareApiTokenSecret,
      type: 'CNAME',
      name: apiDomainName,
      content: customDomain.domainNameAliasDomainName,
      proxied: false,
    });

    cdk.Tags.of(this).add('project', 'serverless-cost');

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, 'CustomDomainUrl', {
      value: `https://${apiDomainName}`,
      description: 'Cost Estimator custom domain URL',
    });
  }
}
