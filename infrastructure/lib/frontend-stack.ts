import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';
import { APP_SUBDOMAIN } from './certificate-stack';
import { CloudflareDnsRecord } from './cloudflare-dns-record';

interface FrontendStackProps extends cdk.StackProps {
  certificate: acm.ICertificate;
  cloudflareZoneId: string;
  cloudflareApiTokenSecretArn: string;
}

export class FrontendStack extends cdk.Stack {
  readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const cloudflareApiTokenSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'CloudflareApiToken',
      props.cloudflareApiTokenSecretArn,
    );

    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [APP_SUBDOMAIN],
      certificate: props.certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    new CloudflareDnsRecord(this, 'CloudflareDnsRecord', {
      zoneId: props.cloudflareZoneId,
      apiTokenSecret: cloudflareApiTokenSecret,
      type: 'CNAME',
      name: APP_SUBDOMAIN,
      content: distribution.distributionDomainName,
      proxied: false,
    });

    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });

    this.distributionDomainName = distribution.distributionDomainName;

    cdk.Tags.of(this).add('project', 'serverless-cost');

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${APP_SUBDOMAIN}`,
      description: 'Frontend URL',
    });
  }
}
