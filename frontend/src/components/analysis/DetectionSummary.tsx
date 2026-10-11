import React from 'react';
import { DetectionResult } from '../../types/api';
import { AlertCircle, CheckCircle2, HelpCircle, Clock, ShieldAlert } from 'lucide-react';

interface DetectionSummaryProps {
  detection: DetectionResult;
  processingTimeMs: number;
}

export const DetectionSummary: React.FC<DetectionSummaryProps> = ({
  detection,
  processingTimeMs,
}) => {
  const { status, score, threshold, reason, supporting_peaks } = detection;

  const isFault = status === 'POTENTIAL_FAULT';
  const isNominal = status === 'NO_FAULT_INDICATED';

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-5">
      {/* Top Row: Status Headline & KPI Metric Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isFault
                ? 'bg-[#FF9500]/10 text-[#FF9500]'
                : isNominal
                ? 'bg-[#34C759]/10 text-[#34C759]'
                : 'bg-[#86868B]/10 text-[#86868B]'
            }`}
          >
            {isFault ? (
              <AlertCircle className="w-5 h-5 text-[#B25000]" />
            ) : isNominal ? (
              <CheckCircle2 className="w-5 h-5 text-[#248A3D]" />
            ) : (
              <HelpCircle className="w-5 h-5 text-[#6E6E73]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  isFault
                    ? 'bg-[#FF9500]/10 text-[#B25000]'
                    : isNominal
                    ? 'bg-[#34C759]/10 text-[#248A3D]'
                    : 'bg-[#F5F5F7] text-[#6E6E73]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isFault
                      ? 'bg-[#FF9500]'
                      : isNominal
                      ? 'bg-[#34C759]'
                      : 'bg-[#86868B]'
                  }`}
                />
                {status === 'POTENTIAL_FAULT'
                  ? 'Potential Fault Indicated'
                  : status === 'NO_FAULT_INDICATED'
                  ? 'No Characteristic Fault Indicated'
                  : 'Inconclusive Outcome'}
              </span>
              <span className="text-[11px] font-mono text-[#86868B]">
                STATUS ASSESSMENT
              </span>
            </div>

            <h3 className="text-[18px] font-semibold text-[#1D1D1F] tracking-tight">
              {isFault
                ? 'Harmonic Indicator Exceeds Nominal Threshold'
                : isNominal
                ? 'Envelope Peaks Below Nominal Cutoff'
                : 'Inconclusive Analysis Outcome'}
            </h3>
          </div>
        </div>

        {/* Clean Scientific Metric Chips */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl px-4 py-2 font-mono">
            <span className="text-[#86868B] text-[10px] block uppercase font-mono">
              Peak Indicator (Rf)
            </span>
            <span
              className={`text-[16px] font-semibold tabular-nums mt-0.5 block ${
                isFault ? 'text-[#B25000]' : 'text-[#1D1D1F]'
              }`}
            >
              {score !== null ? score.toFixed(2) : 'N/A'}
            </span>
          </div>

          <div className="bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl px-4 py-2 font-mono">
            <span className="text-[#86868B] text-[10px] block uppercase font-mono">
              Cutoff Threshold
            </span>
            <span className="text-[16px] font-semibold text-[#1D1D1F] tabular-nums mt-0.5 block">
              {threshold !== null ? threshold.toFixed(2) : 'N/A'}
            </span>
          </div>

          <div className="bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl px-4 py-2 font-mono">
            <span className="text-[#86868B] text-[10px] block uppercase font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#86868B]" /> Exec Time
            </span>
            <span className="text-[16px] font-semibold text-[#1D1D1F] tabular-nums mt-0.5 block">
              {processingTimeMs.toFixed(1)} ms
            </span>
          </div>
        </div>
      </div>

      {/* Rationale Narrative */}
      <div className="p-4 bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl text-[13px] text-[#1D1D1F] leading-relaxed">
        <span className="font-semibold text-[#1D1D1F]">Analytical Rationale: </span>
        <span className="text-[#6E6E73]">{reason}</span>
      </div>

      {/* Supporting Exceeded Peaks (if any) */}
      {supporting_peaks && supporting_peaks.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[#86868B] uppercase font-mono">
            Peaks Exceeding Threshold:
          </span>
          {supporting_peaks.map((peak, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFFFFF] border border-[#FF9500]/40 rounded-lg font-mono text-[12px] text-[#B25000]"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF9500]" />
              <strong>{peak.fault_type}</strong>
              <span className="text-[#6E6E73]">({peak.detected_hz.toFixed(1)} Hz)</span>
              <span className="font-semibold tabular-nums">Rf: {peak.indicator_rf.toFixed(2)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Scientific Footnote */}
      <div className="pt-2 text-[11px] text-[#86868B] leading-relaxed border-t border-[#F2F2F7]">
        {isFault
          ? 'Notice: A potential fault indicator reflects an amplitude ratio anomaly in the envelope spectrum. It constitutes an analytical signal observation and should be corroborated with visual inspection and vibration baselines.'
          : 'Notice: Indicators below threshold confirm that modeled kinematic frequencies do not exhibit prominent envelope modulation. This does not exclude unmodeled mechanical degradation, structural loosening, or sensor misplacement.'}
      </div>
    </div>
  );
};

export default DetectionSummary;
