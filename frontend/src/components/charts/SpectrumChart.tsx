import React from 'react';
import { Plot } from './PlotWrapper';
import { DominantPeak } from '../../types/api';

interface SpectrumChartProps {
  frequencies: number[];
  magnitudes: number[];
  dominantPeaks: DominantPeak[];
  frequencyResolution: number;
  title?: string;
}

export const SpectrumChart: React.FC<SpectrumChartProps> = ({
  frequencies,
  magnitudes,
  dominantPeaks,
  frequencyResolution,
  title = 'Single-Sided FFT Magnitude Spectrum (Hann Window)',
}) => {
  if (!frequencies || frequencies.length === 0) {
    return (
      <div className="bg-white border border-industrial-200 rounded-xl p-8 text-center text-xs text-industrial-400">
        Spectrum data unavailable.
      </div>
    );
  }

  // Annotations for dominant peaks
  const annotations = (dominantPeaks || []).slice(0, 5).map((p) => ({
    x: p.frequency_hz,
    y: p.magnitude,
    text: `${p.frequency_hz.toFixed(1)} Hz<br>${p.magnitude.toFixed(3)}`,
    showarrow: true,
    arrowhead: 2,
    arrowsize: 1,
    arrowwidth: 1,
    arrowcolor: '#2563eb',
    font: { size: 10, color: '#1e293b', family: 'JetBrains Mono, monospace' },
    bgcolor: '#ffffff',
    bordercolor: '#cbd5e1',
    borderwidth: 1,
    borderpad: 3,
    yshift: 10,
  }));

  return (
    <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
        <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider font-mono">
          {title}
        </h4>
        <span className="text-[11px] font-mono text-industrial-500">
          Δf: {frequencyResolution.toFixed(3)} Hz
        </span>
      </div>

      <div className="w-full h-80">
        <Plot
          data={[
            {
              x: frequencies,
              y: magnitudes,
              type: 'scatter',
              mode: 'lines',
              line: { color: '#2563eb', width: 1.5 },
              name: 'FFT Magnitude',
              hoverinfo: 'x+y',
              hovertemplate: '%{x:.2f} Hz: %{y:.5f}<extra></extra>',
            },
            ...(dominantPeaks.length > 0
              ? [
                  {
                    x: dominantPeaks.map((p) => p.frequency_hz),
                    y: dominantPeaks.map((p) => p.magnitude),
                    type: 'scatter' as const,
                    mode: 'markers' as const,
                    marker: { color: '#1d4ed8', size: 6, symbol: 'diamond' as const },
                    name: 'Dominant Peaks',
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
              title: { text: 'Frequency (Hz)', font: { size: 11, color: '#64748b' } },
              tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
              gridcolor: '#f1f5f9',
              linecolor: '#cbd5e1',
              zeroline: false,
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
    </div>
  );
};
