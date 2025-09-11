import { useState } from 'react';

const CostCalculationDocs = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="cost-docs">
      <button 
        className="docs-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {isExpanded ? '▼' : '▶'} How are costs calculated?
      </button>
      
      {isExpanded && (
        <div className="docs-content">
          <h3>Cost Calculation Methodology</h3>
          
          <div className="calculation-section">
            <h4>🚀 AWS Serverless (Lambda + API Gateway)</h4>
            <ul>
              <li><strong>Compute Cost:</strong> Based on GB-seconds (memory × duration × requests)</li>
              <li><strong>Request Cost:</strong> Per-request pricing for Lambda invocations</li>
              <li><strong>API Gateway Cost:</strong> Per-request pricing (REST API: $3.50/million, HTTP API: $1.00/million)</li>
              <li><strong>Network Cost:</strong> Data transfer charges for responses</li>
            </ul>
            <p className="formula">
              <strong>Formula:</strong> (Memory_GB × Duration_s × Requests × $0.0000166667) + (Requests × $0.0000002) + API_Gateway_Cost
            </p>
          </div>

          <div className="calculation-section">
            <h4>☸️ Kubernetes on AWS EC2</h4>
            <ul>
              <li><strong>Compute Cost:</strong> EC2 instance pricing × number of nodes × hours per month</li>
              <li><strong>Load Balancer:</strong> Application Load Balancer pricing (~$16.20/month)</li>
              <li><strong>Storage Cost:</strong> EBS volumes for persistent storage</li>
              <li><strong>Management Cost:</strong> EKS cluster management fee ($72/month)</li>
            </ul>
            <p className="formula">
              <strong>Formula:</strong> (Instance_Cost × Nodes × 730h) + EKS_Fee + ALB_Cost + Storage_Cost
            </p>
            
            <h5>Node Count Calculation</h5>
            <ul>
              <li><strong>Manual Override:</strong> Uses fixed node count when "Override auto-scaling" is enabled</li>
              <li><strong>Auto-scaling Logic:</strong> Calculates required nodes based on:
                <ul>
                  <li>Concurrent requests per second = Monthly requests ÷ (30 × 24 × 3600)</li>
                  <li>Peak concurrent requests (burst factor applied)</li>
                  <li>Requests per pod = Instance CPU cores × 100 (assuming 100 RPS per core)</li>
                  <li>Required pods = Peak concurrent requests ÷ Requests per pod</li>
                  <li>Pods per node = Instance memory ÷ 256MB (assuming 256MB per pod)</li>
                  <li>Required nodes = Required pods ÷ Pods per node</li>
                </ul>
              </li>
              <li><strong>Minimum:</strong> Always at least 2 nodes for high availability</li>
            </ul>
          </div>

          <div className="calculation-section">
            <h4>📊 Key Assumptions</h4>
            <ul>
              <li>Lambda free tier: 1M requests + 400,000 GB-seconds per month</li>
              <li>Average response size: 1KB for network calculations</li>
              <li>Kubernetes pods: 50% CPU/memory utilization target</li>
              <li>Auto-scaling: Minimum 2 nodes, scales up based on concurrent requests</li>
              <li>All prices in USD, based on us-east-1 region (adjusts for other regions)</li>
            </ul>
          </div>

          <div className="calculation-section">
            <h4>🎯 Inflection Point</h4>
            <p>
              The inflection point is where serverless costs exceed Kubernetes costs. 
              This typically occurs at high request volumes due to Lambda's per-request pricing model, 
              while Kubernetes has more predictable fixed costs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCalculationDocs;