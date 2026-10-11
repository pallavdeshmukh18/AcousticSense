"""Tests for AI Interpretation feature (Groq integration).

All external Groq API calls are strictly mocked. Tests do not require a live API key.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app, signals_db, analyses_db
from app.ai_interpreter import build_bounded_dsp_context

client = TestClient(app)


MOCK_VALID_GROQ_CONTENT = {
    "title": "Acoustic Emission Signal Analysis & Interpretation",
    "executive_summary": "The classical DSP analysis indicates potential outer-race bearing fault symptoms with prominent impulse modulation.",
    "signal_overview": "Ingested signal comprises 2048 samples at 20,000 Hz with a crest factor of 4.2.",
    "pipeline_explanation": [
        {
            "stage": "Stage 1: Preprocessing & Detrending",
            "what_happened": "Zero-mean centering was performed to remove DC bias.",
            "why_it_matters": "Eliminates sensor drift while preserving acoustic burst dynamics.",
            "observed_result": "DC offset removed; RMS calculated at 0.045.",
        },
        {
            "stage": "Stage 3: Spectral Kurtosis",
            "what_happened": "Candidate frequency sub-bands were screened for impulsive transient content.",
            "why_it_matters": "Identifies resonance bands where periodic impacts modulate high-frequency carriers.",
            "observed_result": "Optimal band selected: 5,000 - 7,500 Hz with kurtosis of 5.8.",
        },
    ],
    "key_findings": [
        {
            "title": "Elevated Peak-to-Noise Ratio at BPFO",
            "measurement": "BPFO = 107.5 Hz, Rf = 4.21",
            "explanation": "A significant envelope modulation peak matches the outer race fault frequency.",
            "significance": "Suggests periodic impact generation typical of localized raceway defects.",
            "limitations": "Requires baseline confirmation against an unloaded healthy reference.",
        }
    ],
    "bearing_interpretation": {
        "available": True,
        "summary": "Bearing kinematic parameters were supplied; BPFO exhibits Rf exceeding the 3.0 threshold.",
        "indicators": [
            {
                "name": "BPFO",
                "reference_frequency_hz": 107.3,
                "observed_peak_frequency_hz": 107.5,
                "indicator_rf": 4.21,
                "interpretation": "Elevated indicator consistent with outer raceway impact frequency.",
            }
        ],
    },
    "plain_language_explanation": "Imagine a wheel rolling over a pothole at regular intervals. Each impact creates a ring that envelope analysis isolates from background noise.",
    "limitations": [
        "Short recording duration may limit resolution of low-frequency modulation sidebands.",
        "Threshold of 3.0 is preliminary and not calibrated against physical machine load.",
    ],
    "recommended_next_steps": [
        {
            "priority": "High",
            "action": "Inspect physical bearing housing for outer ring spalling or lubrication loss.",
            "reason": "BPFO indicator exceeded the detection threshold at 4.21.",
        }
    ],
    "glossary": [
        {
            "term": "BPFO",
            "definition": "Ball Pass Frequency Outer Race: rate at which balls roll over an outer ring defect.",
        },
        {
            "term": "Envelope Analysis",
            "definition": "Technique utilizing the Hilbert transform to extract low-frequency repetition rates of high-frequency impacts.",
        },
    ],
}


@pytest.fixture(autouse=True)
def clean_in_memory_stores():
    """Cleans in-memory signal and analysis state between tests."""
    signals_db.clear()
    analyses_db.clear()
    yield
    signals_db.clear()
    analyses_db.clear()


def create_and_analyze_sample_signal() -> tuple[str, str]:
    """Helper to upload a signal and run analysis, returning (signal_id, analysis_id)."""
    fs = 20000.0
    t = np.linspace(0, 0.1, int(fs * 0.1), endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * 100 * t) + 0.1 * np.random.randn(len(t))

    csv_content = "amplitude\n" + "\n".join(f"{xi:.6f}" for xi in signal)
    upload_res = client.post(
        "/api/signals/upload",
        files={"file": ("bearing_test.csv", csv_content.encode("utf-8"), "text/csv")},
        data={"sampling_frequency": str(fs)},
    )
    assert upload_res.status_code == 200
    signal_id = upload_res.json()["signal_id"]

    analysis_res = client.post(
        "/api/analysis/run",
        json={
            "signal_id": signal_id,
            "shaft_speed_rpm": 1800,
            "bearing": {
                "rolling_elements": 8,
                "ball_diameter": 7.5,
                "pitch_diameter": 34.5,
                "contact_angle_deg": 0.0,
            },
            "detection_threshold": 3.0,
        },
    )
    assert analysis_res.status_code == 200
    analysis_id = analysis_res.json()["analysis_id"]
    return signal_id, analysis_id


def test_interpret_missing_signal():
    """Requesting interpretation for non-existent signal returns 404."""
    response = client.post(
        "/api/analysis/interpret",
        json={"signal_id": "sig_nonexistent"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_interpret_without_prior_analysis():
    """Requesting interpretation before running DSP returns 404."""
    fs = 10000.0
    t = np.linspace(0, 0.05, 500)
    csv_content = "amplitude\n" + "\n".join("0.1" for _ in t)
    upload_res = client.post(
        "/api/signals/upload",
        files={"file": ("untested.csv", csv_content.encode("utf-8"), "text/csv")},
        data={"sampling_frequency": str(fs)},
    )
    assert upload_res.status_code == 200
    signal_id = upload_res.json()["signal_id"]

    response = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id},
    )
    assert response.status_code == 404
    assert "No completed DSP analysis found" in response.json()["detail"]


def test_interpret_missing_groq_api_key(monkeypatch):
    """Missing GROQ_API_KEY returns 503 with safe informational message."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setattr("app.ai_interpreter.get_groq_api_key", lambda: "")
    signal_id, analysis_id = create_and_analyze_sample_signal()

    response = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert response.status_code == 503
    assert "GROQ_API_KEY" in response.json()["detail"]


@patch("httpx.AsyncClient.post")
def test_interpret_successful_groq_response(mock_post, monkeypatch):
    """Successful Groq completion returns structured InterpretationResponse."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_mock_key_secret123")
    monkeypatch.setenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    signal_id, analysis_id = create_and_analyze_sample_signal()

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": json.dumps(MOCK_VALID_GROQ_CONTENT)}}]
    }
    mock_post.return_value = mock_resp

    response = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["analysis_id"] == analysis_id
    assert data["signal_id"] == signal_id
    assert data["model_used"] == "llama-3.3-70b-versatile"
    assert "executive_summary" in data
    assert len(data["pipeline_explanation"]) == 2
    assert len(data["key_findings"]) == 1
    assert data["bearing_interpretation"]["available"] is True
    assert len(data["glossary"]) == 2


@patch("httpx.AsyncClient.post")
def test_interpret_caching(mock_post, monkeypatch):
    """Subsequent requests for the same completed analysis hit in-memory cache without extra Groq calls."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_mock_key")
    signal_id, analysis_id = create_and_analyze_sample_signal()

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": json.dumps(MOCK_VALID_GROQ_CONTENT)}}]
    }
    mock_post.return_value = mock_resp

    # First call triggers mock Groq
    res1 = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert res1.status_code == 200
    assert mock_post.call_count == 1

    # Second call returns cached interpretation
    res2 = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert res2.status_code == 200
    assert mock_post.call_count == 1  # Not incremented


def test_bounded_dsp_context_excludes_raw_waveform():
    """Verify that build_bounded_dsp_context strictly excludes raw time series arrays."""
    raw_signal = np.sin(np.linspace(0, 10, 5000)).tolist()
    analysis_data = {
        "signal": {"signal_id": "s1", "sampling_frequency": 10000, "sample_count": 5000, "duration_seconds": 0.5},
        "preprocessing": {"rms": 0.5, "crest_factor": 3.0, "kurtosis": 4.1},
        "frequency_analysis": {
            "frequency_resolution": 2.0,
            "dominant_peaks": [{"frequency_hz": 100.0, "magnitude": 1.2}],
            "spectrum": {"frequencies": list(range(1000)), "magnitudes": list(range(1000))},  # Large array
        },
        "spectral_kurtosis": {"selected_band": {"low_hz": 100, "high_hz": 200, "kurtosis": 4.0}},
        "bandpass_filtering": {"filter_type": "Butterworth", "order": 2, "mode": "SOS", "passband_hz": [100, 200]},
        "envelope_analysis": {
            "dominant_peaks": [{"frequency_hz": 50.0, "magnitude": 0.8}],
            "envelope_samples": list(range(1000)),  # Large array
            "envelope_spectrum": {"frequencies": list(range(1000)), "magnitudes": list(range(1000))},  # Large array
        },
        "detection": {"status": "NO_FAULT_INDICATED", "score": 1.5, "threshold": 3.0, "reason": "Normal"},
        "performance": {"processing_time_ms": 12.5},
    }

    bounded = build_bounded_dsp_context(analysis_data, {"filename": "sensor.csv", "signal": raw_signal})

    json_str = json.dumps(bounded)
    # Ensure raw large arrays are NOT present
    assert "envelope_samples" not in json_str
    assert len(json_str) < 5000  # Compact bounded context


@patch("httpx.AsyncClient.post")
def test_interpret_malformed_groq_json(mock_post, monkeypatch):
    """Malformed Groq JSON is caught safely with 502 without exposing stack traces."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_key")
    signal_id, analysis_id = create_and_analyze_sample_signal()

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": "This is plain text, not JSON"}}]
    }
    mock_post.return_value = mock_resp

    res = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert res.status_code == 502
    assert "AI interpretation parsing error" in res.json()["detail"]


@patch("httpx.AsyncClient.post")
def test_interpret_groq_timeout(mock_post, monkeypatch):
    """Timeout during Groq call returns 504 Gateway Timeout."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_key")
    signal_id, analysis_id = create_and_analyze_sample_signal()

    mock_post.side_effect = httpx.TimeoutException("Read timed out")

    res = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert res.status_code == 504
    assert "timed out" in res.json()["detail"].lower()


@patch("httpx.AsyncClient.post")
def test_interpret_groq_auth_failure(mock_post, monkeypatch):
    """Groq 401 response returns 503 without leaking credentials."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_invalid_secret")
    signal_id, analysis_id = create_and_analyze_sample_signal()

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Invalid API key"
    mock_post.return_value = mock_resp

    res = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert res.status_code == 503
    assert "authentication failed" in res.json()["detail"].lower()
    assert "gsk_invalid_secret" not in res.json()["detail"]


@patch("httpx.AsyncClient.post")
def test_interpret_groq_model_not_found_fallback(mock_post, monkeypatch):
    """When configured model returns 404 model_not_found, system automatically falls back to verified model."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_key")
    monkeypatch.setenv("GROQ_MODEL", "unavailable-custom-model")
    signal_id, analysis_id = create_and_analyze_sample_signal()

    mock_resp_404 = MagicMock()
    mock_resp_404.status_code = 404
    mock_resp_404.text = json.dumps({"error": {"message": "The model `unavailable-custom-model` does not exist", "code": "model_not_found"}})

    mock_resp_200 = MagicMock()
    mock_resp_200.status_code = 200
    mock_resp_200.json.return_value = {
        "choices": [{"message": {"content": json.dumps(MOCK_VALID_GROQ_CONTENT)}}]
    }

    # First call returns 404, fallback call returns 200
    mock_post.side_effect = [mock_resp_404, mock_resp_200]

    res = client.post(
        "/api/analysis/interpret",
        json={"signal_id": signal_id, "analysis_id": analysis_id},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["model_used"] == "qwen/qwen3.8-27b"
    assert mock_post.call_count == 2

