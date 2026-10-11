import React, { useState } from 'react';
import { Plot } from './PlotWrapper';
import { EnvelopeAnalysis, FaultIndicator } from '../../types/api';
import { Waves, Activity } from 'lucide-react';

interface EnvelopeChartProps {
  envelopeAnalysis: EnvelopeAnalysis;
  durationSeconds: number;
  samplingFrequency: number;
  faultIndicators?: FaultIndicator[];
}

export const EnvelopeChart: React.FC<EnvelopeChartProps> = ({
  envelopeAnalysis,
  durationSeconds,
  faultIndicators = [],
}) => {
  const [activeTab, setActiveTab] = useState<'spectrum' | 'waveform'>('spectrum');

  const { envelope_samples, envelope_spectrum, dominant_peaks, fault_frequencies } =
    envelopeAnalysis;

  // Waveform time axis
  const timeAxis = (envelope_samples || []).map((_, idx) =>
    (durationSeconds * (idx / Math.max(1, envelope_samples.length - 1)))
  );

  // Annotations for envelope spectrum fault frequencies
  const annotations = faultIndicators
    .filter((fi) => fi.fault_type !== '1X')
    .map((fi) => ({
      x: fi.detected_hz,
      y: fi.magnitude,
      text: `${fi.fault_type}<br>${fi.detected_hz.toFixed(1)} Hz`,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 1.5,
      arrowcolor: fi.indicator_rf >= 3.0 ? '#FF9500' : '#0071E3',
      font: { size: 10, color: '#1D1D1F', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
      bgcolor: '#FFFFFF',
      bordercolor: '#E5E5EA',
      borderwidth: 1,
      borderpad: 2,
      yshift: 12,
    }));

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-4">
      {/* Header & Segmented Control Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
            Stages 06 & 07 &bull; Hilbert Demodulation
          </span>
          <h4 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
            Analytic Envelope & Demodulated Harmonics
          </h4>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Instantaneous envelope A[n] = √(y² + H(y)²) and modulation spectrum.
          </p>
        </div>

        {/* macOS Style Segmented Control */}
        <div className="flex items-center bg-[#F5F5F7] p-1 rounded-full border border-[#E5E5EA] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('spectrum')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-full transition-all ${
              activeTab === 'spectrum'
                ? 'bg-[#FFFFFF] text-[#1D1D1F] shadow-subtle'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Envelope Spectrum</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('waveform')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-full transition-all ${
              activeTab === 'waveform'
                ? 'bg-[#FFFFFF] text-[#1D1D1F] shadow-subtle'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Envelope Waveform</span>
          </button>
        </div>
      </div>

      {/* Chart View */}
      {activeTab === 'spectrum' ? (
        <div className="w-full h-80">
          <Plot
            data={[
              {
                x: envelope_spectrum.frequencies,
                y: envelope_spectrum.magnitudes,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#0071E3', width: 1.5 },
                name: 'Envelope Spectrum',
                hoverinfo: 'x+y',
                hovertemplate: '%{x:.2f} Hz: %{y:.5f}<extra></extra>',
              },
              ...(dominant_peaks.length > 0
                ? [
                    {
                      x: dominant_peaks.map((p) => p.frequency_hz),
                      y: dominant_peaks.map((p) => p.magnitude),
                      type: 'scatter' as const,
                      mode: 'markers' as const,
                      marker: { color: '#0071E3', size: 5, symbol: 'circle' as const },
                      name: 'Envelope Peaks',
                      hoverinfo: 'x+y' as const,
                      hovertemplate: 'Peak: %{x:.2f} Hz<br>Mag: %{y:.5f}<extra></extra>',
                    },
                  ]
                : []),
            ]}
            layout={{
              autosize: true,
              margin: { l: 55, r: 25, t: 20, b: 45 },
              xaxis: {
                title: { text: 'Modulation Frequency (Hz)', font: { size: 11, color: '#6E6E73' } },
                tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                gridcolor: '#F2F2F7',
                linecolor: '#E5E5EA',
                range: [
                  0,
                  Math.min(
                    500,
                    envelope_spectrum.frequencies[envelope_spectrum.frequencies.length - 1] || 500
                  ),
                ],
              },
              yaxis: {
                title: { text: 'Magnitude', font: { size: 11, color: '#6E6E73' } },
                tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                gridcolor: '#F2F2F7',
                linecolor: '#E5E5EA',
                zeroline: false,
              },
              annotations,
              showlegend: false,
              plot_bgcolor: '#FFFFFF',
              paper_bgcolor: '#FFFFFF',
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>
      ) : (
        <div className="w-full h-80">
          <Plot
            data={[
              {
                x: timeAxis,
                y: envelope_samples,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#0071E3', width: 1.25 },
                name: 'Envelope A[n]',
                hoverinfo: 'x+y',
                hovertemplate: '%{x:.4f} s: %{y:.4f}<extra></extra>',
              },
            ]}
            layout={{
              autosize: true,
              margin: { l: 55, r: 25, t: 20, b: 45 },
              xaxis: {
                title: { text: 'Time (seconds)', font: { size: 11, color: '#6E6E73' } },
                tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                gridcolor: '#F2F2F7',
                linecolor: '#E5E5EA',
              },
              yaxis: {
                title: { text: 'Envelope Amplitude', font: { size: 11, color: '#6E6E73' } },
                tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                gridcolor: '#F2F2F7',
                linecolor: '#E5E5EA',
                zeroline: false,
              },
              showlegend: false,
              plot_bgcolor: '#FFFFFF',
              paper_bgcolor: '#FFFFFF',
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>
      )}

      {/* Target Defect Harmonics Reference Bar */}
      {Object.keys(fault_frequencies).length > 0 && (
        <div className="pt-2 border-t border-[#F2F2F7] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#86868B] font-mono text-[10px] uppercase tracking-wider">
            Kinematic Target Harmonics:
          </span>
          {Object.entries(fault_frequencies).map(([key, val]) => (
            <span
              key={key}
              className="px-2.5 py-1 bg-[#FBFBFD] text-[#1D1D1F] rounded-lg font-mono text-[11px] border border-[#E5E5EA] font-medium tabular-nums"
            >
              <strong>{key}</strong>: {val.toFixed(2)} Hz
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnvelopeChart;
