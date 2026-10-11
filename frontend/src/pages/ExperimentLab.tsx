import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignal } from '../context/SignalContext';
import { BlockLengthForm } from '../components/experiments/BlockLengthForm';
import { ExperimentResults } from '../components/experiments/ExperimentResults';
import { FlaskConical, FileAudio, ArrowRight, Activity, Sparkles } from 'lucide-react';

export const ExperimentLab: React.FC = () => {
  const navigate = useNavigate();
  const { uploadedSignal, experimentResult, isExperimenting } = useSignal();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-industrial-900 tracking-tight">
              Experiment Lab — Block-Length Sensitivity
            </h2>
          </div>
          <p className="text-xs text-industrial-500 mt-1">
            Evaluate kurtosis moment variability and execution latency across different segmentation block lengths.
          </p>
        </div>

        {uploadedSignal && (
          <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-industrial-200 text-industrial-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[200px]" title={uploadedSignal.filename}>
              {uploadedSignal.filename}
            </span>
          </div>
        )}
      </div>

      {/* Upload Required Banner if no active signal */}
      {!uploadedSignal && (
        <div className="p-6 bg-white border border-industrial-200 rounded-xl shadow-xs text-center">
          <div className="w-11 h-11 rounded-full bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto mb-3">
            <FileAudio className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-industrial-800">
            Signal Required for Experiments
          </h3>
          <p className="text-xs text-industrial-500 mt-1 max-w-md mx-auto">
            Block-length evaluation tests how non-overlapping window sizes alter kurtosis estimates on an uploaded signal.
            Please upload a signal first in the Signal Analysis workspace.
          </p>
          <button
            onClick={() => navigate('/analysis')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <span>Go to Upload & Signal Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Configuration Form */}
      {uploadedSignal && <BlockLengthForm />}

      {/* Loading Banner */}
      {isExperimenting && (
        <div className="bg-white border border-primary-200 rounded-xl p-8 text-center shadow-xs animate-pulse">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-5 h-5 animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-industrial-800">
            Running Block-Length Segmentation Batch...
          </h3>
          <p className="text-xs text-industrial-500 mt-1 max-w-md mx-auto">
            Computing mean kurtosis, max kurtosis, variability, and measuring execution time across requested block lengths.
          </p>
        </div>
      )}

      {/* Results Section */}
      {experimentResult && !isExperimenting && (
        <ExperimentResults experiment={experimentResult} />
      )}

      {/* Empty State when signal exists but no experiment run yet */}
      {uploadedSignal && !experimentResult && !isExperimenting && (
        <div className="bg-white border border-industrial-200 rounded-xl p-8 text-center shadow-xs">
          <div className="w-10 h-10 rounded-full bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-industrial-700">
            No Experiment Results Yet
          </h3>
          <p className="text-xs text-industrial-400 mt-1 max-w-md mx-auto">
            Select candidate block sizes above and click &quot;Run Experiment Batch&quot; to inspect statistical moments and timing.
          </p>
        </div>
      )}
    </div>
  );
};
