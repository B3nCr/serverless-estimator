import axios from 'axios';

export interface EstimationParams {
  requestsPerMonth: number;
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  concurrentRequests?: number;
  burstConcurrentRequests?: number;
}

export interface CostBreakdown {
  computeCost: number;
  requestCost: number;
  networkCost: number;
  storageCost: number;
  managementCost: number;
  totalCost: number;
  currency: string;
}

export interface ComparisonResult {
  serverless: CostBreakdown;
  kubernetes: CostBreakdown;
  difference: {
    amount: number;
    percentage: number;
  };
}

const API_URL = '/api';

/**
 * Estimate costs for serverless and Kubernetes architectures
 */
export async function estimateCosts(params: EstimationParams): Promise<ComparisonResult> {
  const response = await axios.post(`${API_URL}/estimate`, params);
  return response.data;
}