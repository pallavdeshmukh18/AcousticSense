import React from 'react';
import { BandpassFiltering } from '../../types/api';
import { Filter, Info } from 'lucide-react';

interface WaveformNoticeProps {
  filtering: BandpassFiltering;
}

export const WaveformNotice: React.FC<WaveformNoticeProps> = ({ filtering }) => {
  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#F0F6FF] flex items-center justify-center text-[#0071E3]">
          <Filter className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
            Stage 05 &bull; Digital Filtering
          </span>
          <h4 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
            Butterworth Bandpass Filter Configuration
          </h4>
        </div>
      </div>

      {/* Parameter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] font-mono text-xs">
          <span className="text-[#86868B] block text-[10px] uppercase">Filter Topology</span>
          <span className="font-semibold text-[#1D1D1F] mt-1 block text-[14px]">
            {filtering.filter_type} SOS
          </span>
          <span className="text-[11px] text-[#86868B] mt-0.5 block font-sans">
            Order {filtering.order} &bull; Zero-Phase Forward-Backward
          </span>
        </div>

        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] font-mono text-xs">
          <span className="text-[#86868B] block text-[10px] uppercase">Isolated Passband</span>
          <span className="font-semibold text-[#0071E3] mt-1 block text-[14px] tabular-nums">
            {filtering.passband_hz[0].toFixed(1)} – {filtering.passband_hz[1].toFixed(1)} Hz
          </span>
          <span className="text-[11px] text-[#86868B] mt-0.5 block font-sans">
            Screened Peak Kurtosis Band
          </span>
        </div>

        <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] font-mono text-xs">
          <span className="text-[#86868B] block text-[10px] uppercase">Phase Characteristics</span>
          <span className="font-semibold text-[#1D1D1F] mt-1 block text-[14px] truncate" title={filtering.mode}>
            {filtering.mode}
          </span>
          <span className="text-[11px] text-[#86868B] mt-0.5 block font-sans">
            Zero Phase Delay Distortion
          </span>
        </div>
      </div>

      {/* Pipeline Memory Note */}
      <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex items-start gap-2.5 text-[12px] text-[#6E6E73]">
        <Info className="w-4 h-4 text-[#86868B] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          Intermediate arrays are filtered in backend memory via Second-Order Sections (SOS). Demodulated Hilbert analytic envelope samples and frequency-domain harmonic bins are rendered below.
        </div>
      </div>
    </div>
  );
};

export default WaveformNotice;
