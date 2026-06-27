import axios from 'axios';

export interface EstimationParams {
  requestsPerMonth: number;
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  peakMultiplier?: number;
  workloadProfile?: 'lightweight' | 'standard' | 'heavy' | 'compute';
  apiGatewayType?: 'REST' | 'HTTP';
  ec2InstanceType?: string;
  nodeCount?: number;
  overrideAutoScaling?: boolean;
}

export interface ChartEstimationParams {
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  peakMultiplier?: number;
  workloadProfile?: 'lightweight' | 'standard' | 'heavy' | 'compute';
  apiGatewayType?: 'REST' | 'HTTP';
  ec2InstanceType?: string;
  nodeCount?: number;
  overrideAutoScaling?: boolean;
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

export interface KubernetesCostBreakdown extends CostBreakdown {
  nodeCount: number;
  instanceType: string;
}

export interface ComparisonResult {
  serverless: CostBreakdown;
  kubernetes: KubernetesCostBreakdown;
  difference: {
    amount: number;
    percentage: number;
  };
}

export interface CostChartDataPoint {
  requestsPerMonth: number;
  serverlessCost: number;
  kubernetesCost: number;
  kubernetesNodeCount: number;
}

export interface ChartComparisonResult {
  dataPoints: CostChartDataPoint[];
  inflectionPoint: number | null;
  kubernetesInfo?: {
    nodeCount: number;
    instanceType: string;
  };
}

// Base URL for the API. Defaults to '/api' (proxied to the local backend by
// Vite in dev — see vite.config.ts). Set VITE_API_URL to point at a deployed
// API Gateway, e.g. https://<id>.execute-api.<region>.amazonaws.com/prod/api
const API_URL = import.meta.env.VITE_API_URL ?? '/api';

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