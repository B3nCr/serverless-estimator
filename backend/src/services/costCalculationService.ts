import { EstimationParams, CostBreakdown } from '../models/estimationModels';

/**
 * Calculate AWS Lambda and API Gateway costs
 */
export function calculateServerlessCost(params: EstimationParams): CostBreakdown {
  const {
    requestsPerMonth,
    averageRequestDurationMs,
    averageMemoryMb,
    region = 'us-east-1'
  } = params;

  // Lambda pricing (us-east-1 default)
  const lambdaPricePerGBSecond = 0.0000166667; // $0.0000166667 per GB-second
  const lambdaRequestPrice = 0.0000002; // $0.20 per million requests
  
  // API Gateway pricing
  const apiGatewayRequestPrice = 0.000001; // $1.00 per million requests
  
  // Calculate Lambda cost
  const gbSeconds = (requestsPerMonth * averageRequestDurationMs / 1000) * (averageMemoryMb / 1024);
  const computeCost = gbSeconds * lambdaPricePerGBSecond;
  const lambdaRequestCost = requestsPerMonth * lambdaRequestPrice;
  const apiGatewayRequestCost = requestsPerMonth * apiGatewayRequestPrice;
  
  // Total request cost
  const requestCost = lambdaRequestCost + apiGatewayRequestCost;
  
  // Network cost (estimate)
  const averageResponseSizeKb = 10; // Assumption
  const dataTransferPrice = 0.09 / 1024 / 1024; // $0.09 per GB
  const networkCost = (requestsPerMonth * averageResponseSizeKb * dataTransferPrice);
  
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

/**
 * Calculate Kubernetes costs
 */
export function calculateKubernetesCost(params: EstimationParams): CostBreakdown {
  const {
    requestsPerMonth,
    averageRequestDurationMs,
    averageMemoryMb,
    concurrentRequests = 100,
    burstConcurrentRequests = 200,
    region = 'us-east-1'
  } = params;

  // EKS pricing
  const eksClusterPrice = 0.10 * 24 * 30; // $0.10 per hour * 24 hours * 30 days
  
  // EC2 pricing (t3.medium as default node type)
  const nodePrice = 0.0416 * 24 * 30; // $0.0416 per hour * 24 hours * 30 days
  
  // Calculate required nodes based on memory and concurrent requests
  const memoryPerNode = 4 * 1024; // 4 GB in MB for t3.medium
  const requestsPerSecond = (requestsPerMonth / (30 * 24 * 60 * 60));
  const peakRequestsPerSecond = Math.max(concurrentRequests, burstConcurrentRequests);
  
  // Calculate nodes needed based on memory requirements
  const nodesForMemory = Math.ceil((peakRequestsPerSecond * averageMemoryMb) / memoryPerNode);
  
  // Add minimum 2 nodes for high availability
  const totalNodes = Math.max(2, nodesForMemory);
  
  // Compute cost
  const computeCost = totalNodes * nodePrice;
  
  // ALB (Application Load Balancer) costs for Kubernetes
  const albHourlyPrice = 0.0225; // $0.0225 per hour
  const albMonthlyPrice = albHourlyPrice * 24 * 30; // Monthly cost
  
  // ALB request pricing
  const albRequestPrice = 0.005 / 1000; // $0.005 per 1000 LCU-hours
  
  // Calculate LCU (Load Balancer Capacity Units) based on requests
  // 1 LCU = 1 connection per second, 1 GB per hour, 1000 new connections per minute
  const lcuForRequests = Math.ceil(requestsPerSecond / 25); // Assuming 25 requests per second per LCU
  const lcuCost = lcuForRequests * albRequestPrice * 24 * 30;
  
  // Total request cost
  const requestCost = albMonthlyPrice + lcuCost;
  
  // Network cost (estimate)
  const averageResponseSizeKb = 10; // Assumption
  const dataTransferPrice = 0.09 / 1024 / 1024; // $0.09 per GB
  const networkCost = (requestsPerMonth * averageResponseSizeKb * dataTransferPrice);
  
  // Storage cost (EBS volumes)
  const storagePerNode = 20; // 20 GB per node
  const ebsPrice = 0.10; // $0.10 per GB-month
  const storageCost = totalNodes * storagePerNode * ebsPrice;
  
  // Management cost (EKS)
  const managementCost = eksClusterPrice;
  
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