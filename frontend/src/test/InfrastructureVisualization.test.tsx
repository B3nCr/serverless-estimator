import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InfrastructureVisualization from '../components/InfrastructureVisualization';

describe('InfrastructureVisualization', () => {
  it('renders serverless infrastructure visualization', () => {
    render(<InfrastructureVisualization type="serverless" />);
    
    expect(screen.getByText('AWS Serverless Architecture')).toBeInTheDocument();
    expect(screen.getByText('API Gateway')).toBeInTheDocument();
    expect(screen.getByText('Lambda Function')).toBeInTheDocument();
  });

  it('renders kubernetes infrastructure visualization', () => {
    render(<InfrastructureVisualization type="kubernetes" />);
    
    expect(screen.getByText('Kubernetes Architecture')).toBeInTheDocument();
    expect(screen.getByText('Load Balancer')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes Cluster')).toBeInTheDocument();
  });

  it('toggles expanded state when button is clicked', () => {
    render(<InfrastructureVisualization type="serverless" />);
    
    // Initially, the details should be hidden
    expect(screen.queryByText('Included in estimate:')).not.toBeInTheDocument();
    
    // Click the expand button
    fireEvent.click(screen.getByText('Show Details'));
    
    // Now the details should be visible
    expect(screen.getByText('Included in estimate:')).toBeInTheDocument();
    expect(screen.getByText('API Gateway request handling')).toBeInTheDocument();
    
    // Click the collapse button
    fireEvent.click(screen.getByText('Hide Details'));
    
    // Details should be hidden again
    expect(screen.queryByText('Included in estimate:')).not.toBeInTheDocument();
  });
});