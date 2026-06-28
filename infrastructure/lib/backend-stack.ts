import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  readonly apiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function for cost estimation
    const costEstimatorLambda = new lambda.Function(this, 'CostEstimatorFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'CostEstimatorApi', {
      restApiName: 'Cost Estimator Service',
      description: 'API for serverless vs Kubernetes cost estimation',
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

    // Apply tags to all resources
    cdk.Tags.of(this).add('project', 'serverless-cost');

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Cost Estimator API URL',
    });
  }
}
