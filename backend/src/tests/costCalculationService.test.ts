import { calculateServerlessCost, calculateKubernetesCost } from '../services/costCalculationService';
import { EstimationParams } from '../models/estimationModels';

describe('Cost Calculation Service', () => {
  const testParams: EstimationParams = {
    requestsPerMonth: 1000000, // 1 million requests
    averageRequestDurationMs: 100,
    averageMemoryMb: 128,
    region: 'us-east-1',
    concurrentRequests: 50,
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
        concurrentRequests: 5
      };
      
      const result = calculateKubernetesCost(lowParams);
      
      // Verify compute cost reflects at least 2 nodes
      // t3.medium cost: $0.0416 * 24 * 30 * 2 = ~$59.90
      expect(result.computeCost).toBeGreaterThanOrEqual(59);
    });
  });
});