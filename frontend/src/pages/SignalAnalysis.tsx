import React, { useRef } from 'react';
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
import { Activity, Sparkles, CheckCircle2 } from 'lucide-react';

export const SignalAnalysis: React.FC = () => {
  const { uploadedSignal, analysisResult, isAnalyzing } = useSignal();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleUploadSuccess = () => {
    // Smooth scroll to configuration or results
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Breadcrumb info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-industrial-900 tracking-tight">
            Signal Analysis Workspace
          </h2>
          <p className="text-xs text-industrial-500 mt-0.5">
            Ingest time-series bearing signals, configure analysis parameters, and visualize classical DSP stages.
          </p>
        </div>

        {uploadedSignal && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-industrial-200 text-industrial-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[200px]" title={uploadedSignal.filename}>
              {uploadedSignal.filename}
            </span>
          </div>
        )}
      </div>

      {/* Grid: Upload & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SignalUploader onUploadSuccess={handleUploadSuccess} />
        </div>
        <div>
          <AnalysisForm />
        </div>
      </div>

      {/* Loading Banner when Analysis is running */}
      {isAnalyzing && (
        <div className="bg-white border border-primary-200 rounded-xl p-8 text-center shadow-xs animate-pulse">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-5 h-5 animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-industrial-800">
            Executing Classical DSP Pipeline...
          </h3>
          <p className="text-xs text-industrial-500 mt-1 max-w-md mx-auto">
            Computing zero-phase Butterworth filtering, Hilbert analytic envelope, FFT magnitude spectrum,
            and evaluating peak-to-noise ratios.
          </p>
        </div>
      )}

      {/* Results View */}
      {analysisResult && !isAnalyzing && (
        <div ref={resultsRef} className="space-y-6 pt-2">
          {/* Section Divider */}
          <div className="flex items-center gap-3 border-b border-industrial-200 pb-3">
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-industrial-900 tracking-tight">
                Analysis Results & Diagnostic Evidence
              </h3>
              <p className="text-xs text-industrial-500">
                Verified signal processing outputs computed by the FastAPI backend.
              </p>
            </div>
          </div>

          {/* 1. Detection Summary */}
          <DetectionSummary
            detection={analysisResult.detection}
            processingTimeMs={analysisResult.performance.processing_time_ms}
          />

          {/* 2. Measured Moments Statistics */}
          <SignalStatistics
            samplingFrequency={analysisResult.signal.sampling_frequency}
            preprocessing={analysisResult.preprocessing}
            envelopeStats={analysisResult.envelope_analysis.envelope_statistics}
          />

          {/* 3. Characteristic Bearing Defect Frequencies Table */}
          <FaultFrequencyTable
            faultFrequencies={analysisResult.envelope_analysis.fault_frequencies}
            faultIndicators={analysisResult.envelope_analysis.fault_indicators}
            threshold={analysisResult.detection.threshold}
          />

          {/* 4. Interactive DSP Visualizations Grid */}
          <div className="space-y-6">
            {/* Stage 2: FFT Spectrum */}
            <SpectrumChart
              frequencies={analysisResult.frequency_analysis.spectrum.frequencies}
              magnitudes={analysisResult.frequency_analysis.spectrum.magnitudes}
              dominantPeaks={analysisResult.frequency_analysis.dominant_peaks}
              frequencyResolution={analysisResult.frequency_analysis.frequency_resolution}
            />

            {/* Stage 3: Spectral Kurtosis Sub-Bands */}
            <KurtosisChart spectralKurtosis={analysisResult.spectral_kurtosis} />

            {/* Stage 4: Filter Configuration Notice */}
            <WaveformNotice filtering={analysisResult.bandpass_filtering} />

            {/* Stage 5 & 6: Hilbert Envelope and Demodulated Spectrum */}
            <EnvelopeChart
              envelopeAnalysis={analysisResult.envelope_analysis}
              durationSeconds={analysisResult.signal.duration_seconds}
              samplingFrequency={analysisResult.signal.sampling_frequency}
              faultIndicators={analysisResult.envelope_analysis.fault_indicators}
            />
          </div>
        </div>
      )}

      {/* Empty State when no analysis has been run */}
      {!analysisResult && !isAnalyzing && (
        <div className="bg-white border border-industrial-200 rounded-xl p-8 text-center shadow-xs">
          <div className="w-10 h-10 rounded-full bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-industrial-700">
            No Analysis Results Yet
          </h3>
          <p className="text-xs text-industrial-400 mt-1 max-w-md mx-auto">
            {uploadedSignal
              ? 'Click "Run DSP Analysis" above to process the active signal through the 8-stage pipeline.'
              : 'Upload a WAV audio recording or CSV numerical signal above to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};
