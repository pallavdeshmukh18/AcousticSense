import axios, { AxiosError } from 'axios';
import {
  HealthResponse,
  UploadResponse,
  AnalysisRequest,
  AnalysisResponse,
  BlockLengthExperimentRequest,
  BlockLengthExperimentResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Extracts a human-readable error message from an Axios error response.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ detail?: string | Array<{ msg: string; loc?: string[] }> }>;
    if (axiosErr.response?.data) {
      const data = axiosErr.response.data;
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        return data.detail.map((err) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
      }
    }
    if (axiosErr.message === 'Network Error') {
      return `Unable to connect to DSP backend at ${API_BASE_URL}. Ensure the server is running.`;
    }
    return axiosErr.message || 'An unknown network error occurred.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export const apiService = {
  /**
   * Pings the backend health endpoint.
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/api/health');
    return response.data;
  },

  /**
   * Uploads a WAV or CSV signal file.
   */
  async uploadSignal(
    file: File,
    column?: string,
    samplingFrequency?: number,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (column && column.trim()) {
      formData.append('column', column.trim());
    }
    if (samplingFrequency && samplingFrequency > 0) {
      formData.append('sampling_frequency', samplingFrequency.toString());
    }

    const response = await apiClient.post<UploadResponse>('/api/signals/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Executes the classical 8-stage DSP fault detection pipeline.
   */
  async runAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await apiClient.post<AnalysisResponse>('/api/analysis/run', request);
    return response.data;
  },

  /**
   * Executes the non-overlapping block-length experiment.
   */
  async runBlockLengthExperiment(
    request: BlockLengthExperimentRequest
  ): Promise<BlockLengthExperimentResponse> {
    const response = await apiClient.post<BlockLengthExperimentResponse>(
      '/api/experiments/block-length',
      request
    );
    return response.data;
  },
};
