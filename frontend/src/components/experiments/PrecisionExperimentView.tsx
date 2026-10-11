import React, { useState } from 'react';
import { useSignal } from '../../context/SignalContext';
import { apiService, extractErrorMessage } from '../../services/api';
import { PrecisionExperimentResponse } from '../../types/api';
import { Plot } from '../charts/PlotWrapper';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const PrecisionExperimentView: React.FC = () => {
  const { uploadedSignal } = useSignal();
  const [blockLength, setBlockLength] = useState<number>(1024);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<PrecisionExperimentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRun = async () => {
    if (!uploadedSignal) return;
    setIsRunning(true);
    setErrorMessage(null);

    try {
      const data = await apiService.runPrecisionExperiment({
        signal_id: uploadedSignal.signal_id,
        block_length: blockLength,
        lpc_orders: [2, 4, 8, 12, 16, 20, 24, 32],
      });
      setResult(data);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsRunning(false);
    }
  };

  // Prepare Chart Data
  const formatNames = result?.formats.map((f) => f.format_name) || [];
  const kurtosisValues = result?.formats.map((f) => f.kurtosis) || [];
  const barColors = [
    '#3b82f6', // Float64 (Blue)
    '#10b981', // Float32 (Emerald)
    '#6366f1', // BFP (Indigo)
    '#f59e0b', // Q31 (Amber)
    '#ef4444', // Q15 (Red)
  ];

  // LPC Stability data
  const lpcOrders = result?.lpc_stability_sweep.map((s) => s.order_p) || [];
  const f64Km = result?.lpc_stability_sweep.map((s) => s.float64.max_reflection_coeff) || [];
  const q15Km = result?.lpc_stability_sweep.map((s) => s.q15.max_reflection_coeff) || [];

  return (
    <div className="space-y-6">
      {/* Parameter Selection Form */}
      <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-industrial-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-600" />
              <span>Arithmetic Precision & Word-Length Limits (Hypothesis H2)</span>
            </h3>
            <p className="text-xs text-industrial-500 mt-0.5">
              Simulates bit-exact quantization and fourth-moment accumulation across Float64, Float32, Q31, Q15, and BFP.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-industrial-600 font-medium">Block Size N:</span>
              <select
                value={blockLength}
                onChange={(e) => setBlockLength(Number(e.target.value))}
                className="px-2.5 py-1.5 border border-industrial-300 rounded bg-white text-xs font-mono font-medium"
              >
                <option value={256}>256 samples</option>
                <option value={512}>512 samples</option>
                <option value={1024}>1024 samples</option>
                <option value={2048}>2048 samples</option>
              </select>
            </div>

            <button
              onClick={handleRun}
              disabled={isRunning || !uploadedSignal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Formats...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Precision Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Hypothesis Conclusion Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 shadow-2xs flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-mono">
                  Hypothesis H2 Status: {result.hypothesis_h2_status}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Verified on {result.filename || 'Active Signal'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                {result.scientific_conclusion}
              </p>
            </div>
          </div>

          {/* Formats Comparative Table */}
          <div className="bg-white border border-industrial-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-industrial-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-industrial-700" />
                <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider">
                  Arithmetic Formats & Dynamic Range Headroom (N = {result.block_length})
                </h4>
              </div>
              <span className="text-xs text-industrial-500 font-mono">
                Double Ref Kurtosis: {result.reference_kurtosis.toFixed(4)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-industrial-100 text-industrial-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Precision Format</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Bit Width</th>
                    <th className="px-4 py-3 text-right">Measured Kurtosis</th>
                    <th className="px-4 py-3 text-right">Error Bias (%)</th>
                    <th className="px-4 py-3 text-center">Headroom / Overflow</th>
                    <th className="px-5 py-3">Operating Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-100 text-industrial-700">
                  {result.formats.map((fmt) => (
                    <tr key={fmt.format_name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-industrial-900">
                        {fmt.format_name}
                      </td>
                      <td className="px-4 py-3 text-industrial-500 font-mono text-[11px]">
                        {fmt.category}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-industrial-600">
                        {fmt.bit_width}-bit
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-industrial-900">
                        {fmt.kurtosis.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        <span
                          className={
                            Math.abs(fmt.bias_percent) < 1.0
                              ? 'text-emerald-700'
                              : Math.abs(fmt.bias_percent) < 5.0
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }
                        >
                          {fmt.bias_percent >= 0 ? `+${fmt.bias_percent.toFixed(2)}%` : `${fmt.bias_percent.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {fmt.overflow_flag ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-200">
                            <ShieldAlert className="w-3 h-3" />
                            Overflow
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            fmt.status.includes('Passed') || fmt.status.includes('Exact')
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : fmt.status.includes('Marginal')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {fmt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Kurtosis by Format */}
            <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="border-b border-industrial-100 pb-3 mb-2">
                <h4 className="text-sm font-semibold text-industrial-800">
                  Kurtosis Estimator Bias vs. Precision Format
                </h4>
                <p className="text-[11px] text-industrial-500">
                  Compares Double-precision reference against Float32, BFP, Q31, and Q15.
                </p>
              </div>

              <div className="flex-1 w-full min-h-[280px]">
                <Plot
                  data={[
                    {
                      x: formatNames,
                      y: kurtosisValues,
                      type: 'bar',
                      marker: {
                        color: barColors,
                      },
                      text: kurtosisValues.map((v) => v.toFixed(3)),
                      textposition: 'auto',
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 40, r: 20, t: 15, b: 65 },
                    xaxis: {
                      tickangle: -20,
                      tickfont: { size: 10 },
                    },
                    yaxis: {
                      title: { text: 'Excess Kurtosis', font: { size: 11 } },
                      gridcolor: '#f1f5f9',
                    },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            </div>

            {/* Chart 2: Levinson-Durbin Stability Line Chart */}
            <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="border-b border-industrial-100 pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-industrial-800">
                    Levinson-Durbin LPC Stability (|k_m| vs. Order p)
                  </h4>
                  <p className="text-[11px] text-industrial-500">
                    Reflection coefficient |k_m| must remain &lt; 1.0 for whitening filter stability.
                  </p>
                </div>
              </div>

              <div className="flex-1 w-full min-h-[280px]">
                <Plot
                  data={[
                    // Float64 Max km
                    {
                      x: lpcOrders,
                      y: f64Km,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Float64 (Stable)',
                      line: { color: '#0284c7', width: 2 },
                      marker: { size: 6 },
                    },
                    // Q15 Max km
                    {
                      x: lpcOrders,
                      y: q15Km,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Q15 Fixed-Point',
                      line: { color: '#ef4444', width: 2 },
                      marker: { size: 6 },
                    },
                    // Instability Cutoff Line (|km| = 1.0)
                    {
                      x: [Math.min(...lpcOrders), Math.max(...lpcOrders)],
                      y: [1.0, 1.0],
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Instability Threshold (|km|=1.0)',
                      line: { color: '#dc2626', dash: 'dash', width: 1.5 },
                      hoverinfo: 'none',
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 40, r: 20, t: 15, b: 40 },
                    xaxis: {
                      title: { text: 'LPC Filter Order (p)', font: { size: 11 } },
                      gridcolor: '#f1f5f9',
                    },
                    yaxis: {
                      title: { text: 'Max |k_m|', font: { size: 11 } },
                      range: [0, 1.3],
                      gridcolor: '#f1f5f9',
                    },
                    legend: {
                      orientation: 'h',
                      x: 0.05,
                      y: 1.15,
                      font: { size: 10 },
                    },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrecisionExperimentView;
