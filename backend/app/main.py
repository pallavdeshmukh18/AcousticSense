"""Acoustic Emission Fault Detection in Rotating Machinery Using Digital Signal Processing.

Complete classical DSP backend implemented with FastAPI, NumPy, SciPy, and Pandas.
Follows deterministic signal processing principles without machine learning or external databases.
"""

from __future__ import annotations

import io
import math
import os
import time
import uuid
from typing import Any, Optional

import numpy as np
import pandas as pd
import scipy.signal
import scipy.stats
import logging
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from app.ai_interpreter import (
    InterpretRequest,
    generate_interpretation,
    get_groq_api_key,
)

logger = logging.getLogger("acousticsense.main")

# Auto-load environment variables from .env
get_groq_api_key()

# ---------------------------------------------------------------------------
# Configuration & In-Memory Storage
# ---------------------------------------------------------------------------

MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit
DEFAULT_BLOCK_LENGTH = 1024
MIN_SIGNAL_SAMPLES = 32

# In-memory dictionaries for storing uploaded signals and computed analyses
signals_db: dict[str, dict[str, Any]] = {}
analyses_db: dict[str, dict[str, Any]] = {}

# ---------------------------------------------------------------------------
# FastAPI Application & CORS
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Acoustic Emission Fault Detection API",
    description=(
        "Digital Signal Processing backend for bearing fault diagnosis in rotating machinery. "
        "Provides spectral analysis, band-selection via excess kurtosis, envelope demodulation, "
        "and theoretical bearing characteristic frequency matching."
    ),
    version="1.0.0",
)

# CORS setup for local development and cloud production deployments (Vercel, Render)
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
)
raw_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
allow_all = "*" in raw_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else raw_origins,
    allow_origin_regex=None if allow_all else r"^https?://([a-zA-Z0-9_.-]+\.)*vercel\.app(:[0-9]+)?$",
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic Request & Response Models
# ---------------------------------------------------------------------------


class BearingParameters(BaseModel):
    rolling_elements: int = Field(..., gt=0, description="Number of rolling elements (n)")
    ball_diameter: float = Field(..., gt=0.0, description="Rolling element diameter in mm (d)")
    pitch_diameter: float = Field(..., gt=0.0, description="Pitch diameter in mm (D)")
    contact_angle_deg: float = Field(0.0, ge=-90.0, le=90.0, description="Contact angle in degrees (theta)")

    @model_validator(mode="after")
    def validate_geometry(self) -> BearingParameters:
        if self.pitch_diameter <= self.ball_diameter:
            raise ValueError("Pitch diameter (D) must be strictly greater than rolling element diameter (d).")
        return self


class AnalysisRequest(BaseModel):
    signal_id: str = Field(..., description="Unique ID of previously uploaded signal")
    sampling_frequency: Optional[float] = Field(None, gt=0.0, description="Sampling rate in Hz (optional override)")
    shaft_speed_rpm: Optional[float] = Field(None, gt=0.0, description="Shaft rotational speed in RPM")
    block_length: Optional[int] = Field(DEFAULT_BLOCK_LENGTH, ge=16, description="Block length for processing")
    bearing: Optional[BearingParameters] = Field(None, description="Bearing geometry parameters")
    detection_threshold: Optional[float] = Field(3.0, gt=0.0, description="Peak-to-noise ratio threshold for fault detection")
    num_candidate_bands: Optional[int] = Field(4, ge=2, le=32, description="Number of candidate frequency bands for kurtosis analysis")


class BlockLengthExperimentRequest(BaseModel):
    signal_id: str = Field(..., description="Unique ID of previously uploaded signal")
    block_lengths: list[int] = Field(..., min_length=1, description="List of block lengths to evaluate")
    sampling_frequency: Optional[float] = Field(None, gt=0.0, description="Sampling rate in Hz (optional override)")


class PrecisionExperimentRequest(BaseModel):
    signal_id: str = Field(..., description="Unique ID of previously uploaded signal")
    block_length: Optional[int] = Field(1024, ge=32, description="Block length for moment accumulation")
    lpc_orders: Optional[list[int]] = Field(None, description="LPC orders to sweep for stability")


class RingingExperimentRequest(BaseModel):
    signal_id: str = Field(..., description="Unique ID of previously uploaded signal")
    fault_frequency: Optional[float] = Field(107.3, gt=0.0, description="Fault characteristic frequency in Hz (e.g. BPFO)")
    center_frequency: Optional[float] = Field(3200.0, gt=0.0, description="Filter resonance band center frequency in Hz")
    bandwidths: Optional[list[float]] = Field(None, description="List of bandwidths in Hz to sweep")
    filter_order: Optional[int] = Field(2, ge=1, le=8, description="Butterworth filter order")



# ---------------------------------------------------------------------------
# Utility Helpers
# ---------------------------------------------------------------------------


def sanitize_for_json(data: Any) -> Any:
    """Recursively replaces NaN and Inf floating-point values with None or safe equivalents."""
    if isinstance(data, dict):
        return {k: sanitize_for_json(v) for k, v in data.items()}
    if isinstance(data, list):
        return [sanitize_for_json(v) for v in data]
    if isinstance(data, (float, np.floating)):
        if math.isnan(data) or math.isinf(data):
            return None
        return float(data)
    if isinstance(data, bool):
        return data
    if isinstance(data, (int, np.integer)):
        return int(data)
    if isinstance(data, np.ndarray):
        return sanitize_for_json(data.tolist())
    return data


def decimate_series(series: np.ndarray, max_points: int = 1000) -> list[float]:
    """Subsamples a 1D NumPy array to at most `max_points` to prevent oversized JSON responses."""
    n = len(series)
    if n <= max_points:
        return [float(x) for x in series]
    indices = np.linspace(0, n - 1, max_points, dtype=int)
    return [float(series[i]) for i in indices]


# ---------------------------------------------------------------------------
# Classical DSP Pipeline Functions
# ---------------------------------------------------------------------------


def preprocess_signal(raw_signal: np.ndarray, fs: float) -> dict[str, Any]:
    """Stage 1: Signal Preprocessing.

    - Converts to 1D float64 array.
    - Validates finite values and signal length.
    - Removes DC component (zero-mean centering).
    - Preserves true amplitude (no automatic unit normalization).
    - Calculates fundamental statistical moments and metrics.
    """
    signal = np.asarray(raw_signal, dtype=np.float64).ravel()

    if len(signal) < MIN_SIGNAL_SAMPLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signal length ({len(signal)}) is too short. Minimum required is {MIN_SIGNAL_SAMPLES} samples.",
        )

    if not np.all(np.isfinite(signal)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signal contains non-finite values (NaN or Inf).",
        )

    # Remove DC component
    mean_val = float(np.mean(signal))
    detrended = signal - mean_val

    sample_count = len(detrended)
    duration_seconds = sample_count / fs
    std_val = float(np.std(detrended))
    rms_val = float(np.sqrt(np.mean(detrended**2)))
    min_val = float(np.min(detrended))
    max_val = float(np.max(detrended))
    peak_val = float(np.max(np.abs(detrended)))
    crest_factor = float(peak_val / (rms_val + 1e-12))
    fisher_kurtosis = float(scipy.stats.kurtosis(detrended, fisher=True))

    stats = {
        "sample_count": sample_count,
        "duration_seconds": round(duration_seconds, 6),
        "mean": round(float(np.mean(detrended)), 8),  # Effectively 0 after detrending
        "standard_deviation": round(std_val, 6),
        "rms": round(rms_val, 6),
        "min": round(min_val, 6),
        "max": round(max_val, 6),
        "peak": round(peak_val, 6),
        "crest_factor": round(crest_factor, 4),
        "kurtosis": round(fisher_kurtosis, 4),
    }

    return {"detrended_signal": detrended, "statistics": stats}


def compute_frequency_spectrum(
    signal: np.ndarray, fs: float, max_peaks: int = 10, max_points: int = 1000
) -> dict[str, Any]:
    """Stage 2: Frequency-Domain Analysis.

    - Applies a Hann window to reduce spectral leakage.
    - Computes single-sided FFT magnitude spectrum scaled to physical amplitude.
    - Accurately tracks frequency bins and resolution.
    - Identifies dominant peaks.
    """
    n = len(signal)
    window = np.hanning(n)
    windowed = signal * window

    # Coherent gain compensation for single-sided Hann window spectrum
    win_sum = np.sum(window)
    if win_sum <= 0:
        win_sum = 1.0

    fft_vals = np.fft.rfft(windowed)
    freqs = np.fft.rfftfreq(n, d=1.0 / fs)
    magnitude = (2.0 / win_sum) * np.abs(fft_vals)
    magnitude[0] = magnitude[0] / 2.0  # DC component does not double

    freq_resolution = fs / n

    # Find dominant peaks using prominence thresholding
    peaks_info: list[dict[str, float]] = []
    if len(magnitude) > 3:
        threshold = float(np.mean(magnitude) + 1.5 * np.std(magnitude))
        peak_indices, _ = scipy.signal.find_peaks(
            magnitude,
            height=threshold,
            distance=max(1, int(2.0 / max(freq_resolution, 1e-3))),
        )
        if len(peak_indices) == 0:
            # Fallback to absolute highest bins (excluding DC index 0)
            candidate_indices = np.argsort(magnitude[1:])[::-1][:max_peaks] + 1
            peak_indices = candidate_indices
        else:
            peak_indices = sorted(peak_indices, key=lambda idx: magnitude[idx], reverse=True)[:max_peaks]

        for idx in peak_indices:
            peaks_info.append(
                {
                    "frequency_hz": round(float(freqs[idx]), 2),
                    "magnitude": round(float(magnitude[idx]), 6),
                }
            )

    # Subsample spectrum for client visualization
    display_freqs = decimate_series(freqs, max_points=max_points)
    display_mags = decimate_series(magnitude, max_points=max_points)

    return {
        "frequency_resolution": round(freq_resolution, 4),
        "dominant_peaks": peaks_info,
        "spectrum": {
            "frequencies": [round(f, 2) for f in display_freqs],
            "magnitudes": [round(m, 6) for m in display_mags],
        },
        "_full_freqs": freqs,
        "_full_mag": magnitude,
    }


def compute_spectral_kurtosis_bands(
    signal: np.ndarray, fs: float, num_bands: int = 4
) -> dict[str, Any]:
    """Stage 3: Spectral Kurtosis and Frequency-Band Selection.

    Divides the usable frequency range into candidate sub-bands, applies Butterworth
    band-pass filtering, and computes excess kurtosis for each band to isolate impulsive bursts.

    NOTE: This is a simplified sub-band excess kurtosis screening method designed for
    preliminary resonance selection and is not equivalent to a full multi-rate kurtogram.
    """
    n = len(signal)
    nyquist = fs / 2.0

    # Ensure usable frequency bounds away from DC and Nyquist edge
    f_min = max(20.0, 4.0 * (fs / n))
    f_max = 0.95 * nyquist

    if f_min >= f_max or f_max <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Usable frequency range [{f_min:.1f}, {f_max:.1f}] Hz is invalid for sampling frequency {fs} Hz and length {n}.",
        )

    band_edges = np.linspace(f_min, f_max, num_bands + 1)
    candidate_bands: list[dict[str, Any]] = []

    for i in range(num_bands):
        low_hz = float(band_edges[i])
        high_hz = float(band_edges[i + 1])

        # Butterworth bandpass SOS filter
        try:
            sos = scipy.signal.butter(N=2, Wn=[low_hz, high_hz], btype="bandpass", fs=fs, output="sos")
            # Signal must have adequate length for forward-backward zero-phase filtering
            padlen = 3 * (2 * 2 + 1)
            if len(signal) <= padlen:
                filtered = scipy.signal.sosfilt(sos, signal)
            else:
                filtered = scipy.signal.sosfiltfilt(sos, signal)

            kurt = float(scipy.stats.kurtosis(filtered, fisher=True))
            if math.isnan(kurt) or math.isinf(kurt):
                kurt = 0.0
        except Exception:
            kurt = -3.0  # Penalty score if filter construction fails

        candidate_bands.append(
            {
                "low_hz": round(low_hz, 2),
                "high_hz": round(high_hz, 2),
                "kurtosis": round(kurt, 4),
            }
        )

    # Select candidate band with highest excess kurtosis
    valid_bands = [b for b in candidate_bands if b["kurtosis"] > -3.0]
    if valid_bands:
        selected_band = max(valid_bands, key=lambda b: b["kurtosis"])
    else:
        selected_band = candidate_bands[0]

    return {
        "selected_band": selected_band,
        "candidate_bands": candidate_bands,
        "method_note": (
            "Kurtosis calculated over filtered candidate frequency bands is a simplified band-selection "
            "method and is not equivalent to a full spectral-kurtosis estimator or fast kurtogram."
        ),
    }


def apply_bandpass_filter(
    signal: np.ndarray, fs: float, low_hz: float, high_hz: float, order: int = 2
) -> tuple[np.ndarray, dict[str, Any]]:
    """Stage 4: Band-Pass Filtering.

    Applies a zero-phase forward-backward Butterworth band-pass filter using Second-Order
    Sections (SOS) for numerical stability.
    """
    nyquist = fs / 2.0
    if low_hz <= 0.0 or high_hz >= nyquist or low_hz >= high_hz:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Filter frequency limits [{low_hz}, {high_hz}] Hz are outside valid range (0, {nyquist}) Hz.",
        )

    try:
        sos = scipy.signal.butter(N=order, Wn=[low_hz, high_hz], btype="bandpass", fs=fs, output="sos")
        padlen = 3 * (2 * order + 1)
        if len(signal) <= padlen:
            filtered = scipy.signal.sosfilt(sos, signal)
            filter_mode = "Forward-only (sosfilt) due to short signal length"
        else:
            filtered = scipy.signal.sosfiltfilt(sos, signal)
            filter_mode = "Zero-phase forward-backward (sosfiltfilt)"
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Butterworth bandpass filter failed: {str(exc)}",
        ) from exc

    filter_config = {
        "filter_type": "Butterworth",
        "order": order,
        "mode": filter_mode,
        "passband_hz": [round(low_hz, 2), round(high_hz, 2)],
    }

    return filtered, filter_config


def extract_envelope(filtered_signal: np.ndarray, max_points: int = 1000) -> tuple[np.ndarray, dict[str, Any], list[float]]:
    """Stage 5: Envelope Extraction.

    Extracts amplitude envelope via the Hilbert transform:
    A[n] = sqrt(y[n]^2 + Hilbert(y[n])^2)
    """
    try:
        analytic = scipy.signal.hilbert(filtered_signal)
        envelope = np.abs(analytic)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hilbert transform failed during envelope extraction: {str(exc)}",
        ) from exc

    mean_env = float(np.mean(envelope))
    std_env = float(np.std(envelope))
    rms_env = float(np.sqrt(np.mean(envelope**2)))
    peak_env = float(np.max(envelope))
    kurt_env = float(scipy.stats.kurtosis(envelope, fisher=True))

    stats = {
        "mean": round(mean_env, 6),
        "standard_deviation": round(std_env, 6),
        "rms": round(rms_env, 6),
        "peak": round(peak_env, 6),
        "kurtosis": round(kurt_env, 4),
    }

    display_samples = decimate_series(envelope, max_points=max_points)
    display_samples = [round(v, 6) for v in display_samples]

    return envelope, stats, display_samples


def calculate_bearing_frequencies(
    shaft_speed_rpm: float,
    rolling_elements: int,
    ball_diameter: float,
    pitch_diameter: float,
    contact_angle_deg: float,
) -> dict[str, float]:
    """Calculates theoretical bearing characteristic fault frequencies:

    fr = shaft_speed_rpm / 60.0
    theta = contact_angle_deg * pi / 180.0
    gamma = (d / D) * cos(theta)

    BPFO = (n / 2) * fr * (1 - gamma)
    BPFI = (n / 2) * fr * (1 + gamma)
    BSF  = (D / (2 * d)) * fr * (1 - gamma^2)
    FTF  = (1 / 2) * fr * (1 - gamma)
    """
    if shaft_speed_rpm <= 0:
        raise ValueError("Shaft speed RPM must be positive.")
    if rolling_elements <= 0:
        raise ValueError("Rolling elements count must be positive.")
    if ball_diameter <= 0 or pitch_diameter <= 0:
        raise ValueError("Bearing diameters must be positive.")
    if pitch_diameter <= ball_diameter:
        raise ValueError("Pitch diameter (D) must be greater than ball diameter (d).")

    fr = shaft_speed_rpm / 60.0
    theta_rad = math.radians(contact_angle_deg)
    gamma = (ball_diameter / pitch_diameter) * math.cos(theta_rad)

    bpfo = (rolling_elements / 2.0) * fr * (1.0 - gamma)
    bpfi = (rolling_elements / 2.0) * fr * (1.0 + gamma)
    bsf = (pitch_diameter / (2.0 * ball_diameter)) * fr * (1.0 - (gamma**2))
    ftf = 0.5 * fr * (1.0 - gamma)

    return {
        "1X": round(fr, 2),
        "BPFO": round(bpfo, 2),
        "BPFI": round(bpfi, 2),
        "BSF": round(bsf, 2),
        "FTF": round(ftf, 2),
    }


def compute_envelope_spectrum(
    envelope: np.ndarray,
    fs: float,
    bearing_frequencies: Optional[dict[str, float]] = None,
    max_peaks: int = 10,
    max_points: int = 1000,
) -> dict[str, Any]:
    """Stage 6: Envelope Spectrum & Characteristic Frequency Matching.

    Removes envelope DC offset, windows, computes single-sided FFT, extracts dominant peaks,
    and matches spectral energy near theoretical bearing defect frequencies.
    """
    n = len(envelope)
    # Remove envelope DC component to expose modulating fault frequencies
    env_ac = envelope - np.mean(envelope)
    window = np.hanning(n)
    win_sum = np.sum(window)
    if win_sum <= 0:
        win_sum = 1.0

    fft_vals = np.fft.rfft(env_ac * window)
    freqs = np.fft.rfftfreq(n, d=1.0 / fs)
    magnitude = (2.0 / win_sum) * np.abs(fft_vals)
    df_env = fs / n

    # Extract dominant peaks (excluding 0 Hz DC)
    peaks_info: list[dict[str, float]] = []
    if len(magnitude) > 3:
        threshold = float(np.mean(magnitude[1:]) + 1.5 * np.std(magnitude[1:]))
        peak_indices, _ = scipy.signal.find_peaks(
            magnitude,
            height=threshold,
            distance=max(1, int(1.5 / max(df_env, 1e-3))),
        )
        # Exclude DC bin
        peak_indices = [idx for idx in peak_indices if idx > 0]
        if not peak_indices:
            candidate_indices = np.argsort(magnitude[1:])[::-1][:max_peaks] + 1
            peak_indices = list(candidate_indices)
        else:
            peak_indices = sorted(peak_indices, key=lambda idx: magnitude[idx], reverse=True)[:max_peaks]

        for idx in peak_indices:
            peaks_info.append(
                {
                    "frequency_hz": round(float(freqs[idx]), 2),
                    "magnitude": round(float(magnitude[idx]), 6),
                }
            )

    # Match theoretical bearing fault frequencies if provided
    fault_indicators: list[dict[str, Any]] = []
    if bearing_frequencies:
        # Search window tolerance based on resolution and frequency scale
        for fault_name, target_freq in bearing_frequencies.items():
            if fault_name == "1X":
                continue  # 1X is shaft rotational frequency reference

            tolerance = max(2.0 * df_env, 0.02 * target_freq)
            f_low = max(0.0, target_freq - tolerance)
            f_high = min(fs / 2.0, target_freq + tolerance)

            # Search envelope spectrum in window [f_low, f_high]
            in_window_mask = (freqs >= f_low) & (freqs <= f_high)
            if np.any(in_window_mask):
                window_mags = magnitude[in_window_mask]
                window_freqs = freqs[in_window_mask]
                max_idx = np.argmax(window_mags)
                mf = float(window_mags[max_idx])
                detected_freq = float(window_freqs[max_idx])
            else:
                mf = 0.0
                detected_freq = target_freq

            # Estimate local noise floor PN using median of surrounding bins, excluding target window
            local_low = max(0.0, target_freq - 5.0 * tolerance)
            local_high = min(fs / 2.0, target_freq + 5.0 * tolerance)
            surrounding_mask = (
                (freqs >= local_low)
                & (freqs <= local_high)
                & ((freqs < f_low) | (freqs > f_high))
                & (freqs > 0.0)
            )

            if np.count_nonzero(surrounding_mask) >= 5:
                pn = float(np.median(magnitude[surrounding_mask]))
            else:
                # Fallback to general spectrum median
                pn = float(np.median(magnitude[1:])) if len(magnitude) > 1 else 1e-12

            pn = max(pn, 1e-12)
            rf = mf / (pn + 1e-12)

            fault_indicators.append(
                {
                    "fault_type": fault_name,
                    "theoretical_hz": round(float(target_freq), 2),
                    "detected_hz": round(float(detected_freq), 2),
                    "magnitude": round(mf, 6),
                    "noise_floor": round(pn, 6),
                    "indicator_rf": round(float(rf), 3),
                }
            )

    display_freqs = decimate_series(freqs, max_points=max_points)
    display_mags = decimate_series(magnitude, max_points=max_points)

    return {
        "envelope_spectrum": {
            "frequencies": [round(f, 2) for f in display_freqs],
            "magnitudes": [round(m, 6) for m in display_mags],
        },
        "dominant_peaks": peaks_info,
        "fault_frequencies": bearing_frequencies or {},
        "fault_indicators": fault_indicators,
        "frequency_resolution": round(df_env, 4),
    }


def evaluate_adaptive_detection(
    envelope_analysis: dict[str, Any],
    threshold: float = 3.0,
) -> dict[str, Any]:
    """Stage 7 & 8: Fault Indicator & Adaptive Detection Decision.

    Applies a configurable threshold against peak-to-local-noise-floor ratio Rf.
    Returns POTENTIAL_FAULT, NO_FAULT_INDICATED, or INCONCLUSIVE with documented rationale.
    """
    indicators = envelope_analysis.get("fault_indicators", [])

    if not indicators:
        return {
            "status": "INCONCLUSIVE",
            "score": None,
            "threshold": threshold,
            "supporting_peaks": [],
            "reason": (
                "Bearing geometry or shaft speed parameters were not provided. "
                "Unable to evaluate characteristic bearing fault frequencies."
            ),
        }

    # Evaluate indicators
    highest_indicator = max(indicators, key=lambda ind: ind["indicator_rf"])
    max_score = highest_indicator["indicator_rf"]

    supporting_peaks = [
        ind for ind in indicators if ind["indicator_rf"] >= threshold
    ]

    if max_score >= threshold:
        status_decision = "POTENTIAL_FAULT"
        reason = (
            f"Potential fault indicated: fault frequency component '{highest_indicator['fault_type']}' "
            f"at {highest_indicator['detected_hz']:.2f} Hz exhibits a peak-to-noise ratio of "
            f"{max_score:.2f}, exceeding threshold {threshold:.2f}. "
            "Preliminary finding; calibration with healthy reference baseline recommended."
        )
    else:
        status_decision = "NO_FAULT_INDICATED"
        reason = (
            f"No bearing characteristic frequencies exceed the detection threshold "
            f"(highest ratio: {max_score:.2f} for {highest_indicator['fault_type']}, threshold: {threshold:.2f})."
        )

    return {
        "status": status_decision,
        "score": round(max_score, 3),
        "threshold": round(threshold, 2),
        "supporting_peaks": supporting_peaks,
        "reason": reason,
    }


def run_dsp_pipeline(
    signal: np.ndarray,
    fs: float,
    shaft_speed_rpm: Optional[float] = None,
    bearing: Optional[BearingParameters] = None,
    detection_threshold: float = 3.0,
    num_candidate_bands: int = 4,
) -> dict[str, Any]:
    """Executes the complete 8-stage DSP pipeline sequentially."""
    t_start = time.perf_counter()

    # Stage 1: Signal Preprocessing
    stage1 = preprocess_signal(signal, fs)
    detrended = stage1["detrended_signal"]
    prep_stats = stage1["statistics"]

    # Stage 2: Frequency-Domain Analysis
    freq_analysis = compute_frequency_spectrum(detrended, fs)

    # Stage 3: Spectral Kurtosis and Band Selection
    sk_analysis = compute_spectral_kurtosis_bands(detrended, fs, num_bands=num_candidate_bands)
    selected_band = sk_analysis["selected_band"]

    # Stage 4: Band-Pass Filtering
    filtered_signal, filter_config = apply_bandpass_filter(
        detrended, fs, selected_band["low_hz"], selected_band["high_hz"]
    )

    # Stage 5: Envelope Extraction
    envelope, envelope_stats, env_display = extract_envelope(filtered_signal)

    # Calculate theoretical bearing characteristic frequencies if parameters provided
    bearing_freqs: Optional[dict[str, float]] = None
    if shaft_speed_rpm is not None and bearing is not None:
        bearing_freqs = calculate_bearing_frequencies(
            shaft_speed_rpm=shaft_speed_rpm,
            rolling_elements=bearing.rolling_elements,
            ball_diameter=bearing.ball_diameter,
            pitch_diameter=bearing.pitch_diameter,
            contact_angle_deg=bearing.contact_angle_deg,
        )

    # Stage 6: Envelope Spectrum & Fault Matching
    envelope_analysis = compute_envelope_spectrum(
        envelope, fs, bearing_frequencies=bearing_freqs
    )
    envelope_analysis["envelope_statistics"] = envelope_stats
    envelope_analysis["envelope_samples"] = env_display

    # Stage 7 & 8: Fault Indicator & Adaptive Detection
    detection_result = evaluate_adaptive_detection(
        envelope_analysis, threshold=detection_threshold
    )

    t_elapsed_ms = (time.perf_counter() - t_start) * 1000.0

    return {
        "preprocessing": prep_stats,
        "frequency_analysis": {
            "frequency_resolution": freq_analysis["frequency_resolution"],
            "dominant_peaks": freq_analysis["dominant_peaks"],
            "spectrum": freq_analysis["spectrum"],
        },
        "spectral_kurtosis": {
            "selected_band": sk_analysis["selected_band"],
            "candidate_bands": sk_analysis["candidate_bands"],
            "method_note": sk_analysis["method_note"],
        },
        "bandpass_filtering": filter_config,
        "envelope_analysis": {
            "envelope_statistics": envelope_analysis["envelope_statistics"],
            "dominant_peaks": envelope_analysis["dominant_peaks"],
            "fault_frequencies": envelope_analysis["fault_frequencies"],
            "fault_indicators": envelope_analysis["fault_indicators"],
            "envelope_spectrum": envelope_analysis["envelope_spectrum"],
            "envelope_samples": envelope_analysis["envelope_samples"],
        },
        "detection": detection_result,
        "performance": {
            "processing_time_ms": round(t_elapsed_ms, 2),
        },
    }


def run_block_length_experiment(
    signal: np.ndarray, fs: float, block_lengths: list[int]
) -> dict[str, Any]:
    """Evaluates kurtosis and processing time across various block lengths.

    Uses non-overlapping blocks. Incomplete final blocks are discarded to maintain
    uniform sample size across blocks.
    """
    signal = np.asarray(signal, dtype=np.float64).ravel()
    total_samples = len(signal)
    results: list[dict[str, Any]] = []

    for block_len in block_lengths:
        if block_len <= 0:
            results.append(
                {
                    "block_length": block_len,
                    "valid": False,
                    "reason": "Block length must be a positive integer.",
                }
            )
            continue

        num_blocks = total_samples // block_len
        discarded_samples = total_samples % block_len

        if num_blocks < 1:
            results.append(
                {
                    "block_length": block_len,
                    "valid": False,
                    "num_complete_blocks": 0,
                    "discarded_samples": total_samples,
                    "reason": (
                        f"Signal length ({total_samples}) is insufficient to form even one complete "
                        f"block of length {block_len}."
                    ),
                }
            )
            continue

        t0 = time.perf_counter()
        kurtosis_values: list[float] = []

        for b_idx in range(num_blocks):
            block = signal[b_idx * block_len : (b_idx + 1) * block_len]
            # Detrend block
            block_detrended = block - np.mean(block)
            k = float(scipy.stats.kurtosis(block_detrended, fisher=True))
            if np.isfinite(k):
                kurtosis_values.append(k)

        t_elapsed_ms = (time.perf_counter() - t0) * 1000.0

        if kurtosis_values:
            mean_k = float(np.mean(kurtosis_values))
            max_k = float(np.max(kurtosis_values))
            var_k = float(np.std(kurtosis_values))
        else:
            mean_k, max_k, var_k = 0.0, 0.0, 0.0

        results.append(
            {
                "block_length": block_len,
                "valid": True,
                "num_complete_blocks": num_blocks,
                "discarded_samples": discarded_samples,
                "mean_kurtosis": round(mean_k, 4),
                "max_kurtosis": round(max_k, 4),
                "kurtosis_variability": round(var_k, 4),
                "processing_time_ms": round(t_elapsed_ms, 3),
            }
        )

    return {
        "signal_sample_count": total_samples,
        "sampling_frequency": fs,
        "results": results,
        "notes": {
            "policy": (
                "Incomplete final blocks (total_samples % block_length) are excluded to ensure "
                "uniform statistical sample size for all evaluated blocks."
            ),
            "hardware_disclaimer": (
                "Processing time measured in Python runtime on host CPU; does not represent "
                "execution cycle counts or latency on embedded DSP architectures (e.g., TMS320C6748)."
            ),
        },
    }


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------


@app.get("/", summary="Root Status")
def root_status() -> dict[str, str]:
    """Root health/status endpoint for cloud deployment checks (Render, etc.)."""
    return {
        "status": "ok",
        "service": "AcousticSense Classical DSP API",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health", summary="Health Check Alias")
@app.get("/api/health", summary="Health Check")
def health_check() -> dict[str, str]:
    """Returns the operational status of the service."""
    return {
        "status": "ok",
        "service": "Acoustic Emission Fault Detection API",
        "version": "1.0.0",
    }


@app.post("/api/signals/upload", summary="Upload Signal File")
async def upload_signal(
    file: UploadFile = File(..., description="Signal file (WAV audio or numerical CSV)"),
    column: Optional[str] = Form(None, description="Signal column name if CSV has multiple columns"),
    sampling_frequency: Optional[float] = Form(None, description="Sampling frequency in Hz (optional override)"),
) -> dict[str, Any]:
    """Uploads and validates a bearing signal from a CSV or WAV file.

    - Validates file size (max 50 MB).
    - Checks content headers (does not rely on file extension alone).
    - For WAV: extracts sampling frequency, converts multichannel to mono, normalizes integer PCM to float.
    - For CSV: parses numerical values, handles single or specified column, rejects empty/non-numeric data.
    - Stores signal in an in-memory dictionary.
    """
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed upload size of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    signal_array: Optional[np.ndarray] = None
    extracted_fs: Optional[float] = sampling_frequency

    # 1. Inspect for WAV file header: Starts with 'RIFF' and contains 'WAVE'
    if len(file_bytes) >= 12 and file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WAVE":
        try:
            wav_fs, data = scipy.io.wavfile.read(io.BytesIO(file_bytes))
            if extracted_fs is None:
                extracted_fs = float(wav_fs)

            orig_dtype = data.dtype
            # Convert multi-channel to mono
            if data.ndim > 1:
                data = np.mean(data, axis=-1)

            # Normalize integer PCM to floating-point while preserving relative amplitudes
            if np.issubdtype(orig_dtype, np.integer):
                if orig_dtype == np.int16:
                    signal_array = data.astype(np.float64) / 32768.0
                elif orig_dtype == np.int32:
                    signal_array = data.astype(np.float64) / 2147483648.0
                elif orig_dtype == np.uint8:
                    signal_array = (data.astype(np.float64) - 128.0) / 128.0
                else:
                    max_abs = float(np.iinfo(orig_dtype).max)
                    signal_array = data.astype(np.float64) / max_abs
            else:
                signal_array = data.astype(np.float64)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse WAV file content: {str(exc)}",
            ) from exc

    # 2. Try parsing as CSV text
    if signal_array is None:
        try:
            # First attempt standard comma-delimited parsing
            try:
                df = pd.read_csv(io.BytesIO(file_bytes))
            except Exception:
                df = pd.read_csv(io.BytesIO(file_bytes), sep=r"[\t;, ]+", engine="python")

            if df.empty or len(df.columns) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CSV file contains no readable data rows or columns.",
                )

            # Column selection
            if column is not None:
                if column not in df.columns:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Specified column '{column}' not found. Available columns: {list(df.columns)}",
                    )
                target_col = column
            else:
                if len(df.columns) == 1:
                    target_col = df.columns[0]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Multiple columns found in CSV: {list(df.columns)}. "
                            "Please specify the target signal column using the 'column' parameter."
                        ),
                    )

            # Verify numeric data
            series = pd.to_numeric(df[target_col], errors="coerce")
            if series.isna().any():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Column '{target_col}' contains non-numeric or missing values.",
                )

            signal_array = series.to_numpy(dtype=np.float64)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Uploaded file could not be parsed as valid WAV or CSV data: {str(exc)}",
            ) from exc

    # Final validation on converted signal
    if signal_array is None or len(signal_array) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parsed signal is empty or invalid.",
        )

    if not np.all(np.isfinite(signal_array)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signal contains non-finite numerical values.",
        )

    signal_id = f"sig_{uuid.uuid4().hex[:12]}"
    sample_count = len(signal_array)
    duration_seconds = (sample_count / extracted_fs) if extracted_fs and extracted_fs > 0 else None

    # Calculate basic statistics
    mean_val = float(np.mean(signal_array))
    std_val = float(np.std(signal_array))
    rms_val = float(np.sqrt(np.mean(signal_array**2)))
    min_val = float(np.min(signal_array))
    max_val = float(np.max(signal_array))
    peak_val = float(np.max(np.abs(signal_array)))

    record = {
        "signal_id": signal_id,
        "filename": file.filename or "uploaded_signal",
        "sampling_frequency": extracted_fs,
        "sample_count": sample_count,
        "duration_seconds": duration_seconds,
        "signal": signal_array,
    }
    signals_db[signal_id] = record

    response_payload = {
        "signal_id": signal_id,
        "filename": record["filename"],
        "sampling_frequency": extracted_fs,
        "sample_count": sample_count,
        "duration_seconds": round(duration_seconds, 6) if duration_seconds else None,
        "statistics": {
            "mean": round(mean_val, 6),
            "standard_deviation": round(std_val, 6),
            "rms": round(rms_val, 6),
            "min": round(min_val, 6),
            "max": round(max_val, 6),
            "peak": round(peak_val, 6),
        },
    }

    return sanitize_for_json(response_payload)


@app.post("/api/analysis/run", summary="Run Complete DSP Analysis")
def run_analysis(request: AnalysisRequest) -> dict[str, Any]:
    """Executes the complete 8-stage DSP fault detection pipeline on an uploaded signal."""
    # 1. Retrieve stored signal
    if request.signal_id not in signals_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal with ID '{request.signal_id}' not found.",
        )

    signal_entry = signals_db[request.signal_id]
    signal_data = signal_entry["signal"]

    # 2. Determine effective sampling frequency
    effective_fs = request.sampling_frequency or signal_entry.get("sampling_frequency")
    if effective_fs is None or effective_fs <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Sampling frequency is required. The uploaded signal does not have a stored "
                "sampling frequency, and none was supplied in the analysis request."
            ),
        )

    # 3. Validate signal length
    if len(signal_data) < MIN_SIGNAL_SAMPLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signal length ({len(signal_data)}) is too short for reliable analysis. Minimum required is {MIN_SIGNAL_SAMPLES} samples.",
        )

    # 4. Execute pipeline
    try:
        pipeline_output = run_dsp_pipeline(
            signal=signal_data,
            fs=effective_fs,
            shaft_speed_rpm=request.shaft_speed_rpm,
            bearing=request.bearing,
            detection_threshold=request.detection_threshold or 3.0,
            num_candidate_bands=request.num_candidate_bands or 4,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DSP pipeline execution error: {str(exc)}",
        ) from exc

    sample_count = len(signal_data)
    duration_seconds = sample_count / effective_fs

    analysis_id = f"an_{uuid.uuid4().hex[:12]}"

    result = {
        "analysis_id": analysis_id,
        "signal": {
            "signal_id": request.signal_id,
            "sampling_frequency": effective_fs,
            "sample_count": sample_count,
            "duration_seconds": round(duration_seconds, 6),
        },
        "preprocessing": pipeline_output["preprocessing"],
        "frequency_analysis": pipeline_output["frequency_analysis"],
        "spectral_kurtosis": pipeline_output["spectral_kurtosis"],
        "bandpass_filtering": pipeline_output["bandpass_filtering"],
        "envelope_analysis": pipeline_output["envelope_analysis"],
        "detection": pipeline_output["detection"],
        "performance": pipeline_output["performance"],
    }

    # Store analysis in memory for AI interpretation and reproducibility
    signals_db[request.signal_id]["latest_analysis"] = result
    signals_db[request.signal_id]["latest_analysis_id"] = analysis_id
    signals_db[request.signal_id]["latest_parameters"] = request.model_dump()
    analyses_db[analysis_id] = {
        "analysis_id": analysis_id,
        "signal_id": request.signal_id,
        "result": result,
        "parameters": request.model_dump(),
        "created_at": time.time(),
        "cached_interpretation": None,
    }

    return sanitize_for_json(result)


@app.post("/api/analysis/interpret", summary="Generate AI Interpretation of DSP Analysis")
async def interpret_analysis(request: InterpretRequest) -> dict[str, Any]:
    """Generates an AI-powered scientific explanation of a completed DSP analysis using Groq."""
    # 1. Verify signal exists
    if request.signal_id not in signals_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal with ID '{request.signal_id}' not found.",
        )
    signal_entry = signals_db[request.signal_id]

    # 2. Locate the analysis result
    analysis_entry: Optional[dict[str, Any]] = None
    if request.analysis_id:
        analysis_entry = analyses_db.get(request.analysis_id)
        if not analysis_entry or analysis_entry["signal_id"] != request.signal_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis with ID '{request.analysis_id}' not found for signal '{request.signal_id}'.",
            )
    else:
        # Check latest analysis on the signal
        latest_id = signal_entry.get("latest_analysis_id")
        if latest_id and latest_id in analyses_db:
            analysis_entry = analyses_db[latest_id]

    if not analysis_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No completed DSP analysis found for this signal. Please run an analysis first.",
        )

    # 3. Check cached interpretation for this specific analysis
    if analysis_entry.get("cached_interpretation") is not None:
        cached = analysis_entry["cached_interpretation"]
        return sanitize_for_json(cached.model_dump())

    # 4. Generate interpretation via Groq
    try:
        interpretation = await generate_interpretation(
            analysis_id=analysis_entry["analysis_id"],
            signal_id=request.signal_id,
            analysis_result=analysis_entry["result"],
            signal_meta={"filename": signal_entry.get("filename")},
            parameters=analysis_entry.get("parameters"),
        )
        # Cache on the analysis entry
        analysis_entry["cached_interpretation"] = interpretation
        return sanitize_for_json(interpretation.model_dump())
    except ValueError as exc:
        if "GROQ_API_KEY" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq AI interpretation is not configured. Please set GROQ_API_KEY in the backend environment.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI interpretation parsing error: {str(exc)}",
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq API authentication failed. Please check backend GROQ_API_KEY configuration.",
        ) from exc
    except TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Upstream AI request timed out. Please try again.",
        ) from exc
    except ConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to communicate with Groq AI service. Please check network connection.",
        ) from exc
    except RuntimeError as exc:
        if "already being generated" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An interpretation is already being generated for this analysis. Please wait.",
            ) from exc
        if "rate limit" in str(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Groq API rate limit exceeded. Please wait a moment and try again.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        ) from exc
    except Exception as exc:
        logger.error(f"Unexpected error in interpret_analysis: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI interpretation due to an unexpected server error.",
        ) from exc


@app.post("/api/experiments/block-length", summary="Run Block-Length Experiment")
def block_length_experiment(request: BlockLengthExperimentRequest) -> dict[str, Any]:
    """Evaluates kurtosis variation and execution time across multiple block lengths."""
    if request.signal_id not in signals_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal with ID '{request.signal_id}' not found.",
        )

    signal_entry = signals_db[request.signal_id]
    signal_data = signal_entry["signal"]

    effective_fs = request.sampling_frequency or signal_entry.get("sampling_frequency")
    if effective_fs is None or effective_fs <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sampling frequency is required for the experiment.",
        )

    if len(request.block_lengths) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one block length must be provided.",
        )

    results = run_block_length_experiment(
        signal=signal_data,
        fs=effective_fs,
        block_lengths=request.block_lengths,
    )

    response_payload = {
        "signal_id": request.signal_id,
        "sampling_frequency": effective_fs,
        "total_samples": len(signal_data),
        "experiment_results": results["results"],
        "notes": results["notes"],
    }

    return sanitize_for_json(response_payload)


@app.get("/api/benchmark/results", summary="Get CWRU Benchmark Results")
def get_benchmark_results() -> dict[str, Any]:
    """Returns stored benchmark evaluation results across the CWRU dataset suite."""
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "cwru", "benchmark_evaluation.json"))
    if not os.path.exists(json_path):
        # Run evaluation if not already generated
        try:
            import evaluate_benchmark
            evaluate_benchmark.run_benchmark()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Benchmark results not found and failed to run benchmark: {str(exc)}",
            ) from exc

    if not os.path.exists(json_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benchmark evaluation data is not available. Please run evaluate_benchmark.py first.",
        )

    import json
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return sanitize_for_json(data)


@app.post("/api/benchmark/run", summary="Trigger Fresh Benchmark Evaluation")
def run_fresh_benchmark() -> dict[str, Any]:
    """Runs a fresh benchmark evaluation across all CWRU files and returns the updated metrics."""
    try:
        import evaluate_benchmark
        evaluate_benchmark.run_benchmark()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute benchmark evaluation: {str(exc)}",
        ) from exc

    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "cwru", "benchmark_evaluation.json"))
    import json
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return sanitize_for_json(data)


@app.post("/api/experiments/precision", summary="Run Precision Experiment (Hypothesis H2)")
def precision_experiment(request: PrecisionExperimentRequest) -> dict[str, Any]:
    """Evaluates arithmetic precision limits: Float64 vs Float32 vs Q31 vs Q15 vs BFP.

    Also tests Levinson-Durbin linear prediction whitening ill-conditioning across order p.
    """
    if request.signal_id not in signals_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal with ID '{request.signal_id}' not found.",
        )

    signal_entry = signals_db[request.signal_id]
    signal_data = signal_entry["signal"]

    blk_len = request.block_length or 1024
    if len(signal_data) < blk_len:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signal length ({len(signal_data)}) is shorter than requested block length ({blk_len}).",
        )

    from app.fixed_point import run_arithmetic_precision_experiment

    results = run_arithmetic_precision_experiment(
        signal=signal_data,
        block_length=blk_len,
        lpc_orders=request.lpc_orders,
    )

    response_payload = {
        "signal_id": request.signal_id,
        "filename": signal_entry.get("filename"),
        "sampling_frequency": signal_entry.get("sampling_frequency"),
        "total_samples": len(signal_data),
        **results,
    }

    return sanitize_for_json(response_payload)


@app.post("/api/experiments/ringing", summary="Run Filter Ringing Experiment (Hypothesis H3)")
def ringing_experiment(request: RingingExperimentRequest) -> dict[str, Any]:
    """Quantifies resonance-band filter ringing and impulsiveness loss across filter bandwidths.

    Evaluates dimensionless ratio beta = B / f_fault and smearing duration tau = 1/(pi*B).
    """
    if request.signal_id not in signals_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal with ID '{request.signal_id}' not found.",
        )

    signal_entry = signals_db[request.signal_id]
    signal_data = signal_entry["signal"]
    fs = float(signal_entry.get("sampling_frequency", 12000.0))

    from app.filter_ringing import run_filter_ringing_experiment

    results = run_filter_ringing_experiment(
        signal=signal_data,
        fs=fs,
        fault_frequency=request.fault_frequency or 107.3,
        center_frequency=request.center_frequency or 3200.0,
        bandwidths=request.bandwidths,
        filter_order=request.filter_order or 2,
    )

    response_payload = {
        "signal_id": request.signal_id,
        "filename": signal_entry.get("filename"),
        "sampling_frequency": fs,
        **results,
    }

    return sanitize_for_json(response_payload)

