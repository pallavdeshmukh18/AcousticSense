import React, { useState } from 'react';
import { useSignal } from '../../context/SignalContext';
import { apiService, extractErrorMessage } from '../../services/api';
import { PrecisionExperimentResponse } from '../../types/api';
import { Plot } from '../charts/PlotWrapper';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
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
    '#0071E3', // Float64 (Apple Blue)
    '#34C759', // Float32 (Apple Green)
    '#5856D6', // BFP (Purple)
    '#FF9500', // Q31 (Amber)
    '#FF3B30', // Q15 (Red)
  ];

  // LPC Stability data
  const lpcOrders = result?.lpc_stability_sweep.map((s) => s.order_p) || [];
  const f64Km = result?.lpc_stability_sweep.map((s) => s.float64.max_reflection_coeff) || [];
  const q15Km = result?.lpc_stability_sweep.map((s) => s.q15.max_reflection_coeff) || [];

  return (
    <div className="space-y-6">
      {/* Parameter Selection Form */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
                Hypothesis H2 &bull; Word-Length Limits
              </span>
            </div>
            <h3 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
              Arithmetic precision
            </h3>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Compare numerical formats against the double-precision reference.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6E6E73] font-medium font-sans">Block Size:</span>
              <select
                value={blockLength}
                onChange={(e) => setBlockLength(Number(e.target.value))}
                className="px-3 py-1.5 border border-[#E5E5EA] rounded-lg bg-[#FFFFFF] text-[13px] font-mono font-medium text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-[13px] font-medium rounded-full text-white bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle transition-colors"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Formats…</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex items-start gap-2.5 text-[12px] text-[#D70015]">
          <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
          <span className="font-sans">{errorMessage}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Hypothesis Conclusion Banner */}
          <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-5 shadow-subtle flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-[#248A3D]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                  Hypothesis H2 Status: {result.hypothesis_h2_status}
                </span>
                <span className="text-[11px] bg-[#F5F5F7] text-[#6E6E73] px-2.5 py-0.5 rounded-full font-medium">
                  Verified on {result.filename || 'Active Signal'}
                </span>
              </div>
              <p className="text-[13px] text-[#6E6E73] leading-relaxed font-sans">
                {result.scientific_conclusion}
              </p>
            </div>
          </div>

          {/* Formats Comparative Table */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] overflow-hidden shadow-subtle">
            <div className="px-6 py-4 border-b border-[#E5E5EA] bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0071E3]" />
                <h4 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
                  Arithmetic Formats & Dynamic Range Headroom (N = {result.block_length})
                </h4>
              </div>
              <span className="text-[11px] text-[#6E6E73] font-mono bg-[#F5F5F7] px-2.5 py-1 rounded-md border border-[#E5E5EA] tabular-nums">
                Double Ref Kurtosis: {result.reference_kurtosis.toFixed(4)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5EA] text-[#86868B] font-mono text-[10px] uppercase tracking-wider bg-[#FBFBFD]">
                    <th className="py-3 px-5 font-medium">Precision Format</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 text-right font-medium">Bit Width</th>
                    <th className="py-3 px-4 text-right font-medium">Measured Kurtosis</th>
                    <th className="py-3 px-4 text-right font-medium">Error Bias (%)</th>
                    <th className="py-3 px-4 text-center font-medium">Headroom / Overflow</th>
                    <th className="py-3 px-5 font-medium">Operating Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7] font-sans">
                  {result.formats.map((fmt) => (
                    <tr key={fmt.format_name} className="hover:bg-[#FBFBFD] transition-colors">
                      <td className="py-3 px-5 font-semibold text-[#1D1D1F]">
                        {fmt.format_name}
                      </td>
                      <td className="py-3 px-4 text-[#6E6E73] font-mono text-[11px]">
                        {fmt.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6E6E73]">
                        {fmt.bit_width}-bit
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1D1D1F]">
                        {fmt.kurtosis.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium">
                        <span
                          className={
                            Math.abs(fmt.bias_percent) < 1.0
                              ? 'text-[#248A3D]'
                              : Math.abs(fmt.bias_percent) < 5.0
                              ? 'text-[#B25000]'
                              : 'text-[#D70015]'
                          }
                        >
                          {fmt.bias_percent >= 0 ? `+${fmt.bias_percent.toFixed(2)}%` : `${fmt.bias_percent.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {fmt.overflow_flag ? (
                          <span className="inline-flex items-center gap-1 text-[#D70015] bg-[#FF3B30]/10 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                            <ShieldAlert className="w-3 h-3 text-[#FF3B30]" />
                            Overflow
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#248A3D] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                            <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            fmt.status.includes('Passed') || fmt.status.includes('Exact')
                              ? 'bg-[#34C759]/10 text-[#248A3D]'
                              : fmt.status.includes('Marginal')
                              ? 'bg-[#FF9500]/10 text-[#B25000]'
                              : 'bg-[#FF3B30]/10 text-[#D70015]'
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
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle flex flex-col space-y-3">
              <div className="border-b border-[#F2F2F7] pb-3">
                <h4 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
                  Kurtosis Estimator Bias vs. Precision Format
                </h4>
                <p className="text-[11px] text-[#6E6E73] mt-0.5">
                  Compares Double-precision baseline against Float32, BFP, Q31, and Q15 word-lengths.
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
                    margin: { l: 45, r: 20, t: 15, b: 65 },
                    xaxis: {
                      tickangle: -20,
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    },
                    yaxis: {
                      title: { text: 'Excess Kurtosis', font: { size: 11, color: '#6E6E73' } },
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                      gridcolor: '#F2F2F7',
                    },
                    plot_bgcolor: '#FFFFFF',
                    paper_bgcolor: '#FFFFFF',
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            </div>

            {/* Chart 2: Levinson-Durbin Stability Line Chart */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle flex flex-col space-y-3">
              <div className="border-b border-[#F2F2F7] pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
                    Levinson-Durbin LPC Stability (|k_m| vs. Order p)
                  </h4>
                  <p className="text-[11px] text-[#6E6E73] mt-0.5">
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
                      line: { color: '#0071E3', width: 2 },
                      marker: { size: 6, color: '#0071E3' },
                    },
                    // Q15 Max km
                    {
                      x: lpcOrders,
                      y: q15Km,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Q15 Fixed-Point',
                      line: { color: '#FF3B30', width: 2 },
                      marker: { size: 6, color: '#FF3B30' },
                    },
                    // Instability Cutoff Line (|km| = 1.0)
                    {
                      x: [Math.min(...lpcOrders), Math.max(...lpcOrders)],
                      y: [1.0, 1.0],
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Instability Threshold (|km|=1.0)',
                      line: { color: '#991B1B', dash: 'dash', width: 1.5 },
                      hoverinfo: 'none',
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 45, r: 20, t: 15, b: 40 },
                    xaxis: {
                      title: { text: 'LPC Filter Order (p)', font: { size: 11, color: '#6E6E73' } },
                      gridcolor: '#F2F2F7',
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    },
                    yaxis: {
                      title: { text: 'Max |k_m|', font: { size: 11, color: '#6E6E73' } },
                      range: [0, 1.3],
                      gridcolor: '#F2F2F7',
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    },
                    legend: {
                      orientation: 'h',
                      x: 0.05,
                      y: 1.15,
                      font: { size: 10 },
                    },
                    plot_bgcolor: '#FFFFFF',
                    paper_bgcolor: '#FFFFFF',
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
