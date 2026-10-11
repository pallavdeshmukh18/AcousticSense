import React from 'react';
import { Plot } from './PlotWrapper';
import { SpectralKurtosis } from '../../types/api';
import { Sparkles, Info } from 'lucide-react';

interface KurtosisChartProps {
  spectralKurtosis: SpectralKurtosis;
}

export const KurtosisChart: React.FC<KurtosisChartProps> = ({ spectralKurtosis }) => {
  const { candidate_bands, selected_band, method_note } = spectralKurtosis;

  if (!candidate_bands || candidate_bands.length === 0) {
    return null;
  }

  const bandLabels = candidate_bands.map(
    (b) => `${b.low_hz.toFixed(0)} - ${b.high_hz.toFixed(0)} Hz`
  );
  const kurtosisValues = candidate_bands.map((b) => b.kurtosis);

  const colors = candidate_bands.map((b) =>
    b.low_hz === selected_band.low_hz && b.high_hz === selected_band.high_hz
      ? '#2563eb' // Selected highlighted band: muted primary blue
      : '#cbd5e1' // Other candidate bands: neutral slate
  );

  return (
    <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider font-mono">
              Stage 3: Spectral Kurtosis Across Candidate Sub-Bands
            </h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
              <Sparkles className="w-3 h-3" />
              Selected: {selected_band.low_hz.toFixed(0)} - {selected_band.high_hz.toFixed(0)} Hz
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-industrial-500">
          Peak Kurtosis: {selected_band.kurtosis.toFixed(2)}
        </span>
      </div>

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
                      ? '#1d4ed8'
                      : '#94a3b8'
                  ),
                  width: 1,
                },
              },
              hoverinfo: 'x+y',
              hovertemplate: '%{x}<br>Kurtosis: %{y:.3f}<extra></extra>',
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 50, r: 25, t: 20, b: 60 },
            xaxis: {
              title: { text: 'Candidate Frequency Band (Hz)', font: { size: 11, color: '#64748b' } },
              tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
              gridcolor: '#f1f5f9',
            },
            yaxis: {
              title: { text: 'Excess Kurtosis', font: { size: 11, color: '#64748b' } },
              tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
              gridcolor: '#f1f5f9',
              zeroline: true,
              zerolinecolor: '#cbd5e1',
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>

      <div className="mt-3 p-2.5 bg-industrial-50 rounded-lg border border-industrial-200/60 flex items-start gap-2 text-[11px] text-industrial-500">
        <Info className="w-3.5 h-3.5 text-industrial-400 shrink-0 mt-0.5" />
        <div>
          {method_note ||
            'Kurtosis calculated over filtered candidate frequency bands is a simplified band-selection method and is not equivalent to a full spectral-kurtosis estimator or fast kurtogram.'}
        </div>
      </div>
    </div>
  );
};
