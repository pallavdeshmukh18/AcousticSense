# Acoustic Emission Fault Detection Backend

A classical Digital Signal Processing (DSP) backend built with **FastAPI**, **NumPy**, **SciPy**, and **Pandas** for vibration and acoustic emission fault diagnosis in rotating machinery.

Developed as part of our college research project: *Acoustic Emission Fault Detection in Rotating Machinery Using Digital Signal Processing*.

Designed to serve as the backend for a React + Vite frontend dashboard.

---

## 1. Project Overview

This backend implements a deterministic, classical DSP pipeline for detecting localized bearing defects (Outer Race Ball Pass Frequency — **BPFO**, Inner Race Ball Pass Frequency — **BPFI**, Ball Spin Frequency — **BSF**, and Fundamental Train Frequency — **FTF**).

It deliberately avoids black-box machine learning or neural networks, relying instead on established physical principles:
- **Zero-mean DC removal and moment statistics** (RMS, crest factor, excess kurtosis).
- **Single-sided Hann-windowed FFT** magnitude spectrum.
- **Spectral kurtosis band screening** to locate resonance bands excited by repetitive impacts.
- **Zero-phase Butterworth band-pass filtering** using Second-Order Sections (SOS).
- **Analytic signal envelope demodulation** via the Hilbert transform.
- **Envelope spectrum calculation** and matching against theoretical kinematic defect frequencies.
- **Normalized fault indicator ($R_f$)** calculation against local spectral noise floors.
- **Adaptive preliminary decision logic** (`POTENTIAL_FAULT`, `NO_FAULT_INDICATED`, `INCONCLUSIVE`).
- **Non-overlapping block-length experimentation** to assess estimator stability.

---

## 2. Python Setup & Requirements

- **Python**: 3.11+ (Python 3.13 tested and verified)
- **FastAPI** & **Uvicorn**
- **NumPy**, **SciPy**, **Pandas**
- **python-multipart**
- **Pytest** & **HTTPX**

---

## 3. Installation Instructions

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
python -m pip install -r requirements.txt
```

---

## 4. Startup Command

Start the Uvicorn development server:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Once running:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/health`

CORS is enabled by default for Vite frontend development at `http://localhost:5173`. Custom origins can be provided via the `CORS_ORIGINS` environment variable.

---

## 5. Supported File Formats

1. **WAV Audio Files (`.wav`)**:
   - Single-channel (mono) and multi-channel audio (automatically downmixed to mono via averaging).
   - 16-bit PCM, 32-bit PCM, 8-bit unsigned PCM, and IEEE floating-point audio.
   - Integer PCM samples are normalized to floating-point `[-1.0, 1.0]` preserving relative amplitudes.
   - Sampling rate is extracted directly from the RIFF/WAVE header. Signals are never silently resampled.
2. **CSV Files (`.csv`)**:
   - Single-column numerical signals.
   - Multi-column CSVs when the target column is specified via the `column` form field.
   - Empty files, non-numeric values, or unselected ambiguous multi-column files are rejected with clear HTTP 400 errors.
   - Maximum upload size is 50 MB (configurable).

---

## 6. Available Endpoints

### A. Health Check
`GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "service": "Acoustic Emission Fault Detection API"
}
```

---

### B. Signal Upload
`POST /api/signals/upload`

Multipart Form-Data:
- `file`: The `.wav` or `.csv` signal file.
- `column` *(optional)*: Target column name for multi-column CSV files.
- `sampling_frequency` *(optional)*: Sampling rate in Hz (required for CSV files if not passed at analysis time).

**Example Response:**
```json
{
  "signal_id": "sig_a1b2c3d4e5f6",
  "filename": "bearing_sensor_data.wav",
  "sampling_frequency": 48000.0,
  "sample_count": 48000,
  "duration_seconds": 1.0,
  "statistics": {
    "mean": 0.00012,
    "standard_deviation": 0.1245,
    "rms": 0.1245,
    "min": -0.852,
    "max": 0.891,
    "peak": 0.891
  }
}
```

---

### C. Run Complete DSP Analysis
`POST /api/analysis/run`

JSON Request Body:
```json
{
  "signal_id": "sig_a1b2c3d4e5f6",
  "sampling_frequency": 48000,
  "shaft_speed_rpm": 1800,
  "block_length": 1024,
  "detection_threshold": 3.0,
  "num_candidate_bands": 4,
  "bearing": {
    "rolling_elements": 8,
    "ball_diameter": 7.5,
    "pitch_diameter": 34.5,
    "contact_angle_deg": 0.0
  }
}
```

**Response Format:**
```json
{
  "signal": {
    "signal_id": "sig_a1b2c3d4e5f6",
    "sampling_frequency": 48000.0,
    "sample_count": 48000,
    "duration_seconds": 1.0
  },
  "preprocessing": {
    "sample_count": 48000,
    "duration_seconds": 1.0,
    "mean": 0.0,
    "standard_deviation": 0.1245,
    "rms": 0.1245,
    "min": -0.852,
    "max": 0.891,
    "peak": 0.891,
    "crest_factor": 7.1566,
    "kurtosis": 12.43
  },
  "frequency_analysis": {
    "frequency_resolution": 1.0,
    "dominant_peaks": [
      { "frequency_hz": 3000.0, "magnitude": 0.054 }
    ],
    "spectrum": {
      "frequencies": [0.0, 48.0, 96.0],
      "magnitudes": [0.0, 0.002, 0.004]
    }
  },
  "spectral_kurtosis": {
    "selected_band": {
      "low_hz": 2000.0,
      "high_hz": 8000.0,
      "kurtosis": 14.85
    },
    "candidate_bands": [ ... ],
    "method_note": "Kurtosis calculated over filtered candidate frequency bands is a simplified band-selection method and is not equivalent to a full spectral-kurtosis estimator or fast kurtogram."
  },
  "bandpass_filtering": {
    "filter_type": "Butterworth",
    "order": 2,
    "mode": "Zero-phase forward-backward (sosfiltfilt)",
    "passband_hz": [2000.0, 8000.0]
  },
  "envelope_analysis": {
    "envelope_statistics": {
      "mean": 0.041,
      "standard_deviation": 0.038,
      "rms": 0.056,
      "peak": 0.42,
      "kurtosis": 8.12
    },
    "dominant_peaks": [
      { "frequency_hz": 93.91, "magnitude": 0.018 }
    ],
    "fault_frequencies": {
      "1X": 30.0,
      "BPFO": 93.91,
      "BPFI": 146.09,
      "BSF": 65.74,
      "FTF": 11.74
    },
    "fault_indicators": [
      {
        "fault_type": "BPFO",
        "theoretical_hz": 93.91,
        "detected_hz": 94.0,
        "magnitude": 0.018,
        "noise_floor": 0.003,
        "indicator_rf": 6.0
      }
    ],
    "envelope_samples": [ ... ],
    "envelope_spectrum": { ... }
  },
  "detection": {
    "status": "POTENTIAL_FAULT",
    "score": 6.0,
    "threshold": 3.0,
    "supporting_peaks": [ ... ],
    "reason": "Potential fault indicated: fault frequency component 'BPFO' at 94.00 Hz exhibits a peak-to-noise ratio of 6.00, exceeding threshold 3.00. Preliminary finding; calibration with healthy reference baseline recommended."
  },
  "performance": {
    "processing_time_ms": 14.2
  }
}
```

---

### D. Block-Length Experiment
`POST /api/experiments/block-length`

JSON Request Body:
```json
{
  "signal_id": "sig_a1b2c3d4e5f6",
  "block_lengths": [256, 512, 1024, 2048]
}
```

**Example Response:**
```json
{
  "signal_id": "sig_a1b2c3d4e5f6",
  "sampling_frequency": 48000.0,
  "total_samples": 48000,
  "experiment_results": [
    {
      "block_length": 1024,
      "valid": true,
      "num_complete_blocks": 46,
      "discarded_samples": 896,
      "mean_kurtosis": 5.412,
      "max_kurtosis": 16.89,
      "kurtosis_variability": 3.21,
      "processing_time_ms": 1.25
    }
  ],
  "notes": {
    "policy": "Incomplete final blocks (total_samples % block_length) are excluded to ensure uniform statistical sample size for all evaluated blocks.",
    "hardware_disclaimer": "Processing time measured in Python runtime on host CPU; does not represent execution cycle counts or latency on embedded DSP architectures (e.g., TMS320C6748)."
  }
}
```

---

## 7. DSP Methodology

1. **Signal Preprocessing**:
   - $x_{\text{detrended}}[n] = x[n] - \bar{x}$.
   - Moment statistics computed without destructive normalization.
2. **Frequency-Domain Analysis**:
   - Single-sided FFT magnitude spectrum using a Hann window with coherent gain compensation ($2 / \sum w$).
   - Frequency resolution $\Delta f = F_s / N$.
3. **Band Selection via Excess Kurtosis**:
   - Frequency space is divided into candidate sub-bands.
   - Each band is filtered with a 2nd-order Butterworth SOS filter.
   - Fisher excess kurtosis ($\mu_4 / \sigma^4 - 3$) is evaluated for each sub-band.
   - The band with maximum kurtosis is selected as the primary resonance band.
4. **Envelope Demodulation**:
   - Analytic signal constructed using the Hilbert transform: $z[n] = y[n] + j \mathcal{H}\{y[n]\}$.
   - Instantaneous amplitude envelope: $A[n] = |z[n]| = \sqrt{y[n]^2 + (\mathcal{H}\{y[n]\})^2}$.
5. **Characteristic Fault Frequency Kinematics**:
   - Shaft speed $f_r = \text{RPM} / 60$.
   - Geometric ratio $\gamma = \frac{d}{D} \cos(\theta)$.
   - Outer Race ($BPFO$): $\frac{n}{2} f_r (1 - \gamma)$
   - Inner Race ($BPFI$): $\frac{n}{2} f_r (1 + \gamma)$
   - Rolling Element ($BSF$): $\frac{D}{2d} f_r (1 - \gamma^2)$
   - Cage ($FTF$): $\frac{1}{2} f_r (1 - \gamma)$
6. **Fault Indicator ($R_f$)**:
   - $R_f = \frac{M_f}{PN + \epsilon}$
   - $M_f$: Maximum spectral peak within search tolerance window around theoretical fault frequency.
   - $PN$: Local noise floor estimated via median magnitude in adjacent bins outside the peak window.
7. **Adaptive Detection**:
   - Compares $\max(R_f)$ to user-specified threshold (default 3.0).
   - Classifies status as `POTENTIAL_FAULT`, `NO_FAULT_INDICATED`, or `INCONCLUSIVE`.

---

## 8. Limitations of the Preliminary Detector

1. **Simplified Band-Selection**: Kurtosis computed over a small set of candidate Butterworth sub-bands is an engineering simplification. It is not equivalent to a full multi-rate fast kurtogram or optimal minimum entropy deconvolution.
2. **Threshold Calibration**: A high peak-to-noise ratio ($R_f \ge 3.0$) indicates potential harmonic modulation but does not constitute conclusive evidence of physical spalling or mechanical damage without calibration against a known healthy baseline.
3. **Execution Time Disclaimer**: Python runtime processing times measured on general-purpose CPUs include OS scheduling overhead and vectorized C libraries. They should not be conflated with real-time embedded DSP performance (such as on Texas Instruments TMS320C6748).
4. **Slip & Contact Angle Drift**: In real rolling-element bearings under varying axial and radial loads, ball slip and effective contact angle variations may shift actual defect frequencies by $1-2\%$ from nominal kinematic formulas.

---

## 9. Running Tests

Run the full pytest suite from the `backend` directory:

```bash
cd backend
python -m pytest tests/test_api.py -v
```
