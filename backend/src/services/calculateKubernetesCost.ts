import { EstimationParams, KubernetesCostBreakdown } from '../models/estimationModels';

const HOURS_PER_MONTH = 24 * 30;
const AVERAGE_RESPONSE_SIZE_KB = 10;

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

function calculateComputeMonthlyCost(totalNodes: number, instancePricePerHour: number): number {
  return totalNodes * instancePricePerHour * HOURS_PER_MONTH;
}

// ALB bills $0.008/hour base + $0.008/LCU-hour, where LCU is the max across:
//   new connections (25/sec), processed bytes (1 GB/hour), rule evaluations (1000/sec).
// New connections wins for typical API workloads; bytes only takes over at ~860KB+ responses.
function calculateAlbMonthlyCost(requestsPerSecond: number, averageResponseSizeKb: number): number {
  const albBasePrice = 0.008; // per ALB-hour
  const albLcuPrice  = 0.008; // per LCU-hour

  const lcuFromConnections = requestsPerSecond / 25;
  const lcuFromBytes       = (requestsPerSecond * averageResponseSizeKb * 3600) / (1024 * 1024);
  const lcuFromRules       = requestsPerSecond / 1000;

  const lcuCount = Math.ceil(Math.max(lcuFromConnections, lcuFromBytes, lcuFromRules));

  return (albBasePrice + lcuCount * albLcuPrice) * HOURS_PER_MONTH;
}

function calculateNetworkMonthlyCost(requestsPerMonth: number, averageResponseSizeKb: number): number {
  const dataTransferPrice = 0.09; // $0.09 per GB for first 10TB out
  const totalDataTransferGB = requestsPerMonth * (averageResponseSizeKb / (1024 * 1024));
  return totalDataTransferGB * dataTransferPrice;
}

function calculateStorageMonthlyCost(totalNodes: number): number {
  const storagePerNode = 20; // GB per node
  const ebsPrice = 0.10; // $0.10 per GB-month (gp2)
  return totalNodes * storagePerNode * ebsPrice;
}

function calculateEksMonthlyCost(): number {
  return 0.10 * HOURS_PER_MONTH; // $0.10 per cluster-hour
}

function calculateNatGatewayMonthlyCost(azCount: number): number {
  const natGatewayHourlyRate = 0.045;
  return azCount * natGatewayHourlyRate * HOURS_PER_MONTH;
}

export function calculateKubernetesCost(params: EstimationParams): KubernetesCostBreakdown {
  const {
    requestsPerMonth,
    averageRequestDurationMs,
    averageMemoryMb,
    peakMultiplier = 3,
    workloadProfile = 'standard',
    ec2InstanceType,
    minimumNodes = 2,
    natGateway = true,
  } = params;

  const rpsPerVcpu: Record<string, number> = {
    lightweight: 200,
    standard:     50,
    heavy:        15,
    compute:       3,
  };

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

  const selectedInstanceType = (ec2InstanceType && instanceTypes[ec2InstanceType])
    ? ec2InstanceType
    : selectInstanceType(averageMemoryMb, workloadProfile);

  const instanceConfig = instanceTypes[selectedInstanceType];

  const requestsPerSecond = requestsPerMonth / (30 * 24 * 60 * 60);
  const peakRPS = requestsPerSecond * peakMultiplier;

  const nodesForRPS = Math.ceil(peakRPS / (instanceConfig.vCpus * rpsPerVcpu[workloadProfile]));
  const sustainedMemoryMb = requestsPerSecond * averageMemoryMb * (averageRequestDurationMs / 1000);
  const nodesForMemory = Math.ceil((sustainedMemoryMb * peakMultiplier) / instanceConfig.memory);
  const totalNodes = Math.max(minimumNodes, nodesForRPS, nodesForMemory);

  const computeCost    = calculateComputeMonthlyCost(totalNodes, instanceConfig.price);
  const requestCost    = calculateAlbMonthlyCost(requestsPerSecond, AVERAGE_RESPONSE_SIZE_KB);
  const networkCost    = calculateNetworkMonthlyCost(requestsPerMonth, AVERAGE_RESPONSE_SIZE_KB);
  const storageCost    = calculateStorageMonthlyCost(totalNodes);
  const managementCost = calculateEksMonthlyCost();
  const natGatewayCost = natGateway ? calculateNatGatewayMonthlyCost(Math.min(totalNodes, 3)) : 0;

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
