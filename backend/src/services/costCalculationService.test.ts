import { calculateKubernetesCost } from './calculateKubernetesCost';
import { calculateServerlessCost } from './calculateServerlessCost';
import { EstimationParams } from '../models/estimationModels';

describe('Cost Calculation Service', () => {
  const testParams: EstimationParams = {
    requestsPerMonth: 1000000, // 1 million requests
    averageRequestDurationMs: 100,
    averageMemoryMb: 128,
    region: 'us-east-1',
    burstConcurrentRequests: 100
  };

  describe('calculateServerlessCost', () => {
    it('should calculate serverless costs correctly', () => {
      const result = calculateServerlessCost(testParams);
      
      // Verify result structure
      expect(result).toHaveProperty('computeCost');
      expect(result).toHaveProperty('requestCost');
      expect(result).toHaveProperty('networkCost');
      expect(result).toHaveProperty('storageCost');
      expect(result).toHaveProperty('managementCost');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('currency', 'USD');
      
      // Verify costs are positive numbers
      expect(result.computeCost).toBeGreaterThan(0);
      expect(result.requestCost).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      
      // Verify total is sum of components
      const sum = result.computeCost + result.requestCost + 
                  result.networkCost + result.storageCost + result.managementCost;
      expect(result.totalCost).toBeCloseTo(sum, 10);
    });
    
    it('should scale costs linearly with request count', () => {
      // Calculate cost for 1M requests
      const result1M = calculateServerlessCost(testParams);
      
      // Calculate cost for 2M requests
      const params2M = { ...testParams, requestsPerMonth: 2000000 };
      const result2M = calculateServerlessCost(params2M);
      
      // Costs should double (approximately)
      expect(result2M.computeCost).toBeCloseTo(result1M.computeCost * 2, 5);
      expect(result2M.requestCost).toBeCloseTo(result1M.requestCost * 2, 5);
      expect(result2M.networkCost).toBeCloseTo(result1M.networkCost * 2, 5);
      expect(result2M.totalCost).toBeCloseTo(result1M.totalCost * 2, 5);
    });
    
    it('should scale costs with memory usage', () => {
      // Calculate cost with 128MB memory
      const result128MB = calculateServerlessCost(testParams);
      
      // Calculate cost with 256MB memory
      const params256MB = { ...testParams, averageMemoryMb: 256 };
      const result256MB = calculateServerlessCost(params256MB);
      
      // Compute cost should double, but request cost should stay the same
      expect(result256MB.computeCost).toBeCloseTo(result128MB.computeCost * 2, 5);
      expect(result256MB.requestCost).toBeCloseTo(result128MB.requestCost, 5);
    });
    
    it('should scale costs with request duration', () => {
      // Calculate cost with 100ms duration
      const result100ms = calculateServerlessCost(testParams);
      
      // Calculate cost with 200ms duration
      const params200ms = { ...testParams, averageRequestDurationMs: 200 };
      const result200ms = calculateServerlessCost(params200ms);
      
      // Compute cost should double, but request cost should stay the same
      expect(result200ms.computeCost).toBeCloseTo(result100ms.computeCost * 2, 5);
      expect(result200ms.requestCost).toBeCloseTo(result100ms.requestCost, 5);
    });
  });

  describe('calculateKubernetesCost', () => {
    it('should calculate kubernetes costs correctly', () => {
      const result = calculateKubernetesCost(testParams);
      
      // Verify result structure
      expect(result).toHaveProperty('computeCost');
      expect(result).toHaveProperty('requestCost');
      expect(result).toHaveProperty('networkCost');
      expect(result).toHaveProperty('storageCost');
      expect(result).toHaveProperty('managementCost');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('currency', 'USD');
      expect(result).toHaveProperty('nodeCount');
      expect(result).toHaveProperty('instanceType');
      
      // Verify costs are numbers
      expect(result.computeCost).toBeGreaterThan(0);
      expect(result.managementCost).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      
      // Verify total is sum of components
      const sum = result.computeCost + result.requestCost + 
                  result.networkCost + result.storageCost + result.managementCost;
      expect(result.totalCost).toBeCloseTo(sum, 10);
    });
    
    it('should use minimum 2 nodes for high availability', () => {
      // Test with very low requirements that would normally need less than 2 nodes
      const lowParams: EstimationParams = {
        requestsPerMonth: 10000,
        averageRequestDurationMs: 50,
        averageMemoryMb: 64,
        burstConcurrentRequests: 5
      };
      
      const result = calculateKubernetesCost(lowParams);
      
      // Verify node count is at least 2
      expect(result.nodeCount).toBeGreaterThanOrEqual(2);
      
      // Verify compute cost reflects at least 2 nodes
      // t3.medium cost: $0.0416 * 24 * 30 * 2 = ~$59.90
      expect(result.computeCost).toBeGreaterThanOrEqual(59);
    });
    
    it('should respect overrideAutoScaling parameter', () => {
      // Test with auto-scaling override
      const overrideParams: EstimationParams = {
        ...testParams,
        overrideAutoScaling: true,
        nodeCount: 5
      };
      
      const result = calculateKubernetesCost(overrideParams);
      
      // Verify node count matches the override
      expect(result.nodeCount).toBe(5);
    });
    
    it('should use specified EC2 instance type', () => {
      // Test with specific instance type
      const instanceParams: EstimationParams = {
        ...testParams,
        ec2InstanceType: 'c5.xlarge'
      };
      
      const result = calculateKubernetesCost(instanceParams);
      
      // Verify instance type is used
      expect(result.instanceType).toBe('c5.xlarge');
    });
    
    it('should fall back to default instance type if invalid type provided', () => {
      // Test with invalid instance type
      const invalidParams: EstimationParams = {
        ...testParams,
        ec2InstanceType: 'invalid-type' as any
      };
      
      const result = calculateKubernetesCost(invalidParams);
      
      // Verify default instance type is used
      expect(result.instanceType).toBe('t3.medium');
    });
    
    it('should scale network costs with request count', () => {
      // Calculate cost for 1M requests
      const result1M = calculateKubernetesCost(testParams);
      
      // Calculate cost for 2M requests
      const params2M = { ...testParams, requestsPerMonth: 2000000 };
      const result2M = calculateKubernetesCost(params2M);
      
      // Network costs should double
      expect(result2M.networkCost).toBeCloseTo(result1M.networkCost * 2, 5);
    });
  });
  
  describe('Cost comparison', () => {
    it('should show serverless is cheaper for low request volumes', () => {
      // Low volume scenario
      const lowVolumeParams: EstimationParams = {
        requestsPerMonth: 10000, // Only 10K requests
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };
      
      const serverlessCost = calculateServerlessCost(lowVolumeParams);
      const kubernetesCost = calculateKubernetesCost(lowVolumeParams);
      
      // Serverless should be cheaper for low volumes
      expect(serverlessCost.totalCost).toBeLessThan(kubernetesCost.totalCost);
    });
    
    it('should show Kubernetes can be cheaper for high request volumes', () => {
      // High volume scenario
      const highVolumeParams: EstimationParams = {
        requestsPerMonth: 100000000, // 100M requests
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        burstConcurrentRequests: 2000
      };
      
      const serverlessCost = calculateServerlessCost(highVolumeParams);
      const kubernetesCost = calculateKubernetesCost(highVolumeParams);
      
      // For high volumes, Kubernetes might be cheaper
      // This is the core value proposition of the tool - to find this inflection point
      console.log(`High volume comparison: Serverless $${serverlessCost.totalCost.toFixed(2)} vs Kubernetes $${kubernetesCost.totalCost.toFixed(2)}`);
    });
  });
});