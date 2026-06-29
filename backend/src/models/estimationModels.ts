/**
 * Parameters required for cost estimation
 */
export interface EstimationParams {
  // Common parameters
  requestsPerMonth: number;
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  
  // Optional parameters with defaults
  region?: string;
  peakMultiplier?: number;
  workloadProfile?: 'lightweight' | 'standard' | 'heavy' | 'compute';
  apiGatewayType?: 'REST' | 'HTTP';
  
  // Kubernetes specific overrides
  ec2InstanceType?: string;
  minimumNodes?: number;
  natGateway?: boolean;
}

/**
 * Parameters for cost comparison chart
 */
export interface ChartEstimationParams {
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  peakMultiplier?: number;
  workloadProfile?: 'lightweight' | 'standard' | 'heavy' | 'compute';
  ec2InstanceType?: string;
  minimumNodes?: number;
  natGateway?: boolean;
}

/**
 * Cost breakdown for a specific architecture
 */
export interface CostBreakdown {
  computeCost: number;
  requestCost: number;
  networkCost: number;
  storageCost: number;
  managementCost: number;
  totalCost: number;
  currency: string;
}

/**
 * Comparison result between architectures
 */
export interface ComparisonResult {
  serverless: CostBreakdown;
  kubernetes: CostBreakdown;
  difference: {
    amount: number;
    percentage: number;
  };
}

/**
 * Chart data point for cost comparison
 */
export interface CostChartDataPoint {
  requestsPerMonth: number;
  serverlessCost: number;
  kubernetesCost: number;  
  kubernetesNodeCount: number;
}

/**
 * Chart comparison result
 */
export interface ChartComparisonResult {
  dataPoints: CostChartDataPoint[];
  inflectionPoint: number | null;
  kubernetesInfo?: {
    nodeCount: number;
    instanceType: string;
  };
}

/**
 * Chart comparison result
 */
export interface ChartComparisonResult {
  dataPoints: CostChartDataPoint[];
  inflectionPoint: number | null; // The number of requests where serverless becomes more expensive
}
// Extended cost breakdown with node information
export interface KubernetesCostBreakdown extends CostBreakdown {
  nodeCount: number;
  instanceType: string;
  natGatewayCost: number;
}
