import React from 'react';
import { PreprocessingStats, EnvelopeStats } from '../../types/api';
import { BarChart3, Activity, Clock, ShieldCheck, Zap } from 'lucide-react';

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
    <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-industrial-800">
            Signal Metrics & Moment Statistics
          </h3>
        </div>
        <span className="text-[11px] font-mono text-industrial-400">
          Zero-Mean Detrended Stage 1
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60">
          <span className="text-[10px] uppercase font-mono text-industrial-400 block flex items-center gap-1">
            <Activity className="w-3 h-3 text-industrial-400" /> Sampling Freq
          </span>
          <span className="text-sm font-semibold text-industrial-800 font-mono mt-1 block">
            {samplingFrequency ? `${samplingFrequency.toLocaleString()} Hz` : 'N/A'}
          </span>
          <span className="text-[10px] text-industrial-400">Fs</span>
        </div>

        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60">
          <span className="text-[10px] uppercase font-mono text-industrial-400 block flex items-center gap-1">
            <Clock className="w-3 h-3 text-industrial-400" /> Duration
          </span>
          <span className="text-sm font-semibold text-industrial-800 font-mono mt-1 block">
            {preprocessing.duration_seconds !== undefined
              ? `${preprocessing.duration_seconds.toFixed(3)} s`
              : 'N/A'}
          </span>
          <span className="text-[10px] text-industrial-400">
            {preprocessing.sample_count?.toLocaleString()} samples
          </span>
        </div>

        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60">
          <span className="text-[10px] uppercase font-mono text-industrial-400 block">
            RMS Amplitude
          </span>
          <span className="text-sm font-semibold text-industrial-800 font-mono mt-1 block">
            {preprocessing.rms !== undefined ? preprocessing.rms.toFixed(5) : 'N/A'}
          </span>
          <span className="text-[10px] text-industrial-400">
            Std: {preprocessing.standard_deviation?.toFixed(5) ?? 'N/A'}
          </span>
        </div>

        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60">
          <span className="text-[10px] uppercase font-mono text-industrial-400 block">
            Peak Amplitude
          </span>
          <span className="text-sm font-semibold text-industrial-800 font-mono mt-1 block">
            {preprocessing.peak !== undefined ? preprocessing.peak.toFixed(5) : 'N/A'}
          </span>
          <span className="text-[10px] text-industrial-400">
            Range: [{preprocessing.min?.toFixed(3)}, {preprocessing.max?.toFixed(3)}]
          </span>
        </div>

        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60">
          <span className="text-[10px] uppercase font-mono text-industrial-400 block flex items-center gap-1">
            <Zap className="w-3 h-3 text-industrial-400" /> Crest Factor
          </span>
          <span className="text-sm font-semibold text-industrial-800 font-mono mt-1 block">
            {preprocessing.crest_factor !== undefined
              ? preprocessing.crest_factor.toFixed(2)
              : 'N/A'}
          </span>
          <span className="text-[10px] text-industrial-400">Peak / RMS</span>
        </div>

        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60">
          <span className="text-[10px] uppercase font-mono text-industrial-400 block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-industrial-400" /> Excess Kurtosis
          </span>
          <span className="text-sm font-semibold text-industrial-800 font-mono mt-1 block">
            {preprocessing.kurtosis !== undefined ? preprocessing.kurtosis.toFixed(2) : 'N/A'}
          </span>
          <span className="text-[10px] text-industrial-400">
            {envelopeStats ? `Env Kurt: ${envelopeStats.kurtosis?.toFixed(2)}` : 'Gaussian = 0.0'}
          </span>
        </div>
      </div>
    </div>
  );
};
