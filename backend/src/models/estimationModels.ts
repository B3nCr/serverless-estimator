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
  concurrentRequests?: number;
  burstConcurrentRequests?: number;
  apiGatewayType?: 'REST' | 'HTTP'; // API Gateway type (REST or HTTP)
  
  // Kubernetes specific overrides
  ec2InstanceType?: string;
  nodeCount?: number;
  overrideAutoScaling?: boolean;
}

/**
 * Parameters for cost comparison chart
 */
export interface ChartEstimationParams {
  // Fixed parameters
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  
  // Optional parameters with defaults
  region?: string;
  concurrentRequests?: number;
  burstConcurrentRequests?: number;
  
  // Request range for chart
  minRequestsPerMonth?: number;
  maxRequestsPerMonth?: number;
  dataPoints?: number;
  
  // Kubernetes specific overrides
  ec2InstanceType?: string;
  nodeCount?: number;
  overrideAutoScaling?: boolean;
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
}
