import { EstimationParams, CostBreakdown } from '../models/estimationModels';

/**
 * Calculate AWS Lambda and API Gateway costs
 */

export function calculateServerlessCost(params: EstimationParams): CostBreakdown {
  const {
    requestsPerMonth, averageRequestDurationMs, averageMemoryMb, region = 'us-east-1',
    apiGatewayType = 'REST'
  } = params;

  // Lambda pricing (us-east-1 default)
  const lambdaPricePerGBSecond = 0.0000166667; // $0.0000166667 per GB-second
  const lambdaRequestPrice = 0.0000002; // $0.20 per million requests

  // API Gateway pricing
  let apiGatewayRequestPrice: number;
  if (apiGatewayType === 'HTTP') {
    apiGatewayRequestPrice = 0.0000010; // $1.00 per million requests for HTTP API
  } else {
    apiGatewayRequestPrice = 0.0000035; // $3.50 per million requests for REST API
  }


  // Calculate Lambda cost
  // Convert ms to seconds and MB to GB
  const durationSeconds = averageRequestDurationMs / 1000;
  const memoryGB = averageMemoryMb / 1024;

  // Calculate GB-seconds
  const gbSeconds = requestsPerMonth * durationSeconds * memoryGB;

  // Apply Lambda pricing
  const computeCost = gbSeconds * lambdaPricePerGBSecond;
  const lambdaRequestCost = requestsPerMonth * lambdaRequestPrice;
  const apiGatewayRequestCost = requestsPerMonth * apiGatewayRequestPrice;

  // Total request cost
  const requestCost = lambdaRequestCost + apiGatewayRequestCost;

  // Network cost (estimate)
  // Network cost (estimate)
  const averageResponseSizeKb = 10; // Assumption: 10KB response size
  const dataTransferGBPerRequest = averageResponseSizeKb / (1024 * 1024); // Convert KB to GB
  const dataTransferPrice = 0.09; // $0.09 per GB for first 10TB out
  const totalDataTransferGB = requestsPerMonth * dataTransferGBPerRequest;

  // HTTP APIs include the first 1GB of data transfer for free
  let networkCost = 0;
  if (apiGatewayType === 'HTTP') {
    // For HTTP APIs, first 1GB is free
    const chargeableGB = Math.max(0, totalDataTransferGB - 1);
    networkCost = chargeableGB * dataTransferPrice;
  } else {
    // For REST APIs, all data transfer is charged
    networkCost = totalDataTransferGB * dataTransferPrice;
  }

  // No storage cost for serverless
  const storageCost = 0;

  // No management cost for serverless (fully managed)
  const managementCost = 0;

  // Total cost
  const totalCost = computeCost + requestCost + networkCost + storageCost + managementCost;

  return {
    computeCost,
    requestCost,
    networkCost,
    storageCost,
    managementCost,
    totalCost,
    currency: 'USD'
  };
}
