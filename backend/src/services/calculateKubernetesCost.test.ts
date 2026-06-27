import { calculateKubernetesCost } from './calculateKubernetesCost';
import { EstimationParams } from '../models/estimationModels';

describe('calculateKubernetesCost', () => {
    const testParams: EstimationParams = {
        requestsPerMonth: 1000000, // 1 million requests
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        region: 'us-east-1',
        burstConcurrentRequests: 100
    };

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

    it('should scale the node count with requests and memory usage', () => {
        const params: EstimationParams = {
            requestsPerMonth: 2592000 * 10, // 10 req/sec sustained
            averageRequestDurationMs: 1000,
            averageMemoryMb: 512,
            ec2InstanceType: 't3.small', // 2GB memory
            burstConcurrentRequests: 1
        };

        const result = calculateKubernetesCost(params);
        // Expected: 10 req/sec * 512MB * 1s = 5120MB sustained
        // t3.small has 2048, so 3 nodes needed
        expect(result.nodeCount).toBe(3)

        const params2: EstimationParams = {
            requestsPerMonth: 2592000 * 100, // 10 req/sec sustained
            averageRequestDurationMs: 1000,
            averageMemoryMb: 512,
            ec2InstanceType: 't3.small', // 2GB memory
            burstConcurrentRequests: 1
        };
        const result2m = calculateKubernetesCost(params2);

        // Half as much memory so expect 
        expect(result2m.nodeCount).toBe(25)
    })

    it('should scale network costs with request count', () => {
        // Calculate cost for 1M requests
        const result1M = calculateKubernetesCost(testParams);

        // Calculate cost for 2M requests
        const params2M = { ...testParams, requestsPerMonth: 2000000 };
        const result2M = calculateKubernetesCost(params2M);

        // Network costs should double
        expect(result2M.networkCost).toBeCloseTo(result1M.networkCost * 2, 5);
    });

    describe('pinned cost values', () => {
        it('1M requests, 100ms, 128MB, t3.medium, 100 burst produces known dollar amounts', () => {
            const params: EstimationParams = {
                requestsPerMonth: 1_000_000,
                averageRequestDurationMs: 100,
                averageMemoryMb: 128,
                region: 'us-east-1',
                burstConcurrentRequests: 100,
                ec2InstanceType: 't3.medium',
            };
            const result = calculateKubernetesCost(params);

            // burst drives node count: 100 concurrent × 128MB / 4096MB per node = 4 nodes
            expect(result.nodeCount).toBe(4);
            // 4 × $0.0416/hr × 720hr/month
            expect(result.computeCost).toBeCloseTo(119.81, 1);
            // ALB base $16.20 + LCU cost ~$0.004
            expect(result.requestCost).toBeCloseTo(16.20, 1);
            // 1M × 10KB / 1048576 GB × $0.09/GB
            expect(result.networkCost).toBeCloseTo(0.8583, 3);
            // 4 nodes × 20GB × $0.10/GB-month
            expect(result.storageCost).toBeCloseTo(8.00, 4);
            // EKS: $0.10/hr × 720hr
            expect(result.managementCost).toBeCloseTo(72.00, 4);
            expect(result.totalCost).toBeCloseTo(216.87, 1);
        });
    });
});
