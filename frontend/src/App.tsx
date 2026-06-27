import { useState } from 'react'
import './App.css'
import CostEstimatorForm from './components/CostEstimatorForm'
import CostComparisonChart from './components/CostComparisonChart'
import CostCalculationDocs from './components/CostCalculationDocs'
import { ChartEstimationParams } from './services/api'

function App() {
  const [chartParams, setChartParams] = useState<ChartEstimationParams | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEstimate = (params: ChartEstimationParams) => {
    setError(null)
    setChartParams(params)
  }

  return (
    <div className="container">
      <h1>AWS Serverless vs Kubernetes Cost Estimator</h1>
      <p>
        Compare the cost difference between AWS serverless architecture (Lambda + API Gateway) 
        and Kubernetes architecture across different request volumes. Find the inflection point 
        where serverless becomes more expensive than Kubernetes.
      </p>
      
      <CostCalculationDocs />
      
      <CostEstimatorForm onSubmit={handleEstimate} isLoading={false} />
      
      {error && <div className="error">{error}</div>}
      
      {chartParams && <CostComparisonChart params={chartParams} />}
    </div>
  )
}

export default App
