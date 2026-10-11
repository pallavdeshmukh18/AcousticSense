import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignal } from '../context/SignalContext';
import {
  ArrowRight,
  ChevronDown,
  FileText,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sliders,
  Activity,
  Filter,
  Waves,
  UploadCloud,
} from 'lucide-react';

interface DspStage {
  step: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  formula: string;
  scope: string;
}

const DSP_STAGES: DspStage[] = [
  {
    step: '01',
    title: 'Signal Acquisition',
    icon: Radio,
    description:
      'Ingests raw continuous acoustic emission or vibration sensor waveforms via PCM WAV or high-frequency CSV files.',
    formula: 'x[n] ∈ ℝ, Fs in Hz',
    scope: 'Time domain',
  },
  {
    step: '02',
    title: 'Preprocessing & Detrending',
    icon: Sliders,
    description:
      'Removes sensor DC baseline offset and mechanical low-frequency drift while computing fundamental moment statistics.',
    formula: 'x_detrended[n] = x[n] - x̄',
    scope: 'Mean subtraction',
  },
  {
    step: '03',
    title: 'Frequency-Domain Spectrum',
    icon: Activity,
    description:
      'Single-sided FFT magnitude spectrum scaled with coherent Hann window compensation to identify dominant harmonics.',
    formula: 'X(f) = FFT{x[n] · w[n]}, Δf = Fs / N',
    scope: 'Fourier domain',
  },
  {
    step: '04',
    title: 'Spectral Kurtosis Band Selection',
    icon: Filter,
    description:
      'Screens candidate frequency sub-bands using 4th-order Fisher excess kurtosis to locate the impulsive resonance band.',
    formula: 'Kurtosis = μ₄ / σ⁴ - 3',
    scope: 'Carrier isolation',
  },
  {
    step: '05',
    title: 'Digital Bandpass Filtering',
    icon: Filter,
    description:
      'Applies a 2nd-order Butterworth Second-Order Sections (SOS) zero-phase forward-backward filter to isolate resonance.',
    formula: 'H(z) = ∏ SOS_k(z), Zero-Phase',
    scope: 'SOS bandpass',
  },
  {
    step: '06',
    title: 'Hilbert Demodulation',
    icon: Waves,
    description:
      'Constructs the analytic signal using the discrete Hilbert transform to extract the instantaneous envelope of the carrier.',
    formula: 'A[n] = √(y²[n] + H{y[n]}²)',
    scope: 'Envelope extraction',
  },
  {
    step: '07',
    title: 'Envelope Spectrum Matching',
    icon: Activity,
    description:
      'Computes the AC-coupled spectrum of the demodulated envelope, searching for characteristic bearing fault frequencies.',
    formula: 'BPFO, BPFI, BSF, FTF Kinematics',
    scope: 'Kinematic alignment',
  },
  {
    step: '08',
    title: 'Adaptive Fault Indicator (Rf)',
    icon: CheckCircle2,
    description:
      'Evaluates normalized fault indicator Rf against a robust local median noise floor to deliver deterministic diagnosis.',
    formula: 'Rf = Mf / (PN + ε) ≥ 3.00',
    scope: 'Detection threshold',
  },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { uploadedSignal, analysisResult } = useSignal();

  const scrollToMethodology = () => {
    const el = document.getElementById('methodology');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="py-10 px-6 sm:px-10 max-w-6xl mx-auto space-y-16 text-[#1D1D1F]">
      {/* ======================================================== */}
      {/* 1. EDITORIAL HERO (Apple Open Composition, Generous Whitespace) */}
      {/* ======================================================== */}
      <section className="pt-4 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-[12px] font-semibold text-[#0071E3] uppercase tracking-wider font-mono">
              Acoustic Emission Analysis
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-semibold tracking-[-0.03em] text-[#1D1D1F] leading-[1.08]">
              Understand the signals.<br />
              Detect what matters.
            </h1>

            <p className="text-[16px] sm:text-[17px] text-[#6E6E73] font-normal leading-relaxed max-w-xl">
              Investigate acoustic emission signals from rotating machinery using
              classical digital signal processing, from frequency analysis to bearing
              fault signature detection.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/analysis')}
                className="px-6 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium transition-colors shadow-subtle flex items-center gap-2 group"
              >
                <span>Analyse a signal</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={scrollToMethodology}
                className="px-4 py-2.5 rounded-full text-[#1D1D1F] hover:text-[#0071E3] hover:bg-[#FFFFFF] text-[13px] font-medium transition-colors border border-transparent hover:border-[#E5E5EA] flex items-center gap-1.5"
              >
                <span>Explore the methodology</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#86868B]" />
              </button>
            </div>
          </div>

          {/* Right Column: Precision Scientific Instrument Visualization */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-5 shadow-panel space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0071E3]" />
                  <span className="text-[11px] font-medium text-[#1D1D1F] uppercase tracking-wider">
                    Harmonic Carrier Waveform
                  </span>
                </div>
                <span className="text-[10px] text-[#86868B] font-mono">
                  48 kHz &bull; BPFO Reference
                </span>
              </div>

              {/* Minimalist, Clean Scientific Waveform SVG */}
              <div className="h-44 w-full flex items-center justify-center bg-[#FBFBFD] rounded-xl p-3 border border-[#F2F2F7]">
                <svg
                  viewBox="0 0 360 120"
                  className="w-full h-full overflow-visible"
                  aria-label="Scientific waveform trace preview"
                >
                  {/* Subtle Gridlines */}
                  <line x1="0" y1="20" x2="360" y2="20" stroke="#E5E5EA" strokeWidth="0.75" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="360" y2="60" stroke="#E5E5EA" strokeWidth="1" />
                  <line x1="0" y1="100" x2="360" y2="100" stroke="#E5E5EA" strokeWidth="0.75" strokeDasharray="3 3" />
                  <line x1="90" y1="0" x2="90" y2="120" stroke="#F2F2F7" strokeWidth="0.75" />
                  <line x1="180" y1="0" x2="180" y2="120" stroke="#F2F2F7" strokeWidth="0.75" />
                  <line x1="270" y1="0" x2="270" y2="120" stroke="#F2F2F7" strokeWidth="0.75" />

                  {/* Exponential Transient AE Burst Waveform Trace */}
                  <path
                    d="M 10,60 
                       L 35,60 
                       Q 45,58 55,60
                       L 65,60
                       C 70,55 75,20 85,15
                       C 95,10 100,105 110,85
                       C 120,65 125,30 135,42
                       C 145,54 150,80 160,70
                       C 170,60 175,48 185,55
                       C 195,62 205,65 220,60
                       L 250,60
                       C 255,58 260,35 268,30
                       C 276,25 280,95 288,78
                       C 296,62 302,45 310,54
                       C 318,63 325,62 335,60
                       L 355,60"
                    fill="none"
                    stroke="#0071E3"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Analytic Hilbert Demodulated Envelope Line */}
                  <path
                    d="M 10,60
                       L 65,60
                       C 75,30 80,12 85,12
                       C 105,12 120,38 135,40
                       C 155,42 175,56 195,58
                       L 250,59
                       C 260,35 265,26 268,26
                       C 285,26 300,50 315,55
                       L 355,60"
                    fill="none"
                    stroke="#86868B"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />

                  {/* Peak Marker */}
                  <circle cx="85" cy="15" r="3" fill="#0071E3" />
                  <text x="94" y="16" fill="#1D1D1F" fontSize="9" fontFamily="system-ui" fontWeight="600">
                    Impact Spall
                  </text>

                  {/* Second Harmonic Peak */}
                  <circle cx="268" cy="30" r="2.5" fill="#0071E3" />
                </svg>
              </div>

              {/* Quiet, Honest Scientific Caption */}
              <div className="flex items-center justify-between text-[11px] text-[#86868B] font-mono tabular-nums pt-1">
                <span>0.0 ms &rarr; 10.6 ms interval</span>
                <span>Deterministic Model</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CURRENT WORKING SESSION (Clean, Purposeful State) */}
      {/* ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold text-[#86868B] uppercase tracking-wider font-mono">
            Working Session
          </div>
          {uploadedSignal && (
            <span className="text-[11px] font-medium text-[#34C759] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              Loaded in Memory
            </span>
          )}
        </div>

        {uploadedSignal ? (
          /* Populated State */
          <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F0F6FF] border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
                    {uploadedSignal.filename}
                  </h3>
                  <span className="text-[11px] font-mono text-[#86868B]">
                    ID: {uploadedSignal.signal_id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-[#6E6E73] font-mono tabular-nums">
                  <span>
                    <strong className="text-[#1D1D1F] font-medium font-sans">Samples:</strong>{' '}
                    {uploadedSignal.sample_count.toLocaleString()}
                  </span>
                  <span>
                    <strong className="text-[#1D1D1F] font-medium font-sans">Rate:</strong>{' '}
                    {uploadedSignal.sampling_frequency
                      ? `${uploadedSignal.sampling_frequency.toLocaleString()} Hz`
                      : 'Not defined'}
                  </span>
                  <span>
                    <strong className="text-[#1D1D1F] font-medium font-sans">Duration:</strong>{' '}
                    {uploadedSignal.duration_seconds
                      ? `${uploadedSignal.duration_seconds.toFixed(3)} s`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
              {analysisResult ? (
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ${
                      analysisResult.detection.status === 'POTENTIAL_FAULT'
                        ? 'bg-[#FF9500]/10 text-[#B25000]'
                        : 'bg-[#34C759]/10 text-[#248A3D]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        analysisResult.detection.status === 'POTENTIAL_FAULT'
                          ? 'bg-[#FF9500]'
                          : 'bg-[#34C759]'
                      }`}
                    />
                    {analysisResult.detection.status === 'POTENTIAL_FAULT'
                      ? 'Potential Fault'
                      : 'No Fault Indicated'}
                  </span>
                  <button
                    onClick={() => navigate('/analysis')}
                    className="px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-[13px] font-medium transition-colors"
                  >
                    View Results
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/analysis')}
                  className="px-5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium transition-colors shadow-subtle flex items-center gap-1.5"
                >
                  <span>Run Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Apple-Style Empty State: Calm, Intentional, Never Unfinished */
          <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-8 sm:p-10 shadow-subtle flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mb-3.5">
              <UploadCloud className="w-5 h-5 text-[#6E6E73]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight mb-1">
              No signal in this session
            </h3>
            <p className="text-[13px] text-[#6E6E73] max-w-sm mb-5 leading-normal">
              Upload a WAV recording or CSV signal to begin your analysis.
            </p>
            <button
              onClick={() => navigate('/analysis')}
              className="px-5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium transition-colors shadow-subtle"
            >
              Open Signal Analysis
            </button>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 3. EIGHT-STAGE DSP PIPELINE (Clean, Structured Progression) */}
      {/* ======================================================== */}
      <section id="methodology" className="space-y-6 pt-4">
        <div className="space-y-1">
          <div className="text-[12px] font-semibold text-[#86868B] uppercase tracking-wider font-mono">
            Algorithmic Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-[-0.02em]">
            From raw signal to fault insight
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#6E6E73] max-w-2xl leading-relaxed">
            Eight stages of classical digital signal processing, executed sequentially
            to investigate acoustic emission signals.
          </p>
        </div>

        {/* 8-Stage Grid (Restrained, Light, High-Precision) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DSP_STAGES.map((stg) => {
            const Icon = stg.icon;
            return (
              <div
                key={stg.step}
                className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-5 shadow-subtle hover:border-[#D1D1D6] transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono text-[#86868B] font-medium">
                      {stg.step}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73]">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3 className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight leading-snug">
                    {stg.title}
                  </h3>

                  <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                    {stg.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F2F2F7] space-y-1.5">
                  <div className="text-[10px] text-[#86868B] font-mono uppercase tracking-wider">
                    {stg.scope}
                  </div>
                  <div
                    className="text-[11px] font-mono text-[#1D1D1F] bg-[#F5F5F7] px-2.5 py-1.5 rounded-lg truncate"
                    title={stg.formula}
                  >
                    {stg.formula}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest Technical Note (Preserving Scientific Limits) */}
        <div className="p-4 bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl flex items-start gap-3 text-[12px] text-[#6E6E73] leading-relaxed">
          <AlertCircle className="w-4 h-4 text-[#86868B] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#1D1D1F] font-medium">Scientific Methodology:</strong> Stage 4 evaluates
            discrete sub-bands using 4th-order excess kurtosis. This is a simplified band-selection screening
            designed for clear carrier isolation and does not represent a full spectral-kurtosis estimator or fast
            kurtogram.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
