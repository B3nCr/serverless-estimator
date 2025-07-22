import axios from 'axios';

export interface EstimationParams {
  requestsPerMonth: number;
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  concurrentRequests?: number;
  burstConcurrentRequests?: number;
}

export interface ChartEstimationParams {
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  concurrentRequests?: number;
  burstConcurrentRequests?: number;
  minRequestsPerMonth?: number;
  maxRequestsPerMonth?: number;
  dataPoints?: number;
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

export interface CostChartDataPoint {
  requestsPerMonth: number;
  serverlessCost: number;
  kubernetesCost: number;
}

export interface ChartComparisonResult {
  dataPoints: CostChartDataPoint[];
  inflectionPoint: number | null;
}

const API_URL = '/api';

/**
 * Estimate costs for serverless and Kubernetes architectures
 */
export async function estimateCosts(params: EstimationParams): Promise<ComparisonResult> {
  const response = await axios.post(`${API_URL}/estimate`, params);
  return response.data;
}

/**
 * Generate chart data for cost comparison with varying request counts
 */
export async function generateChartData(params: ChartEstimationParams): Promise<ChartComparisonResult> {
  const response = await axios.post(`${API_URL}/estimate/chart`, params);
  return response.data;
}