import { Request, Response, NextFunction } from 'express';
import { estimateRouter } from './estimateController';
// import * as costCalculationService from '../services/costCalculationService';
import { calculateServerlessCost } from '../services/calculateServerlessCost';
import { calculateKubernetesCost } from '../services/calculateKubernetesCost';
import { EstimationParams, ChartEstimationParams } from '../models/estimationModels';

// Mock the cost calculation service
jest.mock('../services/calculateServerlessCost');
jest.mock('../services/calculateKubernetesCost');

describe('Estimate Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
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
    it('should return 400 if required parameters are missing', () => {
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

      route.route.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required parameters' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should calculate and return cost comparison', () => {
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

      (calculateServerlessCost as jest.Mock).mockReturnValue(mockServerlessCost);
      (calculateKubernetesCost as jest.Mock).mockReturnValue(mockKubernetesCost);

      // Act
      const route = estimateRouter.stack.find(layer =>
        layer.route && layer.route.path === '/');

      if (!route || !route.route) {
        throw new Error('Route not found');
      }

      route.route.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(calculateServerlessCost).toHaveBeenCalledWith(testParams);
      expect(calculateKubernetesCost).toHaveBeenCalledWith(testParams);
      expect(mockJson).toHaveBeenCalledWith({
        serverless: mockServerlessCost,
        kubernetes: mockKubernetesCost,
        difference: {
          amount: -65, // serverless - kubernetes = 35 - 100 = -65
          percentage: -65 // (35 - 100) / 100 * 100 = -65%
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and return 500', () => {
      // Arrange
      mockRequest.body = {
        requestsPerMonth: 1000000,
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };

      (calculateServerlessCost as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      const route = estimateRouter.stack.find(layer =>
        layer.route && layer.route.path === '/');

      if (!route || !route.route) {
        throw new Error('Route not found');
      }

      route.route.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to calculate costs' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/estimate/chart', () => {
    it('should return 400 if required parameters are missing', () => {
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

      route.route.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing required parameters' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should generate chart data with default parameters', () => {
      // Arrange
      const testParams: ChartEstimationParams = {
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };
      mockRequest.body = testParams;

      // Mock cost calculation functions
      (calculateServerlessCost as jest.Mock).mockImplementation(
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

      (calculateKubernetesCost as jest.Mock).mockImplementation(
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

      route.route.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

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
      result.dataPoints.forEach((point: any) => {
        expect(point).toHaveProperty('requestsPerMonth');
        expect(point).toHaveProperty('serverlessCost');
        expect(point).toHaveProperty('kubernetesCost');
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and return 500', () => {
      // Arrange
      mockRequest.body = {
        averageRequestDurationMs: 100,
        averageMemoryMb: 128
      };

      (calculateServerlessCost as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      const route = estimateRouter.stack.find(layer =>
        layer.route && layer.route.path === '/chart');

      if (!route || !route.route) {
        throw new Error('Route not found');
      }

      route.route.stack[0].handle(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to calculate chart data' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});