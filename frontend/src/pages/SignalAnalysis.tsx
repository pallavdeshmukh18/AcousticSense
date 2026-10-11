import React, { useRef, useEffect } from 'react';
import { useSignal } from '../context/SignalContext';
import { SignalUploader } from '../components/upload/SignalUploader';
import { AnalysisForm } from '../components/analysis/AnalysisForm';
import { DetectionSummary } from '../components/analysis/DetectionSummary';
import { SignalStatistics } from '../components/analysis/SignalStatistics';
import { FaultFrequencyTable } from '../components/analysis/FaultFrequencyTable';
import { SpectrumChart } from '../components/charts/SpectrumChart';
import { KurtosisChart } from '../components/charts/KurtosisChart';
import { EnvelopeChart } from '../components/charts/EnvelopeChart';
import { WaveformNotice } from '../components/charts/WaveformNotice';
import { AiInterpretationView } from '../components/analysis/AiInterpretationView';
import { Activity, CheckCircle2 } from 'lucide-react';

export const SignalAnalysis: React.FC = () => {
  const { uploadedSignal, analysisResult, isAnalyzing } = useSignal();
  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auto-scroll gently to results when analysis completes
  useEffect(() => {
    if (analysisResult && !isAnalyzing && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult, isAnalyzing]);

  return (
    <div className="py-8 px-6 sm:px-10 max-w-6xl mx-auto space-y-10 text-[#1D1D1F]">
      {/* ======================================================== */}
      {/* 1. PAGE HEADER (Compact, Editorial, Restrained) */}
      {/* ======================================================== */}
      <header className="space-y-1.5 pb-2">
        <div className="text-[11px] font-semibold text-[#0071E3] uppercase tracking-wider font-mono">
          Signal Processing
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[#1D1D1F]">
            Signal Analysis
          </h1>
          {uploadedSignal && (
            <div className="flex items-center gap-2 text-[12px] font-mono text-[#6E6E73] bg-[#FFFFFF] px-3 py-1 rounded-full border border-[#E5E5EA] self-start sm:self-auto shadow-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span className="font-medium text-[#1D1D1F] truncate max-w-[200px]" title={uploadedSignal.filename}>
                {uploadedSignal.filename}
              </span>
              <span className="text-[#86868B]">
                ({uploadedSignal.sample_count.toLocaleString()} pts)
              </span>
            </div>
          )}
        </div>
        <p className="text-[14px] sm:text-[15px] text-[#6E6E73] leading-relaxed max-w-2xl">
          Prepare a signal, configure the analysis, and investigate its frequency-domain and bearing-fault characteristics.
        </p>
      </header>

      {/* ======================================================== */}
      {/* 2. CONTINUOUS WORKFLOW: INGESTION & CONFIGURATION */}
      {/* ======================================================== */}
      <section ref={formRef} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Signal Ingestion Surface */}
          <div className="lg:col-span-5">
            <SignalUploader />
          </div>

          {/* Analysis Settings Surface */}
          <div className="lg:col-span-7">
            <AnalysisForm />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. RESTRAINED ANALYSIS EXECUTION INDICATOR */}
      {/* ======================================================== */}
      {isAnalyzing && (
        <section className="bg-[#FFFFFF] border border-[#0071E3]/30 rounded-2xl p-8 sm:p-10 shadow-subtle text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#F0F6FF] text-[#0071E3] flex items-center justify-center mx-auto">
            <Activity className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">
              Executing 8-Stage DSP Pipeline…
            </h3>
            <p className="text-[13px] text-[#6E6E73] max-w-md mx-auto leading-normal">
              Evaluating detrending moments, Hann-windowed FFT, sub-band spectral kurtosis, zero-phase Butterworth filtering, and discrete Hilbert envelope harmonics.
            </p>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. RESULTS WORKSPACE */}
      {/* ======================================================== */}
      {analysisResult && !isAnalyzing && (
        <section ref={resultsRef} className="space-y-8 pt-4">
          {/* Section Divider & Title */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E5EA]">
            <div className="w-6 h-6 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#248A3D]" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-[#1D1D1F] tracking-tight">
                Analysis Results & Diagnostic Evidence
              </h2>
            </div>
          </div>

          {/* A. Detection Assessment Summary */}
          <DetectionSummary
            detection={analysisResult.detection}
            processingTimeMs={analysisResult.performance.processing_time_ms}
          />

          {/* B. Signal Moment Statistics */}
          <SignalStatistics
            samplingFrequency={analysisResult.signal.sampling_frequency}
            preprocessing={analysisResult.preprocessing}
            envelopeStats={analysisResult.envelope_analysis.envelope_statistics}
          />

          {/* C. Kinematic Defect Frequencies Table */}
          <FaultFrequencyTable
            faultFrequencies={analysisResult.envelope_analysis.fault_frequencies}
            faultIndicators={analysisResult.envelope_analysis.fault_indicators}
            threshold={analysisResult.detection.threshold}
          />

          {/* D. Interactive Visualizations Grid */}
          <div className="space-y-6">
            {/* Stage 03: FFT Spectrum */}
            <SpectrumChart
              frequencies={analysisResult.frequency_analysis.spectrum.frequencies}
              magnitudes={analysisResult.frequency_analysis.spectrum.magnitudes}
              dominantPeaks={analysisResult.frequency_analysis.dominant_peaks}
              frequencyResolution={analysisResult.frequency_analysis.frequency_resolution}
            />

            {/* Stage 04: Spectral Kurtosis Sub-Bands */}
            <KurtosisChart spectralKurtosis={analysisResult.spectral_kurtosis} />

            {/* Stage 05: Bandpass Filter Configuration */}
            <WaveformNotice filtering={analysisResult.bandpass_filtering} />

            {/* Stages 06 & 07: Hilbert Analytic Envelope & Harmonics */}
            <EnvelopeChart
              envelopeAnalysis={analysisResult.envelope_analysis}
              durationSeconds={analysisResult.signal.duration_seconds}
              samplingFrequency={analysisResult.signal.sampling_frequency}
              faultIndicators={analysisResult.envelope_analysis.fault_indicators}
            />
          </div>

          {/* E. AI Analysis & Interpretation Section */}
          <AiInterpretationView
            analysisResult={analysisResult}
            signalId={uploadedSignal?.signal_id}
            onRunAnalysisRequested={scrollToForm}
          />
        </section>
      )}

      {/* ======================================================== */}
      {/* 5. AI INTERPRETATION EMPTY STATE (Awaiting Execution) */}
      {/* ======================================================== */}
      {!analysisResult && !isAnalyzing && (
        <AiInterpretationView
          analysisResult={null}
          signalId={uploadedSignal?.signal_id}
          onRunAnalysisRequested={scrollToForm}
        />
      )}
    </div>
  );
};

export default SignalAnalysis;
