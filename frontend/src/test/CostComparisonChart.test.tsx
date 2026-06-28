import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CostComparisonChart from '../components/CostComparisonChart';
import { RateLimitError } from '../services/api';

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>();
  return { ...actual, generateChartData: vi.fn() };
});

const { generateChartData } = await import('../services/api');
const mockGenerateChartData = vi.mocked(generateChartData);

const defaultParams = {
  averageRequestDurationMs: 100,
  averageMemoryMb: 256,
};

beforeEach(() => {
  mockGenerateChartData.mockReset();
});

describe('CostComparisonChart error handling', () => {
  it('shows rate limit message on 429', async () => {
    mockGenerateChartData.mockRejectedValue(new RateLimitError());

    render(<CostComparisonChart params={defaultParams} />);

    await waitFor(() => {
      expect(screen.getByText('Too many requests — please wait a moment and try again.')).toBeInTheDocument();
    });
  });

  it('shows generic error message for non-rate-limit failures', async () => {
    mockGenerateChartData.mockRejectedValue(new Error('Internal Server Error'));

    render(<CostComparisonChart params={defaultParams} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to generate chart data')).toBeInTheDocument();
    });
  });
});
