/**
 * TypeScript API definitions for AcousticSense DSP Backend.
 * Faithfully mirrors backend/app/main.py schemas.
 */

export interface HealthResponse {
  status: string;
  service: string;
}

export interface SignalStatistics {
  mean: number;
  standard_deviation: number;
  rms: number;
  min: number;
  max: number;
  peak: number;
}

export interface UploadResponse {
  signal_id: string;
  filename: string;
  sampling_frequency: number | null;
  sample_count: number;
  duration_seconds: number | null;
  statistics: SignalStatistics;
}

export interface BearingParameters {
  rolling_elements: number;
  ball_diameter: number;
  pitch_diameter: number;
  contact_angle_deg: number;
}

export interface AnalysisRequest {
  signal_id: string;
  sampling_frequency?: number;
  shaft_speed_rpm?: number;
  block_length?: number;
  bearing?: BearingParameters;
  detection_threshold?: number;
  num_candidate_bands?: number;
}

export interface DominantPeak {
  frequency_hz: number;
  magnitude: number;
}

export interface CandidateBand {
  low_hz: number;
  high_hz: number;
  kurtosis: number;
}

export interface FaultIndicator {
  fault_type: string; // e.g. "BPFO", "BPFI", "BSF", "FTF"
  theoretical_hz: number;
  detected_hz: number;
  magnitude: number;
  noise_floor: number;
  indicator_rf: number;
}

export type DetectionStatus = 'POTENTIAL_FAULT' | 'NO_FAULT_INDICATED' | 'INCONCLUSIVE';

export interface DetectionResult {
  status: DetectionStatus;
  score: number | null;
  threshold: number | null;
  supporting_peaks: FaultIndicator[];
  reason: string;
}

export interface PreprocessingStats {
  sample_count: number;
  duration_seconds: number;
  mean: number;
  standard_deviation: number;
  rms: number;
  min: number;
  max: number;
  peak: number;
  crest_factor: number;
  kurtosis: number;
}

export interface FrequencyAnalysis {
  frequency_resolution: number;
  dominant_peaks: DominantPeak[];
  spectrum: {
    frequencies: number[];
    magnitudes: number[];
  };
}

export interface SpectralKurtosis {
  selected_band: CandidateBand;
  candidate_bands: CandidateBand[];
  method_note: string;
}

export interface BandpassFiltering {
  filter_type: string;
  order: number;
  mode: string;
  passband_hz: [number, number];
}

export interface EnvelopeStats {
  mean: number;
  standard_deviation: number;
  rms: number;
  peak: number;
  kurtosis: number;
}

export interface EnvelopeAnalysis {
  envelope_statistics: EnvelopeStats;
  dominant_peaks: DominantPeak[];
  fault_frequencies: Record<string, number>;
  fault_indicators: FaultIndicator[];
  envelope_spectrum: {
    frequencies: number[];
    magnitudes: number[];
  };
  envelope_samples: number[];
}

export interface AnalysisResponse {
  signal: {
    signal_id: string;
    sampling_frequency: number;
    sample_count: number;
    duration_seconds: number;
  };
  preprocessing: PreprocessingStats;
  frequency_analysis: FrequencyAnalysis;
  spectral_kurtosis: SpectralKurtosis;
  bandpass_filtering: BandpassFiltering;
  envelope_analysis: EnvelopeAnalysis;
  detection: DetectionResult;
  performance: {
    processing_time_ms: number;
  };
}

export interface BlockLengthResult {
  block_length: number;
  valid: boolean;
  num_complete_blocks?: number;
  discarded_samples?: number;
  mean_kurtosis?: number;
  max_kurtosis?: number;
  kurtosis_variability?: number;
  processing_time_ms?: number;
  reason?: string;
}

export interface BlockLengthExperimentRequest {
  signal_id: string;
  block_lengths: number[];
  sampling_frequency?: number;
}

export interface BlockLengthExperimentResponse {
  signal_id: string;
  sampling_frequency: number;
  total_samples: number;
  experiment_results: BlockLengthResult[];
  notes: {
    policy: string;
    hardware_disclaimer: string;
  };
}
