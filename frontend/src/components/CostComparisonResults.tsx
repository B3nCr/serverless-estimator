import { ComparisonResult, CostBreakdown, KubernetesCostBreakdown } from '../services/api';
import InfrastructureVisualization from './InfrastructureVisualization';

interface CostComparisonResultsProps {
  results: ComparisonResult;
}

const formatCurrency = (value: number): string => {
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  } else if (value < 1) {
    return `$${value.toFixed(3)}`;
  } else if (value < 10) {
    return `$${value.toFixed(2)}`;
  } else {
    return `$${Math.round(value * 100) / 100}`;
  }
};

const CostBreakdownCard = ({ title, data }: { title: string; data: CostBreakdown | KubernetesCostBreakdown }) => {
  return (
    <div className="cost-card">
      <h3>{title}</h3>
      <div className="cost-breakdown">
        <div>
          <span>Compute:</span>
          <span>{formatCurrency(data.computeCost)}</span>
        </div>
        <div>
          <span>Requests:</span>
          <span>{formatCurrency(data.requestCost)}</span>
        </div>
        <div>
          <span>Network:</span>
          <span>{formatCurrency(data.networkCost)}</span>
        </div>
        <div>
          <span>Storage:</span>
          <span>{formatCurrency(data.storageCost)}</span>
        </div>
        <div>
          <span>Management:</span>
          <span>{formatCurrency(data.managementCost)}</span>
        </div>
        <div className="total-cost">
          <span>Total:</span>
          <span>{formatCurrency(data.totalCost)}</span>
        </div>
      </div>
      
      {/* Display node information for Kubernetes */}
      {'nodeCount' in data && 'instanceType' in data && (
        <div className="node-info">
          <h4>Kubernetes Infrastructure</h4>
          <div>
            <span>Instance Type:</span>
            <span>{data.instanceType}</span>
          </div>
          <div>
            <span>Node Count:</span>
            <span>{data.nodeCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const CostComparisonResults = ({ results }: CostComparisonResultsProps) => {
  const { serverless, kubernetes, difference } = results;

  return (
    <div className="results">
      <h2>Cost Comparison Results</h2>
      
      <div className="cost-summary">
        <p>
          <strong>Cost Difference:</strong> {formatCurrency(Math.abs(difference.amount))}
          {' '}({difference.amount > 0 ? 'Kubernetes is cheaper' : 'Serverless is cheaper'} by{' '}
          {Math.abs(difference.percentage).toFixed(2)}%)
        </p>
      </div>
      
      <div className="cost-comparison">
        <CostBreakdownCard title="AWS Serverless" data={serverless} />
        <CostBreakdownCard title="Kubernetes" data={kubernetes} />
      </div>
      
      <div className="infrastructure-visualizations">
        <h2>Infrastructure Comparison</h2>
        <p>Visual representation of the architectures included in this cost estimate:</p>
        <div className="visualization-container">
          <InfrastructureVisualization type="serverless" />
          <InfrastructureVisualization type="kubernetes" />
        </div>
        <div className="visualization-note">
          <small>Click "Show Details" to see what's included in each architecture estimate.</small>
        </div>
      </div>
    </div>
  );
};

export default CostComparisonResults;