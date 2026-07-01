import express from 'express';
import request from 'supertest';
import { estimateRouter } from '../controllers/estimateController';
import { ChartEstimationParams } from '../models/estimationModels';

describe('API Integration Tests', () => {
  // Create a test Express app
  const app = express();
  app.use(express.json());
  app.use('/api/estimate', estimateRouter);

  describe('POST /api/estimate/chart', () => {
    it('should return chart data for valid input', async () => {
      // Arrange
      const testParams: ChartEstimationParams = {
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        region: 'us-east-1',
        peakMultiplier: 3
      };

      // Act
      const response = await request(app)
        .post('/api/estimate/chart')
        .send(testParams)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('dataPoints');
      expect(response.body).toHaveProperty('inflectionPoint');
      expect(response.body).toHaveProperty('kubernetesInfo');
      
      // Check data points
      expect(Array.isArray(response.body.dataPoints)).toBe(true);
      expect(response.body.dataPoints.length).toBe(20);
      
      // Check each data point has the right structure
      response.body.dataPoints.forEach((point: any) => {
        expect(point).toHaveProperty('requestsPerMonth');
        expect(point).toHaveProperty('serverlessCost');
        expect(point).toHaveProperty('kubernetesCost');
      });
    });

    it('should return 400 for missing parameters', async () => {
      // Arrange
      const invalidParams = {
        // Missing required parameters
        region: 'us-east-1'
      };

      // Act
      const response = await request(app)
        .post('/api/estimate/chart')
        .send(invalidParams)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required parameters');
    });
  });
});