import { Router, Request, Response } from 'express';
import { calculateServerlessCost } from '../services/calculateServerlessCost';
import { calculateKubernetesCost } from '../services/calculateKubernetesCost';
import { EstimationParams, ChartEstimationParams, CostChartDataPoint, ChartComparisonResult } from '../models/estimationModels';

const router = Router();

/**
 * Calculate cost comparison between serverless and Kubernetes architectures
 * @route POST /api/estimate
 */
router.post('/', async (req: Request, res: Response) => {
  console.log('Received cost estimation request ("/") with body:', req.body);
  try {
    const params: EstimationParams = req.body;
    
    // Validate input parameters
    if (!params.requestsPerMonth || !params.averageRequestDurationMs || !params.averageMemoryMb) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Calculate costs
    const serverlessCost = calculateServerlessCost(params);
    const kubernetesCost = calculateKubernetesCost(params);
    
    // Return comparison
    res.json({
      serverless: serverlessCost,
      kubernetes: kubernetesCost,
      difference: {
        amount: serverlessCost.totalCost - kubernetesCost.totalCost,
        percentage: ((serverlessCost.totalCost - kubernetesCost.totalCost) / kubernetesCost.totalCost) * 100
      }
    });
  } catch (error) {
    console.error('Error calculating costs:', error);
    res.status(500).json({ error: 'Failed to calculate costs' });
  }
});

/**
 * Generate cost comparison chart data with varying request counts
 * @route POST /api/estimate/chart
 */
router.post('/chart', async (req: Request, res: Response) => {
  console.log('Received chart estimation request with body:', req.body);
  try {
    const params: ChartEstimationParams = req.body;
    
    // Validate input parameters
    if (!params.averageRequestDurationMs || !params.averageMemoryMb) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Set defaults if not provided
    const minRequests = params.minRequestsPerMonth || 10000; // 10K
    const maxRequests = params.maxRequestsPerMonth || 100000000; // 100M
    const dataPoints = params.dataPoints || 20;
    
    // Generate logarithmic scale of request counts
    const requestCounts: number[] = [];
    const logMin = Math.log10(minRequests);
    const logMax = Math.log10(maxRequests);
    const step = (logMax - logMin) / (dataPoints - 1);
    
    for (let i = 0; i < dataPoints; i++) {
      const logValue = logMin + (step * i);
      requestCounts.push(Math.round(Math.pow(10, logValue)));
    }
    
    // Calculate costs for each request count
    const chartData: CostChartDataPoint[] = [];
    let inflectionPoint: number | null = null;
    let previousDifference: number | null = null;
    
    for (const requestsPerMonth of requestCounts) {
      const estimationParams: EstimationParams = {
        ...params,
        requestsPerMonth
      };
      
      const serverlessCost = calculateServerlessCost(estimationParams);
      const kubernetesCost = calculateKubernetesCost(estimationParams);
      
      chartData.push({
        requestsPerMonth,
        serverlessCost: serverlessCost.totalCost,
        kubernetesCost: kubernetesCost.totalCost,
        kubernetesNodeCount: kubernetesCost.nodeCount 
      });
      
      // Check for inflection point (where serverless becomes more expensive)
      const currentDifference = serverlessCost.totalCost - kubernetesCost.totalCost;
      
      if (previousDifference !== null && 
          ((previousDifference <= 0 && currentDifference > 0) || 
           (previousDifference >= 0 && currentDifference < 0))) {
        // We've crossed the inflection point
        inflectionPoint = requestsPerMonth;
      }
      
      previousDifference = currentDifference;
    }
    
    // If we didn't find an inflection point but the last point shows a crossover
    if (inflectionPoint === null && chartData.length >= 2) {
      const lastPoint = chartData[chartData.length - 1];
      const secondLastPoint = chartData[chartData.length - 2];
      
      if ((lastPoint.serverlessCost > lastPoint.kubernetesCost && 
           secondLastPoint.serverlessCost <= secondLastPoint.kubernetesCost) ||
          (lastPoint.serverlessCost < lastPoint.kubernetesCost && 
           secondLastPoint.serverlessCost >= secondLastPoint.kubernetesCost)) {
        // Estimate inflection point by linear interpolation
        inflectionPoint = lastPoint.requestsPerMonth;
      }
    }
    
    // Get Kubernetes info from the middle point for reference
    const midPointIndex = Math.floor(chartData.length / 2);
    const midPointRequests = requestCounts[midPointIndex];
    const midPointParams: EstimationParams = {
      ...params,
      requestsPerMonth: midPointRequests
    };
    
    const kubernetesCost = calculateKubernetesCost(midPointParams);
    
    const result: ChartComparisonResult = {
      dataPoints: chartData,
      inflectionPoint,
      kubernetesInfo: {
        nodeCount: kubernetesCost.nodeCount,
        instanceType: kubernetesCost.instanceType
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error calculating chart data:', error);
    res.status(500).json({ error: 'Failed to calculate chart data' });
  }
});

export const estimateRouter = router;