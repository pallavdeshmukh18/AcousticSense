import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignal } from '../context/SignalContext';
import {
  Activity,
  ArrowRight,
  Server,
  Waves,
  FlaskConical,
  Filter,
  Radio,
  Sliders,
  CheckCircle2,
  FileAudio,
  Eye,
  HelpCircle,
} from 'lucide-react';

const DSP_STAGES = [
  {
    step: 1,
    title: 'Signal Acquisition',
    icon: Radio,
    description:
      'Ingest raw continuous acoustic emission or vibration sensor signals via PCM WAV or numerical CSV formats.',
    formula: 'x[n] ∈ ℝ, Fs in Hz',
  },
  {
    step: 2,
    title: 'Preprocessing & Detrending',
    icon: Sliders,
    description:
      'Zero-mean detrending removes DC drift while preserving true physical amplitudes and calculating fundamental moment statistics.',
    formula: 'x_detrended[n] = x[n] - x̄',
  },
  {
    step: 3,
    title: 'Frequency-Domain Analysis',
    icon: Activity,
    description:
      'Single-sided FFT magnitude spectrum scaled with coherent Hann window gain compensation to locate spectral energy and dominant peaks.',
    formula: 'X(f) = FFT{x[n] · w[n]}, Δf = Fs / N',
  },
  {
    step: 4,
    title: 'Spectral Kurtosis & Band Selection',
    icon: Filter,
    description:
      'Screen candidate frequency sub-bands for transient impulsiveness using Fisher excess kurtosis to select the optimal resonance band.',
    formula: 'Kurtosis = μ₄ / σ⁴ - 3',
  },
  {
    step: 5,
    title: 'Digital Band-Pass Filtering',
    icon: Filter,
    description:
      'Apply numerically stable 2nd-order Butterworth Second-Order Sections (SOS) zero-phase forward-backward filtering.',
    formula: 'H(z) = ∏ SOS_k(z)',
  },
  {
    step: 6,
    title: 'Envelope Extraction (Hilbert)',
    icon: WavesIcon,
    description:
      'Construct the analytic signal using the Hilbert transform to extract the instantaneous high-frequency envelope.',
    formula: 'A[n] = √(y²[n] + H{y[n]}²)',
  },
  {
    step: 7,
    title: 'Envelope Spectrum & Fault Matching',
    icon: Activity,
    description:
      'Compute AC-coupled FFT of the extracted envelope and search within tolerances for kinematic bearing defect frequencies.',
    formula: 'BPFO, BPFI, BSF, FTF Kinematics',
  },
  {
    step: 8,
    title: 'Adaptive Fault Detection',
    icon: CheckCircle2,
    description:
      'Evaluate normalized fault indicator Rf = Mf / (PN + ε) against robust median local noise floors to determine diagnostic status.',
    formula: 'Rf ≥ Threshold (POTENTIAL_FAULT)',
  },
];

function WavesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  );
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { uploadedSignal, analysisResult, backendConnected, backendService } = useSignal();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero / Overview Banner */}
      <div className="bg-white border border-industrial-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-medium mb-3 border border-primary-200/60">
              <Radio className="w-3.5 h-3.5" />
              <span>Digital Signal Processing Research Backend</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-industrial-900 tracking-tight">
              Acoustic Emission Fault Detection
            </h1>
            <p className="text-sm text-industrial-600 mt-2 leading-relaxed">
              Classical digital signal processing for bearing fault diagnosis in rotating machinery.
              Analyzes acoustic emission waveforms using spectral kurtosis, digital bandpass filtering,
              and Hilbert envelope demodulation without neural networks or black-box classifiers.
            </p>
          </div>

          {/* Quick Actions Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => navigate('/analysis')}
              className="flex items-center justify-between gap-4 px-5 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs shadow-xs transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Waves className="w-4 h-4" />
                <span>Analyze Signal</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/experiments')}
              className="flex items-center justify-between gap-4 px-5 py-3 rounded-lg bg-white border border-industrial-300 hover:bg-industrial-50 text-industrial-800 font-medium text-xs transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-4 h-4 text-industrial-600" />
                <span>Open Experiment Lab</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Backend Connectivity Status Bar */}
        <div className="mt-6 pt-5 border-t border-industrial-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-industrial-600">
            <Server className="w-4 h-4 text-industrial-400" />
            <span>FastAPI DSP Service:</span>
            <span className="font-mono text-industrial-800 font-medium">
              {backendService || 'Acoustic Emission Fault Detection API'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                backendConnected === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : backendConnected === false
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-industrial-100 text-industrial-600 border-industrial-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendConnected === true
                    ? 'bg-emerald-500'
                    : backendConnected === false
                    ? 'bg-rose-500'
                    : 'bg-industrial-400'
                }`}
              />
              {backendConnected === true
                ? 'Connected (http://localhost:8000)'
                : backendConnected === false
                ? 'Disconnected (Start backend server)'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Session Status / Empty State */}
      <div className="bg-white border border-industrial-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-industrial-800 mb-3 uppercase tracking-wider font-mono">
          Current Working Session
        </h2>

        {uploadedSignal ? (
          <div className="p-4 bg-industrial-50 rounded-lg border border-industrial-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-industrial-200 flex items-center justify-center text-primary-600 shadow-xs">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-industrial-900 font-mono text-sm">
                    {uploadedSignal.filename}
                  </span>
                  <span className="text-[11px] font-mono text-industrial-400 bg-white px-2 py-0.5 rounded border border-industrial-200">
                    {uploadedSignal.signal_id}
                  </span>
                </div>
                <div className="text-xs text-industrial-500 mt-1 flex flex-wrap gap-4 font-mono">
                  <span>Samples: {uploadedSignal.sample_count.toLocaleString()}</span>
                  <span>Fs: {uploadedSignal.sampling_frequency ? `${uploadedSignal.sampling_frequency} Hz` : 'Not Set'}</span>
                  <span>Duration: {uploadedSignal.duration_seconds ? `${uploadedSignal.duration_seconds.toFixed(3)} s` : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              {analysisResult ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                      analysisResult.detection.status === 'POTENTIAL_FAULT'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : analysisResult.detection.status === 'NO_FAULT_INDICATED'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-industrial-100 text-industrial-800 border-industrial-300'
                    }`}
                  >
                    {analysisResult.detection.status}
                  </span>
                  <button
                    onClick={() => navigate('/analysis')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Results</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/analysis')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium transition-colors"
                >
                  <Waveform className="w-3.5 h-3.5" />
                  <span>Configure Analysis</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-industrial-200 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto mb-2">
              <FileAudio className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-industrial-700">
              No signal loaded in current session.
            </p>
            <p className="text-xs text-industrial-400 mt-1 max-w-md mx-auto">
              Upload a WAV audio recording or CSV vibration signal in the Signal Analysis workspace to begin.
            </p>
            <button
              onClick={() => navigate('/analysis')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
            >
              <span>Go to Signal Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 8-Stage Classical DSP Pipeline Documentation */}
      <div className="bg-white border border-industrial-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-industrial-900">
              Deterministic DSP Processing Pipeline
            </h2>
            <p className="text-xs text-industrial-500 mt-0.5">
              The 8 sequential algorithmic stages executed by the backend for each analysis request.
            </p>
          </div>
          <span className="text-xs bg-industrial-100 text-industrial-600 px-2.5 py-1 rounded font-mono">
            Classical Theory
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DSP_STAGES.map((stg) => {
            const Icon = stg.icon;
            return (
              <div
                key={stg.step}
                className="p-4 rounded-lg border border-industrial-200/80 bg-industrial-50/40 hover:bg-white hover:border-industrial-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-industrial-200 text-industrial-700 text-xs font-mono font-semibold flex items-center justify-center">
                      {stg.step}
                    </span>
                    <Icon className="w-4 h-4 text-primary-600" />
                  </div>
                  <h3 className="text-xs font-semibold text-industrial-800 leading-snug">
                    {stg.title}
                  </h3>
                  <p className="text-[11px] text-industrial-500 mt-1.5 leading-relaxed">
                    {stg.description}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-industrial-200/60 font-mono text-[10px] text-industrial-500 truncate" title={stg.formula}>
                  {stg.formula}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engineering Disclaimers Banner */}
      <div className="p-4 bg-industrial-50 rounded-xl border border-industrial-200 flex items-start gap-3 text-xs text-industrial-600">
        <HelpCircle className="w-4 h-4 text-industrial-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-industrial-800 block mb-0.5">
            Research Project Methodology Note
          </span>
          This system uses deterministic digital signal processing algorithms designed for rotating machinery fault detection.
          In-memory signal persistence is maintained across browser page navigation. If the page is hard-refreshed, signals may need to be uploaded again.
        </div>
      </div>
    </div>
  );
};
