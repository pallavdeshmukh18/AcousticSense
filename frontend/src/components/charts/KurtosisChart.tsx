import React from 'react';
import { Plot } from './PlotWrapper';
import { SpectralKurtosis } from '../../types/api';
import { Info } from 'lucide-react';

interface KurtosisChartProps {
  spectralKurtosis: SpectralKurtosis;
}

export const KurtosisChart: React.FC<KurtosisChartProps> = ({ spectralKurtosis }) => {
  const { candidate_bands, selected_band, method_note } = spectralKurtosis;

  if (!candidate_bands || candidate_bands.length === 0) {
    return null;
  }

  const bandLabels = candidate_bands.map(
    (b) => `${b.low_hz.toFixed(0)} – ${b.high_hz.toFixed(0)} Hz`
  );
  const kurtosisValues = candidate_bands.map((b) => b.kurtosis);

  const colors = candidate_bands.map((b) =>
    b.low_hz === selected_band.low_hz && b.high_hz === selected_band.high_hz
      ? '#0071E3' // Selected highlighted band: Apple blue
      : '#E5E5EA' // Other candidate bands: subtle gray
  );

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
            Stage 04 &bull; Resonance Screening
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <h4 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
              Spectral Kurtosis Across Candidate Sub-Bands
            </h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F0F6FF] text-[#0071E3] border border-[#0071E3]/20">
              Selected: {selected_band.low_hz.toFixed(0)} – {selected_band.high_hz.toFixed(0)} Hz
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#6E6E73] bg-[#F5F5F7] px-2.5 py-1 rounded-md self-start sm:self-auto tabular-nums">
          Peak Kurtosis: {selected_band.kurtosis.toFixed(2)}
        </span>
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        <Plot
          data={[
            {
              x: bandLabels,
              y: kurtosisValues,
              type: 'bar',
              marker: {
                color: colors,
                line: {
                  color: candidate_bands.map((b) =>
                    b.low_hz === selected_band.low_hz && b.high_hz === selected_band.high_hz
                      ? '#005bb5'
                      : '#D1D1D6'
                  ),
                  width: 1,
                },
              },
              hoverinfo: 'x+y',
              hovertemplate: '%{x}<br>Excess Kurtosis: %{y:.3f}<extra></extra>',
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 50, r: 25, t: 20, b: 60 },
            xaxis: {
              title: { text: 'Candidate Frequency Band (Hz)', font: { size: 11, color: '#6E6E73' } },
              tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
              gridcolor: '#F2F2F7',
            },
            yaxis: {
              title: { text: 'Excess Kurtosis', font: { size: 11, color: '#6E6E73' } },
              tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
              gridcolor: '#F2F2F7',
              zeroline: true,
              zerolinecolor: '#E5E5EA',
            },
            plot_bgcolor: '#FFFFFF',
            paper_bgcolor: '#FFFFFF',
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>

      {/* Methodological Context Note */}
      <div className="p-3.5 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex items-start gap-2.5 text-[12px] text-[#6E6E73]">
        <Info className="w-4 h-4 text-[#86868B] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          {method_note ||
            'Notice: Stage 4 evaluates discrete candidate sub-bands using 4th-order Fisher excess kurtosis. This is a simplified screening procedure to select the optimal carrier band for subsequent filtering, and does not constitute a full continuous spectral-kurtosis estimator or fast kurtogram.'}
        </div>
      </div>
    </div>
  );
};

export default KurtosisChart;
