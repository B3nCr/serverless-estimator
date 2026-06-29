import { calculateKubernetesCost } from './calculateKubernetesCost';
import { EstimationParams } from '../models/estimationModels';

describe('calculateKubernetesCost', () => {
    const testParams: EstimationParams = {
        requestsPerMonth: 1000000, // 1 million requests
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        region: 'us-east-1',
        peakMultiplier: 3
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
            result.networkCost + result.storageCost + result.managementCost + result.natGatewayCost;
        expect(result.totalCost).toBeCloseTo(sum, 10);
    });

    it('should use minimum 2 nodes for high availability', () => {
        // Test with very low requirements that would normally need less than 2 nodes
        const lowParams: EstimationParams = {
            requestsPerMonth: 10000,
            averageRequestDurationMs: 50,
            averageMemoryMb: 64,
            peakMultiplier: 3
        };

        const result = calculateKubernetesCost(lowParams);

        // Verify node count is at least 2
        expect(result.nodeCount).toBeGreaterThanOrEqual(2);

        // Verify compute cost reflects at least 2 nodes
        // t3.small cost: $0.0208 * 24 * 30 * 2 = ~$29.95
        expect(result.computeCost).toBeGreaterThanOrEqual(29);
    });

    it('should respect minimumNodes parameter', () => {
        const result = calculateKubernetesCost({ ...testParams, minimumNodes: 5 });
        expect(result.nodeCount).toBeGreaterThanOrEqual(5);
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

    it('should auto-select instance type if invalid type provided', () => {
        const invalidParams: EstimationParams = {
            ...testParams,
            ec2InstanceType: 'invalid-type' as any
        };

        const result = calculateKubernetesCost(invalidParams);

        // Should fall back to auto-selection (128MB standard → t3.medium)
        expect(result.instanceType).toBe('t3.medium');
    });

    it('should scale the node count with requests and memory usage', () => {
        const params: EstimationParams = {
            requestsPerMonth: 2592000 * 10, // 10 req/sec sustained
            averageRequestDurationMs: 1000,
            averageMemoryMb: 512,
            ec2InstanceType: 't3.small', // 2GB memory
            peakMultiplier: 1
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
            peakMultiplier: 1
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

    describe('auto instance type selection', () => {
        it('standard profile with small memory selects t3.medium', () => {
            const result = calculateKubernetesCost({ ...testParams, workloadProfile: 'standard', averageMemoryMb: 128 });
            expect(result.instanceType).toBe('t3.medium'); // 30×128=3840MB → t3.medium (4096MB)
        });

        it('standard profile with large memory selects t3.xlarge', () => {
            const result = calculateKubernetesCost({ ...testParams, workloadProfile: 'standard', averageMemoryMb: 300 });
            expect(result.instanceType).toBe('t3.xlarge'); // 30×300=9000MB > t3.large (8192MB) → t3.xlarge
        });

        it('heavy profile selects m5 family', () => {
            const result = calculateKubernetesCost({ ...testParams, workloadProfile: 'heavy', averageMemoryMb: 128 });
            expect(result.instanceType).toBe('m5.large'); // 30×128=3840MB → m5.large (8192MB)
        });

        it('compute profile selects c5 family', () => {
            const result = calculateKubernetesCost({ ...testParams, workloadProfile: 'compute', averageMemoryMb: 128 });
            expect(result.instanceType).toBe('c5.large'); // 30×128=3840MB → c5.large (4096MB)
        });
    });

    describe('pinned cost values', () => {
        it('1M requests, 100ms, 128MB, 3× peak produces known dollar amounts', () => {
            const params: EstimationParams = {
                requestsPerMonth: 1_000_000,
                averageRequestDurationMs: 100,
                averageMemoryMb: 128,
                region: 'us-east-1',
                peakMultiplier: 3,
                natGateway: false,
                // no ec2InstanceType — auto-selected as t3.medium (128MB standard → 30×128=3840MB → t3.medium)
            };
            const result = calculateKubernetesCost(params);

            // sustained: 0.386 req/s × 128MB × 0.1s = 4.94MB × 3 = 14.8MB → 1 node → HA floor = 2
            expect(result.nodeCount).toBe(2);
            // 2 × $0.0416/hr × 720hr/month
            expect(result.computeCost).toBeCloseTo(59.90, 1);
            // ALB base $16.20 + 1 LCU × $0.000005 × 720hr
            expect(result.requestCost).toBeCloseTo(16.20, 1);
            // 1M × 10KB / 1048576 GB × $0.09/GB
            expect(result.networkCost).toBeCloseTo(0.8583, 3);
            // 2 nodes × 20GB × $0.10/GB-month
            expect(result.storageCost).toBeCloseTo(4.00, 4);
            // EKS: $0.10/hr × 720hr
            expect(result.managementCost).toBeCloseTo(72.00, 4);
            expect(result.natGatewayCost).toBe(0);
            expect(result.totalCost).toBeCloseTo(152.97, 1);
        });

    it('NAT Gateway cost uses min(nodeCount, 3) AZs at $0.045/hr each', () => {
            // 2-node cluster → 2 AZs → 2 × $0.045 × 24 × 30 = $64.80
            const result2 = calculateKubernetesCost({
                requestsPerMonth: 1_000_000,
                averageRequestDurationMs: 100,
                averageMemoryMb: 128,
                natGateway: true,
            });
            expect(result2.nodeCount).toBe(2);
            expect(result2.natGatewayCost).toBeCloseTo(64.80, 2);

            // Force 6 nodes → capped at 3 AZs → 3 × $0.045 × 24 × 30 = $97.20
            const result6 = calculateKubernetesCost({
                requestsPerMonth: 1_000_000,
                averageRequestDurationMs: 100,
                averageMemoryMb: 128,
                minimumNodes: 6,
                natGateway: true,
            });
            expect(result6.natGatewayCost).toBeCloseTo(97.20, 2);
        });
    });
});
