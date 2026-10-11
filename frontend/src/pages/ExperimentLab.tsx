import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignal } from '../context/SignalContext';
import { BlockLengthForm } from '../components/experiments/BlockLengthForm';
import { ExperimentResults } from '../components/experiments/ExperimentResults';
import { PrecisionExperimentView } from '../components/experiments/PrecisionExperimentView';
import { FilterRingingView } from '../components/experiments/FilterRingingView';
import {
  FileAudio,
  ArrowRight,
  Activity,
  Sparkles,
  Cpu,
  Sliders,
  Waves,
} from 'lucide-react';

type ExperimentTab = 'block_length' | 'precision' | 'ringing';

interface ExperimentMeta {
  id: ExperimentTab;
  code: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXPERIMENT_TABS: ExperimentMeta[] = [
  {
    id: 'block_length',
    code: 'H1',
    title: 'Block-Length Sensitivity',
    subtitle: 'Windowing and kurtosis sensitivity',
    icon: Sliders,
  },
  {
    id: 'precision',
    code: 'H2',
    title: 'Numeric Precision',
    subtitle: 'Floating-point and fixed-point comparison',
    icon: Cpu,
  },
  {
    id: 'ringing',
    code: 'H3',
    title: 'Filter Ringing',
    subtitle: 'Transient preservation and bandwidth sensitivity',
    icon: Waves,
  },
];

export const ExperimentLab: React.FC = () => {
  const navigate = useNavigate();
  const { uploadedSignal, experimentResult, isExperimenting } = useSignal();
  const [activeTab, setActiveTab] = useState<ExperimentTab>('block_length');

  return (
    <div className="py-8 px-6 sm:px-10 max-w-6xl mx-auto space-y-10 text-[#1D1D1F]">
      {/* ======================================================== */}
      {/* 1. PAGE HEADER (Compact, Editorial, Restrained) */}
      {/* ======================================================== */}
      <header className="space-y-1.5 pb-2">
        <div className="text-[11px] font-semibold text-[#0071E3] uppercase tracking-wider font-mono">
          Research Workspace
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[#1D1D1F]">
            Experiment Lab
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
          Investigate how signal-processing choices affect detection, numerical precision, and transient preservation.
        </p>
      </header>

      {/* ======================================================== */}
      {/* 2. REFINED HYPOTHESIS SELECTOR (Apple 3-Item Card Switcher) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {EXPERIMENT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-[#FFFFFF] border-[#0071E3] shadow-panel ring-2 ring-[#0071E3]/15'
                  : 'bg-[#FFFFFF] border-[#E5E5EA] hover:border-[#D1D1D6] shadow-subtle hover:bg-[#FBFBFD]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-[#0071E3]/10 text-[#0071E3]'
                      : 'bg-[#F5F5F7] text-[#86868B]'
                  }`}
                >
                  {tab.code}
                </span>
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#0071E3]' : 'text-[#86868B]'
                  }`}
                />
              </div>
              <h3 className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight">
                {tab.title}
              </h3>
              <p className="text-[12px] text-[#6E6E73] mt-0.5 leading-normal">
                {tab.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. SIGNAL INGESTION REQUIREMENT (Calm Empty State) */}
      {/* ======================================================== */}
      {!uploadedSignal && (
        <section className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-8 sm:p-10 shadow-subtle text-center space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-1">
            <FileAudio className="w-5 h-5 text-[#6E6E73]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">
              Signal ingestion required for lab experiments
            </h3>
            <p className="text-[13px] text-[#6E6E73] max-w-md mx-auto leading-normal">
              Empirical hypothesis sweeps evaluate statistical moments, word-length precision, and resonance smearing on real sensor waveforms.
            </p>
          </div>
          <button
            onClick={() => navigate('/analysis')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium transition-colors shadow-subtle"
          >
            <span>Open Signal Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. ACTIVE EXPERIMENT WORKSPACE */}
      {/* ======================================================== */}
      {uploadedSignal && (
        <div className="space-y-8">
          {/* TAB 1: Block Length (H1) */}
          {activeTab === 'block_length' && (
            <div className="space-y-8">
              <BlockLengthForm />

              {/* Execution Loading Indicator */}
              {isExperimenting && (
                <div className="bg-[#FFFFFF] border border-[#0071E3]/30 rounded-2xl p-8 sm:p-10 shadow-subtle text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#F0F6FF] text-[#0071E3] flex items-center justify-center mx-auto">
                    <Activity className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">
                      Running Block-Length Segmentation Batch…
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] max-w-md mx-auto leading-normal">
                      Computing mean kurtosis, max kurtosis, variability, and execution time across requested block sizes.
                    </p>
                  </div>
                </div>
              )}

              {/* Results View */}
              {experimentResult && !isExperimenting && (
                <ExperimentResults experiment={experimentResult} />
              )}

              {/* Empty State when no results yet */}
              {!experimentResult && !isExperimenting && (
                <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-8 sm:p-10 shadow-subtle text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-1">
                    <Sparkles className="w-5 h-5 text-[#86868B]" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
                    No block-length results yet
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] max-w-sm mx-auto leading-normal">
                    Select candidate block sizes above and click &ldquo;Run Experiment Batch&rdquo; to evaluate statistical moments and runtime latency.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Precision Limits (H2) */}
          {activeTab === 'precision' && <PrecisionExperimentView />}

          {/* TAB 3: Filter Ringing Limits (H3) */}
          {activeTab === 'ringing' && <FilterRingingView />}
        </div>
      )}
    </div>
  );
};

export default ExperimentLab;
