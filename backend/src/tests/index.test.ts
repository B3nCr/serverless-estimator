import request from 'supertest';
import app from '../app';

describe('Express App', () => {
  describe('Health Check', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('API Routes', () => {
    it('should have the estimate route configured', async () => {
      // Send an invalid request to verify the route exists
      // We're not testing functionality here, just that the route is configured
      const response = await request(app).post('/api/estimate');
      
      // Should return 400 Bad Request (not 404 Not Found)
      expect(response.status).toBe(400);
    });
    
    it('should have the chart route configured', async () => {
      // Send an invalid request to verify the route exists
      const response = await request(app).post('/api/estimate/chart');
      
      // Should return 400 Bad Request (not 404 Not Found)
      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      expect(response.status).toBe(404);
    });
  });
});