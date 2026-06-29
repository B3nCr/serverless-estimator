import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartEstimationParams } from '../services/api';

interface CostEstimatorFormProps {
  onSubmit: (params: ChartEstimationParams) => void;
  isLoading: boolean;
}

const CostEstimatorForm = ({ onSubmit, isLoading }: CostEstimatorFormProps) => {
  const [params, setParams] = useState<ChartEstimationParams>({
    averageRequestDurationMs: 100,
    averageMemoryMb: 128,
    region: 'us-east-1',
    peakMultiplier: 3,
    workloadProfile: 'standard',
    apiGatewayType: 'REST',
    ec2InstanceType: '',
    natGateway: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setParams({
      ...params,
      [name]: type === 'checkbox' ? checked
        : ['region', 'ec2InstanceType', 'apiGatewayType', 'workloadProfile'].includes(name) ? value
        : Number(value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <form onSubmit={handleSubmit} className="cost-form">
      <div className="form-group">
        <label htmlFor="workloadProfile">Workload Profile</label>
        <select
          id="workloadProfile"
          name="workloadProfile"
          value={params.workloadProfile}
          onChange={handleChange}
        >
          <option value="lightweight">Lightweight — cached or static responses (~200 req/s per vCPU)</option>
          <option value="standard">Standard — typical DB-backed API (~50 req/s per vCPU)</option>
          <option value="heavy">Heavy — multiple queries or external calls (~15 req/s per vCPU)</option>
          <option value="compute">Compute — ML inference, image processing (~3 req/s per vCPU)</option>
        </select>
        <small className="form-hint">
          How each request uses compute — the key driver of Kubernetes node count scaling. <Link to="/docs#workload-profile">Learn more</Link>
        </small>
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
        <small className="form-hint">
          Lambda bills per ms; Kubernetes uses this to size pod concurrency. <Link to="/docs#request-duration">Learn more</Link>
        </small>
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
        <small className="form-hint">
          Affects Lambda GB-second cost and how many pods fit on a Kubernetes node. <Link to="/docs#memory">Learn more</Link>
        </small>
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
        <small className="form-hint">
          Lambda and EC2 pricing both vary by region. <Link to="/docs#region">Learn more</Link>
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="peakMultiplier">Peak Traffic Multiplier</label>
        <input
          type="number"
          id="peakMultiplier"
          name="peakMultiplier"
          value={params.peakMultiplier}
          onChange={handleChange}
          min="1"
          max="10"
        />
        <small className="form-hint">
          Kubernetes is sized for peak, not average — this multiplies the monthly rate to model burst capacity. <Link to="/docs#peak-multiplier">Learn more</Link>
        </small>
      </div>

      <h3>Serverless Configuration</h3>

      <div className="form-group">
        <label htmlFor="apiGatewayType">API Gateway Type</label>
        <select
          id="apiGatewayType"
          name="apiGatewayType"
          value={params.apiGatewayType}
          onChange={handleChange}
        >
          <option value="REST">REST API ($3.50/million requests)</option>
          <option value="HTTP">HTTP API ($1.00/million requests)</option>
        </select>
        <small className="form-hint">
          HTTP API is cheaper; REST API has more features. <Link to="/docs#api-gateway-type">Learn more</Link>
        </small>
      </div>

      <h3>Kubernetes Configuration</h3>

      <div className="form-group">
        <label htmlFor="ec2InstanceType">EC2 Instance Type</label>
        <select
          id="ec2InstanceType"
          name="ec2InstanceType"
          value={params.ec2InstanceType}
          onChange={handleChange}
        >
          <option value="">Auto (recommended)</option>
          <option value="t3.small">t3.small (2GB RAM)</option>
          <option value="t3.medium">t3.medium (4GB RAM)</option>
          <option value="t3.large">t3.large (8GB RAM)</option>
          <option value="t3.xlarge">t3.xlarge (16GB RAM)</option>
          <option value="m5.large">m5.large (8GB RAM)</option>
          <option value="m5.xlarge">m5.xlarge (16GB RAM)</option>
          <option value="m5.2xlarge">m5.2xlarge (32GB RAM)</option>
          <option value="c5.large">c5.large (4GB RAM)</option>
          <option value="c5.xlarge">c5.xlarge (8GB RAM)</option>
          <option value="c5.2xlarge">c5.2xlarge (16GB RAM)</option>
        </select>
        <small className="form-hint">
          Auto selects the right instance for your pod memory. Override to model a specific fleet. <Link to="/docs#ec2-instance-type">Learn more</Link>
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="minimumNodes">Minimum Nodes (optional)</label>
        <input
          type="number"
          id="minimumNodes"
          name="minimumNodes"
          value={params.minimumNodes ?? ''}
          onChange={handleChange}
          min="2"
          placeholder="2 (default)"
        />
        <small className="form-hint">
          Set higher for multi-AZ redundancy, e.g. 3. <Link to="/docs#minimum-nodes">Learn more</Link>
        </small>
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <label htmlFor="natGateway">
            <input
              type="checkbox"
              id="natGateway"
              name="natGateway"
              checked={params.natGateway ?? true}
              onChange={handleChange}
            />
            Include NAT Gateway cost
          </label>
        </div>
        <small className="form-hint">
          Uncheck if pods only call internal AWS services via VPC endpoints. <Link to="/docs#nat-gateway">Learn more</Link>
        </small>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Calculating...' : 'Calculate Costs'}
      </button>
    </form>
  );
};

export default CostEstimatorForm;
