import { EstimationParams, KubernetesCostBreakdown } from '../models/estimationModels';

// Pick the instance family from workload profile, then the smallest size that
// can comfortably hold ~30 concurrent requests worth of memory.
function selectInstanceType(averageMemoryMb: number, workloadProfile: string): string {
  const family =
    workloadProfile === 'compute' ? 'c5' :
    workloadProfile === 'heavy'   ? 'm5' : 't3';

  const neededMb = 30 * averageMemoryMb;

  const options: Record<string, { threshold: number; name: string }[]> = {
    t3: [
      { threshold: 2048,     name: 't3.small' },
      { threshold: 4096,     name: 't3.medium' },
      { threshold: 8192,     name: 't3.large' },
      { threshold: Infinity, name: 't3.xlarge' },
    ],
    m5: [
      { threshold: 8192,     name: 'm5.large' },
      { threshold: 16384,    name: 'm5.xlarge' },
      { threshold: Infinity, name: 'm5.2xlarge' },
    ],
    c5: [
      { threshold: 4096,     name: 'c5.large' },
      { threshold: 8192,     name: 'c5.xlarge' },
      { threshold: Infinity, name: 'c5.2xlarge' },
    ],
  };

  const sizes = options[family];
  return sizes.find(s => neededMb <= s.threshold)!.name;
}

export function calculateKubernetesCost(params: EstimationParams): KubernetesCostBreakdown {
  const {
    requestsPerMonth,
    averageRequestDurationMs,
    averageMemoryMb,
    peakMultiplier = 3,
    workloadProfile = 'standard',
    region = 'us-east-1',
    ec2InstanceType,
    minimumNodes = 2,
    natGateway = true,
  } = params;

  // EKS pricing
  const eksClusterPrice = 0.10 * 24 * 30;

  // RPS capacity per vCPU by workload profile
  const rpsPerVcpu: Record<string, number> = {
    lightweight: 200, // cached/static responses
    standard:     50, // typical DB-backed API
    heavy:        15, // multiple queries, external calls
    compute:       3, // ML inference, image processing
  };

  // EC2 instance type configuration
  const instanceTypes: { [key: string]: any; } = {
    't3.small':   { price: 0.0208, memory: 2 * 1024,  vCpus: 2 },
    't3.medium':  { price: 0.0416, memory: 4 * 1024,  vCpus: 2 },
    't3.large':   { price: 0.0832, memory: 8 * 1024,  vCpus: 2 },
    't3.xlarge':  { price: 0.1664, memory: 16 * 1024, vCpus: 4 },
    'm5.large':   { price: 0.096,  memory: 8 * 1024,  vCpus: 2 },
    'm5.xlarge':  { price: 0.192,  memory: 16 * 1024, vCpus: 4 },
    'm5.2xlarge': { price: 0.384,  memory: 32 * 1024, vCpus: 8 },
    'c5.large':   { price: 0.085,  memory: 4 * 1024,  vCpus: 2 },
    'c5.xlarge':  { price: 0.17,   memory: 8 * 1024,  vCpus: 4 },
    'c5.2xlarge': { price: 0.34,   memory: 16 * 1024, vCpus: 8 },
  };

  // Auto-select instance type from workload characteristics if not explicitly provided
  const selectedInstanceType = (ec2InstanceType && instanceTypes[ec2InstanceType])
    ? ec2InstanceType
    : selectInstanceType(averageMemoryMb, workloadProfile);

  const instanceConfig = instanceTypes[selectedInstanceType];
  const nodePrice = instanceConfig.price * 24 * 30; // hourly price * 24 hours * 30 days
  const memoryPerNode = instanceConfig.memory; // Memory in MB

  const requestsPerSecond = requestsPerMonth / (30 * 24 * 60 * 60);

  const peakRPS = requestsPerSecond * peakMultiplier;
  const rpsCapacityPerNode = instanceConfig.vCpus * rpsPerVcpu[workloadProfile];
  const nodesForRPS = Math.ceil(peakRPS / rpsCapacityPerNode);

  const sustainedMemoryMb = requestsPerSecond * averageMemoryMb * (averageRequestDurationMs / 1000);
  const nodesForMemory = Math.ceil((sustainedMemoryMb * peakMultiplier) / memoryPerNode);

  const totalNodes = Math.max(minimumNodes, nodesForRPS, nodesForMemory);

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

  // NAT Gateway cost — one per AZ, capped at 3 AZs
  const azCount = Math.min(totalNodes, 3);
  const natGatewayHourlyRate = 0.045;
  const natGatewayCost = natGateway ? azCount * natGatewayHourlyRate * 24 * 30 : 0;

  // Total cost
  const totalCost = computeCost + requestCost + networkCost + storageCost + managementCost + natGatewayCost;

  return {
    computeCost,
    requestCost,
    networkCost,
    storageCost,
    managementCost,
    natGatewayCost,
    totalCost,
    currency: 'USD',
    nodeCount: totalNodes,
    instanceType: selectedInstanceType
  };
}
