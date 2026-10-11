import React from 'react';
import { DetectionResult } from '../../types/api';
import { AlertTriangle, CheckCircle2, HelpCircle, Timer, Gauge, ShieldAlert } from 'lucide-react';

interface DetectionSummaryProps {
  detection: DetectionResult;
  processingTimeMs: number;
}

export const DetectionSummary: React.FC<DetectionSummaryProps> = ({
  detection,
  processingTimeMs,
}) => {
  const { status, score, threshold, reason, supporting_peaks } = detection;

  const getStatusBadge = () => {
    switch (status) {
      case 'POTENTIAL_FAULT':
        return {
          title: 'Potential Fault Detected',
          badgeText: 'POTENTIAL_FAULT',
          badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
          dotStyle: 'bg-amber-600',
          containerStyle: 'border-l-4 border-l-amber-500 bg-amber-50/40 border-industrial-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      case 'NO_FAULT_INDICATED':
        return {
          title: 'No Fault Indicated in Characteristic Bands',
          badgeText: 'NO_FAULT_INDICATED',
          badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
          dotStyle: 'bg-slate-500',
          containerStyle: 'border-l-4 border-l-slate-400 bg-slate-50/40 border-industrial-200',
          icon: CheckCircle2,
          iconColor: 'text-slate-600',
        };
      case 'INCONCLUSIVE':
      default:
        return {
          title: 'Inconclusive Analysis',
          badgeText: 'INCONCLUSIVE',
          badgeStyle: 'bg-industrial-100 text-industrial-800 border-industrial-300',
          dotStyle: 'bg-industrial-400',
          containerStyle: 'border-l-4 border-l-industrial-400 bg-industrial-50/40 border-industrial-200',
          icon: HelpCircle,
          iconColor: 'text-industrial-500',
        };
    }
  };

  const statusConfig = getStatusBadge();
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`border rounded-xl p-5 shadow-xs bg-white ${statusConfig.containerStyle}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-industrial-200 flex items-center justify-center shadow-xs">
            <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${statusConfig.badgeStyle}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotStyle}`} />
              {statusConfig.badgeText}
            </span>
            <h2 className="text-base font-semibold text-industrial-900 mt-1">
              {statusConfig.title}
            </h2>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-white border border-industrial-200 rounded-lg px-3 py-1.5 flex items-center gap-2 font-mono">
            <Gauge className="w-3.5 h-3.5 text-industrial-400" />
            <div>
              <span className="text-industrial-400 text-[10px] block leading-none">Max Indicator Rf</span>
              <span className="font-semibold text-industrial-800 text-sm">
                {score !== null ? score.toFixed(2) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-industrial-200 rounded-lg px-3 py-1.5 flex items-center gap-2 font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-industrial-400" />
            <div>
              <span className="text-industrial-400 text-[10px] block leading-none">Threshold Cutoff</span>
              <span className="font-semibold text-industrial-800 text-sm">
                {threshold !== null ? threshold.toFixed(2) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-industrial-200 rounded-lg px-3 py-1.5 flex items-center gap-2 font-mono">
            <Timer className="w-3.5 h-3.5 text-industrial-400" />
            <div>
              <span className="text-industrial-400 text-[10px] block leading-none">Compute Time</span>
              <span className="font-semibold text-industrial-800 text-sm">
                {processingTimeMs.toFixed(1)} ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rationale Narrative */}
      <div className="text-xs text-industrial-700 bg-white/80 p-3 rounded-lg border border-industrial-200/80 leading-relaxed font-sans">
        <span className="font-semibold text-industrial-900">Diagnosis Rationale: </span>
        {reason}
      </div>

      {/* Supporting Peaks list if potential fault */}
      {supporting_peaks && supporting_peaks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-industrial-200/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-industrial-500 font-medium">Exceeded Threshold Components:</span>
          {supporting_peaks.map((peak, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/70 border border-amber-300 rounded font-mono text-[11px] text-amber-900"
            >
              <strong>{peak.fault_type}</strong>
              <span>({peak.detected_hz.toFixed(1)} Hz)</span>
              <span className="text-amber-700">Rf: {peak.indicator_rf.toFixed(2)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Technical Warning / Methodology Notice */}
      <div className="mt-2 text-[11px] text-industrial-400 italic">
        * Note: &apos;NO_FAULT_INDICATED&apos; signifies no spectral peaks exceeded the baseline threshold near kinematic frequencies;
        it does not constitute proof that the machinery is entirely defect-free. Reference baseline calibration is advised.
      </div>
    </div>
  );
};
