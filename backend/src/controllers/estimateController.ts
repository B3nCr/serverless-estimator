import { Router, Request, Response } from 'express';
import { calculateServerlessCost } from '../services/calculateServerlessCost';
import { calculateKubernetesCost } from '../services/calculateKubernetesCost';
import { EstimationParams, ChartEstimationParams, CostChartDataPoint, ChartComparisonResult } from '../models/estimationModels';
import logger from '../logger';

const router = Router();

/**
 * Calculate cost comparison between serverless and Kubernetes architectures
 * @route POST /api/estimate
 */
router.post('/', async (req: Request, res: Response) => {
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
    logger.error({ err: error }, 'Error calculating costs');
    res.status(500).json({ error: 'Failed to calculate costs' });
  }
});

/**
 * Generate cost comparison chart data with varying request counts
 * @route POST /api/estimate/chart
 */
router.post('/chart', async (req: Request, res: Response) => {
  try {
    const params: ChartEstimationParams = req.body;
    
    // Validate input parameters
    if (!params.averageRequestDurationMs || !params.averageMemoryMb) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Coarse sweep across 1K–1B to find approximate inflection point
    const coarsePoints = 30;
    const coarseMin = 1000;
    const coarseMax = 1000000000;
    const coarseLogStep = (Math.log10(coarseMax) - Math.log10(coarseMin)) / (coarsePoints - 1);

    let approxInflection: number | null = null;
    let prevDiff: number | null = null;

    for (let i = 0; i < coarsePoints; i++) {
      const requests = Math.round(Math.pow(10, Math.log10(coarseMin) + coarseLogStep * i));
      const sl = calculateServerlessCost({ ...params, requestsPerMonth: requests });
      const k8s = calculateKubernetesCost({ ...params, requestsPerMonth: requests });
      const diff = sl.totalCost - k8s.totalCost;
      if (prevDiff !== null && ((prevDiff <= 0 && diff > 0) || (prevDiff >= 0 && diff < 0))) {
        approxInflection = requests;
        break;
      }
      prevDiff = diff;
    }

    // Build the chart range centred around the inflection point.
    // If no crossover exists, fall back to a sensible default window.
    const chartMin = approxInflection ? Math.max(1000, approxInflection / 50) : coarseMin;
    const chartMax = approxInflection ? approxInflection * 5 : coarseMax;
    const dataPoints = 20;

    const requestCounts: number[] = [];
    const logMin = Math.log10(chartMin);
    const logMax = Math.log10(chartMax);
    const step = (logMax - logMin) / (dataPoints - 1);
    for (let i = 0; i < dataPoints; i++) {
      requestCounts.push(Math.round(Math.pow(10, logMin + step * i)));
    }

    // Calculate costs for the focused range
    const chartData: CostChartDataPoint[] = [];
    let inflectionPoint: number | null = null;
    let previousDifference: number | null = null;

    for (const requestsPerMonth of requestCounts) {
      const estimationParams: EstimationParams = { ...params, requestsPerMonth };
      const serverlessCost = calculateServerlessCost(estimationParams);
      const kubernetesCost = calculateKubernetesCost(estimationParams);

      chartData.push({
        requestsPerMonth,
        serverlessCost: serverlessCost.totalCost,
        kubernetesCost: kubernetesCost.totalCost,
        kubernetesNodeCount: kubernetesCost.nodeCount
      });

      const currentDifference = serverlessCost.totalCost - kubernetesCost.totalCost;
      if (previousDifference !== null &&
          ((previousDifference <= 0 && currentDifference > 0) ||
           (previousDifference >= 0 && currentDifference < 0))) {
        inflectionPoint = requestsPerMonth;
      }
      previousDifference = currentDifference;
    }

    // Get Kubernetes info from the point nearest the inflection (or midpoint)
    const refRequests = inflectionPoint ?? requestCounts[Math.floor(requestCounts.length / 2)];
    const kubernetesCost = calculateKubernetesCost({ ...params, requestsPerMonth: refRequests });
    
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
    logger.error({ err: error }, 'Error calculating chart data');
    res.status(500).json({ error: 'Failed to calculate chart data' });
  }
});

export const estimateRouter = router;