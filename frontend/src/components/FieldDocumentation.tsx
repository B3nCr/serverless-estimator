import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const FieldDocumentation = () => {
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
      <h1>Field Reference</h1>
      <p>Detailed guidance for each input in the cost estimator.</p>

      <nav className="docs-toc">
        <h2>Contents</h2>
        <ul>
          <li><a href="#workload-profile">Workload Profile</a></li>
          <li><a href="#request-duration">Average Request Duration</a></li>
          <li><a href="#memory">Average Memory Usage</a></li>
          <li><a href="#region">AWS Region</a></li>
          <li><a href="#peak-multiplier">Peak Traffic Multiplier</a></li>
          <li><a href="#api-gateway-type">API Gateway Type</a></li>
          <li><a href="#ec2-instance-type">EC2 Instance Type</a></li>
          <li><a href="#minimum-nodes">Minimum Nodes</a></li>
        </ul>
      </nav>

      <section id="workload-profile" className="docs-section">
        <h2>Workload Profile</h2>
        <p>
          The workload profile controls how many requests a single Kubernetes pod or node can handle
          at a given point in time. Different workloads saturate CPU and memory in fundamentally
          different ways.
        </p>
        <ul>
          <li><strong>Lightweight</strong> — cached or static responses (~200 req/s per vCPU). Barely touches the CPU; a node can handle hundreds of concurrent requests.</li>
          <li><strong>Standard</strong> — typical DB-backed API (~50 req/s per vCPU). A request does a small amount of blocking I/O and light processing.</li>
          <li><strong>Heavy</strong> — multiple queries or external calls (~15 req/s per vCPU). Each request holds a connection open for longer, reducing concurrency.</li>
          <li><strong>Compute</strong> — ML inference, image processing (~3 req/s per vCPU). A request may hold an entire core for hundreds of milliseconds.</li>
        </ul>
        <p>
          This is the key driver of how quickly your Kubernetes cluster must grow as traffic
          increases. Compute-heavy workloads require significantly more nodes at the same request
          volume, and benefit from memory-optimized or compute-optimized instance families rather
          than general-purpose ones.
        </p>
        <p>
          For async-heavy workloads (heavy profile), AWS Step Functions (Express) can reduce Lambda
          costs by billing only for actual compute time rather than total wall-clock wait time —
          but this tool models Lambda + API Gateway only.
        </p>
      </section>

      <section id="request-duration" className="docs-section">
        <h2>Average Request Duration (ms)</h2>
        <p>How long a single request takes end-to-end, in milliseconds.</p>
        <ul>
          <li>
            <strong>Lambda:</strong> billed per ms of execution time. A shorter duration
            directly reduces your compute cost.
          </li>
          <li>
            <strong>Kubernetes:</strong> determines how many concurrent requests a pod can
            handle. A pod serving 100ms requests can handle ~10 concurrent requests; the same
            pod serving 1000ms requests can only handle ~1. This sets the number of pods and
            nodes required at a given RPS.
          </li>
        </ul>
        <p>
          Use your p50 (median) latency for a representative estimate. Using p99 will
          overestimate Kubernetes node requirements; using a theoretical minimum will underestimate them.
        </p>
      </section>

      <section id="memory" className="docs-section">
        <h2>Average Memory Usage (MB)</h2>
        <p>Peak memory consumed per request.</p>
        <ul>
          <li>
            <strong>Lambda:</strong> memory must be allocated upfront (in 1MB increments) and
            feeds directly into GB-second billing. Allocating more memory than you use wastes money,
            but allocating too little causes out-of-memory errors.
          </li>
          <li>
            <strong>Kubernetes:</strong> determines how many pods fit on a single node. A node
            with 8GB RAM and 1GB system overhead can fit ~7 pods at 1GB each. This directly
            influences which EC2 instance SKU is selected and how quickly the cluster must scale.
          </li>
        </ul>
      </section>

      <section id="region" className="docs-section">
        <h2>AWS Region</h2>
        <p>
          Both Lambda and EC2 pricing vary by region. This setting applies to the entire comparison —
          choose the region where your workload will actually run.
        </p>
        <p>
          US East (N. Virginia) is typically the cheapest. EU and Asia-Pacific regions are
          generally 5–15% more expensive. The relative cost difference between serverless and
          Kubernetes is broadly similar across regions, so the inflection point doesn't shift
          dramatically with region choice.
        </p>
      </section>

      <section id="peak-multiplier" className="docs-section">
        <h2>Peak Traffic Multiplier</h2>
        <p>
          Kubernetes must be sized for peak load, not average load — you cannot spin up nodes
          instantly when a traffic spike arrives. This multiplier models the relationship between
          your average monthly traffic and your peak traffic.
        </p>
        <p>
          A multiplier of 3 means your cluster is sized to handle 3× the average monthly
          request rate. Both RPS capacity and concurrent memory headroom are scaled accordingly.
        </p>
        <p>
          A value of 1 assumes perfectly flat traffic (unrealistic for most workloads). A value
          of 5–10 is appropriate for highly bursty workloads such as e-commerce during sales
          events. A value of 2–3 is typical for most web APIs.
        </p>
        <p>
          Lambda is unaffected by this setting — it scales instantly and you only pay for
          actual invocations.
        </p>
      </section>

      <section id="api-gateway-type" className="docs-section">
        <h2>API Gateway Type</h2>
        <p>AWS offers two API Gateway flavours with meaningfully different pricing and capabilities.</p>
        <ul>
          <li>
            <strong>HTTP API — $1.00/million requests.</strong> Simpler, lower latency, and
            cheaper. Suitable for most REST and WebSocket use cases. Lacks some advanced features
            of REST API.
          </li>
          <li>
            <strong>REST API — $3.50/million requests.</strong> Supports advanced routing,
            request/response transformation, usage plans, API keys, and WAF integration.
            Use this if you need those features.
          </li>
        </ul>
        <p>
          At high request volumes, the difference between HTTP and REST API Gateway can be
          significant. 100M requests/month costs $100 with HTTP API vs $350 with REST API —
          a $250/month difference that shifts the serverless/Kubernetes inflection point noticeably.
        </p>
      </section>

      <section id="ec2-instance-type" className="docs-section">
        <h2>EC2 Instance Type</h2>
        <p>The EC2 instance type used for Kubernetes worker nodes.</p>
        <ul>
          <li>
            <strong>Auto (recommended):</strong> selects the smallest instance whose RAM fits
            your pod memory requirements, with headroom for Kubernetes system overhead (~500MB).
            This is usually the most cost-efficient choice.
          </li>
          <li>
            <strong>Manual override:</strong> useful if you already operate a specific fleet and
            want to model its cost, or if you want to compare instance families
            (e.g. general-purpose m5 vs compute-optimized c5 vs memory-optimized r5).
          </li>
        </ul>
        <p>
          Instance family matters for compute-heavy workloads. A c5 instance has a higher
          CPU-to-memory ratio than an m5, meaning it can handle more concurrent CPU-bound
          requests per node — but may require more nodes if your pods are memory-hungry.
        </p>
      </section>

      <section id="minimum-nodes" className="docs-section">
        <h2>Minimum Nodes</h2>
        <p>
          Sets a floor on the number of Kubernetes worker nodes, regardless of what the
          auto-scaling calculation produces.
        </p>
        <p>
          The default minimum is 2 nodes. Common reasons to increase this:
        </p>
        <ul>
          <li><strong>Multi-AZ redundancy</strong> — 3 nodes to spread across 3 availability zones.</li>
          <li><strong>Rolling deploys</strong> — enough spare capacity to drain a node without dropping below your required pod count.</li>
          <li><strong>Regulatory requirements</strong> — some compliance frameworks require N+1 or N+2 redundancy.</li>
        </ul>
        <p>
          A higher minimum node floor raises the base cost of Kubernetes, which moves the
          inflection point earlier — serverless becomes relatively cheaper at lower request volumes
          when your Kubernetes baseline is more expensive.
        </p>
      </section>
    </div>
  );
};

export default FieldDocumentation;
