import React, { useState } from 'react';
import { useSignal } from '../../context/SignalContext';
import { Play, AlertCircle, Plus, X, Sliders } from 'lucide-react';

const PRESET_LENGTHS = [256, 512, 1024, 2048, 4096];

export const BlockLengthForm: React.FC = () => {
  const { uploadedSignal, runExperiment, isExperimenting, experimentError } = useSignal();
  const [selectedLengths, setSelectedLengths] = useState<number[]>([256, 512, 1024, 2048]);
  const [customInput, setCustomInput] = useState<string>('');
  const [samplingFrequency, setSamplingFrequency] = useState<string>(
    uploadedSignal?.sampling_frequency ? uploadedSignal.sampling_frequency.toString() : ''
  );

  const toggleLength = (len: number) => {
    if (selectedLengths.includes(len)) {
      if (selectedLengths.length > 1) {
        setSelectedLengths(selectedLengths.filter((l) => l !== len));
      }
    } else {
      setSelectedLengths([...selectedLengths, len].sort((a, b) => a - b));
    }
  };

  const handleAddCustom = () => {
    const parsed = parseInt(customInput.trim(), 10);
    if (parsed && parsed >= 16 && !selectedLengths.includes(parsed)) {
      setSelectedLengths([...selectedLengths, parsed].sort((a, b) => a - b));
      setCustomInput('');
    }
  };

  const handleRemove = (len: number) => {
    if (selectedLengths.length > 1) {
      setSelectedLengths(selectedLengths.filter((l) => l !== len));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedSignal || selectedLengths.length === 0) return;

    const fs = samplingFrequency ? parseFloat(samplingFrequency) : undefined;
    await runExperiment(selectedLengths, fs);
  };

  const totalSamples = uploadedSignal?.sample_count ?? 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#0071E3] uppercase tracking-wider font-semibold">
              Hypothesis H1 &bull; Windowing Limits
            </span>
          </div>
          <h3 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
            Block-length sensitivity
          </h3>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Evaluate how segmentation size influences kurtosis estimates and execution time.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F7] rounded-full text-[12px] font-mono text-[#6E6E73]">
          <Sliders className="w-3.5 h-3.5 text-[#86868B]" />
          <span>H1 Parameter Sweep</span>
        </div>
      </div>

      {/* Preset Candidate Lengths Selector */}
      <div className="space-y-3">
        <label className="block text-[12px] font-medium text-[#1D1D1F]">
          Candidate Segmentation Block Lengths (samples)
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_LENGTHS.map((len) => {
            const isSelected = selectedLengths.includes(len);
            const isTooLarge = totalSamples > 0 && len > totalSamples;
            return (
              <button
                key={len}
                type="button"
                onClick={() => toggleLength(len)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-mono font-medium border transition-all ${
                  isSelected
                    ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-subtle'
                    : 'bg-[#FFFFFF] text-[#1D1D1F] border-[#E5E5EA] hover:bg-[#F5F5F7]'
                } ${isTooLarge ? 'opacity-50' : ''}`}
                title={isTooLarge ? `Exceeds total signal length (${totalSamples} samples)` : undefined}
              >
                {len} pts
                {isTooLarge && ' (oversized)'}
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2 pt-1 max-w-sm">
          <input
            type="number"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Custom length (e.g. 8192)"
            min="16"
            className="text-[13px] px-3 py-1.5 border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums bg-[#FFFFFF] text-[#1D1D1F] flex-1"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] rounded-lg text-[12px] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Active Sweep Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#F2F2F7]">
          <span className="text-[11px] text-[#86868B] font-mono uppercase tracking-wider mr-1">
            Active Batch Sweep:
          </span>
          {selectedLengths.map((len) => (
            <span
              key={len}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FBFBFD] text-[#1D1D1F] rounded-md font-mono text-[12px] border border-[#E5E5EA] font-medium tabular-nums"
            >
              <span>{len} pts</span>
              {selectedLengths.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(len)}
                  className="text-[#86868B] hover:text-[#FF3B30] transition-colors"
                  aria-label={`Remove ${len} samples`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-[#F2F2F7]" />

      {/* Optional Sampling Frequency Override */}
      <div className="max-w-xs space-y-1">
        <label className="block text-[12px] font-medium text-[#1D1D1F]">
          Sampling Frequency <span className="text-[#86868B] font-normal">(Optional Override)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={samplingFrequency}
            onChange={(e) => setSamplingFrequency(e.target.value)}
            placeholder="e.g. 48000"
            className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
          />
          <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
            Hz
          </span>
        </div>
        <p className="text-[11px] text-[#86868B] font-mono">
          {uploadedSignal?.sampling_frequency
            ? `Default from active signal: ${uploadedSignal.sampling_frequency.toLocaleString()} Hz`
            : 'Required if active signal lacks sampling rate.'}
        </p>
      </div>

      {/* Error Message */}
      {experimentError && (
        <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex items-start gap-2.5 text-[12px] text-[#D70015]">
          <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
          <div className="font-sans">{experimentError}</div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <span className="text-[12px] text-[#86868B] font-mono truncate max-w-md">
          {uploadedSignal
            ? `Active: ${uploadedSignal.filename} (${uploadedSignal.sample_count.toLocaleString()} samples)`
            : 'Upload a signal first.'}
        </span>

        <button
          type="submit"
          disabled={!uploadedSignal || isExperimenting || selectedLengths.length === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-[13px] font-medium rounded-full text-white bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle transition-colors"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isExperimenting ? 'animate-spin' : ''}`} />
          <span>{isExperimenting ? 'Running Experiments…' : 'Run Experiment Batch'}</span>
        </button>
      </div>
    </form>
  );
};

export default BlockLengthForm;
