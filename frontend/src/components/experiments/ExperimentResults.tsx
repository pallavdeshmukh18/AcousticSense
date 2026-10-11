import React from 'react';
import { BlockLengthExperimentResponse } from '../../types/api';
import { Plot } from '../charts/PlotWrapper';
import { AlertCircle, CheckCircle2, Info, Cpu, ShieldCheck } from 'lucide-react';

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
      <div className="bg-white border border-industrial-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-industrial-800">
              Block Segmentation Results
            </h3>
            <p className="text-xs text-industrial-500">
              Evaluated on {total_samples.toLocaleString()} total samples at {sampling_frequency.toLocaleString()} Hz.
            </p>
          </div>
          <span className="text-xs font-mono text-industrial-400">
            {experiment_results.length} block configurations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-industrial-200 text-industrial-500 font-mono text-[11px] uppercase bg-industrial-50/60">
                <th className="py-2.5 px-3">Block Length</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Complete Blocks</th>
                <th className="py-2.5 px-3 text-right">Discarded Remainder</th>
                <th className="py-2.5 px-3 text-right">Mean Kurtosis</th>
                <th className="py-2.5 px-3 text-right">Max Kurtosis</th>
                <th className="py-2.5 px-3 text-right">Variability (σ)</th>
                <th className="py-2.5 px-3 text-right">Compute Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-100 font-mono">
              {experiment_results.map((r, idx) => (
                <tr key={idx} className="hover:bg-industrial-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-industrial-800">
                    {r.block_length} samples
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {r.valid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title={r.reason}>
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Insufficient Samples
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-industrial-700">
                    {r.num_complete_blocks !== undefined ? r.num_complete_blocks : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-industrial-500">
                    {r.discarded_samples !== undefined ? `${r.discarded_samples} samples` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-industrial-800 font-semibold">
                    {r.mean_kurtosis !== undefined ? r.mean_kurtosis.toFixed(4) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-industrial-800">
                    {r.max_kurtosis !== undefined ? r.max_kurtosis.toFixed(4) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-industrial-600">
                    {r.kurtosis_variability !== undefined ? r.kurtosis_variability.toFixed(4) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-industrial-600">
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
          {/* Kurtosis vs Block Length */}
          <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
            <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider font-mono mb-3">
              Kurtosis Estimator Stability vs Block Length
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
                    line: { color: '#2563eb', width: 2 },
                    marker: { size: 6, color: '#2563eb' },
                  },
                  {
                    x: blockLengths.map(String),
                    y: maxKurtosis,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Max Kurtosis',
                    line: { color: '#d97706', width: 1.5, dash: 'dot' },
                    marker: { size: 5, color: '#d97706' },
                  },
                ]}
                layout={{
                  autosize: true,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  xaxis: {
                    title: { text: 'Block Length (samples)', font: { size: 11, color: '#64748b' } },
                    tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                    gridcolor: '#f1f5f9',
                  },
                  yaxis: {
                    title: { text: 'Kurtosis Metric', font: { size: 11, color: '#64748b' } },
                    tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                    gridcolor: '#f1f5f9',
                  },
                  legend: { orientation: 'h', y: -0.25, font: { size: 10 } },
                  plot_bgcolor: '#ffffff',
                  paper_bgcolor: '#ffffff',
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          </div>

          {/* Execution Time vs Block Length */}
          <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
            <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider font-mono mb-3">
              Python Runtime Execution Time vs Block Length
            </h4>
            <div className="w-full h-72">
              <Plot
                data={[
                  {
                    x: blockLengths.map(String),
                    y: processingTimes,
                    type: 'bar',
                    name: 'Processing Time (ms)',
                    marker: { color: '#64748b' },
                  },
                ]}
                layout={{
                  autosize: true,
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  xaxis: {
                    title: { text: 'Block Length (samples)', font: { size: 11, color: '#64748b' } },
                    tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                    gridcolor: '#f1f5f9',
                  },
                  yaxis: {
                    title: { text: 'Time (ms)', font: { size: 11, color: '#64748b' } },
                    tickfont: { size: 10, color: '#64748b', family: 'JetBrains Mono, monospace' },
                    gridcolor: '#f1f5f9',
                  },
                  plot_bgcolor: '#ffffff',
                  paper_bgcolor: '#ffffff',
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
        <div className="p-4 bg-industrial-50 rounded-xl border border-industrial-200 flex items-start gap-3 text-xs text-industrial-600">
          <Info className="w-4 h-4 text-industrial-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-industrial-800 block mb-1">
              Sample Discarding Policy
            </span>
            {notes.policy}
          </div>
        </div>

        <div className="p-4 bg-industrial-50 rounded-xl border border-industrial-200 flex items-start gap-3 text-xs text-industrial-600">
          <Cpu className="w-4 h-4 text-industrial-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-industrial-800 block mb-1">
              Embedded Hardware Architecture Disclaimer
            </span>
            {notes.hardware_disclaimer}
          </div>
        </div>
      </div>

      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Preliminary Research Context:</strong> This block-length experiment is designed for preliminary
          investigation into how sample window size influences kurtosis estimator variance; it does not constitute
          proof of statistically validated detection probability.
        </div>
      </div>
    </div>
  );
};
