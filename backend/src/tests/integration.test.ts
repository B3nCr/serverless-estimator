import express from 'express';
import request from 'supertest';
import { estimateRouter } from '../controllers/estimateController';
import { EstimationParams, ChartEstimationParams } from '../models/estimationModels';

describe('API Integration Tests', () => {
  // Create a test Express app
  const app = express();
  app.use(express.json());
  app.use('/api/estimate', estimateRouter);

  describe('POST /api/estimate', () => {
    it('should return cost comparison for valid input', async () => {
      // Arrange
      const testParams: EstimationParams = {
        requestsPerMonth: 1000000,
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        region: 'us-east-1'
      };

      // Act
      const response = await request(app)
        .post('/api/estimate')
        .send(testParams)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('serverless');
      expect(response.body).toHaveProperty('kubernetes');
      expect(response.body).toHaveProperty('difference');
      
      // Check structure of response
      expect(response.body.serverless).toHaveProperty('totalCost');
      expect(response.body.kubernetes).toHaveProperty('totalCost');
      expect(response.body.difference).toHaveProperty('amount');
      expect(response.body.difference).toHaveProperty('percentage');
    });

    it('should return 400 for missing parameters', async () => {
      // Arrange
      const invalidParams = {
        // Missing required parameters
        region: 'us-east-1'
      };

      // Act
      const response = await request(app)
        .post('/api/estimate')
        .send(invalidParams)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required parameters');
    });
  });

  describe('POST /api/estimate/chart', () => {
    it('should return chart data for valid input', async () => {
      // Arrange
      const testParams: ChartEstimationParams = {
        averageRequestDurationMs: 100,
        averageMemoryMb: 128,
        region: 'us-east-1',
        minRequestsPerMonth: 10000,
        maxRequestsPerMonth: 1000000,
        dataPoints: 10
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
      expect(response.body.dataPoints.length).toBe(10); // As specified in request
      
      // Check each data point has the right structure
      response.body.dataPoints.forEach(point => {
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