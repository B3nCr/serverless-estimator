import { Routes, Route, Link, NavLink } from "react-router-dom";
import "./App.css";
import CostEstimatorForm from "./components/CostEstimatorForm";
import CostComparisonChart from "./components/CostComparisonChart";
import FieldDocumentation from "./components/FieldDocumentation";
import MethodologyDocs from "./components/MethodologyDocs";
import GuideDocs from "./components/GuideDocs";
import { useState } from "react";
import { ChartEstimationParams } from "./services/api";

function EstimatorPage() {
  const [chartParams, setChartParams] = useState<ChartEstimationParams | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = (params: ChartEstimationParams) => {
    setError(null);
    setChartParams(params);
  };

  return (
    <>
      <h1>AWS Serverless vs Kubernetes Cost Estimator</h1>
      <p>
        Compare the cost difference between AWS serverless architecture (Lambda
        + API Gateway) and Kubernetes architecture across different request
        volumes. Find the inflection point where serverless becomes more
        expensive than Kubernetes.
      </p>
      <p className="estimator-docs-link">
        <Link to="/docs/methodology">How costs are calculated</Link> &middot;{" "}
        <Link to="/docs/guide">When to use each approach</Link>
      </p>

      <CostEstimatorForm onSubmit={handleEstimate} isLoading={false} />

      {error && <div className="error">{error}</div>}

      {chartParams && <CostComparisonChart params={chartParams} />}
    </>
  );
}

function App() {
  return (
    <div className="container">
      <nav className="site-nav">
        <NavLink to="/" end>
          Estimator
        </NavLink>
        <span className="site-nav-group">
          <NavLink to="/docs/guide">Guide</NavLink>
          <NavLink to="/docs/methodology">Methodology</NavLink>
          <NavLink to="/docs">Field Reference</NavLink>
        </span>
        <a
          className="site-nav-github"
          href="https://github.com/B3nCr/serverless-estimator"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository (opens in new tab)"
        >
          <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </nav>
      <Routes>
        <Route path="/" element={<EstimatorPage />} />
        <Route path="/docs/guide" element={<GuideDocs />} />
        <Route path="/docs" element={<FieldDocumentation />} />
        <Route path="/docs/methodology" element={<MethodologyDocs />} />
      </Routes>
    </div>
  );
}

export default App;
