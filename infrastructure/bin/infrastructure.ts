#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }

const apigw_async_lambda = new BackendStack(app, 'ApiGatewayAsyncLambdaStack', {
  env,
  stackName: `InfrastructureStack`,
});