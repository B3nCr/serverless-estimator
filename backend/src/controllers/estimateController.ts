import { Router, Request, Response } from 'express';
import { calculateServerlessCost, calculateKubernetesCost } from '../services/costCalculationService';
import { EstimationParams } from '../models/estimationModels';

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
    console.error('Error calculating costs:', error);
    res.status(500).json({ error: 'Failed to calculate costs' });
  }
});

export const estimateRouter = router;