import React from 'react';
import { PreprocessingStats, EnvelopeStats } from '../../types/api';
import { BarChart3, Activity, Clock, ShieldCheck, Zap, Layers } from 'lucide-react';

interface SignalStatisticsProps {
  samplingFrequency: number;
  preprocessing: PreprocessingStats;
  envelopeStats?: EnvelopeStats;
}

export const SignalStatistics: React.FC<SignalStatisticsProps> = ({
  samplingFrequency,
  preprocessing,
  envelopeStats,
}) => {
  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
            Signal metrics & moments
          </h3>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Statistical parameters evaluated after zero-mean baseline detrending.
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#86868B] bg-[#F5F5F7] px-2.5 py-1 rounded-md">
          Stage 02 Detrended
        </span>
      </div>

      {/* Grid of 6 Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-[#86868B] block flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#86868B]" /> Sampling Rate
          </span>
          <span className="text-[15px] font-semibold text-[#1D1D1F] font-mono tabular-nums mt-1 block">
            {samplingFrequency ? `${samplingFrequency.toLocaleString()} Hz` : 'N/A'}
          </span>
          <span className="text-[10px] text-[#86868B] font-mono">Carrier Fs</span>
        </div>

        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-[#86868B] block flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#86868B]" /> Duration
          </span>
          <span className="text-[15px] font-semibold text-[#1D1D1F] font-mono tabular-nums mt-1 block">
            {preprocessing.duration_seconds !== undefined
              ? `${preprocessing.duration_seconds.toFixed(3)} s`
              : 'N/A'}
          </span>
          <span className="text-[10px] text-[#86868B] font-mono truncate">
            {preprocessing.sample_count?.toLocaleString()} samples
          </span>
        </div>

        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-[#86868B] block flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#86868B]" /> RMS Level
          </span>
          <span className="text-[15px] font-semibold text-[#1D1D1F] font-mono tabular-nums mt-1 block">
            {preprocessing.rms !== undefined ? preprocessing.rms.toFixed(4) : 'N/A'}
          </span>
          <span className="text-[10px] text-[#86868B] font-mono truncate">
            σ: {preprocessing.standard_deviation?.toFixed(4) ?? 'N/A'}
          </span>
        </div>

        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-[#86868B] block flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-[#86868B]" /> Peak Amplitude
          </span>
          <span className="text-[15px] font-semibold text-[#1D1D1F] font-mono tabular-nums mt-1 block">
            {preprocessing.peak !== undefined ? preprocessing.peak.toFixed(4) : 'N/A'}
          </span>
          <span className="text-[10px] text-[#86868B] font-mono truncate">
            [{preprocessing.min?.toFixed(2)}, {preprocessing.max?.toFixed(2)}]
          </span>
        </div>

        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-[#86868B] block flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#86868B]" /> Crest Factor
          </span>
          <span className="text-[15px] font-semibold text-[#1D1D1F] font-mono tabular-nums mt-1 block">
            {preprocessing.crest_factor !== undefined
              ? preprocessing.crest_factor.toFixed(2)
              : 'N/A'}
          </span>
          <span className="text-[10px] text-[#86868B] font-mono">Peak / RMS ratio</span>
        </div>

        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-[#86868B] block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#86868B]" /> Excess Kurtosis
          </span>
          <span className="text-[15px] font-semibold text-[#1D1D1F] font-mono tabular-nums mt-1 block">
            {preprocessing.kurtosis !== undefined ? preprocessing.kurtosis.toFixed(2) : 'N/A'}
          </span>
          <span className="text-[10px] text-[#86868B] font-mono truncate">
            {envelopeStats ? `Env: ${envelopeStats.kurtosis?.toFixed(2)}` : 'Gaussian = 0.0'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignalStatistics;
