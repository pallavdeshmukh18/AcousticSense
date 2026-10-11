import React, { useState } from 'react';
import { useSignal } from '../../context/SignalContext';
import { Play, FlaskConical, AlertCircle, Plus, X } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="bg-white border border-industrial-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-industrial-100 flex items-center justify-center text-industrial-700">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-industrial-800">
            Block-Length Sensitivity Configuration
          </h2>
          <p className="text-xs text-industrial-500">
            Evaluate estimator stability and execution latency across varying segmentation block sizes.
          </p>
        </div>
      </div>

      {/* Preset Blocks Toggle */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-industrial-700 mb-2">
          Select Candidate Block Lengths (samples)
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_LENGTHS.map((len) => {
            const isSelected = selectedLengths.includes(len);
            const isTooLarge = totalSamples > 0 && len > totalSamples;
            return (
              <button
                key={len}
                type="button"
                onClick={() => toggleLength(len)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium border transition-colors ${
                  isSelected
                    ? 'bg-primary-50 text-primary-700 border-primary-300 shadow-xs'
                    : 'bg-white text-industrial-600 border-industrial-200 hover:bg-industrial-50'
                } ${isTooLarge ? 'opacity-60' : ''}`}
                title={isTooLarge ? `Exceeds total signal length (${totalSamples} samples)` : undefined}
              >
                {len} samples
                {isTooLarge && ' (oversized)'}
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add custom (e.g. 8192)"
            min="16"
            className="text-xs px-3 py-1.5 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono w-48"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-industrial-100 hover:bg-industrial-200 text-industrial-700 rounded-md text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Selected List Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-industrial-100">
          <span className="text-[11px] text-industrial-400 font-mono">Active Configurations:</span>
          {selectedLengths.map((len) => (
            <span
              key={len}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-industrial-100 text-industrial-800 rounded font-mono text-[11px] border border-industrial-200"
            >
              <span>{len}</span>
              {selectedLengths.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(len)}
                  className="text-industrial-400 hover:text-industrial-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Optional Sampling Frequency Override */}
      <div className="mb-5 max-w-xs">
        <label className="block text-xs font-medium text-industrial-700 mb-1">
          Sampling Frequency (Hz)
        </label>
        <input
          type="number"
          value={samplingFrequency}
          onChange={(e) => setSamplingFrequency(e.target.value)}
          placeholder="e.g. 48000"
          className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
        />
        <p className="text-[10px] text-industrial-400 mt-1">
          {uploadedSignal?.sampling_frequency
            ? `Default from active signal: ${uploadedSignal.sampling_frequency} Hz`
            : 'Required if active signal lacks sampling rate.'}
        </p>
      </div>

      {/* Error Banner */}
      {experimentError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>{experimentError}</div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-industrial-400 font-mono">
          {uploadedSignal
            ? `Signal: ${uploadedSignal.filename} (${uploadedSignal.sample_count.toLocaleString()} samples)`
            : 'Upload a signal first.'}
        </span>

        <button
          type="submit"
          disabled={!uploadedSignal || isExperimenting || selectedLengths.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
        >
          <Play className={`w-4 h-4 fill-white ${isExperimenting ? 'animate-spin' : ''}`} />
          <span>{isExperimenting ? 'Running Block Experiments...' : 'Run Experiment Batch'}</span>
        </button>
      </div>
    </form>
  );
};
