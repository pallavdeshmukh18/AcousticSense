import React, { useState, useEffect } from 'react';
import { useSignal } from '../../context/SignalContext';
import { BearingParameters } from '../../types/api';
import { Play, Settings2, HelpCircle, AlertCircle, RotateCcw } from 'lucide-react';

export const AnalysisForm: React.FC = () => {
  const { uploadedSignal, runAnalysis, isAnalyzing, analysisError } = useSignal();

  // Core parameters
  const [samplingFrequency, setSamplingFrequency] = useState<string>('');
  const [shaftSpeedRpm, setShaftSpeedRpm] = useState<string>('1800');
  const [blockLength, setBlockLength] = useState<string>('1024');
  const [detectionThreshold, setDetectionThreshold] = useState<string>('3.0');
  const [numCandidateBands, setNumCandidateBands] = useState<string>('4');

  // Bearing parameters
  const [enableBearing, setEnableBearing] = useState<boolean>(true);
  const [rollingElements, setRollingElements] = useState<string>('8');
  const [ballDiameter, setBallDiameter] = useState<string>('7.5');
  const [pitchDiameter, setPitchDiameter] = useState<string>('34.5');
  const [contactAngleDeg, setContactAngleDeg] = useState<string>('0');

  // Client validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync with uploaded signal's sampling frequency
  useEffect(() => {
    if (uploadedSignal?.sampling_frequency) {
      setSamplingFrequency(uploadedSignal.sampling_frequency.toString());
    }
  }, [uploadedSignal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const fs = parseFloat(samplingFrequency);
    if (!fs || fs <= 0) {
      setValidationError('A valid positive sampling frequency (Hz) is required.');
      return;
    }

    let bearingObj: BearingParameters | undefined = undefined;
    if (enableBearing) {
      const n = parseInt(rollingElements, 10);
      const d = parseFloat(ballDiameter);
      const D = parseFloat(pitchDiameter);
      const theta = parseFloat(contactAngleDeg);

      if (!n || n <= 0) {
        setValidationError('Rolling elements count must be an integer >= 1.');
        return;
      }
      if (!d || d <= 0) {
        setValidationError('Ball diameter (d) must be greater than 0 mm.');
        return;
      }
      if (!D || D <= 0) {
        setValidationError('Pitch diameter (D) must be greater than 0 mm.');
        return;
      }
      if (D <= d) {
        setValidationError('Pitch diameter (D) must be strictly greater than rolling element diameter (d).');
        return;
      }
      if (isNaN(theta) || theta < -90 || theta > 90) {
        setValidationError('Contact angle must be between -90° and +90°.');
        return;
      }

      bearingObj = {
        rolling_elements: n,
        ball_diameter: d,
        pitch_diameter: D,
        contact_angle_deg: theta,
      };
    }

    const rpm = shaftSpeedRpm ? parseFloat(shaftSpeedRpm) : undefined;
    const blk = blockLength ? parseInt(blockLength, 10) : 1024;
    const thresh = detectionThreshold ? parseFloat(detectionThreshold) : 3.0;
    const bands = numCandidateBands ? parseInt(numCandidateBands, 10) : 4;

    await runAnalysis({
      sampling_frequency: fs,
      shaft_speed_rpm: rpm && rpm > 0 ? rpm : undefined,
      block_length: blk && blk >= 16 ? blk : 1024,
      detection_threshold: thresh && thresh > 0 ? thresh : 3.0,
      num_candidate_bands: bands && bands >= 2 ? bands : 4,
      bearing: bearingObj,
    });
  };

  const handleResetDefaults = () => {
    if (uploadedSignal?.sampling_frequency) {
      setSamplingFrequency(uploadedSignal.sampling_frequency.toString());
    } else {
      setSamplingFrequency('');
    }
    setShaftSpeedRpm('1800');
    setBlockLength('1024');
    setDetectionThreshold('3.0');
    setNumCandidateBands('4');
    setEnableBearing(true);
    setRollingElements('8');
    setBallDiameter('7.5');
    setPitchDiameter('34.5');
    setContactAngleDeg('0');
    setValidationError(null);
  };

  const hasSignal = Boolean(uploadedSignal);

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-industrial-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-industrial-100 flex items-center justify-center text-industrial-700">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-industrial-800">Analysis Configuration</h2>
            <p className="text-xs text-industrial-500">
              Configure DSP filter bounds, theoretical kinematics, and detection thresholds.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1 text-xs text-industrial-500 hover:text-industrial-700 font-medium px-2 py-1 rounded transition-colors"
          title="Reset form to default parameters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-industrial-700 mb-1 flex items-center justify-between">
            <span>Sampling Frequency (Fs) *</span>
            <span className="text-[10px] text-industrial-400 font-mono">Hz</span>
          </label>
          <input
            type="number"
            value={samplingFrequency}
            onChange={(e) => setSamplingFrequency(e.target.value)}
            placeholder="e.g. 48000"
            required
            min="1"
            step="any"
            className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
          />
          <span className="text-[10px] text-industrial-400 mt-1 block">
            Overrides or supplies signal sample rate.
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-industrial-700 mb-1 flex items-center justify-between">
            <span>Shaft Speed (RPM)</span>
            <span className="text-[10px] text-industrial-400 font-mono">RPM</span>
          </label>
          <input
            type="number"
            value={shaftSpeedRpm}
            onChange={(e) => setShaftSpeedRpm(e.target.value)}
            placeholder="e.g. 1800"
            min="1"
            step="any"
            className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
          />
          <span className="text-[10px] text-industrial-400 mt-1 block">
            Used to compute rotational frequency fr = RPM / 60.
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-industrial-700 mb-1 flex items-center justify-between">
            <span>Detection Threshold (Rf)</span>
            <span className="text-[10px] text-industrial-400 font-mono">ratio</span>
          </label>
          <input
            type="number"
            value={detectionThreshold}
            onChange={(e) => setDetectionThreshold(e.target.value)}
            placeholder="3.0"
            min="0.1"
            step="any"
            className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
          />
          <span className="text-[10px] text-industrial-400 mt-1 block">
            Peak-to-noise ratio cutoff (default: 3.0).
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-industrial-700 mb-1 flex items-center justify-between">
            <span>Processing Block Length</span>
            <span className="text-[10px] text-industrial-400 font-mono">samples</span>
          </label>
          <input
            type="number"
            value={blockLength}
            onChange={(e) => setBlockLength(e.target.value)}
            placeholder="1024"
            min="16"
            step="16"
            className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
          />
          <span className="text-[10px] text-industrial-400 mt-1 block">
            Default block size for segmenting (min: 16).
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-industrial-700 mb-1 flex items-center justify-between">
            <span>Candidate Filter Bands</span>
            <span className="text-[10px] text-industrial-400 font-mono">bands</span>
          </label>
          <input
            type="number"
            value={numCandidateBands}
            onChange={(e) => setNumCandidateBands(e.target.value)}
            placeholder="4"
            min="2"
            max="16"
            className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
          />
          <span className="text-[10px] text-industrial-400 mt-1 block">
            Sub-band divisions for excess kurtosis screening.
          </span>
        </div>
      </div>

      {/* Bearing Geometry Section */}
      <div className="border border-industrial-200 rounded-lg p-4 mb-5 bg-industrial-50/50">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableBearing}
              onChange={(e) => setEnableBearing(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 border-industrial-300"
            />
            <span className="text-xs font-semibold text-industrial-800">
              Evaluate Theoretical Bearing Kinematics
            </span>
          </label>
          <span className="text-[11px] text-industrial-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            BPFO, BPFI, BSF, FTF
          </span>
        </div>

        {enableBearing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-industrial-200/60">
            <div>
              <label className="block text-[11px] font-medium text-industrial-600 mb-1">
                Rolling Elements (n)
              </label>
              <input
                type="number"
                value={rollingElements}
                onChange={(e) => setRollingElements(e.target.value)}
                placeholder="8"
                min="1"
                className="w-full text-xs px-2.5 py-1.5 border border-industrial-300 rounded bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-industrial-600 mb-1">
                Ball Diameter (d) [mm]
              </label>
              <input
                type="number"
                value={ballDiameter}
                onChange={(e) => setBallDiameter(e.target.value)}
                placeholder="7.5"
                min="0.001"
                step="any"
                className="w-full text-xs px-2.5 py-1.5 border border-industrial-300 rounded bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-industrial-600 mb-1">
                Pitch Diameter (D) [mm]
              </label>
              <input
                type="number"
                value={pitchDiameter}
                onChange={(e) => setPitchDiameter(e.target.value)}
                placeholder="34.5"
                min="0.001"
                step="any"
                className="w-full text-xs px-2.5 py-1.5 border border-industrial-300 rounded bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-industrial-600 mb-1">
                Contact Angle (θ) [deg]
              </label>
              <input
                type="number"
                value={contactAngleDeg}
                onChange={(e) => setContactAngleDeg(e.target.value)}
                placeholder="0"
                min="-90"
                max="90"
                step="any"
                className="w-full text-xs px-2.5 py-1.5 border border-industrial-300 rounded bg-white font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Validation or API Errors */}
      {(validationError || analysisError) && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>{validationError || analysisError}</div>
        </div>
      )}

      {/* Run Action */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-industrial-400">
          {!hasSignal ? 'Upload a signal file first to run analysis.' : 'Ready to execute 8-stage DSP.'}
        </span>

        <button
          type="submit"
          disabled={!hasSignal || isAnalyzing}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
        >
          <Play className={`w-4 h-4 fill-white ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Processing DSP Pipeline...' : 'Run DSP Analysis'}</span>
        </button>
      </div>
    </form>
  );
};
