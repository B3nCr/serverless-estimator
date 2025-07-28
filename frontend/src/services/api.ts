import axios from 'axios';

export interface EstimationParams {
  requestsPerMonth: number;
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  burstConcurrentRequests?: number;
  apiGatewayType?: 'REST' | 'HTTP';
  ec2InstanceType?: string;
  nodeCount?: number;
  overrideAutoScaling?: boolean;
}

export interface ChartEstimationParams {
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  burstConcurrentRequests?: number;
  apiGatewayType?: 'REST' | 'HTTP';
  minRequestsPerMonth?: number;
  maxRequestsPerMonth?: number;
  dataPoints?: number;
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