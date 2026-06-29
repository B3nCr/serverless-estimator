import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const GuideDocs = () => {
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
      <h1>Serverless vs Kubernetes — When to Use Which</h1>
      <p>
        Cost is one factor, but rarely the deciding one. This guide covers the full picture:
        when each approach fits, where each breaks down, and how teams typically evolve between them.
      </p>

      <nav className="docs-toc">
        <h2>Contents</h2>
        <ul>
          <li><a href="#cost-shape">The cost shape difference</a></li>
          <li><a href="#choose-serverless">When to choose serverless</a></li>
          <li><a href="#choose-kubernetes">When to choose Kubernetes</a></li>
          <li><a href="#test-environments">Test and non-production environments</a></li>
          <li><a href="#operational-overhead">Operational overhead</a></li>
          <li><a href="#team-context">Team context matters</a></li>
          <li><a href="#migration-path">Migration paths</a></li>
        </ul>
      </nav>

      <section id="cost-shape" className="docs-section">
        <h2>The cost shape difference</h2>
        <p>
          Serverless and Kubernetes have fundamentally different cost curves, and understanding
          the shape matters more than the absolute numbers.
        </p>
        <p>
          <strong>Serverless scales to near-zero.</strong> If your service receives 100 requests
          a day, you pay almost nothing. There is no idle cost. Every dollar you spend is directly
          tied to work being done.
        </p>
        <p>
          <strong>Kubernetes has a fixed baseline.</strong> Even a minimal cluster — 2 nodes,
          EKS management fee, load balancer — costs $150–300/month before a single request
          arrives. That baseline is the price of the platform.
        </p>
        <p>
          The <Link to="/">estimator</Link> finds the crossover point where serverless per-request
          costs accumulate past the Kubernetes baseline. For most general-purpose APIs this
          crossover is somewhere between 5M and 50M requests/month, but it varies enormously
          with request duration, memory, and workload type.
        </p>
      </section>

      <section id="choose-serverless" className="docs-section">
        <h2>When to choose serverless</h2>
        <ul>
          <li>
            <strong>Unpredictable or spiky traffic.</strong> Lambda handles traffic spikes
            far faster than Kubernetes — it scales in seconds rather than the 5–15 minutes
            required for cluster autoscaling and pod scheduling. That said, Lambda does have
            burst limits: an initial ceiling of ~3,000 concurrent executions, then +500/minute
            in most regions. A sudden extreme spike (tens of thousands of concurrent requests)
            will still see a brief ramp-up period, not instant full capacity. For the vast
            majority of workloads this is immaterial, but it is worth knowing.
          </li>
          <li>
            <strong>Low or variable baseline traffic.</strong> Internal tools, webhooks,
            scheduled jobs, and APIs that receive thousands rather than millions of requests
            per month are almost always cheaper serverless.
          </li>
          <li>
            <strong>Small teams or early-stage products.</strong> No cluster to manage, no
            capacity planning, no on-call for node failures. The operational savings often
            outweigh higher per-request costs.
          </li>
          <li>
            <strong>Event-driven architectures.</strong> Lambda integrates natively with S3,
            SQS, SNS, DynamoDB Streams, EventBridge. Wiring these with Kubernetes requires
            significantly more glue.
          </li>
          <li>
            <strong>Short, stateless request handling.</strong> Lambda's execution model is
            a natural fit for request/response APIs where each invocation is independent.
          </li>
        </ul>
      </section>

      <section id="choose-kubernetes" className="docs-section">
        <h2>When to choose Kubernetes</h2>
        <ul>
          <li>
            <strong>High, sustained request volume.</strong> Once you're in the tens of millions
            of requests per month with non-trivial compute per request, Kubernetes' fixed costs
            are amortised across enough traffic that per-unit cost drops significantly below Lambda.
          </li>
          <li>
            <strong>Long-running or stateful workloads.</strong> Lambda has a 15-minute maximum
            execution time and no persistent local state. Kubernetes pods can run indefinitely
            and hold in-memory caches, connection pools, and local files.
          </li>
          <li>
            <strong>Compute-intensive workloads.</strong> ML inference, video processing, and
            similar CPU/GPU-bound tasks can run much cheaper on reserved EC2 capacity than
            Lambda's per-ms billing. GPU instances are also not available on Lambda.
          </li>
          <li>
            <strong>Existing containerised workloads.</strong> If your services already run in
            Docker containers, Kubernetes adds relatively little migration cost. Moving to Lambda
            requires code changes and architectural adjustments.
          </li>
          <li>
            <strong>Regulatory or data residency requirements.</strong> Some compliance frameworks
            require explicit control over compute isolation, network egress, and audit trails that
            are easier to satisfy with dedicated infrastructure.
          </li>
          <li>
            <strong>Multi-cloud or on-premises portability.</strong> Kubernetes runs on any cloud
            and on-premises. Lambda is AWS-specific.
          </li>
        </ul>
      </section>

      <section id="test-environments" className="docs-section">
        <h2>Test and non-production environments</h2>
        <p>
          Non-production environments have a meaningfully different cost profile from production,
          and this is one area where serverless has a genuine structural advantage.
        </p>
        <p>
          On a pure serverless stack, every non-production environment — UAT, SIT, per-PR
          ephemeral deployments — is effectively free when idle. You can have dozens of named
          environments, or a fresh environment for every open pull request, at near-zero
          infrastructure cost. The constraint shifts from cost to deployment pipeline complexity.
        </p>
        <p>
          Kubernetes non-production is more expensive, and the shared-cluster-with-namespaces
          approach that is often cited as the cost mitigation tends to be worse than it sounds.
          In my experience, namespace isolation introduces enough friction — shared capacity
          contention, cluster-level concerns leaking across tenants, tighter governance on who
          can deploy what — that teams end up with a small number of named environments (dev,
          SIT, UAT, preprod) that people queue to use, rather than genuinely on-demand
          environments. The consequence is that per-PR integration testing against a real
          deployed environment simply does not happen, not because teams don't want it, but
          because there is no environment to deploy to. That quality and velocity cost does
          not appear on the infrastructure bill.
        </p>
        <p>
          One assumption worth challenging: automated test suites can generate surprisingly
          high Lambda invocations. A CI pipeline running 500 integration tests, each making
          10 API calls, 50 times a day, produces roughly 7.5M Lambda invocations per month
          — a non-trivial cost. Automated testing traffic is also highly predictable and
          sustained, which is precisely the traffic pattern where per-request billing is
          expensive relative to a shared cluster that absorbs it at no marginal cost.
          If your CI runs frequently against a serverless environment, model that traffic
          separately before assuming non-prod costs are negligible.
        </p>
      </section>

      <section id="operational-overhead" className="docs-section">
        <h2>Operational overhead</h2>
        <p>
          The operational difference is often larger than the cost difference, especially for
          smaller teams.
        </p>
        <p>
          <strong>Serverless operational surface:</strong> deployment packaging, cold start
          latency, function timeout tuning, memory sizing, IAM permissions per function,
          distributed tracing across invocations. Tooling (AWS SAM, Serverless Framework,
          CDK) handles most of this.
        </p>
        <p>
          <strong>Kubernetes operational surface:</strong> cluster upgrades, node patching,
          pod disruption budgets, resource requests and limits, horizontal pod autoscaling,
          cluster autoscaler, ingress controllers, certificate management, persistent volume
          management, multi-AZ scheduling. Even with managed EKS, this is a meaningful
          ongoing investment.
        </p>
        <p>
          A rough rule of thumb: serverless requires a day of ops work per month for a
          small-to-medium system. Kubernetes typically requires 2–5 days of platform
          engineering per month at minimum — more during upgrades, incidents, or migrations.
          At current contractor rates that is roughly:
        </p>
        <ul>
          <li><strong>UK</strong> — £500–700/day → £1,000–3,500/month in platform labour</li>
          <li><strong>US</strong> — $900–1,400/day → $1,800–7,000/month</li>
          <li><strong>Offshore</strong> (India, Eastern Europe) — £200–400/day → £400–2,000/month</li>
        </ul>
        <p>
          Even at the low end, this regularly exceeds the Lambda cost premium — particularly
          for teams below ~20M requests/month. The estimator models infrastructure cost only;
          factor in this labour cost before concluding that Kubernetes is cheaper.
        </p>
      </section>

      <section id="team-context" className="docs-section">
        <h2>Team context matters</h2>
        <p>
          The right choice is heavily influenced by what your team already knows and operates.
        </p>
        <ul>
          <li>
            A team with strong Kubernetes expertise running Kubernetes everywhere should
            probably add one more service to the cluster rather than introduce a second
            operational model — unless serverless is substantially cheaper (more than
            30–40% lower all-in cost including labour), which is unlikely once the
            cluster already exists and fixed costs are shared.
          </li>
          <li>
            A team with no infrastructure engineers should strongly prefer serverless.
            The total cost of ownership, including the engineering time to operate Kubernetes,
            is almost always higher than the higher per-request Lambda cost.
          </li>
          <li>
            Platform teams at larger organisations often provide a Kubernetes platform as a
            shared service. In that context, the Kubernetes fixed costs are shared across
            many teams, changing the economics significantly.
          </li>
        </ul>
      </section>

      <section id="migration-path" className="docs-section">
        <h2>Migration paths</h2>
        <p>
          Most teams do not make a permanent choice — they start where it makes sense and
          migrate as their needs change.
        </p>
        <p>
          <strong>Serverless to Kubernetes</strong> is the most common path. Teams start
          with serverless for speed and low overhead, then migrate specific high-volume
          or long-running services to Kubernetes as traffic grows and the cost gap widens.
          This is rarely a full migration — hybrid architectures (Lambda for event-driven
          work, Kubernetes for high-throughput APIs) are common and sensible.
        </p>
        <p>
          <strong>Kubernetes to serverless</strong> happens less often but is worth
          considering for services with highly variable traffic or services that are
          expensive to maintain in a cluster.
        </p>
        <p>
          Lambda container images are sometimes suggested as an easy migration path — package
          your existing Docker image and run it on Lambda with minimal code changes. In practice
          this is rarely a good idea for synchronous APIs. Container cold starts on Lambda can
          reach 5–30 seconds depending on image size, compared to under a second for zip-deployed
          Lambda. For a user-facing API that is not acceptable. You can mitigate this with
          Provisioned Concurrency, but that adds significant cost and largely defeats the
          scale-to-zero benefit that makes serverless attractive.
        </p>
        <p>
          Container Lambda is more useful for async workloads — background jobs, scheduled
          tasks, or data processing pipelines — where an occasional cold start does not affect
          user experience and you want to keep your existing container build pipeline.
          For request/response APIs, a proper port to zip-deployed Lambda is the better path.
        </p>
        <p>
          Use the <Link to="/">estimator</Link> to find the request volume where the cost
          crossover happens for your specific workload, then weigh that against the
          operational factors above.
        </p>
      </section>
    </div>
  );
};

export default GuideDocs;
