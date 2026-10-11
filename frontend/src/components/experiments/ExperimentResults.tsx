import React from 'react';
import { BlockLengthExperimentResponse } from '../../types/api';
import { Plot } from '../charts/PlotWrapper';
import { AlertCircle, CheckCircle2, Info, Cpu } from 'lucide-react';

interface ExperimentResultsProps {
  experiment: BlockLengthExperimentResponse;
}

export const ExperimentResults: React.FC<ExperimentResultsProps> = ({ experiment }) => {
  const { experiment_results, notes, total_samples, sampling_frequency } = experiment;

  const validResults = experiment_results.filter((r) => r.valid);

  const blockLengths = validResults.map((r) => r.block_length);
  const meanKurtosis = validResults.map((r) => r.mean_kurtosis ?? 0);
  const maxKurtosis = validResults.map((r) => r.max_kurtosis ?? 0);
  const processingTimes = validResults.map((r) => r.processing_time_ms ?? 0);

  return (
    <div className="space-y-6">
      {/* Table Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] overflow-hidden shadow-subtle">
        <div className="p-6 pb-4 border-b border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FFFFFF]">
          <div>
            <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
              Statistical Evidence
            </span>
            <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
              Block Segmentation Results (Hypothesis H1)
            </h3>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Evaluated on {total_samples.toLocaleString()} total samples at {sampling_frequency.toLocaleString()} Hz.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#6E6E73] bg-[#F5F5F7] px-3 py-1.5 rounded-lg border border-[#E5E5EA] self-start sm:self-auto tabular-nums">
            {experiment_results.length} configurations evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] text-[#86868B] font-mono text-[10px] uppercase tracking-wider bg-[#FBFBFD]">
                <th className="py-3 px-5 font-medium">Block Length</th>
                <th className="py-3 px-4 font-medium">Validation</th>
                <th className="py-3 px-4 text-right font-medium">Complete Blocks</th>
                <th className="py-3 px-4 text-right font-medium">Discarded Remainder</th>
                <th className="py-3 px-4 text-right font-medium">Mean Kurtosis</th>
                <th className="py-3 px-4 text-right font-medium">Max Kurtosis</th>
                <th className="py-3 px-4 text-right font-medium">Variability (σ)</th>
                <th className="py-3 px-5 text-right font-medium">Compute Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2F7] font-mono">
              {experiment_results.map((r, idx) => (
                <tr key={idx} className="hover:bg-[#FBFBFD] transition-colors">
                  <td className="py-3 px-5 font-semibold text-[#1D1D1F]">
                    {r.block_length} pts
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {r.valid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#248A3D] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
                        Valid
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D70015] bg-[#FF3B30]/10 px-2.5 py-0.5 rounded-full"
                        title={r.reason}
                      >
                        <AlertCircle className="w-3 h-3 text-[#FF3B30]" />
                        Insufficient
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#6E6E73]">
                    {r.num_complete_blocks !== undefined ? r.num_complete_blocks : '—'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#86868B]">
                    {r.discarded_samples !== undefined ? `${r.discarded_samples} pts` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#1D1D1F] font-semibold">
                    {r.mean_kurtosis !== undefined ? r.mean_kurtosis.toFixed(4) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#1D1D1F]">
                    {r.max_kurtosis !== undefined ? r.max_kurtosis.toFixed(4) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#6E6E73]">
                    {r.kurtosis_variability !== undefined ? r.kurtosis_variability.toFixed(4) : '—'}
                  </td>
                  <td className="py-3 px-5 text-right tabular-nums text-[#6E6E73]">
                    {r.processing_time_ms !== undefined ? `${r.processing_time_ms.toFixed(3)} ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plotly Comparison Charts */}
      {validResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Kurtosis vs Block Length */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-3">
            <h4 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
              Kurtosis Estimator Stability vs. Block Length
            </h4>
            <div className="w-full h-72">
              <Plot
                data={[
                  {
                    x: blockLengths.map(String),
                    y: meanKurtosis,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Mean Kurtosis',
                    line: { color: '#0071E3', width: 2 },
                    marker: { size: 6, color: '#0071E3' },
                  },
                  {
                    x: blockLengths.map(String),
                    y: maxKurtosis,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Max Kurtosis',
                    line: { color: '#FF9500', width: 1.5, dash: 'dot' },
                    marker: { size: 5, color: '#FF9500' },
                  },
                ]}
                layout={{
                  autosize: true,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  xaxis: {
                    title: { text: 'Block Length (samples)', font: { size: 11, color: '#6E6E73' } },
                    tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    gridcolor: '#F2F2F7',
                  },
                  yaxis: {
                    title: { text: 'Kurtosis Metric', font: { size: 11, color: '#6E6E73' } },
                    tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    gridcolor: '#F2F2F7',
                  },
                  legend: { orientation: 'h', y: -0.25, font: { size: 10 } },
                  plot_bgcolor: '#FFFFFF',
                  paper_bgcolor: '#FFFFFF',
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          </div>

          {/* Chart 2: Execution Time vs Block Length */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-3">
            <h4 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
              Runtime Latency vs. Block Length
            </h4>
            <div className="w-full h-72">
              <Plot
                data={[
                  {
                    x: blockLengths.map(String),
                    y: processingTimes,
                    type: 'bar',
                    name: 'Processing Time (ms)',
                    marker: { color: '#0071E3' },
                  },
                ]}
                layout={{
                  autosize: true,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  xaxis: {
                    title: { text: 'Block Length (samples)', font: { size: 11, color: '#6E6E73' } },
                    tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    gridcolor: '#F2F2F7',
                  },
                  yaxis: {
                    title: { text: 'Compute Time (ms)', font: { size: 11, color: '#6E6E73' } },
                    tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    gridcolor: '#F2F2F7',
                  },
                  plot_bgcolor: '#FFFFFF',
                  paper_bgcolor: '#FFFFFF',
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Disclaimers & Methodology Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex items-start gap-3 text-[12px] text-[#6E6E73]">
          <Info className="w-4 h-4 text-[#86868B] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#1D1D1F] block mb-1">
              Sample Discarding Policy
            </span>
            {notes.policy}
          </div>
        </div>

        <div className="p-4 bg-[#FBFBFD] rounded-xl border border-[#E5E5EA] flex items-start gap-3 text-[12px] text-[#6E6E73]">
          <Cpu className="w-4 h-4 text-[#86868B] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#1D1D1F] block mb-1">
              Hardware Architecture Disclaimer
            </span>
            {notes.hardware_disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentResults;
