import axios from 'axios';

export class RateLimitError extends Error {
  constructor() {
    super('Too many requests — please wait a moment and try again.');
    this.name = 'RateLimitError';
  }
}

export function isRateLimitError(err: unknown): err is RateLimitError {
  return err instanceof RateLimitError;
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 429) {
      return Promise.reject(new RateLimitError());
    }
    return Promise.reject(error);
  }
);

export interface ChartEstimationParams {
  averageRequestDurationMs: number;
  averageMemoryMb: number;
  region?: string;
  peakMultiplier?: number;
  workloadProfile?: 'lightweight' | 'standard' | 'heavy' | 'compute';
  apiGatewayType?: 'REST' | 'HTTP';
  ec2InstanceType?: string;
  minimumNodes?: number;
  natGateway?: boolean;
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

export async function generateChartData(params: ChartEstimationParams): Promise<ChartComparisonResult> {
  const response = await axios.post(`${API_URL}/estimate/chart`, params);
  return response.data;
}