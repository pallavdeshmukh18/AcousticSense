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
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-8 text-center text-[13px] text-[#86868B]">
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
    arrowwidth: 1.5,
    arrowcolor: '#0071E3',
    font: { size: 10, color: '#1D1D1F', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
    bgcolor: '#FFFFFF',
    bordercolor: '#E5E5EA',
    borderwidth: 1,
    borderpad: 3,
    yshift: 10,
  }));

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
            Stage 03 &bull; Fourier Domain
          </span>
          <h4 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
            {title}
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[#6E6E73] bg-[#F5F5F7] px-2.5 py-1 rounded-md self-start sm:self-auto tabular-nums">
          Δf: {frequencyResolution.toFixed(3)} Hz
        </span>
      </div>

      {/* Chart */}
      <div className="w-full h-80">
        <Plot
          data={[
            {
              x: frequencies,
              y: magnitudes,
              type: 'scatter',
              mode: 'lines',
              line: { color: '#0071E3', width: 1.5 },
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
                    marker: { color: '#0071E3', size: 6, symbol: 'diamond' as const },
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
              title: { text: 'Frequency (Hz)', font: { size: 11, color: '#6E6E73' } },
              tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
              gridcolor: '#F2F2F7',
              linecolor: '#E5E5EA',
              zeroline: false,
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
    </div>
  );
};

export default SpectrumChart;
