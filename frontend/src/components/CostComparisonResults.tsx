import { ComparisonResult, CostBreakdown } from '../services/api';

interface CostComparisonResultsProps {
  results: ComparisonResult;
}

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

const CostBreakdownCard = ({ title, data }: { title: string; data: CostBreakdown }) => {
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
    </div>
  );
};

export default CostComparisonResults;