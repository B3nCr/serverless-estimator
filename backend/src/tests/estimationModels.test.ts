import { 
  EstimationParams, 
  ChartEstimationParams, 
  CostBreakdown, 
  ComparisonResult,
  CostChartDataPoint,
  ChartComparisonResult
} from '../models/estimationModels';

describe('Estimation Models', () => {
  describe('EstimationParams', () => {
    it('should allow creating a valid estimation params object', () => {
      const params: EstimationParams = {
        requestsPerMonth: 1000000,
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        region: 'us-east-1',
        concurrentRequests: 50,
        burstConcurrentRequests: 100,
        ec2InstanceType: 't3.medium',
        nodeCount: 2,
        overrideAutoScaling: false
      };
      
      // Verify required properties
      expect(params.requestsPerMonth).toBe(1000000);
      expect(params.averageRequestDurationMs).toBe(100);
      expect(params.averageMemoryMb).toBe(128);
      
      // Verify optional properties
      expect(params.region).toBe('us-east-1');
      expect(params.concurrentRequests).toBe(50);
      expect(params.burstConcurrentRequests).toBe(100);
      expect(params.ec2InstanceType).toBe('t3.medium');
      expect(params.nodeCount).toBe(2);
      expect(params.overrideAutoScaling).toBe(false);
    });
    
    it('should allow creating params with only required properties', () => {
      const params: EstimationParams = {
        requestsPerMonth: 1000000,
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };
      
      // Verify required properties
      expect(params.requestsPerMonth).toBe(1000000);
      expect(params.averageRequestDurationMs).toBe(100);
      expect(params.averageMemoryMb).toBe(128);
      
      // Optional properties should be undefined
      expect(params.region).toBeUndefined();
      expect(params.concurrentRequests).toBeUndefined();
      expect(params.burstConcurrentRequests).toBeUndefined();
      expect(params.ec2InstanceType).toBeUndefined();
      expect(params.nodeCount).toBeUndefined();
      expect(params.overrideAutoScaling).toBeUndefined();
    });
  });
  
  describe('ChartEstimationParams', () => {
    it('should allow creating a valid chart estimation params object', () => {
      const params: ChartEstimationParams = {
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        region: 'us-east-1',
        concurrentRequests: 50,
        burstConcurrentRequests: 100,
        minRequestsPerMonth: 10000,
        maxRequestsPerMonth: 1000000,
        dataPoints: 20,
        ec2InstanceType: 't3.medium',
        nodeCount: 2,
        overrideAutoScaling: false
      };
      
      // Verify required properties
      expect(params.averageRequestDurationMs).toBe(100);
      expect(params.averageMemoryMb).toBe(128);
      
      // Verify optional properties
      expect(params.region).toBe('us-east-1');
      expect(params.minRequestsPerMonth).toBe(10000);
      expect(params.maxRequestsPerMonth).toBe(1000000);
      expect(params.dataPoints).toBe(20);
    });
  });
  
  describe('CostBreakdown', () => {
    it('should allow creating a valid cost breakdown object', () => {
      const breakdown: CostBreakdown = {
        computeCost: 100,
        requestCost: 50,
        networkCost: 25,
        storageCost: 10,
        managementCost: 15,
        totalCost: 200,
        currency: 'USD'
      };
      
      // Verify properties
      expect(breakdown.computeCost).toBe(100);
      expect(breakdown.requestCost).toBe(50);
      expect(breakdown.networkCost).toBe(25);
      expect(breakdown.storageCost).toBe(10);
      expect(breakdown.managementCost).toBe(15);
      expect(breakdown.totalCost).toBe(200);
      expect(breakdown.currency).toBe('USD');
    });
  });
  
  describe('ComparisonResult', () => {
    it('should allow creating a valid comparison result object', () => {
      const result: ComparisonResult = {
        serverless: {
          computeCost: 100,
          requestCost: 50,
          networkCost: 25,
          storageCost: 0,
          managementCost: 0,
          totalCost: 175,
          currency: 'USD'
        },
        kubernetes: {
          computeCost: 200,
          requestCost: 20,
          networkCost: 25,
          storageCost: 10,
          managementCost: 15,
          totalCost: 270,
          currency: 'USD'
        },
        difference: {
          amount: -95,
          percentage: -35.19
        }
      };
      
      // Verify properties
      expect(result.serverless.totalCost).toBe(175);
      expect(result.kubernetes.totalCost).toBe(270);
      expect(result.difference.amount).toBe(-95);
      expect(result.difference.percentage).toBeCloseTo(-35.19, 2);
    });
  });
  
  describe('CostChartDataPoint', () => {
    it('should allow creating a valid chart data point', () => {
      const dataPoint: CostChartDataPoint = {
        requestsPerMonth: 1000000,
        serverlessCost: 175,
        kubernetesCost: 270
      };
      
      // Verify properties
      expect(dataPoint.requestsPerMonth).toBe(1000000);
      expect(dataPoint.serverlessCost).toBe(175);
      expect(dataPoint.kubernetesCost).toBe(270);
    });
  });
  
  describe('ChartComparisonResult', () => {
    it('should allow creating a valid chart comparison result', () => {
      const result: ChartComparisonResult = {
        dataPoints: [
          {
            requestsPerMonth: 10000,
            serverlessCost: 10,
            kubernetesCost: 100
          },
          {
            requestsPerMonth: 100000,
            serverlessCost: 100,
            kubernetesCost: 150
          },
          {
            requestsPerMonth: 1000000,
            serverlessCost: 1000,
            kubernetesCost: 300
          }
        ],
        inflectionPoint: 500000,
        kubernetesInfo: {
          nodeCount: 2,
          instanceType: 't3.medium'
        }
      };
      
      // Verify properties
      expect(result.dataPoints.length).toBe(3);
      expect(result.inflectionPoint).toBe(500000);
      expect(result.kubernetesInfo?.nodeCount).toBe(2);
      expect(result.kubernetesInfo?.instanceType).toBe('t3.medium');
    });
    
    it('should allow null inflection point', () => {
      const result: ChartComparisonResult = {
        dataPoints: [
          {
            requestsPerMonth: 10000,
            serverlessCost: 10,
            kubernetesCost: 100
          }
        ],
        inflectionPoint: null
      };
      
      // Verify properties
      expect(result.dataPoints.length).toBe(1);
      expect(result.inflectionPoint).toBeNull();
    });
  });
});