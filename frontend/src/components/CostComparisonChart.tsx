import { useEffect, useState } from 'react';
import { ChartEstimationParams, generateChartData, CostChartDataPoint } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CostComparisonChartProps {
  params: ChartEstimationParams;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatCurrency = (value: number): string => {
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  } else if (value < 1) {
    return `$${value.toFixed(3)}`;
  } else if (value < 10) {
    return `$${value.toFixed(2)}`;
  } else {
    return `$${Math.round(value * 100) / 100}`;
  }
};

const CostComparisonChart = ({ params }: CostComparisonChartProps) => {
  const [chartData, setChartData] = useState<CostChartDataPoint[]>([]);
  const [inflectionPoint, setInflectionPoint] = useState<number | null>(null);
  const [kubernetesInfo, setKubernetesInfo] = useState<{ nodeCount: number; instanceType: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await generateChartData(params);
        setChartData(result.dataPoints);
        setInflectionPoint(result.inflectionPoint);
        if (result.kubernetesInfo) {
          setKubernetesInfo(result.kubernetesInfo);
        }
      } catch (err) {
        setError('Failed to generate chart data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [params]);

  if (loading) {
    return <div className="chart-loading">Loading chart data...</div>;
  }

  if (error) {
    return <div className="chart-error">{error}</div>;
  }

  if (chartData.length === 0) {
    return <div className="chart-empty">No chart data available</div>;
  }

  return (
    <div className="cost-chart-container">
      <h3>Cost Comparison by Request Volume</h3>

      {inflectionPoint && (
        <div className="inflection-point-info">
          <p>
            <strong>Inflection Point:</strong> At approximately {formatNumber(inflectionPoint)} requests per month,
            serverless becomes more expensive than Kubernetes.
          </p>
        </div>
      )}

      {kubernetesInfo && (
        <div className="kubernetes-info">
          <p>
            <strong>Kubernetes Configuration:</strong> {kubernetesInfo.nodeCount} nodes of type {kubernetesInfo.instanceType}
            {params.overrideAutoScaling ? ' (manually configured)' : ' (auto-scaled)'}
          </p>
        </div>
      )}

      <div className="chart-wrapper" style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="requestsPerMonth"
              scale="log"
              domain={['auto', 'auto']}
              tickFormatter={formatNumber}
              label={{ value: 'Requests per Month', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              label={{ value: 'Monthly Cost (USD)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number, name: string, _: any) => {
                if (name === "Kubernetes Node Count") {
                  return `${value} nodes`
                }
                return name + formatCurrency(value);
              }}
              labelFormatter={(value: number) => `${formatNumber(value)} requests/month`}
            />

            <Legend />
            <Line type="monotone"
              dataKey="kubernetesNodeCount"
              name="Kubernetes Node Count"
              stroke="#ff5500"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="serverlessCost"
              name="AWS Serverless"
              stroke="#ff9900"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="kubernetesCost"
              name="Kubernetes"
              stroke="#326ce5"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-note">
        <small>
          Note: This chart uses a logarithmic scale for request volume to better visualize the cost differences
          across a wide range of request volumes.
        </small>
      </div>
    </div>
  );
};

export default CostComparisonChart;