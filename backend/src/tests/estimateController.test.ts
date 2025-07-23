import { Request, Response } from 'express';
import { estimateRouter } from '../controllers/estimateController';
import * as costCalculationService from '../services/costCalculationService';
import { EstimationParams, ChartEstimationParams } from '../models/estimationModels';

// Mock the cost calculation service
jest.mock('../services/costCalculationService');

describe('Estimate Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      body: {}
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /api/estimate', () => {
    it('should return 400 if required parameters are missing', async () => {
      // Arrange
      mockRequest.body = {
        // Missing required parameters
      };

      // Act
      const route = estimateRouter.stack.find(layer => 
        layer.route && layer.route.path === '/');

      if (!route || !route.route) {
        throw new Error('Route not found');
      } 
        
      await route.route.stack[0].handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required parameters' });
    });

    it('should calculate and return cost comparison', async () => {
      // Arrange
      const testParams: EstimationParams = {
        requestsPerMonth: 1000000,
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };
      mockRequest.body = testParams;

      const mockServerlessCost = {
        computeCost: 10,
        requestCost: 20,
        networkCost: 5,
        storageCost: 0,
        managementCost: 0,
        totalCost: 35,
        currency: 'USD'
      };

      const mockKubernetesCost = {
        computeCost: 50,
        requestCost: 10,
        networkCost: 5,
        storageCost: 10,
        managementCost: 25,
        totalCost: 100,
        currency: 'USD',
        nodeCount: 2,
        instanceType: 't3.medium'
      };

      (costCalculationService.calculateServerlessCost as jest.Mock).mockReturnValue(mockServerlessCost);
      (costCalculationService.calculateKubernetesCost as jest.Mock).mockReturnValue(mockKubernetesCost);

      // Act
      const route = estimateRouter.stack.find(layer => 
        layer.route && layer.route.path === '/');
      
      if (!route || !route.route) {
        throw new Error('Route not found');
      }
      
      await route.route.stack[0].handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(costCalculationService.calculateServerlessCost).toHaveBeenCalledWith(testParams);
      expect(costCalculationService.calculateKubernetesCost).toHaveBeenCalledWith(testParams);
      expect(mockJson).toHaveBeenCalledWith({
        serverless: mockServerlessCost,
        kubernetes: mockKubernetesCost,
        difference: {
          amount: -65, // serverless - kubernetes = 35 - 100 = -65
          percentage: -65 // (35 - 100) / 100 * 100 = -65%
        }
      });
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      mockRequest.body = {
        requestsPerMonth: 1000000,
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };

      (costCalculationService.calculateServerlessCost as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      const route = estimateRouter.stack.find(layer => 
        layer.route && layer.route.path === '/');
      
      if (!route || !route.route) {
        throw new Error('Route not found');
      }
      
      await route.route.stack[0].handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to calculate costs' });
    });
  });

  describe('POST /api/estimate/chart', () => {
    it('should return 400 if required parameters are missing', async () => {
      // Arrange
      mockRequest.body = {
        // Missing required parameters
      };

      // Act
      const route = estimateRouter.stack.find(layer => 
        layer.route && layer.route.path === '/chart');
      
      if (!route || !route.route) {
        throw new Error('Route not found');
      }
      
      await route.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required parameters' });
    });

    it('should generate chart data with default parameters', async () => {
      // Arrange
      const testParams: ChartEstimationParams = {
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };
      mockRequest.body = testParams;

      // Mock cost calculation functions
      (costCalculationService.calculateServerlessCost as jest.Mock).mockImplementation(
        (params) => ({
          computeCost: 10,
          requestCost: 20,
          networkCost: 5,
          storageCost: 0,
          managementCost: 0,
          totalCost: params.requestsPerMonth * 0.00001, // Simple mock for testing
          currency: 'USD'
        })
      );

      (costCalculationService.calculateKubernetesCost as jest.Mock).mockImplementation(
        (params) => ({
          computeCost: 50,
          requestCost: 10,
          networkCost: 5,
          storageCost: 10,
          managementCost: 25,
          totalCost: 100 + (params.requestsPerMonth * 0.000001), // Fixed cost + variable
          currency: 'USD',
          nodeCount: 2,
          instanceType: 't3.medium'
        })
      );

      // Act
      const route = estimateRouter.stack.find(layer => 
        layer.route && layer.route.path === '/chart');
      
      if (!route || !route.route) {
        throw new Error('Route not found');
      }
      
      await route.route.stack[0].handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockJson).toHaveBeenCalled();
      const result = mockJson.mock.calls[0][0];
      
      // Check structure
      expect(result).toHaveProperty('dataPoints');
      expect(result).toHaveProperty('inflectionPoint');
      expect(result).toHaveProperty('kubernetesInfo');
      
      // Check data points
      expect(Array.isArray(result.dataPoints)).toBe(true);
      expect(result.dataPoints.length).toBe(20); // Default data points
      
      // Check each data point has the right structure
      result.dataPoints.forEach(point => {
        expect(point).toHaveProperty('requestsPerMonth');
        expect(point).toHaveProperty('serverlessCost');
        expect(point).toHaveProperty('kubernetesCost');
      });
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      mockRequest.body = {
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };

      (costCalculationService.calculateServerlessCost as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      const route = estimateRouter.stack.find(layer => 
        layer.route && layer.route.path === '/chart');
      
      if (!route || !route.route) {
        throw new Error('Route not found');
      }
      
      await route.route.stack[0].handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to calculate chart data' });
    });
  });
});