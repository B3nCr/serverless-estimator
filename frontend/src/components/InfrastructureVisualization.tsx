import React, { useState } from 'react';

interface InfrastructureVisualizationProps {
  type: 'serverless' | 'kubernetes';
}

const InfrastructureVisualization: React.FC<InfrastructureVisualizationProps> = ({ type }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  return (
    <div className={`infrastructure-diagram ${type} ${expanded ? 'expanded' : ''}`}>
      <button className="expand-button" onClick={toggleExpand}>
        {expanded ? 'Hide Details' : 'Show Details'}
      </button>
      {type === 'serverless' ? (
        <div className="diagram-container">
          <h4>AWS Serverless Architecture</h4>
          <div className="diagram">
            <div className="component client">
              <div className="icon">👤</div>
              <div className="label">Client</div>
            </div>
            <div className="arrow">→</div>
            <div className="component api-gateway">
              <div className="icon">🌐</div>
              <div className="label">API Gateway</div>
            </div>
            <div className="arrow">→</div>
            <div className="component lambda">
              <div className="icon">λ</div>
              <div className="label">Lambda Function</div>
            </div>
            <div className="arrow">→</div>
            <div className="component dynamodb">
              <div className="icon">🗄️</div>
              <div className="label">DynamoDB (Optional)</div>
            </div>
          </div>
          {expanded && (
            <div className="infrastructure-notes">
              <p>Included in estimate:</p>
              <ul>
                <li>API Gateway request handling</li>
                <li>Lambda compute and request costs</li>
                <li>Data transfer costs</li>
                <li>CloudWatch monitoring</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="diagram-container">
          <h4>Kubernetes Architecture</h4>
          <div className="diagram">
            <div className="component client">
              <div className="icon">👤</div>
              <div className="label">Client</div>
            </div>
            <div className="arrow">→</div>
            <div className="component load-balancer">
              <div className="icon">⚖️</div>
              <div className="label">Load Balancer</div>
            </div>
            <div className="arrow">→</div>
            <div className="component k8s-cluster">
              <div className="icon">🔄</div>
              <div className="label">Kubernetes Cluster</div>
              <div className="sub-components">
                <div className="sub-component">
                  <div className="icon small">🔶</div>
                  <div className="label small">Pod</div>
                </div>
                <div className="sub-component">
                  <div className="icon small">🔶</div>
                  <div className="label small">Pod</div>
                </div>
                <div className="sub-component">
                  <div className="icon small">🔶</div>
                  <div className="label small">Pod</div>
                </div>
              </div>
            </div>
            <div className="arrow">→</div>
            <div className="component database">
              <div className="icon">🗄️</div>
              <div className="label">Database (Optional)</div>
            </div>
          </div>
          {expanded && (
            <div className="infrastructure-notes">
              <p>Included in estimate:</p>
              <ul>
                <li>EC2 instances for Kubernetes nodes</li>
                <li>Load balancer costs</li>
                <li>Data transfer costs</li>
                <li>EBS storage for nodes</li>
                <li>Management overhead</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InfrastructureVisualization;