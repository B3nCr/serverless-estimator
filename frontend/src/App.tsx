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
