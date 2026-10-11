"""AI Interpretation Service for AcousticSense DSP Analysis.

Uses Groq's OpenAI-compatible API to provide structured, accessible,
and scientifically grounded explanations of deterministic DSP results.
"""

from __future__ import annotations

import asyncio
import datetime
import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger("acousticsense.ai_interpreter")

# ---------------------------------------------------------------------------
# Configuration & Constants
# ---------------------------------------------------------------------------

DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b"
FALLBACK_GROQ_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
REQUEST_TIMEOUT_SECONDS = 45.0


def get_groq_api_key() -> str:
    """Retrieves GROQ_API_KEY from environment or auto-loads from .env files."""
    key = os.getenv("GROQ_API_KEY", "").strip()
    if key:
        return key

    # Search candidates: backend/.env, cwd/.env, cwd/backend/.env
    candidates = [
        Path(__file__).resolve().parent.parent / ".env",
        Path.cwd() / "backend" / ".env",
        Path.cwd() / ".env",
    ]
    for env_file in candidates:
        if env_file.is_file():
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v
                        if k == "GROQ_API_KEY" and v:
                            key = v
            except Exception as exc:
                logger.debug(f"Failed to read env candidate {env_file}: {exc}")
        if key:
            break

    return key or os.getenv("GROQ_API_KEY", "").strip()


def get_groq_model() -> str:
    """Retrieves GROQ_MODEL, prioritizing environment variables and backend/.env."""
    model = os.getenv("GROQ_MODEL", "").strip()
    if not model:
        candidates = [
            Path(__file__).resolve().parent.parent / ".env",
            Path.cwd() / "backend" / ".env",
            Path.cwd() / ".env",
        ]
        for env_file in candidates:
            if env_file.is_file():
                try:
                    with open(env_file, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("GROQ_MODEL="):
                                val = line.split("=", 1)[1].strip().strip("'\"")
                                if val:
                                    model = val
                                    break
                except Exception:
                    pass
            if model:
                break

    if not model:
        model = DEFAULT_GROQ_MODEL

    # If model is an unreleased or invalid model like llama-4, map to default verified model
    if "llama-4" in model:
        logger.warning(
            f"Configured model '{model}' is not available on Groq. "
            f"Using '{DEFAULT_GROQ_MODEL}'."
        )
        model = DEFAULT_GROQ_MODEL

    return model


# ---------------------------------------------------------------------------
# Pydantic Schemas for AI Interpretation
# ---------------------------------------------------------------------------


class PipelineStageExplanation(BaseModel):
    stage: str = Field(..., description="Stage name or number, e.g. 'Stage 3: Spectral Kurtosis'")
    what_happened: str = Field(..., description="What physical/mathematical operation was performed")
    why_it_matters: str = Field(..., description="Why this step is critical for bearing diagnosis")
    observed_result: str = Field(..., description="The concrete numerical outcome observed in this analysis")


class FindingItem(BaseModel):
    title: str = Field(..., description="Short finding headline")
    measurement: Optional[str] = Field(None, description="Measured numerical value or frequency band, if applicable")
    explanation: str = Field(..., description="Plain-language explanation of this finding")
    significance: str = Field(..., description="Engineering significance of the finding")
    limitations: Optional[str] = Field(None, description="Limitations or caveats regarding this finding")


class BearingIndicatorItem(BaseModel):
    name: str = Field(..., description="Fault code, e.g. BPFO, BPFI, BSF, FTF")
    reference_frequency_hz: Optional[float] = Field(None, description="Theoretical kinematic defect frequency in Hz")
    observed_peak_frequency_hz: Optional[float] = Field(None, description="Detected peak frequency in envelope spectrum")
    indicator_rf: Optional[float] = Field(None, description="Peak-to-noise floor ratio Rf")
    interpretation: str = Field(..., description="Scientific interpretation of this indicator relative to threshold")


class BearingInterpretation(BaseModel):
    available: bool = Field(..., description="True if bearing kinematics and shaft speed were supplied and evaluated")
    summary: str = Field(..., description="Overall summary of bearing kinematic fault evaluation")
    indicators: list[BearingIndicatorItem] = Field(default_factory=list, description="Evaluation for each fault frequency")


class NextStepItem(BaseModel):
    priority: str = Field(..., description="'High', 'Medium', or 'Low'")
    action: str = Field(..., description="Recommended investigation or engineering action")
    reason: str = Field(..., description="Reason based on actual data and limitations")


class GlossaryItem(BaseModel):
    term: str = Field(..., description="Technical term, acronym, or metric")
    definition: str = Field(..., description="Accessible, intuitive definition tailored to this context")


class InterpretationResponse(BaseModel):
    analysis_id: str = Field(..., description="Unique ID of the underlying DSP analysis")
    signal_id: str = Field(..., description="ID of the analyzed signal")
    title: str = Field(default="Acoustic Emission Signal Analysis & Interpretation")
    executive_summary: str = Field(..., description="Concise explanation of the overall DSP outcome")
    signal_overview: str = Field(..., description="Overview of the ingested signal characteristics and data quality")
    pipeline_explanation: list[PipelineStageExplanation] = Field(
        ..., description="Step-by-step breakdown of the classical DSP pipeline stages executed"
    )
    key_findings: list[FindingItem] = Field(..., description="Most critical observations from the numerical results")
    bearing_interpretation: BearingInterpretation = Field(
        ..., description="Comparison with theoretical bearing fault frequencies"
    )
    plain_language_explanation: str = Field(
        ..., description="Intuitive explanation suitable for students and non-specialists"
    )
    limitations: list[str] = Field(..., description="Documented limitations, assumptions, and uncertainties")
    recommended_next_steps: list[NextStepItem] = Field(
        ..., description="Prioritized recommendations for further inspection"
    )
    glossary: list[GlossaryItem] = Field(..., description="Glossary of terms appearing in the report")
    model_used: str = Field(..., description="Groq model identifier used for generation")
    generated_at: str = Field(..., description="ISO 8601 timestamp of interpretation creation")


class InterpretRequest(BaseModel):
    signal_id: str = Field(..., description="ID of the uploaded signal")
    analysis_id: Optional[str] = Field(None, description="Specific analysis ID to interpret (optional)")


# ---------------------------------------------------------------------------
# Bounded Context Builder
# ---------------------------------------------------------------------------


def build_bounded_dsp_context(
    analysis_result: dict[str, Any],
    signal_meta: dict[str, Any],
    parameters: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Extracts a bounded, compact numerical summary from the full DSP analysis.

    CRITICAL GUARDRAIL: Raw waveforms and large frequency series arrays are
    strictly excluded to prevent prompt bloat and maintain token efficiency.
    Only calculated statistics, top peaks, filter parameters, and detection
    metrics are preserved.
    """
    sig = analysis_result.get("signal", {})
    prep = analysis_result.get("preprocessing", {})
    freq = analysis_result.get("frequency_analysis", {})
    sk = analysis_result.get("spectral_kurtosis", {})
    filt = analysis_result.get("bandpass_filtering", {})
    env = analysis_result.get("envelope_analysis", {})
    det = analysis_result.get("detection", {})
    perf = analysis_result.get("performance", {})

    # Top spectrum dominant peaks (at most 8)
    spectrum_peaks = [
        {"frequency_hz": p.get("frequency_hz"), "magnitude": p.get("magnitude")}
        for p in (freq.get("dominant_peaks") or [])[:8]
    ]

    # Candidate bands from spectral kurtosis
    candidate_bands = [
        {
            "low_hz": b.get("low_hz"),
            "high_hz": b.get("high_hz"),
            "kurtosis": b.get("kurtosis"),
        }
        for b in (sk.get("candidate_bands") or [])[:6]
    ]

    # Top envelope spectrum dominant peaks (at most 8)
    env_peaks = [
        {"frequency_hz": p.get("frequency_hz"), "magnitude": p.get("magnitude")}
        for p in (env.get("dominant_peaks") or [])[:8]
    ]

    # Fault indicators (BPFO, BPFI, BSF, FTF)
    fault_indicators = [
        {
            "fault_type": ind.get("fault_type"),
            "theoretical_hz": ind.get("theoretical_hz"),
            "detected_hz": ind.get("detected_hz"),
            "magnitude": ind.get("magnitude"),
            "noise_floor": ind.get("noise_floor"),
            "indicator_rf": ind.get("indicator_rf"),
        }
        for ind in (env.get("fault_indicators") or [])
    ]

    return {
        "signal_metadata": {
            "signal_id": sig.get("signal_id"),
            "filename": signal_meta.get("filename", "uploaded_signal"),
            "sampling_frequency_hz": sig.get("sampling_frequency"),
            "sample_count": sig.get("sample_count"),
            "duration_seconds": sig.get("duration_seconds"),
        },
        "preprocessing_statistics": {
            "mean": prep.get("mean"),
            "standard_deviation": prep.get("standard_deviation"),
            "rms": prep.get("rms"),
            "peak": prep.get("peak"),
            "crest_factor": prep.get("crest_factor"),
            "kurtosis_fisher": prep.get("kurtosis"),
        },
        "frequency_domain_summary": {
            "frequency_resolution_hz": freq.get("frequency_resolution"),
            "dominant_peaks": spectrum_peaks,
        },
        "spectral_kurtosis_summary": {
            "selected_resonance_band": sk.get("selected_band"),
            "candidate_bands": candidate_bands,
            "method_note": sk.get("method_note"),
        },
        "bandpass_filtering_configuration": {
            "filter_type": filt.get("filter_type"),
            "order": filt.get("order"),
            "mode": filt.get("mode"),
            "passband_hz": filt.get("passband_hz"),
        },
        "envelope_analysis_summary": {
            "envelope_statistics": env.get("envelope_statistics"),
            "dominant_envelope_peaks": env_peaks,
            "fault_characteristic_frequencies_hz": env.get("fault_frequencies") or {},
            "fault_indicators": fault_indicators,
        },
        "detection_decision": {
            "status": det.get("status"),
            "score_rf": det.get("score"),
            "threshold": det.get("threshold"),
            "reason": det.get("reason"),
            "supporting_peaks": det.get("supporting_peaks") or [],
        },
        "computational_performance": {
            "processing_time_ms": perf.get("processing_time_ms"),
        },
        "user_parameters": {
            "shaft_speed_rpm": parameters.get("shaft_speed_rpm") if parameters else None,
            "block_length": parameters.get("block_length") if parameters else None,
            "bearing_geometry_provided": bool(parameters and parameters.get("bearing")),
        },
    }


# ---------------------------------------------------------------------------
# Prompt Engineering & System Instructions
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a rigorous, distinguished Digital Signal Processing (DSP) engineer and technical educator specializing in rotating machinery vibration and acoustic emission fault diagnosis.
Your task is to interpret the deterministic output of an 8-stage classical DSP pipeline for a user who may range from an engineering student to a senior reliability specialist.

CRITICAL SCIENTIFIC GUARDRAILS:
1. GROUNDED TRUTH ONLY: The provided JSON analysis context contains the ONLY measured facts. Do NOT invent, extrapolate, or hallucinate peaks, amplitudes, frequencies, or defect classifications.
2. OBSERVATION VS INTERPRETATION: Clearly separate objective numerical observations (e.g., "A peak at 107.5 Hz with Rf=4.2 was detected") from engineering interpretation (e.g., "This aligns closely with the outer race passing frequency BPFO").
3. NO DEFINITIVE DIAGNOSIS: Classical DSP indicates acoustic/vibration anomalies, not definitive metallurgical machine failure. Explicitly clarify that detection of an indicator is a preliminary signal anomaly requiring physical verification, lubrication checks, or baseline comparison.
4. BEARING KINEMATICS CONDITIONALITY:
   - If bearing_geometry_provided is true and fault_indicators has items, compare measured peaks against theoretical BPFO, BPFI, BSF, FTF.
   - If bearing_geometry_provided is false or fault_indicators is empty, explicitly state that bearing kinematic fault matching was NOT performed because geometry was not supplied, and explain that general spectral and kurtosis indicators still apply.
5. NO INVENTED STANDARDS: Do not claim compliance with specific ISO standards (e.g., ISO 10816, ISO 13373) unless explicitly mentioned in the context.
6. NO RAW WAVEFORM CLAIMS: Acknowledge that you are evaluating derived numerical results and spectral moments, not the raw continuous analog waveform.
7. ACCESSIBLE YET RIGOROUS: Use clear, lucid explanations without dumbing down the mathematical fundamentals. Define key acronyms and metrics in the glossary.

JSON OUTPUT REQUIREMENT:
You MUST output a valid, well-formed JSON object adhering precisely to the following structure:
{
  "title": "Acoustic Emission Signal Analysis & Interpretation",
  "executive_summary": "Concise summary of the analysis outcome...",
  "signal_overview": "Detailed overview of signal length, sampling rate, noise floor, and moments...",
  "pipeline_explanation": [
    {
      "stage": "Stage Name",
      "what_happened": "Mathematical/physical operation performed",
      "why_it_matters": "Why this stage is vital",
      "observed_result": "Concrete numerical observation from this signal"
    }
  ],
  "key_findings": [
    {
      "title": "Finding Title",
      "measurement": "e.g. 107.5 Hz, Rf = 4.12",
      "explanation": "What this finding means",
      "significance": "Engineering significance",
      "limitations": "Caveats or uncertainty"
    }
  ],
  "bearing_interpretation": {
    "available": true or false,
    "summary": "Summary of kinematic fault indicator status",
    "indicators": [
      {
        "name": "BPFO",
        "reference_frequency_hz": 107.3,
        "observed_peak_frequency_hz": 107.5,
        "indicator_rf": 4.12,
        "interpretation": "Interpretation of outer race indicator"
      }
    ]
  },
  "plain_language_explanation": "Intuitive analogy or explanation for someone learning DSP...",
  "limitations": [
    "Limitation 1",
    "Limitation 2"
  ],
  "recommended_next_steps": [
    {
      "priority": "High" or "Medium" or "Low",
      "action": "Specific investigation step",
      "reason": "Why this step makes sense based on data"
    }
  ],
  "glossary": [
    {
      "term": "Term or Acronym",
      "definition": "Clear concise definition"
    }
  ]
}
"""

# In-memory tracking of active generation tasks to prevent race conditions & duplicate requests
_active_generation_ids: set[str] = set()
_generation_lock = asyncio.Lock()


async def generate_interpretation(
    analysis_id: str,
    signal_id: str,
    analysis_result: dict[str, Any],
    signal_meta: dict[str, Any],
    parameters: Optional[dict[str, Any]] = None,
) -> InterpretationResponse:
    """Invokes the Groq API with bounded DSP context and validates the structured response."""
    groq_api_key = get_groq_api_key()
    if not groq_api_key:
        raise ValueError(
            "GROQ_API_KEY is not configured in the backend environment. "
            "Please set GROQ_API_KEY in backend/.env to enable AI interpretation."
        )

    groq_model = get_groq_model()

    # Guard against duplicate concurrent requests for the exact same analysis
    async with _generation_lock:
        if analysis_id in _active_generation_ids:
            raise RuntimeError("An AI interpretation is already being generated for this analysis. Please wait.")
        _active_generation_ids.add(analysis_id)

    try:
        # Build compact, bounded context
        bounded_context = build_bounded_dsp_context(analysis_result, signal_meta, parameters)
        context_json_str = json.dumps(bounded_context, indent=2)

        user_prompt = (
            "Here is the complete bounded numerical summary of the completed DSP analysis:\n\n"
            f"```json\n{context_json_str}\n```\n\n"
            "Produce the comprehensive, step-by-step scientific interpretation as a valid JSON object matching the requested schema."
        )

        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": groq_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 4096,
        }

        models_to_try = [groq_model]
        for fb in FALLBACK_GROQ_MODELS:
            if fb not in models_to_try:
                models_to_try.append(fb)

        response = None
        error_text = ""
        actual_model_used = groq_model

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            for candidate_model in models_to_try:
                payload["model"] = candidate_model
                try:
                    response = await client.post(GROQ_API_URL, headers=headers, json=payload)
                except httpx.TimeoutException as exc:
                    logger.error(f"Groq API timeout after {REQUEST_TIMEOUT_SECONDS}s with model '{candidate_model}': {exc}")
                    raise TimeoutError("Upstream Groq request timed out while generating explanation. Please try again.") from exc
                except httpx.RequestError as exc:
                    logger.error(f"Network error connecting to Groq API with model '{candidate_model}': {exc}")
                    raise ConnectionError("Unable to communicate with Groq AI service. Please check your network connection.") from exc

                if response.status_code == 200:
                    actual_model_used = candidate_model
                    break

                error_text = response.text
                logger.warning(f"Groq API returned HTTP {response.status_code} for model '{candidate_model}': {error_text[:200]}")

                # If the error is NOT 404 model_not_found, do not retry other models (e.g. 401 auth or 429 quota)
                if response.status_code != 404 and "model_not_found" not in error_text:
                    break

        if response is None or response.status_code != 200:
            status = response.status_code if response else 500
            if status == 401:
                raise PermissionError("Groq authentication failed. Please verify that GROQ_API_KEY is valid.")
            elif status == 429:
                raise RuntimeError("Groq API rate limit reached. Please wait a moment before trying again.")
            elif status == 404 or "model_not_found" in error_text:
                raise ValueError(f"The model '{groq_model}' was not found on Groq. Please configure a valid model such as '{DEFAULT_GROQ_MODEL}'.")
            else:
                raise RuntimeError(f"Groq service responded with status {status}.")

        try:
            raw_data = response.json()
            content = raw_data["choices"][0]["message"]["content"]
            parsed_json = json.loads(content)
        except (KeyError, json.JSONDecodeError, IndexError) as exc:
            logger.error(f"Failed to parse Groq completion JSON: {exc}")
            raise ValueError("The AI model returned an unexpected response structure that could not be parsed.") from exc

        # Attach metadata
        parsed_json["analysis_id"] = analysis_id
        parsed_json["signal_id"] = signal_id
        parsed_json["model_used"] = actual_model_used
        parsed_json["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Validate with Pydantic
        interpretation = InterpretationResponse.model_validate(parsed_json)
        return interpretation

    finally:
        async with _generation_lock:
            _active_generation_ids.discard(analysis_id)
