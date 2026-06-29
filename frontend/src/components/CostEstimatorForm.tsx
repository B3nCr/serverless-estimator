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
          <option value="lightweight">Lightweight — cached or static responses (~200 req/s per vCPU)</option>
          <option value="standard">Standard — typical DB-backed API (~50 req/s per vCPU)</option>
          <option value="heavy">Heavy — multiple queries or external calls (~15 req/s per vCPU)</option>
          <option value="compute">Compute — ML inference, image processing (~3 req/s per vCPU)</option>
        </select>
        <small className="form-hint">
          Different workloads saturate a node in fundamentally different ways. A cached response barely touches the CPU — a node can handle hundreds of requests per second. An ML inference job might hold a full core for hundreds of milliseconds, meaning a node handles only a handful simultaneously. This is the key driver of how quickly your Kubernetes cluster needs to grow as traffic increases: compute-heavy workloads require significantly more nodes at the same request volume, and benefit from memory-optimized or compute-optimized instance families rather than general-purpose ones.
        </small>
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
        <small className="form-hint">
          How long a single request takes end-to-end. For Lambda this drives compute cost directly (billed per ms). For Kubernetes it determines how many concurrent requests a pod can handle, which sets the number of pods and nodes required at a given RPS.
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
          Peak memory consumed per request. For Lambda this feeds into GB-second billing and must be set at allocation time. For Kubernetes it determines how many pods fit on a node, directly influencing which instance SKU is selected and how quickly the cluster must scale.
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
          Applies to both sides of the comparison — Lambda and EC2 pricing both vary by region. Choose the region where your workload will actually run.
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
          Kubernetes must be sized for peak load, not average. A multiplier of 3 means peak traffic is assumed to be 3× the average monthly rate — both RPS capacity and concurrent memory are scaled accordingly.
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
          <option value="REST">REST API</option>
          <option value="HTTP">HTTP API</option>
        </select>
        <small className="form-hint">
          AWS offers two API Gateway flavours with different pricing. HTTP API ($1.00/million requests) is cheaper but has fewer features. REST API ($3.50/million requests) supports advanced routing, request validation, and usage plans. Choose whichever matches your serverless architecture.
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
          The EC2 instance type used for Kubernetes worker nodes. Auto selects the smallest instance whose RAM fits your pod memory requirements with headroom for the k8s system overhead. Override this to model a specific fleet you already operate or to compare instance families.
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
        <small className="form-hint">Set higher for multi-AZ redundancy requirements, e.g. 3</small>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Calculating...' : 'Calculate Costs'}
      </button>
    </form>
  );
};

export default CostEstimatorForm;