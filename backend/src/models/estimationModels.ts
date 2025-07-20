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