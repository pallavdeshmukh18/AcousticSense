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
      arrowcolor: fi.indicator_rf >= 3.0 ? '#d97706' : '#2563eb',
      font: { size: 10, color: '#1e293b', family: 'JetBrains Mono, monospace' },
      bgcolor: '#ffffff',
      bordercolor: '#cbd5e1',
      borderwidth: 1,
      borderpad: 2,
      yshift: 12,
    }));

  return (
    <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider font-mono">
            Hilbert Demodulation & Envelope Analysis
          </h4>
          <p className="text-xs text-industrial-500 mt-0.5">
            Analytic signal envelope A[n] = √(y² + H(y)²) and AC-coupled demodulated envelope spectrum.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-industrial-100 p-0.5 rounded-lg border border-industrial-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('spectrum')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'spectrum'
                ? 'bg-white text-industrial-900 shadow-xs'
                : 'text-industrial-500 hover:text-industrial-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-primary-600" />
            <span>Envelope Spectrum</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('waveform')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'waveform'
                ? 'bg-white text-industrial-900 shadow-xs'
                : 'text-industrial-500 hover:text-industrial-800'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-primary-600" />
            <span>Envelope Waveform</span>
          </button>
        </div>
      </div>

      {activeTab === 'spectrum' ? (
        <div className="w-full h-80">
          <Plot
            data={[
              {
                x: envelope_spectrum.frequencies,
                y: envelope_spectrum.magnitudes,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#0284c7', width: 1.5 },
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
                      marker: { color: '#0369a1', size: 6, symbol: 'circle' as const },
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
                title: { text: 'Modulation Frequency (Hz)', font: { size: 11, color: '#64748b' } },
                tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                gridcolor: '#f1f5f9',
                linecolor: '#cbd5e1',
                // Zoom in on low frequency modulation region (up to 500 Hz or Nyquist if smaller)
                range: [
                  0,
                  Math.min(
                    500,
                    envelope_spectrum.frequencies[envelope_spectrum.frequencies.length - 1] || 500
                  ),
                ],
              },
              yaxis: {
                title: { text: 'Magnitude', font: { size: 11, color: '#64748b' } },
                tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                gridcolor: '#f1f5f9',
                linecolor: '#cbd5e1',
                zeroline: false,
              },
              annotations,
              showlegend: false,
              plot_bgcolor: '#ffffff',
              paper_bgcolor: '#ffffff',
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
                line: { color: '#475569', width: 1.2 },
                name: 'Envelope A[n]',
                hoverinfo: 'x+y',
                hovertemplate: '%{x:.4f} s: %{y:.4f}<extra></extra>',
              },
            ]}
            layout={{
              autosize: true,
              margin: { l: 55, r: 25, t: 20, b: 45 },
              xaxis: {
                title: { text: 'Time (seconds)', font: { size: 11, color: '#64748b' } },
                tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                gridcolor: '#f1f5f9',
                linecolor: '#cbd5e1',
              },
              yaxis: {
                title: { text: 'Envelope Amplitude', font: { size: 11, color: '#64748b' } },
                tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                gridcolor: '#f1f5f9',
                linecolor: '#cbd5e1',
                zeroline: false,
              },
              showlegend: false,
              plot_bgcolor: '#ffffff',
              paper_bgcolor: '#ffffff',
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>
      )}

      {/* Characteristic Frequency Badges */}
      {Object.keys(fault_frequencies).length > 0 && (
        <div className="mt-3 pt-3 border-t border-industrial-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-industrial-400 font-mono text-[11px]">Kinematic Frequencies:</span>
          {Object.entries(fault_frequencies).map(([key, val]) => (
            <span
              key={key}
              className="px-2 py-0.5 bg-industrial-100 text-industrial-700 rounded font-mono text-[11px] border border-industrial-200"
            >
              {key}: {val.toFixed(2)} Hz
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
