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
  analysis_id?: string;
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

export interface BenchmarkFileResult {
  name: string;
  fault_type: string;
  expected_defect: string | null;
  sampling_rate: number;
  rpm: number;
  ground_truth_faulty: boolean;
  detected_status: string;
  score_rf: number;
  highest_fault: string;
  highest_ratio: number;
  exec_time_ms: number;
}

export interface ThresholdMetric {
  threshold: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  pd: number;
  pfa: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

export interface BenchmarkResponse {
  full_file_results: BenchmarkFileResult[];
  threshold_metrics: ThresholdMetric[];
  total_slices: number;
  total_positive: number;
  total_negative: number;
}

export interface FormatPrecisionResult {
  format_name: string;
  bit_width: number;
  category: string;
  kurtosis: number;
  bias_percent: number;
  overflow_flag: boolean;
  status: string;
  description: string;
}

export interface LpcStabilityStep {
  order_p: number;
  float64: {
    stable: boolean;
    max_reflection_coeff: number;
  };
  q15: {
    stable: boolean;
    max_reflection_coeff: number;
    failed: boolean;
  };
}

export interface PrecisionExperimentRequest {
  signal_id: string;
  block_length?: number;
  lpc_orders?: number[];
}

export interface PrecisionExperimentResponse {
  signal_id: string;
  filename: string;
  sampling_frequency: number;
  total_samples: number;
  block_length: number;
  reference_kurtosis: number;
  formats: FormatPrecisionResult[];
  lpc_stability_sweep: LpcStabilityStep[];
  q15_instability_order: number | null;
  hypothesis_h2_status: string;
  scientific_conclusion: string;
}

export interface BandwidthResult {
  bandwidth_hz: number;
  low_hz: number;
  high_hz: number;
  beta_ratio: number;
  ringing_duration_ms: number;
  smear_ratio: number;
  kurtosis_iir: number;
  kurtosis_fir: number;
  retention_percent: number;
  smearing_regime: string;
  regime_description: string;
}

export interface RingingExperimentRequest {
  signal_id: string;
  fault_frequency?: number;
  center_frequency?: number;
  bandwidths?: number[];
  filter_order?: number;
}

export interface RingingExperimentResponse {
  signal_id: string;
  filename: string;
  sampling_frequency: number;
  fault_frequency_hz: number;
  center_frequency_hz: number;
  impact_interval_ms: number;
  filter_order: number;
  min_recommended_bandwidth_hz: number;
  bandwidth_results: BandwidthResult[];
  hypothesis_h3_status: string;
  scientific_conclusion: string;
}

// ---------------------------------------------------------------------------
// AI Interpretation Types (Groq LLM Explanation)
// ---------------------------------------------------------------------------

export interface PipelineStageExplanation {
  stage: string;
  what_happened: string;
  why_it_matters: string;
  observed_result: string;
}

export interface FindingItem {
  title: string;
  measurement?: string | null;
  explanation: string;
  significance: string;
  limitations?: string | null;
}

export interface BearingIndicatorItem {
  name: string;
  reference_frequency_hz?: number | null;
  observed_peak_frequency_hz?: number | null;
  indicator_rf?: number | null;
  interpretation: string;
}

export interface BearingInterpretation {
  available: boolean;
  summary: string;
  indicators: BearingIndicatorItem[];
}

export interface NextStepItem {
  priority: 'High' | 'Medium' | 'Low' | string;
  action: string;
  reason: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface InterpretationResponse {
  analysis_id: string;
  signal_id: string;
  title: string;
  executive_summary: string;
  signal_overview: string;
  pipeline_explanation: PipelineStageExplanation[];
  key_findings: FindingItem[];
  bearing_interpretation: BearingInterpretation;
  plain_language_explanation: string;
  limitations: string[];
  recommended_next_steps: NextStepItem[];
  glossary: GlossaryItem[];
  model_used: string;
  generated_at: string;
}

export interface InterpretRequest {
  signal_id: string;
  analysis_id?: string;
}


