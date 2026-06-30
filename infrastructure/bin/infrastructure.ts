#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { DnsStack } from '../lib/dns-stack';
import { CertificateStack } from '../lib/certificate-stack';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

new DnsStack(app, 'DnsStack', { env });

const certStack = new CertificateStack(app, 'CertificateStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});

new BackendStack(app, 'BackendStack', { env });

new FrontendStack(app, 'FrontendStack', {
  env,
  certificate: certStack.certificate,
});
