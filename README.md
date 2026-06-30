# AWS Serverless vs Kubernetes Cost Estimator

A web application that compares the cost difference between AWS serverless architecture (Lambda + API Gateway) and Kubernetes architecture.

Live at [b3ncr.uk](https://b3ncr.uk)

## Project Structure

- `frontend/` — React + TypeScript client application built with Vite, served via CloudFront
- `backend/` — Node.js + Express API, deployed as a Lambda function behind API Gateway
- `infrastructure/` — AWS CDK stacks for deploying all cloud resources

### Infrastructure stacks

| Stack | Resources |
|---|---|
| `DnsStack` | Route 53 hosted zone for `b3ncr.uk` |
| `BackendStack` | Lambda function + API Gateway REST API |
| `FrontendStack` | S3 bucket + CloudFront distribution |

## Prerequisites

- Node.js 24+
- AWS CDK CLI (`npm install -g aws-cdk`)
- AWS credentials configured

## Getting Started

```bash
# Install all dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../infrastructure && npm install
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

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend
```

## Deployment

Deployments are automated via GitHub Actions on push to `main`. The workflow:

1. Runs frontend and backend tests
2. Deploys `DnsStack` → `BackendStack` → `FrontendStack` using CDK

To deploy manually from the `infrastructure/` directory:

```bash
npm run deploy
```

This builds the backend and frontend, then deploys all three stacks in order.

## Technologies

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Infrastructure:** AWS CDK (TypeScript)
- **AWS services:** Lambda, API Gateway, S3, CloudFront, Route 53
- **Testing:** Vitest (frontend), Jest (backend, infrastructure)
- **CI/CD:** GitHub Actions
