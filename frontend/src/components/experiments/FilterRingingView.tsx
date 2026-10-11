import React, { useState } from 'react';
import { useSignal } from '../../context/SignalContext';
import { apiService, extractErrorMessage } from '../../services/api';
import { RingingExperimentResponse } from '../../types/api';
import { Plot } from '../charts/PlotWrapper';
import {
  Waves,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Layers,
  Timer,
  Activity,
  Zap,
} from 'lucide-react';

export const FilterRingingView: React.FC = () => {
  const { uploadedSignal } = useSignal();
  const [faultFreq, setFaultFreq] = useState<number>(107.3);
  const [centerFreq, setCenterFreq] = useState<number>(3200);
  const [filterOrder, setFilterOrder] = useState<number>(2);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<RingingExperimentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRun = async () => {
    if (!uploadedSignal) return;
    setIsRunning(true);
    setErrorMessage(null);

    try {
      const data = await apiService.runRingingExperiment({
        signal_id: uploadedSignal.signal_id,
        fault_frequency: faultFreq,
        center_frequency: centerFreq,
        bandwidths: [80.0, 150.0, 300.0, 600.0, 1200.0, 2400.0, 3600.0],
        filter_order: filterOrder,
      });
      setResult(data);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsRunning(false);
    }
  };

  // Prepare chart series
  const betas = result?.bandwidth_results.map((r) => r.beta_ratio) || [];
  const kurtIIR = result?.bandwidth_results.map((r) => r.kurtosis_iir) || [];
  const kurtFIR = result?.bandwidth_results.map((r) => r.kurtosis_fir) || [];
  const bandwidths = result?.bandwidth_results.map((r) => r.bandwidth_hz) || [];
  const tauMs = result?.bandwidth_results.map((r) => r.ringing_duration_ms) || [];
  const tImpact = result?.impact_interval_ms || 9.32;

  return (
    <div className="space-y-6">
      {/* Parameter Control Form */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
                Hypothesis H3 &bull; Impulsiveness Preservation
              </span>
            </div>
            <h3 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
              Filter ringing
            </h3>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Investigate how filter bandwidth and order influence transient preservation and ringing behavior.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6E6E73] font-medium font-sans">Fault Freq:</span>
              <div className="relative">
                <input
                  type="number"
                  value={faultFreq}
                  step="any"
                  min={1}
                  max={2000}
                  onChange={(e) => setFaultFreq(Number(e.target.value))}
                  className="w-24 px-2.5 py-1.5 border border-[#E5E5EA] rounded-lg bg-[#FFFFFF] text-[13px] font-mono tabular-nums text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
                />
                <span className="text-[10px] text-[#86868B] font-mono ml-1">Hz</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6E6E73] font-medium font-sans">Center Freq:</span>
              <div className="relative">
                <input
                  type="number"
                  value={centerFreq}
                  step="50"
                  min={200}
                  max={20000}
                  onChange={(e) => setCenterFreq(Number(e.target.value))}
                  className="w-24 px-2.5 py-1.5 border border-[#E5E5EA] rounded-lg bg-[#FFFFFF] text-[13px] font-mono tabular-nums text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
                />
                <span className="text-[10px] text-[#86868B] font-mono ml-1">Hz</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6E6E73] font-medium font-sans">Order:</span>
              <select
                value={filterOrder}
                onChange={(e) => setFilterOrder(Number(e.target.value))}
                className="px-2.5 py-1.5 border border-[#E5E5EA] rounded-lg bg-[#FFFFFF] text-[13px] font-mono text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
              >
                <option value={2}>2nd Order (12 dB/oct)</option>
                <option value={4}>4th Order (24 dB/oct)</option>
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
                  <span>Sweeping Bandwidths…</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Ringing Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex items-start gap-2.5 text-[12px] text-[#D70015]">
          <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
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
                  Hypothesis H3 Status: {result.hypothesis_h3_status}
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

          {/* Quick Metrics Chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between text-[#86868B] mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider font-mono">Impact Spacing</span>
                <Timer className="w-3.5 h-3.5 text-[#0071E3]" />
              </div>
              <div className="text-[16px] font-semibold font-mono text-[#1D1D1F] tabular-nums">
                {result.impact_interval_ms.toFixed(2)} <span className="text-[12px] font-normal text-[#86868B]">ms</span>
              </div>
              <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                T_impact = 1 / {result.fault_frequency_hz.toFixed(1)} Hz
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between text-[#86868B] mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider font-mono">Min Recommended BW</span>
                <Zap className="w-3.5 h-3.5 text-[#34C759]" />
              </div>
              <div className="text-[16px] font-semibold font-mono text-[#248A3D] tabular-nums">
                &ge; {result.min_recommended_bandwidth_hz.toFixed(0)} <span className="text-[12px] font-normal text-[#86868B]">Hz</span>
              </div>
              <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                Condition: &beta; = B / f_fault &ge; 8.0
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between text-[#86868B] mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider font-mono">Max Ringing Decay</span>
                <Activity className="w-3.5 h-3.5 text-[#FF3B30]" />
              </div>
              <div className="text-[16px] font-semibold font-mono text-[#D70015] tabular-nums">
                {result.bandwidth_results[0]?.ringing_duration_ms.toFixed(2)} <span className="text-[12px] font-normal text-[#86868B]">ms</span>
              </div>
              <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                At B = {result.bandwidth_results[0]?.bandwidth_hz} Hz (&tau; = 1/&pi;B)
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between text-[#86868B] mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider font-mono">Demodulation Band</span>
                <Waves className="w-3.5 h-3.5 text-[#5856D6]" />
              </div>
              <div className="text-[16px] font-semibold font-mono text-[#1D1D1F] tabular-nums">
                {result.center_frequency_hz.toFixed(0)} <span className="text-[12px] font-normal text-[#86868B]">Hz</span>
              </div>
              <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                Center Freq (Order {result.filter_order})
              </div>
            </div>
          </div>

          {/* Bandwidth Sweep Table */}
          <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-subtle">
            <div className="px-6 py-4 border-b border-[#E5E5EA] bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0071E3]" />
                <h4 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
                  Bandwidth Sweep & Ringing Duration Breakdown
                </h4>
              </div>
              <span className="text-[11px] text-[#6E6E73] font-mono bg-[#F5F5F7] px-2.5 py-1 rounded-md border border-[#E5E5EA] tabular-nums">
                f_fault: {result.fault_frequency_hz} Hz &bull; T_impact: {result.impact_interval_ms} ms
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5EA] text-[#86868B] font-mono text-[10px] uppercase tracking-wider bg-[#FBFBFD]">
                    <th className="py-3 px-5 font-medium">Bandwidth B (Hz)</th>
                    <th className="py-3 px-4 text-right font-medium">Passband [Low - High]</th>
                    <th className="py-3 px-4 text-right font-medium">&beta; Ratio (B / f_fault)</th>
                    <th className="py-3 px-4 text-right font-medium">Ringing &tau; (ms)</th>
                    <th className="py-3 px-4 text-right font-medium">Kurtosis (IIR)</th>
                    <th className="py-3 px-4 text-right font-medium">Kurtosis (FIR)</th>
                    <th className="py-3 px-4 text-right font-medium">Retention</th>
                    <th className="py-3 px-5 font-medium">Smearing Regime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7] font-sans">
                  {result.bandwidth_results.map((row) => (
                    <tr key={row.bandwidth_hz} className="hover:bg-[#FBFBFD] transition-colors">
                      <td className="py-3 px-5 font-semibold text-[#1D1D1F] font-mono">
                        {row.bandwidth_hz.toFixed(0)} Hz
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73] text-[11px] tabular-nums">
                        [{row.low_hz.toFixed(0)} – {row.high_hz.toFixed(0)} Hz]
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        <span
                          className={
                            row.beta_ratio < 3.0
                              ? 'text-[#D70015]'
                              : row.beta_ratio < 8.0
                              ? 'text-[#B25000]'
                              : 'text-[#248A3D]'
                          }
                        >
                          {row.beta_ratio.toFixed(2)}&times;
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6E6E73]">
                        {row.ringing_duration_ms.toFixed(2)} ms
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1D1D1F]">
                        {row.kurtosis_iir.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6E6E73]">
                        {row.kurtosis_fir.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0071E3]">
                        {row.retention_percent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            row.smearing_regime === 'Severe Smearing'
                              ? 'bg-[#FF3B30]/10 text-[#D70015]'
                              : row.smearing_regime === 'Transitional'
                              ? 'bg-[#FF9500]/10 text-[#B25000]'
                              : 'bg-[#34C759]/10 text-[#248A3D]'
                          }`}
                          title={row.regime_description}
                        >
                          {row.smearing_regime}
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
            {/* Chart 1: Kurtosis vs. Beta Ratio */}
            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-6 shadow-subtle flex flex-col space-y-3">
              <div className="border-b border-[#F2F2F7] pb-3">
                <h4 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
                  Impulsiveness (Kurtosis) vs. Ratio &beta; = B / f_fault
                </h4>
                <p className="text-[11px] text-[#6E6E73] mt-0.5">
                  Impulses smear together when &beta; &lt; 3.0; full physical kurtosis is preserved once &beta; &ge; 8.0.
                </p>
              </div>

              <div className="flex-1 w-full min-h-[290px]">
                <Plot
                  data={[
                    // IIR Kurtosis
                    {
                      x: betas,
                      y: kurtIIR,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'IIR Butterworth SOS',
                      line: { color: '#0071E3', width: 2 },
                      marker: { size: 6, color: '#0071E3' },
                    },
                    // FIR Kurtosis
                    {
                      x: betas,
                      y: kurtFIR,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'FIR Windowed',
                      line: { color: '#8E8E93', width: 1.5, dash: 'dot' },
                      marker: { size: 5, color: '#8E8E93' },
                    },
                    // Severe smearing threshold line (beta = 3.0)
                    {
                      x: [3.0, 3.0],
                      y: [0, Math.max(...kurtIIR, ...kurtFIR) * 1.15],
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Severe Smearing Cutoff (β=3.0)',
                      line: { color: '#FF3B30', dash: 'dash', width: 1.5 },
                    },
                    // Clean boundary line (beta = 8.0)
                    {
                      x: [8.0, 8.0],
                      y: [0, Math.max(...kurtIIR, ...kurtFIR) * 1.15],
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Clean Isolation Boundary (β=8.0)',
                      line: { color: '#34C759', dash: 'dash', width: 1.5 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 45, r: 20, t: 15, b: 45 },
                    xaxis: {
                      title: { text: 'Ratio β = B / f_fault', font: { size: 11, color: '#6E6E73' } },
                      gridcolor: '#F2F2F7',
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    },
                    yaxis: {
                      title: { text: 'Kurtosis (Impulsiveness)', font: { size: 11, color: '#6E6E73' } },
                      gridcolor: '#F2F2F7',
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    },
                    legend: {
                      orientation: 'h',
                      x: 0.0,
                      y: 1.15,
                      font: { size: 9 },
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

            {/* Chart 2: Ringing Duration tau vs. Bandwidth B */}
            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-2xl p-6 shadow-subtle flex flex-col space-y-3">
              <div className="border-b border-[#F2F2F7] pb-3">
                <h4 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
                  Filter Ringing Duration &tau; vs. Bandwidth B
                </h4>
                <p className="text-[11px] text-[#6E6E73] mt-0.5">
                  Decay time &tau; &approx; 1/(&pi;B) compared to physical impact interval T_impact = {tImpact.toFixed(1)} ms.
                </p>
              </div>

              <div className="flex-1 w-full min-h-[290px]">
                <Plot
                  data={[
                    // Ringing tau
                    {
                      x: bandwidths,
                      y: tauMs,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Ringing Duration τ = 1/(πB)',
                      line: { color: '#FF9500', width: 2 },
                      marker: { size: 6, color: '#FF9500' },
                    },
                    // Impact spacing horizontal threshold
                    {
                      x: [Math.min(...bandwidths), Math.max(...bandwidths)],
                      y: [tImpact, tImpact],
                      type: 'scatter',
                      mode: 'lines',
                      name: `Impact Spacing T_impact (${tImpact.toFixed(1)} ms)`,
                      line: { color: '#FF3B30', dash: 'dash', width: 1.5 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 45, r: 20, t: 15, b: 45 },
                    xaxis: {
                      title: { text: 'Bandwidth B (Hz)', font: { size: 11, color: '#6E6E73' } },
                      gridcolor: '#F2F2F7',
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    },
                    yaxis: {
                      title: { text: 'Duration (ms)', font: { size: 11, color: '#6E6E73' } },
                      gridcolor: '#F2F2F7',
                      tickfont: { size: 10, color: '#6E6E73', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
                    },
                    legend: {
                      orientation: 'h',
                      x: 0.0,
                      y: 1.15,
                      font: { size: 9 },
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

export default FilterRingingView;
