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
  AlertTriangle,
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
      <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-industrial-800 flex items-center gap-2">
              <Waves className="w-4 h-4 text-primary-600" />
              <span>Resonance-Band Filter Ringing & Impulsiveness Loss (Hypothesis H3)</span>
            </h3>
            <p className="text-xs text-industrial-500 mt-0.5">
              Quantifies how narrow-band filter decay time &tau; &approx; 1/(&pi;B) smears adjacent defect impacts when &beta; = B / f_fault &lt; 3.0.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-industrial-600 font-medium">Fault Freq (Hz):</span>
              <input
                type="number"
                value={faultFreq}
                step="any"
                min={1}
                max={2000}
                onChange={(e) => setFaultFreq(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 border border-industrial-300 rounded bg-white text-xs font-mono font-medium"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-industrial-600 font-medium">Center Freq (Hz):</span>
              <input
                type="number"
                value={centerFreq}
                step="50"
                min={200}
                max={20000}
                onChange={(e) => setCenterFreq(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 border border-industrial-300 rounded bg-white text-xs font-mono font-medium"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-industrial-600 font-medium">Order:</span>
              <select
                value={filterOrder}
                onChange={(e) => setFilterOrder(Number(e.target.value))}
                className="px-2 py-1.5 border border-industrial-300 rounded bg-white text-xs font-mono font-medium"
              >
                <option value={2}>2nd Order (12 dB/oct)</option>
                <option value={4}>4th Order (24 dB/oct)</option>
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
                  <span>Sweeping Bandwidths...</span>
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
                  Hypothesis H3 Status: {result.hypothesis_h3_status}
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

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-industrial-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-industrial-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Impact Spacing</span>
                <Timer className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <div className="text-lg font-bold font-mono text-industrial-900">
                {result.impact_interval_ms.toFixed(2)} <span className="text-xs font-normal text-industrial-500">ms</span>
              </div>
              <div className="text-[10px] text-industrial-400 mt-0.5">
                T_impact = 1 / {result.fault_frequency_hz.toFixed(1)} Hz
              </div>
            </div>

            <div className="bg-white border border-industrial-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-industrial-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Min Recommended BW</span>
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700">
                &ge; {result.min_recommended_bandwidth_hz.toFixed(0)} <span className="text-xs font-normal text-industrial-500">Hz</span>
              </div>
              <div className="text-[10px] text-industrial-400 mt-0.5">
                Condition: &beta; = B / f_fault &ge; 8.0
              </div>
            </div>

            <div className="bg-white border border-industrial-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-industrial-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Max Ringing Decay</span>
                <Activity className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-lg font-bold font-mono text-rose-600">
                {result.bandwidth_results[0]?.ringing_duration_ms.toFixed(2)} <span className="text-xs font-normal text-industrial-500">ms</span>
              </div>
              <div className="text-[10px] text-industrial-400 mt-0.5">
                At B = {result.bandwidth_results[0]?.bandwidth_hz} Hz (&tau; = 1 / &pi;B)
              </div>
            </div>

            <div className="bg-white border border-industrial-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-industrial-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Demodulation Band</span>
                <Waves className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-lg font-bold font-mono text-industrial-900">
                {result.center_frequency_hz.toFixed(0)} <span className="text-xs font-normal text-industrial-500">Hz</span>
              </div>
              <div className="text-[10px] text-industrial-400 mt-0.5">
                Center Freq (Order {result.filter_order})
              </div>
            </div>
          </div>

          {/* Bandwidth Sweep Table */}
          <div className="bg-white border border-industrial-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-industrial-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-industrial-700" />
                <h4 className="text-xs font-semibold text-industrial-800 uppercase tracking-wider">
                  Bandwidth Sweep & Ringing Duration Breakdown
                </h4>
              </div>
              <span className="text-xs text-industrial-500 font-mono">
                f_fault: {result.fault_frequency_hz} Hz | T_impact: {result.impact_interval_ms} ms
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-industrial-100 text-industrial-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Bandwidth B (Hz)</th>
                    <th className="px-4 py-3 text-right">Passband [Low - High]</th>
                    <th className="px-4 py-3 text-right">&beta; Ratio (B / f_fault)</th>
                    <th className="px-4 py-3 text-right">Ringing &tau; (ms)</th>
                    <th className="px-4 py-3 text-right">Kurtosis (IIR)</th>
                    <th className="px-4 py-3 text-right">Kurtosis (FIR)</th>
                    <th className="px-4 py-3 text-right">Retention</th>
                    <th className="px-5 py-3">Smearing Regime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-100 text-industrial-700">
                  {result.bandwidth_results.map((row) => (
                    <tr key={row.bandwidth_hz} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-industrial-900 font-mono">
                        {row.bandwidth_hz.toFixed(0)} Hz
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-industrial-500 text-[11px]">
                        [{row.low_hz.toFixed(0)} - {row.high_hz.toFixed(0)} Hz]
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        <span
                          className={
                            row.beta_ratio < 3.0
                              ? 'text-rose-700'
                              : row.beta_ratio < 8.0
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }
                        >
                          {row.beta_ratio.toFixed(2)}&times;
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-industrial-700">
                        {row.ringing_duration_ms.toFixed(2)} ms
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-industrial-900">
                        {row.kurtosis_iir.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-industrial-600">
                        {row.kurtosis_fir.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-primary-700">
                        {row.retention_percent.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            row.smearing_regime === 'Severe Smearing'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : row.smearing_regime === 'Transitional'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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
            <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="border-b border-industrial-100 pb-3 mb-2">
                <h4 className="text-sm font-semibold text-industrial-800">
                  Impulsiveness (Kurtosis) vs. Ratio &beta; = B / f_fault
                </h4>
                <p className="text-[11px] text-industrial-500">
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
                      line: { color: '#0284c7', width: 2.5 },
                      marker: { size: 7 },
                    },
                    // FIR Kurtosis
                    {
                      x: betas,
                      y: kurtFIR,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'FIR Windowed',
                      line: { color: '#8b5cf6', width: 2, dash: 'dot' },
                      marker: { size: 6 },
                    },
                    // Severe smearing threshold line (beta = 3.0)
                    {
                      x: [3.0, 3.0],
                      y: [0, Math.max(...kurtIIR, ...kurtFIR) * 1.15],
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Severe Smearing Cutoff (β=3.0)',
                      line: { color: '#ef4444', dash: 'dash', width: 1.5 },
                    },
                    // Clean boundary line (beta = 8.0)
                    {
                      x: [8.0, 8.0],
                      y: [0, Math.max(...kurtIIR, ...kurtFIR) * 1.15],
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Clean Isolation Boundary (β=8.0)',
                      line: { color: '#10b981', dash: 'dash', width: 1.5 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 45, r: 20, t: 15, b: 45 },
                    xaxis: {
                      title: { text: 'Ratio β = B / f_fault', font: { size: 11 } },
                      gridcolor: '#f1f5f9',
                    },
                    yaxis: {
                      title: { text: 'Kurtosis (Impulsiveness)', font: { size: 11 } },
                      gridcolor: '#f1f5f9',
                    },
                    legend: {
                      orientation: 'h',
                      x: 0.0,
                      y: 1.15,
                      font: { size: 9 },
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

            {/* Chart 2: Ringing Duration tau vs. Bandwidth B */}
            <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs flex flex-col">
              <div className="border-b border-industrial-100 pb-3 mb-2">
                <h4 className="text-sm font-semibold text-industrial-800">
                  Filter Ringing Duration &tau; vs. Bandwidth B
                </h4>
                <p className="text-[11px] text-industrial-500">
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
                      line: { color: '#f59e0b', width: 2.5 },
                      marker: { size: 7 },
                    },
                    // Impact spacing horizontal threshold
                    {
                      x: [Math.min(...bandwidths), Math.max(...bandwidths)],
                      y: [tImpact, tImpact],
                      type: 'scatter',
                      mode: 'lines',
                      name: `Impact Spacing T_impact (${tImpact.toFixed(1)} ms)`,
                      line: { color: '#dc2626', dash: 'dash', width: 1.5 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 45, r: 20, t: 15, b: 45 },
                    xaxis: {
                      title: { text: 'Bandwidth B (Hz)', font: { size: 11 } },
                      gridcolor: '#f1f5f9',
                    },
                    yaxis: {
                      title: { text: 'Duration (ms)', font: { size: 11 } },
                      gridcolor: '#f1f5f9',
                    },
                    legend: {
                      orientation: 'h',
                      x: 0.0,
                      y: 1.15,
                      font: { size: 9 },
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

export default FilterRingingView;
