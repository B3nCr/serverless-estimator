import { useState } from 'react';
import { EstimationParams } from '../services/api';

interface CostEstimatorFormProps {
  onSubmit: (params: EstimationParams) => void;
  isLoading: boolean;
}

const CostEstimatorForm = ({ onSubmit, isLoading }: CostEstimatorFormProps) => {
  const [params, setParams] = useState<EstimationParams>({
    requestsPerMonth: 1000000, // 1 million requests
    averageRequestDurationMs: 100,
    averageMemoryMb: 128,
    region: 'us-east-1',
    concurrentRequests: 100,
    burstConcurrentRequests: 200
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: name === 'region' ? value : Number(value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <form onSubmit={handleSubmit} className="cost-form">
      <div className="form-group">
        <label htmlFor="requestsPerMonth">Requests per Month</label>
        <input
          type="number"
          id="requestsPerMonth"
          name="requestsPerMonth"
          value={params.requestsPerMonth}
          onChange={handleChange}
          min="1"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="averageRequestDurationMs">Average Request Duration (ms)</label>
        <input
          type="number"
          id="averageRequestDurationMs"
          name="averageRequestDurationMs"
          value={params.averageRequestDurationMs}
          onChange={handleChange}
          min="1"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="averageMemoryMb">Average Memory Usage (MB)</label>
        <input
          type="number"
          id="averageMemoryMb"
          name="averageMemoryMb"
          value={params.averageMemoryMb}
          onChange={handleChange}
          min="128"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="region">AWS Region</label>
        <select
          id="region"
          name="region"
          value={params.region}
          onChange={handleChange}
        >
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="us-east-2">US East (Ohio)</option>
          <option value="us-west-1">US West (N. California)</option>
          <option value="us-west-2">US West (Oregon)</option>
          <option value="eu-west-1">EU (Ireland)</option>
          <option value="eu-central-1">EU (Frankfurt)</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="concurrentRequests">Average Concurrent Requests</label>
        <input
          type="number"
          id="concurrentRequests"
          name="concurrentRequests"
          value={params.concurrentRequests}
          onChange={handleChange}
          min="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="burstConcurrentRequests">Peak Concurrent Requests</label>
        <input
          type="number"
          id="burstConcurrentRequests"
          name="burstConcurrentRequests"
          value={params.burstConcurrentRequests}
          onChange={handleChange}
          min="1"
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Calculating...' : 'Calculate Costs'}
      </button>
    </form>
  );
};

export default CostEstimatorForm;