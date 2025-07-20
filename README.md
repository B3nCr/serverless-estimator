# AWS Serverless vs Kubernetes Cost Estimator

This application compares the cost difference between AWS serverless architecture (Lambda + API Gateway) and Kubernetes architecture.

## Project Structure

- `frontend/`: React + TypeScript client application built with Vite
- `backend/`: TypeScript backend service with containerization support

## Prerequisites

- Node.js 16+
- Docker (for containerized deployment)

## Getting Started

### Install Dependencies

```bash
# Install project dependencies
npm install
```

### Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend
```

### Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend
```

### Building

```bash
# Build all packages
npm run build
```

### Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# Stop containers
docker-compose down
```

## Features

- Compare costs between AWS serverless (Lambda + API Gateway) and Kubernetes architectures
- Visualize cost breakdowns
- Adjust parameters to see how they affect costs
- Containerized deployment for easy hosting

## Technologies Used

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Testing: Vitest (frontend), Jest (backend)
- Containerization: Docker, Docker Compose