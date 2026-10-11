import React from 'react';
import { BandpassFiltering } from '../../types/api';
import { Filter, Info } from 'lucide-react';

interface WaveformNoticeProps {
  filtering: BandpassFiltering;
}

export const WaveformNotice: React.FC<WaveformNoticeProps> = ({ filtering }) => {
  return (
    <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-primary-600" />
        <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider font-mono">
          Stage 4: Butterworth Bandpass Filter Configuration
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60 font-mono text-xs">
          <span className="text-industrial-400 block text-[10px] uppercase">Filter Topology</span>
          <span className="font-semibold text-industrial-800 mt-0.5 block">{filtering.filter_type} SOS</span>
          <span className="text-[10px] text-industrial-400">Order: {filtering.order}</span>
        </div>

        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60 font-mono text-xs">
          <span className="text-industrial-400 block text-[10px] uppercase">Selected Passband</span>
          <span className="font-semibold text-industrial-800 mt-0.5 block">
            {filtering.passband_hz[0].toFixed(1)} – {filtering.passband_hz[1].toFixed(1)} Hz
          </span>
          <span className="text-[10px] text-industrial-400">Highest Kurtosis Resonance</span>
        </div>

        <div className="p-3 bg-industrial-50 rounded-lg border border-industrial-200/60 font-mono text-xs">
          <span className="text-industrial-400 block text-[10px] uppercase">Filtering Mode</span>
          <span className="font-semibold text-industrial-800 mt-0.5 block truncate" title={filtering.mode}>
            {filtering.mode}
          </span>
          <span className="text-[10px] text-industrial-400">Zero Phase Distortion</span>
        </div>
      </div>

      <div className="p-3 bg-industrial-50/80 rounded-lg border border-industrial-200/60 flex items-start gap-2.5 text-xs text-industrial-500">
        <Info className="w-4 h-4 text-industrial-400 shrink-0 mt-0.5" />
        <div>
          Raw and filtered intermediate time-series arrays are preserved in backend memory during execution but
          omitted from the JSON payload to prevent transmission delays over the network. The demodulated Hilbert envelope
          and its FFT spectrum are transmitted and rendered above.
        </div>
      </div>
    </div>
  );
};
