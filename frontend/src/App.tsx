import { useState } from 'react'
import './App.css'
import CostEstimatorForm from './components/CostEstimatorForm'
import CostComparisonResults from './components/CostComparisonResults'
import { estimateCosts, ComparisonResult } from './services/api'

function App() {
  const [results, setResults] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEstimate = async (params: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await estimateCosts(params)
      setResults(data)
    } catch (err) {
      setError('Failed to calculate costs. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>AWS Serverless vs Kubernetes Cost Estimator</h1>
      <p>
        Compare the cost difference between AWS serverless architecture (Lambda + API Gateway) 
        and Kubernetes architecture for your workload.
      </p>
      
      <CostEstimatorForm onSubmit={handleEstimate} isLoading={loading} />
      
      {error && <div className="error">{error}</div>}
      
      {results && <CostComparisonResults results={results} />}
    </div>
  )
}

export default App
