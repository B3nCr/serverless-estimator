# Backend - AWS Serverless vs Kubernetes Cost Estimator

This is the backend service for the AWS Serverless vs Kubernetes Cost Estimator, built with Node.js, Express, and TypeScript.

## Development

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev
```

The development server will start at http://localhost:3001.

## Building

```bash
# Build for production
pnpm build
```

The build output will be in the `dist` directory.

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Docker

The backend can be built and run in a Docker container:

```bash
# Build the Docker image
docker build -t serverless-estimator-backend .

# Run the container
docker run -p 3001:3001 serverless-estimator-backend
```

## API Endpoints

### POST /api/estimate

Calculate cost comparison between serverless and Kubernetes architectures.

**Request Body:**

```json
{
  "requestsPerMonth": 1000000,
  "averageRequestDurationMs": 100,
  "averageMemoryMb": 128,
  "region": "us-east-1",
  "concurrentRequests": 100,
  "burstConcurrentRequests": 200
}
```

**Response:**

```json
{
  "serverless": {
    "computeCost": 0.21,
    "requestCost": 1.20,
    "networkCost": 0.09,
    "storageCost": 0,
    "managementCost": 0,
    "totalCost": 1.50,
    "currency": "USD"
  },
  "kubernetes": {
    "computeCost": 59.90,
    "requestCost": 0,
    "networkCost": 0.09,
    "storageCost": 4.00,
    "managementCost": 72.00,
    "totalCost": 135.99,
    "currency": "USD"
  },
  "difference": {
    "amount": -134.49,
    "percentage": -98.89
  }
}
```

## Project Structure

- `src/controllers/`: API route controllers
- `src/services/`: Business logic services
- `src/models/`: Data models and interfaces
- `src/tests/`: Test files