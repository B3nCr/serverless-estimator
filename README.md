# AWS Serverless vs Kubernetes Cost Estimator

This application compares the cost difference between AWS serverless architecture (Lambda + API Gateway) and Kubernetes architecture.

## Project Structure

- `packages/frontend/`: React + TypeScript client application built with Vite
- `packages/backend/`: TypeScript backend service with containerization support

## Prerequisites

- Node.js 16+
- pnpm 7+
- Docker (for containerized deployment)

## Getting Started

### Install Dependencies

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install project dependencies
pnpm install
```

### Development

```bash
# Start both frontend and backend in development mode
pnpm dev

# Start only frontend
pnpm dev:frontend

# Start only backend
pnpm dev:backend
```

### Testing

```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm --filter frontend test

# Run backend tests
pnpm --filter backend test
```

### Building

```bash
# Build all packages
pnpm build
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
- Visualize cost breakdowns with interactive charts
- Adjust parameters to see how they affect costs
- Containerized deployment for easy hosting

## Technologies Used

- Frontend: React, TypeScript, Vite, Recharts
- Backend: Node.js, Express, TypeScript
- Testing: Vitest (frontend), Jest (backend)
- Containerization: Docker, Docker Compose
- Package Management: pnpm workspaces