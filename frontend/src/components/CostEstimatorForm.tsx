import { useState } from 'react';
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
    nodeCount: 2,
    overrideAutoScaling: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: ['region', 'ec2InstanceType', 'apiGatewayType', 'workloadProfile'].includes(name) ? value : Number(value)
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
          <option value="lightweight">Lightweight — cached or static responses</option>
          <option value="standard">Standard — typical DB-backed API</option>
          <option value="heavy">Heavy — multiple queries or external calls</option>
          <option value="compute">Compute — ML inference, image processing</option>
        </select>
        {params.workloadProfile === 'heavy' && (
          <small className="form-hint">
            For async-heavy workloads, AWS Step Functions (Express) can reduce costs by billing Lambda only for actual compute time rather than total wait time — but this tool models Lambda + API Gateway only.
          </small>
        )}
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
        <label htmlFor="apiGatewayType">API Gateway Type</label>
        <select
          id="apiGatewayType"
          name="apiGatewayType"
          value={params.apiGatewayType}
          onChange={handleChange}
        >
          <option value="REST">REST API</option>
          <option value="HTTP">HTTP API</option>
        </select>
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
      </div>

      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="overrideAutoScaling"
          name="overrideAutoScaling"
          checked={params.overrideAutoScaling}
          onChange={(e) => setParams({
            ...params,
            overrideAutoScaling: e.target.checked
          })}
        />
        <label htmlFor="overrideAutoScaling">Override auto-scaling (specify fixed node count)</label>
      </div>
      
      {params.overrideAutoScaling && (
        <div className="form-group">
          <label htmlFor="nodeCount">Number of Nodes</label>
          <input
            type="number"
            id="nodeCount"
            name="nodeCount"
            value={params.nodeCount}
            onChange={handleChange}
            min="2"
            required={params.overrideAutoScaling}
          />
        </div>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Calculating...' : 'Calculate Costs'}
      </button>
    </form>
  );
};

export default CostEstimatorForm;