import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UploadResponse,
  AnalysisResponse,
  AnalysisRequest,
  BlockLengthExperimentResponse,
} from '../types/api';
import { apiService, extractErrorMessage } from '../services/api';

interface SignalContextType {
  uploadedSignal: UploadResponse | null;
  setUploadedSignal: (signal: UploadResponse | null) => void;
  analysisResult: AnalysisResponse | null;
  setAnalysisResult: (result: AnalysisResponse | null) => void;
  experimentResult: BlockLengthExperimentResponse | null;
  setExperimentResult: (result: BlockLengthExperimentResponse | null) => void;
  backendConnected: boolean | null;
  backendService: string | null;
  isCheckingHealth: boolean;
  checkBackendHealth: () => Promise<boolean>;
  isAnalyzing: boolean;
  analysisError: string | null;
  runAnalysis: (config: Omit<AnalysisRequest, 'signal_id'>) => Promise<boolean>;
  isExperimenting: boolean;
  experimentError: string | null;
  runExperiment: (blockLengths: number[], samplingFrequency?: number) => Promise<boolean>;
  clearSession: () => void;
}

const SignalContext = createContext<SignalContextType | undefined>(undefined);

export const SignalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploadedSignal, setUploadedSignal] = useState<UploadResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [experimentResult, setExperimentResult] = useState<BlockLengthExperimentResponse | null>(null);

  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [backendService, setBackendService] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [isExperimenting, setIsExperimenting] = useState(false);
  const [experimentError, setExperimentError] = useState<string | null>(null);

  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    setIsCheckingHealth(true);
    try {
      const res = await apiService.checkHealth();
      setBackendConnected(res.status === 'ok');
      setBackendService(res.service);
      return res.status === 'ok';
    } catch {
      setBackendConnected(false);
      setBackendService(null);
      return false;
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // Periodic health ping
  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const runAnalysis = async (config: Omit<AnalysisRequest, 'signal_id'>): Promise<boolean> => {
    if (!uploadedSignal) {
      setAnalysisError('No signal currently uploaded. Please upload a signal first.');
      return false;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const requestPayload: AnalysisRequest = {
        signal_id: uploadedSignal.signal_id,
        ...config,
      };

      const result = await apiService.runAnalysis(requestPayload);
      setAnalysisResult(result);
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err);
      setAnalysisError(msg);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runExperiment = async (
    blockLengths: number[],
    samplingFrequency?: number
  ): Promise<boolean> => {
    if (!uploadedSignal) {
      setExperimentError('No signal currently uploaded. Please upload a signal first.');
      return false;
    }

    setIsExperimenting(true);
    setExperimentError(null);

    try {
      const result = await apiService.runBlockLengthExperiment({
        signal_id: uploadedSignal.signal_id,
        block_lengths: blockLengths,
        sampling_frequency: samplingFrequency || uploadedSignal.sampling_frequency || undefined,
      });
      setExperimentResult(result);
      return true;
    } catch (err) {
      const msg = extractErrorMessage(err);
      setExperimentError(msg);
      return false;
    } finally {
      setIsExperimenting(false);
    }
  };

  const clearSession = () => {
    setUploadedSignal(null);
    setAnalysisResult(null);
    setExperimentResult(null);
    setAnalysisError(null);
    setExperimentError(null);
  };

  return (
    <SignalContext.Provider
      value={{
        uploadedSignal,
        setUploadedSignal,
        analysisResult,
        setAnalysisResult,
        experimentResult,
        setExperimentResult,
        backendConnected,
        backendService,
        isCheckingHealth,
        checkBackendHealth,
        isAnalyzing,
        analysisError,
        runAnalysis,
        isExperimenting,
        experimentError,
        runExperiment,
        clearSession,
      }}
    >
      {children}
    </SignalContext.Provider>
  );
};

export const useSignal = (): SignalContextType => {
  const context = useContext(SignalContext);
  if (!context) {
    throw new Error('useSignal must be used within a SignalProvider');
  }
  return context;
};
