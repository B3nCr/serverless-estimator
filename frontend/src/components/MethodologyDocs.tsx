import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MethodologyDocs = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <div className="docs-page">
      <h1>Methodology</h1>
      <p>
        How this tool calculates costs, what it models, and where it makes simplifying assumptions.
      </p>

      <nav className="docs-toc">
        <h2>Contents</h2>
        <ul>
          <li><a href="#serverless">AWS Serverless (Lambda + API Gateway)</a></li>
          <li><a href="#kubernetes">Kubernetes on AWS EC2</a></li>
          <li><a href="#node-sizing">Node Sizing Logic</a></li>
          <li><a href="#inflection-point">Inflection Point</a></li>
          <li><a href="#assumptions">Assumptions &amp; Limitations</a></li>
        </ul>
      </nav>

      <section id="serverless" className="docs-section">
        <h2>AWS Serverless (Lambda + API Gateway)</h2>
        <p>The serverless cost is the sum of four components:</p>
        <ul>
          <li>
            <strong>Compute cost</strong> — billed per GB-second. Each invocation costs
            memory (GB) × duration (s) × $0.0000166667.
          </li>
          <li>
            <strong>Request cost</strong> — $0.0000002 per Lambda invocation ($0.20/million).
          </li>
          <li>
            <strong>API Gateway cost</strong> — REST API: $3.50/million requests;
            HTTP API: $1.00/million requests.
          </li>
          <li>
            <strong>Data transfer</strong> — outbound transfer charges based on an assumed
            10KB average response size.
          </li>
        </ul>
        <p className="formula">
          <strong>Formula:</strong> (Memory_GB × Duration_s × Requests × $0.0000166667) + (Requests × $0.0000002) + API_Gateway_Cost + Transfer_Cost
        </p>
        <p>
          The Lambda free tier (1M requests + 400,000 GB-seconds per month) is applied where
          applicable. Above that threshold, all requests are billed at full rate.
        </p>
      </section>

      <section id="kubernetes" className="docs-section">
        <h2>Kubernetes on AWS EC2</h2>
        <p>The Kubernetes cost is the sum of four fixed components:</p>
        <ul>
          <li>
            <strong>Compute cost</strong> — EC2 on-demand pricing × node count × 730 hours/month.
          </li>
          <li>
            <strong>EKS management fee</strong> — $72/month per cluster, regardless of node count.
          </li>
          <li>
            <strong>Application Load Balancer</strong> — ~$16.20/month base cost.
          </li>
          <li>
            <strong>EBS storage</strong> — per-node EBS volume costs for the OS and container runtime.
          </li>
        </ul>
        <p className="formula">
          <strong>Formula:</strong> (Instance_Cost × Nodes × 730h) + $72 (EKS) + $16.20 (ALB) + Storage_Cost
        </p>
        <p>
          Unlike serverless, Kubernetes costs are largely fixed regardless of actual traffic.
          The dominant variable is node count, which is determined by the node sizing logic below.
        </p>
      </section>

      <section id="node-sizing" className="docs-section">
        <h2>Node Sizing Logic</h2>
        <p>
          Node count is calculated from first principles based on the constraints that bind first —
          either RPS throughput or concurrent memory usage, whichever requires more nodes.
        </p>
        <ol>
          <li>Average RPS = Monthly requests ÷ (30 × 24 × 3600)</li>
          <li>Peak RPS = Average RPS × Peak Traffic Multiplier</li>
          <li>Concurrent requests per pod = 1000ms ÷ Request Duration (ms)</li>
          <li>RPS capacity per pod = Concurrent requests × (Workload profile RPS/vCPU ÷ vCPUs)</li>
          <li>Pods required for throughput = Peak RPS ÷ RPS per pod</li>
          <li>Pods required for memory = (Peak RPS × Request Duration × Memory per request) ÷ Node memory</li>
          <li>Required nodes = max(throughput-bound nodes, memory-bound nodes)</li>
          <li>Final node count = max(Required nodes, Minimum Nodes)</li>
        </ol>
        <p>
          If a specific EC2 instance type is selected, that instance's specs are used directly.
          On Auto, the smallest instance whose RAM comfortably fits your pod memory (with ~500MB
          system headroom) is selected.
        </p>
      </section>

      <section id="inflection-point" className="docs-section">
        <h2>Inflection Point</h2>
        <p>
          The inflection point is the monthly request volume at which serverless becomes more
          expensive than Kubernetes. It is found by binary search over the chart range.
        </p>
        <p>
          Kubernetes has high fixed costs (EKS fee, ALB, minimum nodes) that make it expensive
          at low request volumes. Serverless scales to near-zero at low traffic but grows
          linearly with every request. The crossover point depends heavily on request duration,
          memory, workload profile, and the peak traffic multiplier.
        </p>
        <p>
          Not all configurations produce an inflection point within the chart range — for some
          workloads (particularly memory-heavy, long-duration requests), Kubernetes may always
          be cheaper within realistic traffic volumes, or serverless may never cross over.
        </p>
      </section>

      <section id="assumptions" className="docs-section">
        <h2>Assumptions &amp; Limitations</h2>

        <h3>Pricing</h3>
        <ul>
          <li>All prices are AWS us-east-1 on-demand rates. Regional multipliers are applied for other regions but may drift from current AWS pricing.</li>
          <li>Spot instances, Reserved Instances, and Savings Plans are not modelled — real-world Kubernetes costs are often 30–70% lower with reservations.</li>
          <li>Lambda Provisioned Concurrency is not modelled.</li>
          <li>Prices reflect AWS public list pricing and are not automatically updated. Treat results as directional, not as a billing forecast.</li>
        </ul>

        <h3>Architecture</h3>
        <ul>
          <li>The serverless model assumes Lambda + API Gateway only. It does not include Step Functions, SQS, SNS, DynamoDB, or other services.</li>
          <li>The Kubernetes model assumes EKS on EC2. EKS Fargate, self-managed K8s, and ECS are not modelled.</li>
          <li>NAT Gateway fixed hourly cost is included when the NAT Gateway option is enabled (default on). Data processing costs ($0.045/GB) are not included as they are too workload-specific to model generically.</li>
          <li>Cross-AZ data transfer costs are not included.</li>
          <li>Kubernetes assumes a single cluster. Multi-cluster or multi-region architectures are out of scope.</li>
        </ul>

        <h3>Node sizing</h3>
        <ul>
          <li>Pod overhead is assumed at 50% CPU/memory utilisation target — nodes are not packed to 100%.</li>
          <li>~500MB of each node's RAM is reserved for Kubernetes system components (kubelet, kube-proxy, etc.).</li>
          <li>The workload profile RPS/vCPU figures are rough industry approximations. Your actual throughput will depend on your specific application code and dependencies.</li>
        </ul>
      </section>
    </div>
  );
};

export default MethodologyDocs;
