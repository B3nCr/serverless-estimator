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
  
  // API Gateway pricing (REST API)
  const apiGatewayRequestPrice = 0.0000035; // $3.50 per million requests
  
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
  const averageResponseSizeKb = 10; // Assumption: 10KB response size
  const dataTransferGBPerRequest = averageResponseSizeKb / (1024 * 1024); // Convert KB to GB
  const dataTransferPrice = 0.09; // $0.09 per GB for first 10TB out
  const totalDataTransferGB = requestsPerMonth * dataTransferGBPerRequest;
  const networkCost = totalDataTransferGB * dataTransferPrice;
  
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

// Extended cost breakdown with node information
interface KubernetesCostBreakdown extends CostBreakdown {
  nodeCount: number;
  instanceType: string;
}

/**
 * Calculate Kubernetes costs
 */
export function calculateKubernetesCost(params: EstimationParams): KubernetesCostBreakdown {
  const {
    requestsPerMonth,
    averageRequestDurationMs,
    averageMemoryMb,
    concurrentRequests = 100,
    burstConcurrentRequests = 200,
    region = 'us-east-1',
    ec2InstanceType,
    nodeCount,
    overrideAutoScaling = false
  } = params;

  // EKS pricing
  const eksClusterPrice = 0.10 * 24 * 30; // $0.10 per hour * 24 hours * 30 days
  
  // EC2 instance type configuration
  const instanceTypes : {[key: string]: any } = {
    't3.small': { price: 0.0208, memory: 2 * 1024 },    // 2GB, $0.0208/hr
    't3.medium': { price: 0.0416, memory: 4 * 1024 },   // 4GB, $0.0416/hr
    't3.large': { price: 0.0832, memory: 8 * 1024 },    // 8GB, $0.0832/hr
    't3.xlarge': { price: 0.1664, memory: 16 * 1024 },  // 16GB, $0.1664/hr
    'm5.large': { price: 0.096, memory: 8 * 1024 },     // 8GB, $0.096/hr
    'm5.xlarge': { price: 0.192, memory: 16 * 1024 },   // 16GB, $0.192/hr
    'm5.2xlarge': { price: 0.384, memory: 32 * 1024 },  // 32GB, $0.384/hr
    'c5.large': { price: 0.085, memory: 4 * 1024 },     // 4GB, $0.085/hr
    'c5.xlarge': { price: 0.17, memory: 8 * 1024 },     // 8GB, $0.17/hr
    'c5.2xlarge': { price: 0.34, memory: 16 * 1024 }    // 16GB, $0.34/hr
  };
  
  // Default to t3.medium if not specified or invalid
  const selectedInstanceType = ec2InstanceType && instanceTypes[ec2InstanceType] ? 
    ec2InstanceType : 't3.medium';
  
  const instanceConfig = instanceTypes[selectedInstanceType];
  const nodePrice = instanceConfig.price * 24 * 30; // hourly price * 24 hours * 30 days
  const memoryPerNode = instanceConfig.memory; // Memory in MB
  
  let totalNodes;
  
  if (overrideAutoScaling && nodeCount) {
    // Use user-specified node count
    totalNodes = nodeCount;
  } else {
    // Calculate required nodes based on memory and concurrent requests
    const requestsPerSecond = (requestsPerMonth / (30 * 24 * 60 * 60));
    const peakRequestsPerSecond = Math.max(concurrentRequests, burstConcurrentRequests);
    
    // Calculate nodes needed based on memory requirements
    const nodesForMemory = Math.ceil((peakRequestsPerSecond * averageMemoryMb) / memoryPerNode);
    
    // Add minimum 2 nodes for high availability
    totalNodes = Math.max(2, nodesForMemory);
  }
  
  // Compute cost
  const computeCost = totalNodes * nodePrice;
  
  // ALB (Application Load Balancer) costs for Kubernetes
  const albHourlyPrice = 0.0225; // $0.0225 per hour
  const albMonthlyPrice = albHourlyPrice * 24 * 30; // Monthly cost
  
  // ALB request pricing
  const albRequestPrice = 0.005 / 1000; // $0.005 per 1000 LCU-hours
  
  // Calculate LCU (Load Balancer Capacity Units) based on requests
  // 1 LCU = 1 connection per second, 1 GB per hour, 1000 new connections per minute
  const requestsPerSecond = (requestsPerMonth / (30 * 24 * 60 * 60));
  const lcuForRequests = Math.ceil(requestsPerSecond / 25); // Assuming 25 requests per second per LCU
  const lcuCost = lcuForRequests * albRequestPrice * 24 * 30;
  
  // Total request cost
  const requestCost = albMonthlyPrice + lcuCost;
  
  // Network cost (estimate)
  const averageResponseSizeKb = 10; // Assumption: 10KB response size
  const dataTransferGBPerRequest = averageResponseSizeKb / (1024 * 1024); // Convert KB to GB
  const dataTransferPrice = 0.09; // $0.09 per GB for first 10TB out
  const totalDataTransferGB = requestsPerMonth * dataTransferGBPerRequest;
  const networkCost = totalDataTransferGB * dataTransferPrice;
  
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
    currency: 'USD',
    nodeCount: totalNodes,
    instanceType: selectedInstanceType
  };
}