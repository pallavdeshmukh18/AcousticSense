"""Comprehensive test suite for the Acoustic Emission Fault Detection API and classical DSP pipeline."""

from __future__ import annotations

import io
import math
import numpy as np
import pytest
import scipy.io.wavfile
from fastapi.testclient import TestClient

from app.main import (
    app,
    calculate_bearing_frequencies,
    compute_frequency_spectrum,
    compute_spectral_kurtosis_bands,
    extract_envelope,
    preprocess_signal,
    signals_db,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_signals():
    """Ensure in-memory signals dictionary is clean for each test."""
    signals_db.clear()
    yield
    signals_db.clear()


# ===========================================================================
# 1. Health Endpoint Tests
# ===========================================================================


def test_health_endpoint():
    """Verifies that GET /api/health returns HTTP 200 with expected operational status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Acoustic Emission Fault Detection API"


# ===========================================================================
# 2. File Upload Tests (CSV & WAV)
# ===========================================================================


def test_csv_upload_single_column():
    """Verifies uploading a single-column CSV signal."""
    # Generate 1000 samples of a 50 Hz sine wave
    fs = 1000.0
    t = np.linspace(0, 1.0, 1000, endpoint=False)
    sine = 2.5 * np.sin(2 * np.pi * 50 * t)

    csv_buffer = io.StringIO()
    csv_buffer.write("acoustic_emission\n")
    for val in sine:
        csv_buffer.write(f"{val}\n")
    csv_bytes = csv_buffer.getvalue().encode("utf-8")

    response = client.post(
        "/api/signals/upload",
        files={"file": ("bearing_test.csv", csv_bytes, "text/csv")},
        data={"sampling_frequency": 1000.0},
    )

    assert response.status_code == 200
    data = response.json()
    assert "signal_id" in data
    assert data["filename"] == "bearing_test.csv"
    assert data["sample_count"] == 1000
    assert data["sampling_frequency"] == 1000.0
    assert pytest.approx(data["duration_seconds"], abs=1e-3) == 1.0
    assert "statistics" in data
    assert pytest.approx(data["statistics"]["mean"], abs=1e-2) == 0.0
    assert pytest.approx(data["statistics"]["peak"], abs=0.1) == 2.5


def test_csv_upload_multiple_columns_and_selection():
    """Verifies multi-column CSV uploads require and respect the column selection."""
    t = np.linspace(0, 0.5, 500, endpoint=False)
    sig1 = np.sin(2 * np.pi * 20 * t)
    sig2 = 5.0 * np.cos(2 * np.pi * 80 * t)

    csv_buffer = io.StringIO()
    csv_buffer.write("time,channel_a,channel_b\n")
    for i in range(len(t)):
        csv_buffer.write(f"{t[i]},{sig1[i]},{sig2[i]}\n")
    csv_bytes = csv_buffer.getvalue().encode("utf-8")

    # Upload without selecting column should return 400
    resp_no_col = client.post(
        "/api/signals/upload",
        files={"file": ("multi_channel.csv", csv_bytes, "text/csv")},
    )
    assert resp_no_col.status_code == 400
    assert "Multiple columns found" in resp_no_col.json()["detail"]

    # Upload with invalid column should return 400
    resp_invalid_col = client.post(
        "/api/signals/upload",
        files={"file": ("multi_channel.csv", csv_bytes, "text/csv")},
        data={"column": "channel_c"},
    )
    assert resp_invalid_col.status_code == 400
    assert "channel_c" in resp_invalid_col.json()["detail"]

    # Upload selecting channel_b
    resp_valid = client.post(
        "/api/signals/upload",
        files={"file": ("multi_channel.csv", csv_bytes, "text/csv")},
        data={"column": "channel_b", "sampling_frequency": 1000.0},
    )
    assert resp_valid.status_code == 200
    data = resp_valid.json()
    assert data["sample_count"] == 500
    assert pytest.approx(data["statistics"]["peak"], abs=0.1) == 5.0


def test_wav_upload_mono_and_multichannel():
    """Verifies uploading mono and multichannel WAV files with integer PCM normalization."""
    wav_fs = 44100
    duration = 0.25
    t = np.linspace(0, duration, int(wav_fs * duration), endpoint=False)
    sine = 0.8 * np.sin(2 * np.pi * 440 * t)

    # 1. Mono 16-bit PCM WAV
    int16_samples = (sine * 32767).astype(np.int16)
    mono_buf = io.BytesIO()
    scipy.io.wavfile.write(mono_buf, wav_fs, int16_samples)
    mono_bytes = mono_buf.getvalue()

    resp_mono = client.post(
        "/api/signals/upload",
        files={"file": ("test_mono.wav", mono_bytes, "audio/wav")},
    )
    assert resp_mono.status_code == 200
    mono_data = resp_mono.json()
    assert mono_data["sampling_frequency"] == 44100.0
    assert mono_data["sample_count"] == len(t)
    assert pytest.approx(mono_data["duration_seconds"], abs=1e-3) == duration
    # Normalized amplitude check
    assert mono_data["statistics"]["max"] <= 1.0
    assert mono_data["statistics"]["min"] >= -1.0
    assert pytest.approx(mono_data["statistics"]["peak"], abs=0.05) == 0.8

    # 2. Stereo (multichannel) WAV converted to mono
    stereo_samples = np.stack([int16_samples, int16_samples], axis=-1)
    stereo_buf = io.BytesIO()
    scipy.io.wavfile.write(stereo_buf, wav_fs, stereo_samples)
    stereo_bytes = stereo_buf.getvalue()

    resp_stereo = client.post(
        "/api/signals/upload",
        files={"file": ("test_stereo.wav", stereo_bytes, "audio/wav")},
    )
    assert resp_stereo.status_code == 200
    stereo_data = resp_stereo.json()
    assert stereo_data["sample_count"] == len(t)
    assert pytest.approx(stereo_data["statistics"]["peak"], abs=0.05) == 0.8


def test_invalid_and_empty_file_uploads():
    """Verifies rejection of empty files, non-numeric CSVs, and malformed files."""
    # 1. Empty file
    resp_empty = client.post(
        "/api/signals/upload",
        files={"file": ("empty.csv", b"", "text/csv")},
    )
    assert resp_empty.status_code == 400
    assert "empty" in resp_empty.json()["detail"].lower()

    # 2. Non-numeric CSV
    csv_text = "label,reading\na,first\nb,second\nc,third"
    resp_non_num = client.post(
        "/api/signals/upload",
        files={"file": ("text.csv", csv_text.encode("utf-8"), "text/csv")},
        data={"column": "reading"},
    )
    assert resp_non_num.status_code == 400
    assert "non-numeric" in resp_non_num.json()["detail"].lower()

    # 3. Corrupted arbitrary binary file
    resp_bad_bin = client.post(
        "/api/signals/upload",
        files={"file": ("corrupt.dat", b"\x00\xff\xee\xdd\x00\x11", "application/octet-stream")},
    )
    assert resp_bad_bin.status_code == 400


# ===========================================================================
# 3. DSP Unit Tests
# ===========================================================================


def test_signal_preprocessing_dc_removal_and_moments():
    """Verifies that DC component is removed while true physical amplitudes are preserved."""
    fs = 1000.0
    t = np.linspace(0, 1.0, 1000, endpoint=False)
    dc_offset = 12.5
    amplitude = 3.0
    raw_sig = dc_offset + amplitude * np.sin(2 * np.pi * 10 * t)

    res = preprocess_signal(raw_sig, fs)
    detrended = res["detrended_signal"]
    stats = res["statistics"]

    # Mean after DC removal must be negligible
    assert pytest.approx(float(np.mean(detrended)), abs=1e-10) == 0.0
    # Standard deviation of sine wave with peak A is A / sqrt(2)
    expected_std = amplitude / np.sqrt(2)
    assert pytest.approx(stats["standard_deviation"], abs=0.05) == expected_std
    assert pytest.approx(stats["rms"], abs=0.05) == expected_std
    # Amplitude should NOT be forced to 1.0
    assert pytest.approx(stats["peak"], abs=0.05) == amplitude


def test_fft_frequency_axis_correctness():
    """Verifies that single-sided FFT correctly maps frequency bin and preserves amplitude."""
    fs = 4000.0
    n = 4000
    t = np.arange(n) / fs
    target_freq = 250.0
    amplitude = 1.75
    clean_sin = amplitude * np.sin(2 * np.pi * target_freq * t)

    res = compute_frequency_spectrum(clean_sin, fs, max_peaks=5)
    dominant_peaks = res["dominant_peaks"]

    assert len(dominant_peaks) > 0
    top_peak = dominant_peaks[0]
    # Frequency bin must match exactly target_freq
    assert pytest.approx(top_peak["frequency_hz"], abs=1.0) == target_freq
    # Amplitude with Hann coherent compensation
    assert pytest.approx(top_peak["magnitude"], abs=0.1) == amplitude
    assert pytest.approx(res["frequency_resolution"], abs=1e-3) == 1.0


def test_bearing_characteristic_frequency_formulas():
    """Verifies bearing defect frequency calculations against theoretical ground truth."""
    # Standard test bearing: n=8, d=7.5 mm, D=34.5 mm, theta=0 deg, shaft RPM=1800 (fr=30 Hz)
    shaft_rpm = 1800.0
    fr = shaft_rpm / 60.0  # 30.0 Hz
    n = 8
    d = 7.5
    d_pitch = 34.5
    theta_deg = 0.0

    freqs = calculate_bearing_frequencies(
        shaft_speed_rpm=shaft_rpm,
        rolling_elements=n,
        ball_diameter=d,
        pitch_diameter=d_pitch,
        contact_angle_deg=theta_deg,
    )

    gamma = (d / d_pitch) * math.cos(math.radians(theta_deg))  # 7.5 / 34.5 = 0.217391
    expected_bpfo = (n / 2.0) * fr * (1.0 - gamma)  # 4 * 30 * (1 - 0.217391) = 93.91 Hz
    expected_bpfi = (n / 2.0) * fr * (1.0 + gamma)  # 4 * 30 * (1 + 0.217391) = 146.09 Hz
    expected_bsf = (d_pitch / (2.0 * d)) * fr * (1.0 - (gamma**2))  # 65.74 Hz
    expected_ftf = 0.5 * fr * (1.0 - gamma)  # 11.74 Hz

    assert pytest.approx(freqs["1X"], abs=0.1) == 30.0
    assert pytest.approx(freqs["BPFO"], abs=0.1) == expected_bpfo
    assert pytest.approx(freqs["BPFI"], abs=0.1) == expected_bpfi
    assert pytest.approx(freqs["BSF"], abs=0.1) == expected_bsf
    assert pytest.approx(freqs["FTF"], abs=0.1) == expected_ftf

    # Geometric validation: D <= d must raise error
    with pytest.raises(ValueError):
        calculate_bearing_frequencies(
            shaft_speed_rpm=1800,
            rolling_elements=8,
            ball_diameter=35.0,
            pitch_diameter=30.0,
            contact_angle_deg=0.0,
        )


def test_spectral_kurtosis_and_band_selection():
    """Verifies that band selection correctly isolates the band containing impulsive bursts."""
    fs = 10000.0
    n = 10000
    t = np.arange(n) / fs

    # Background Gaussian noise (low kurtosis ~ 0)
    np.random.seed(42)
    noise = np.random.normal(0, 0.2, n)

    # Impulsive component localized around high resonant carrier frequency (3500 Hz)
    # Impulses repeat every 0.1 seconds (10 Hz impact rate)
    impulses = np.zeros(n)
    impact_indices = np.arange(0, n, int(fs * 0.1))
    for idx in impact_indices:
        impulses[idx] = 10.0
    sos_res = scipy.signal.butter(2, [3200, 3800], btype="bandpass", fs=fs, output="sos")
    resonant_impulses = scipy.signal.sosfilt(sos_res, impulses)

    synthetic_signal = noise + resonant_impulses

    res = compute_spectral_kurtosis_bands(synthetic_signal, fs, num_bands=4)
    selected_band = res["selected_band"]
    candidate_bands = res["candidate_bands"]

    assert len(candidate_bands) == 4
    # The selected band must span the 3500 Hz resonance
    assert selected_band["low_hz"] <= 3500 <= selected_band["high_hz"]
    # Excess kurtosis in the impulsive band should be significantly positive
    assert selected_band["kurtosis"] > 3.0


def test_envelope_extraction_hilbert():
    """Verifies that Hilbert transform correctly demodulates amplitude-modulated signals."""
    fs = 4000.0
    n = 4000
    t = np.arange(n) / fs
    fc = 800.0  # Carrier frequency
    fm = 20.0   # Modulation frequency
    modulation = 1.0 + 0.6 * np.cos(2 * np.pi * fm * t)
    signal = modulation * np.sin(2 * np.pi * fc * t)

    envelope, stats, display_samples = extract_envelope(signal)

    # Envelope should be strictly positive
    assert np.all(envelope >= 0.0)
    # Peak of modulation is 1.0 + 0.6 = 1.6
    assert pytest.approx(stats["peak"], abs=0.1) == 1.6
    # Mean of envelope should be near 1.0
    assert pytest.approx(stats["mean"], abs=0.1) == 1.0
    assert len(display_samples) <= 1000


# ===========================================================================
# 4. API End-to-End Analysis & Validation Tests
# ===========================================================================


def test_analysis_endpoint_unknown_signal_id():
    """Verifies that querying a non-existent signal returns HTTP 404."""
    resp = client.post(
        "/api/analysis/run",
        json={"signal_id": "non_existent_sig_12345"},
    )
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_analysis_missing_sampling_frequency():
    """Verifies that analysis fails if no sampling frequency is known."""
    # Upload CSV without sampling frequency (valid single header, repeating numbers)
    csv_bytes = ("sig\n" + "\n".join(["1.0", "2.0", "3.0", "4.0"] * 25)).encode("utf-8")
    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("no_fs.csv", csv_bytes, "text/csv")},
    )
    assert up_resp.status_code == 200
    sig_id = up_resp.json()["signal_id"]

    # Run analysis without specifying sampling_frequency
    run_resp = client.post(
        "/api/analysis/run",
        json={"signal_id": sig_id},
    )
    assert run_resp.status_code == 400
    assert "sampling frequency is required" in run_resp.json()["detail"].lower()


def test_analysis_invalid_bearing_geometry():
    """Verifies that invalid bearing parameters (pitch diameter <= ball diameter) are rejected."""
    # Upload valid signal
    sig = np.random.normal(0, 1, 1000)
    csv_bytes = ("sig\n" + "\n".join(str(x) for x in sig)).encode("utf-8")
    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("test.csv", csv_bytes, "text/csv")},
        data={"sampling_frequency": 1000.0},
    )
    sig_id = up_resp.json()["signal_id"]

    # Bearing with ball diameter greater than pitch diameter
    bad_req = {
        "signal_id": sig_id,
        "shaft_speed_rpm": 1800,
        "bearing": {
            "rolling_elements": 8,
            "ball_diameter": 40.0,
            "pitch_diameter": 30.0,  # Invalid: D <= d
            "contact_angle_deg": 0.0,
        },
    }
    resp = client.post("/api/analysis/run", json=bad_req)
    assert resp.status_code == 422


def test_analysis_too_short_signal():
    """Verifies that signals with insufficient sample length are cleanly rejected."""
    short_csv = b"val\n1.0\n2.0\n3.0\n4.0\n5.0\n"
    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("short.csv", short_csv, "text/csv")},
        data={"sampling_frequency": 1000.0},
    )
    sig_id = up_resp.json()["signal_id"]

    resp = client.post("/api/analysis/run", json={"signal_id": sig_id})
    assert resp.status_code == 400
    assert "too short" in resp.json()["detail"].lower()


def test_complete_dsp_analysis_with_synthetic_fault():
    """Verifies complete 8-stage DSP pipeline on a simulated outer race bearing fault (BPFO)."""
    fs = 12000.0
    duration = 0.5
    n = int(fs * duration)
    t = np.arange(n) / fs

    # Machine operating at 1800 RPM (fr = 30 Hz)
    # Bearing: n=8, d=7.5 mm, D=34.5 mm, theta=0 deg -> Theoretical BPFO = 93.91 Hz
    bpfo_freq = 93.91
    carrier_freq = 3000.0

    # Generate repetitive transients repeating at BPFO
    t_period = 1.0 / bpfo_freq
    impulse_train = np.zeros(n)
    impact_times = np.arange(0, duration, t_period)
    decay_samples = int(fs * 0.005)  # 5 ms ring-down
    decay_t = np.arange(decay_samples) / fs
    transient = np.exp(-decay_t * 600.0) * np.sin(2 * np.pi * carrier_freq * decay_t)

    for imp_t in impact_times:
        start_idx = int(imp_t * fs)
        if start_idx + decay_samples <= n:
            impulse_train[start_idx : start_idx + decay_samples] += 3.0 * transient

    # Add Gaussian noise
    np.random.seed(123)
    noise = np.random.normal(0, 0.1, n)
    fault_signal = impulse_train + noise

    # Upload as WAV to test end-to-end WAV workflow
    wav_buf = io.BytesIO()
    # Normalize to int16
    norm_sig = fault_signal / np.max(np.abs(fault_signal))
    int16_sig = (norm_sig * 30000).astype(np.int16)
    scipy.io.wavfile.write(wav_buf, int(fs), int16_sig)

    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("simulated_bearing_fault.wav", wav_buf.getvalue(), "audio/wav")},
    )
    assert up_resp.status_code == 200
    sig_id = up_resp.json()["signal_id"]

    # Run analysis with bearing parameters
    req = {
        "signal_id": sig_id,
        "shaft_speed_rpm": 1800,
        "detection_threshold": 2.5,
        "bearing": {
            "rolling_elements": 8,
            "ball_diameter": 7.5,
            "pitch_diameter": 34.5,
            "contact_angle_deg": 0.0,
        },
    }

    run_resp = client.post("/api/analysis/run", json=req)
    assert run_resp.status_code == 200
    res = run_resp.json()

    # Check required top-level keys
    for key in [
        "signal",
        "preprocessing",
        "frequency_analysis",
        "spectral_kurtosis",
        "bandpass_filtering",
        "envelope_analysis",
        "detection",
        "performance",
    ]:
        assert key in res, f"Missing key '{key}' in response"

    # Verify no NaN or Inf in JSON output
    def check_no_nan_inf(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                check_no_nan_inf(v)
        elif isinstance(obj, list):
            for v in obj:
                check_no_nan_inf(v)
        elif isinstance(obj, float):
            assert not math.isnan(obj) and not math.isinf(obj)

    check_no_nan_inf(res)

    # Verify BPFO detection
    fault_indicators = res["envelope_analysis"]["fault_indicators"]
    bpfo_ind = next((ind for ind in fault_indicators if ind["fault_type"] == "BPFO"), None)
    assert bpfo_ind is not None
    assert pytest.approx(bpfo_ind["theoretical_hz"], abs=0.5) == bpfo_freq
    # Should identify BPFO component above noise floor
    assert bpfo_ind["indicator_rf"] >= 2.5

    # Check adaptive detection status
    detection = res["detection"]
    assert detection["status"] == "POTENTIAL_FAULT"
    assert detection["score"] >= 2.5
    assert len(detection["supporting_peaks"]) > 0


def test_analysis_without_bearing_parameters_returns_inconclusive():
    """Verifies that running analysis without bearing parameters returns INCONCLUSIVE."""
    sig = np.random.normal(0, 1, 2000)
    csv_bytes = ("sig\n" + "\n".join(str(x) for x in sig)).encode("utf-8")
    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("healthy.csv", csv_bytes, "text/csv")},
        data={"sampling_frequency": 4000.0},
    )
    sig_id = up_resp.json()["signal_id"]

    resp = client.post(
        "/api/analysis/run",
        json={"signal_id": sig_id},
    )
    assert resp.status_code == 200
    res = resp.json()
    assert res["detection"]["status"] == "INCONCLUSIVE"
    assert res["detection"]["score"] is None
    assert "not provided" in res["detection"]["reason"].lower()


def test_analysis_pure_noise_yields_no_fault_indicated():
    """Verifies that pure Gaussian noise with bearing parameters yields NO_FAULT_INDICATED."""
    np.random.seed(99)
    noise = np.random.normal(0, 1, 4000)
    csv_bytes = ("sig\n" + "\n".join(str(x) for x in noise)).encode("utf-8")
    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("pure_noise.csv", csv_bytes, "text/csv")},
        data={"sampling_frequency": 4000.0},
    )
    sig_id = up_resp.json()["signal_id"]

    req = {
        "signal_id": sig_id,
        "shaft_speed_rpm": 1800,
        "detection_threshold": 3.0,
        "bearing": {
            "rolling_elements": 8,
            "ball_diameter": 7.5,
            "pitch_diameter": 34.5,
            "contact_angle_deg": 0.0,
        },
    }
    resp = client.post("/api/analysis/run", json=req)
    assert resp.status_code == 200
    res = resp.json()
    assert res["detection"]["status"] == "NO_FAULT_INDICATED"
    assert res["detection"]["score"] < 3.0
    assert len(res["detection"]["supporting_peaks"]) == 0


# ===========================================================================
# 5. Block-Length Experiment Tests
# ===========================================================================



def test_block_length_experiment_validation():
    """Verifies block-length experiment execution across valid and oversized block lengths."""
    # Signal of 2000 samples
    fs = 2000.0
    sig = np.random.normal(0, 1, 2000)
    csv_bytes = ("sig\n" + "\n".join(str(x) for x in sig)).encode("utf-8")

    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("experiment_test.csv", csv_bytes, "text/csv")},
        data={"sampling_frequency": fs},
    )
    sig_id = up_resp.json()["signal_id"]

    exp_resp = client.post(
        "/api/experiments/block-length",
        json={
            "signal_id": sig_id,
            "block_lengths": [256, 512, 1024, 4096],
        },
    )
    assert exp_resp.status_code == 200
    exp_data = exp_resp.json()

    assert exp_data["signal_id"] == sig_id
    assert exp_data["total_samples"] == 2000
    results = exp_data["experiment_results"]
    assert len(results) == 4

    # 1. Block length 256: 2000 // 256 = 7 complete blocks, 208 discarded samples
    res_256 = results[0]
    assert res_256["block_length"] == 256
    assert res_256["valid"] is True
    assert res_256["num_complete_blocks"] == 7
    assert res_256["discarded_samples"] == 208
    assert "mean_kurtosis" in res_256
    assert "processing_time_ms" in res_256

    # 2. Block length 4096: exceeds signal length -> valid: False
    res_4096 = results[3]
    assert res_4096["block_length"] == 4096
    assert res_4096["valid"] is False
    assert res_4096["num_complete_blocks"] == 0
    assert "insufficient" in res_4096["reason"].lower()

    # Notes disclaimer
    assert "hardware_disclaimer" in exp_data["notes"]
    assert "TMS320C6748" in exp_data["notes"]["hardware_disclaimer"]


def test_benchmark_results_endpoint():
    """Verifies that GET /api/benchmark/results returns the 6 CWRU benchmark files and ROC metrics."""
    response = client.get("/api/benchmark/results")
    assert response.status_code == 200
    data = response.json()
    assert "full_file_results" in data
    assert "threshold_metrics" in data
    assert len(data["full_file_results"]) == 6
    assert len(data["threshold_metrics"]) >= 5
    # Verify healthy baseline is marked NO_FAULT_INDICATED
    normal_entry = next((r for r in data["full_file_results"] if r["name"] == "cwru_normal_baseline_12k"), None)
    assert normal_entry is not None
    assert normal_entry["detected_status"] == "NO_FAULT_INDICATED"


def test_precision_experiment_endpoint():
    """Verifies Hypothesis H2 precision evaluation endpoint on an uploaded signal."""
    # Create 2000 samples of synthetic sine wave
    fs = 1000.0
    t = np.linspace(0, 2.0, 2000, endpoint=False)
    sine = 1.5 * np.sin(2 * np.pi * 50 * t)

    csv_buf = io.StringIO()
    csv_buf.write("val\n")
    for v in sine:
        csv_buf.write(f"{v}\n")

    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("prec_test.csv", csv_buf.getvalue().encode("utf-8"), "text/csv")},
        data={"sampling_frequency": 1000.0},
    )
    sig_id = up_resp.json()["signal_id"]

    prec_resp = client.post(
        "/api/experiments/precision",
        json={"signal_id": sig_id, "block_length": 512, "lpc_orders": [2, 4, 8, 16]},
    )
    assert prec_resp.status_code == 200
    data = prec_resp.json()
    assert "formats" in data
    assert len(data["formats"]) == 5
    assert data["hypothesis_h2_status"] == "CONFIRMED"
    assert "lpc_stability_sweep" in data
    assert len(data["lpc_stability_sweep"]) == 4


def test_ringing_experiment_endpoint():
    """Verifies Hypothesis H3 filter ringing evaluation endpoint on an uploaded signal."""
    fs = 12000.0
    t = np.linspace(0, 1.0, 12000, endpoint=False)
    # Synthetic impulse bursts at 100 Hz
    sig = 0.05 * np.random.randn(12000)
    for i in range(0, 12000, 120):
        sig[i : min(i + 10, 12000)] += 3.0

    csv_buf = io.StringIO()
    csv_buf.write("val\n")
    for v in sig:
        csv_buf.write(f"{v}\n")

    up_resp = client.post(
        "/api/signals/upload",
        files={"file": ("ringing_test.csv", csv_buf.getvalue().encode("utf-8"), "text/csv")},
        data={"sampling_frequency": fs},
    )
    sig_id = up_resp.json()["signal_id"]

    resp = client.post(
        "/api/experiments/ringing",
        json={
            "signal_id": sig_id,
            "fault_frequency": 100.0,
            "center_frequency": 2500.0,
            "bandwidths": [100.0, 300.0, 800.0, 1600.0],
            "filter_order": 2,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["fault_frequency_hz"] == 100.0
    assert data["impact_interval_ms"] == 10.0
    assert data["hypothesis_h3_status"] == "CONFIRMED"
    assert "bandwidth_results" in data
    assert len(data["bandwidth_results"]) == 4
    # Check that smearing regime is classified
    assert data["bandwidth_results"][0]["smearing_regime"] in ["Severe Smearing", "Transitional", "Negligible Smearing"]


