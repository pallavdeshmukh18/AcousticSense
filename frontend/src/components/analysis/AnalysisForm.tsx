import React, { useState, useEffect } from 'react';
import { useSignal } from '../../context/SignalContext';
import { BearingParameters } from '../../types/api';
import { Play, AlertCircle, RotateCcw, Activity } from 'lucide-react';

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
        setValidationError('Rolling elements count must be an integer ≥ 1.');
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
    <form
      onSubmit={handleSubmit}
      className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
            Analysis settings
          </h2>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Adjust signal parameters and detection settings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors"
          title="Reset form fields to defaults"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* GROUP 1 — SIGNAL PARAMETERS */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider font-mono">
          Signal Parameters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
              Sampling Frequency (Fs) <span className="text-[#FF3B30]">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={samplingFrequency}
                onChange={(e) => setSamplingFrequency(e.target.value)}
                placeholder="e.g. 48000"
                required
                min="1"
                step="any"
                className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                Hz
              </span>
            </div>
            <span className="text-[11px] text-[#86868B] mt-1 block">
              Required for Nyquist frequency limits and spectrum binning.
            </span>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
              Shaft Speed
            </label>
            <div className="relative">
              <input
                type="number"
                value={shaftSpeedRpm}
                onChange={(e) => setShaftSpeedRpm(e.target.value)}
                placeholder="1800"
                min="1"
                step="any"
                className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                RPM
              </span>
            </div>
            <span className="text-[11px] text-[#86868B] mt-1 block">
              Fundamental rotational frequency: fr = RPM / 60.
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#F2F2F7]" />

      {/* ========================================================= */}
      {/* GROUP 2 — DETECTION PARAMETERS */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider font-mono">
          Detection Parameters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
              Detection Threshold (Rf)
            </label>
            <div className="relative">
              <input
                type="number"
                value={detectionThreshold}
                onChange={(e) => setDetectionThreshold(e.target.value)}
                placeholder="3.0"
                min="0.1"
                step="any"
                className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                ratio
              </span>
            </div>
            <span className="text-[11px] text-[#86868B] mt-1 block">
              Peak-to-median noise ratio cutoff (nominal: 3.00).
            </span>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
              Block Length
            </label>
            <div className="relative">
              <input
                type="number"
                value={blockLength}
                onChange={(e) => setBlockLength(e.target.value)}
                placeholder="1024"
                min="16"
                step="16"
                className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                pts
              </span>
            </div>
            <span className="text-[11px] text-[#86868B] mt-1 block">
              Window segment size for moment calculations.
            </span>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
              Candidate Filter Bands
            </label>
            <div className="relative">
              <input
                type="number"
                value={numCandidateBands}
                onChange={(e) => setNumCandidateBands(e.target.value)}
                placeholder="4"
                min="2"
                max="16"
                className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                bands
              </span>
            </div>
            <span className="text-[11px] text-[#86868B] mt-1 block">
              Discrete sub-bands screened for peak kurtosis.
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#F2F2F7]" />

      {/* ========================================================= */}
      {/* GROUP 3 — BEARING GEOMETRY & KINEMATICS */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableBearing}
              onChange={(e) => setEnableBearing(e.target.checked)}
              className="rounded text-[#0071E3] focus:ring-[#0071E3] h-4 w-4 border-[#E5E5EA]"
            />
            <span className="text-[13px] font-medium text-[#1D1D1F]">
              Evaluate bearing kinematics
            </span>
          </label>

          <span className="text-[11px] font-mono text-[#86868B]">
            BPFO &bull; BPFI &bull; BSF &bull; FTF
          </span>
        </div>

        {enableBearing ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
                Rolling Elements (n)
              </label>
              <input
                type="number"
                value={rollingElements}
                onChange={(e) => setRollingElements(e.target.value)}
                placeholder="8"
                min="1"
                className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
                Ball Diameter (d)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={ballDiameter}
                  onChange={(e) => setBallDiameter(e.target.value)}
                  placeholder="7.5"
                  min="0.001"
                  step="any"
                  className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                  mm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
                Pitch Diameter (D)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={pitchDiameter}
                  onChange={(e) => setPitchDiameter(e.target.value)}
                  placeholder="34.5"
                  min="0.001"
                  step="any"
                  className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                  mm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
                Contact Angle (θ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={contactAngleDeg}
                  onChange={(e) => setContactAngleDeg(e.target.value)}
                  placeholder="0"
                  min="-90"
                  max="90"
                  step="any"
                  className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                  °
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl text-[12px] text-[#86868B]">
            Bearing kinematics disabled. Analysis will evaluate statistical moments and envelope spectrum without harmonic frequency matching.
          </div>
        )}
      </div>

      {/* Validation or API Errors */}
      {(validationError || analysisError) && (
        <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex items-start gap-2.5 text-[12px] text-[#D70015]">
          <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
          <div className="font-sans">{validationError || analysisError}</div>
        </div>
      )}

      {/* Primary Action Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <span className="text-[12px] text-[#86868B]">
          {!hasSignal ? 'Upload a signal to continue.' : 'Ready to analyze.'}
        </span>

        <button
          type="submit"
          disabled={!hasSignal || isAnalyzing}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-[13px] font-medium rounded-full text-white bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              <span>Analysing signal…</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run DSP Analysis</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AnalysisForm;
