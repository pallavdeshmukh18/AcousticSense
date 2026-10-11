import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  ArrowRight,
  BookOpen,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Compass,
} from 'lucide-react';
import {
  AnalysisResponse,
  InterpretationResponse,
  InterpretRequest,
} from '../../types/api';
import { apiService, extractErrorMessage } from '../../services/api';

interface AiInterpretationViewProps {
  analysisResult: AnalysisResponse | null;
  signalId?: string;
  onRunAnalysisRequested?: () => void;
}

export const AiInterpretationView: React.FC<AiInterpretationViewProps> = ({
  analysisResult,
  signalId,
  onRunAnalysisRequested,
}) => {
  const [interpretation, setInterpretation] = useState<InterpretationResponse | null>(null);
  const [associatedAnalysisId, setAssociatedAnalysisId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedPipelineStages, setExpandedPipelineStages] = useState<Record<number, boolean>>({});

  const currentAnalysisId = analysisResult?.analysis_id || analysisResult?.signal?.signal_id || null;

  // Stale detection: if underlying analysis changed, detect mismatch
  const isStale = Boolean(
    interpretation &&
    associatedAnalysisId &&
    currentAnalysisId &&
    associatedAnalysisId !== currentAnalysisId
  );

  // When signal changes completely (signalId changes and no result), reset
  useEffect(() => {
    if (!analysisResult) {
      setInterpretation(null);
      setAssociatedAnalysisId(null);
      setErrorMessage(null);
    }
  }, [analysisResult, signalId]);

  const handleGenerate = async () => {
    if (!analysisResult) return;

    const targetSignalId = signalId || analysisResult.signal?.signal_id;
    if (!targetSignalId) {
      setErrorMessage('No valid signal ID available for interpretation.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload: InterpretRequest = {
        signal_id: targetSignalId,
        analysis_id: analysisResult.analysis_id,
      };

      const result = await apiService.interpretAnalysis(payload);
      setInterpretation(result);
      setAssociatedAnalysisId(analysisResult.analysis_id || currentAnalysisId);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStage = (index: number) => {
    setExpandedPipelineStages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <section className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-[#E5E5EA]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">
              AI Analysis & Interpretation
            </h3>
          </div>
          <p className="text-xs text-[#86868B] mt-1.5 max-w-2xl leading-relaxed">
            Understand what your signal reveals, explained step by step using Groq-powered scientific reasoning grounded strictly in the deterministic DSP pipeline findings.
          </p>
        </div>

        {/* Primary Action Button (when results exist) */}
        {analysisResult && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-xl transition-all shadow-xs ${
                isLoading
                  ? 'bg-[#F5F5F7] text-[#86868B] border border-[#E5E5EA] cursor-not-allowed'
                  : isStale
                  ? 'bg-[#0071E3] hover:bg-[#0077ED] text-white active:scale-[0.98]'
                  : interpretation
                  ? 'bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] border border-[#E5E5EA]'
                  : 'bg-[#0071E3] hover:bg-[#0077ED] text-white active:scale-[0.98]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading
                ? 'Interpreting analysis results…'
                : isStale
                ? 'Update Explanation'
                : interpretation
                ? 'Re-evaluate Interpretation'
                : 'Explain my analysis'}
            </button>
          </div>
        )}
      </div>

      {/* STATE 1: NO DSP RESULTS */}
      {!analysisResult && (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-[#86868B] flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#1D1D1F]">
            No Active DSP Analysis
          </h4>
          <p className="text-xs text-[#86868B] max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Run a DSP analysis before generating an AI interpretation. The AI assistant strictly interprets computed numerical results rather than raw unanalyzed audio.
          </p>
          {onRunAnalysisRequested && (
            <button
              onClick={onRunAnalysisRequested}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0071E3] hover:underline"
            >
              Configure & Run DSP Analysis
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* STATE 6 (Banner): STALE INTERPRETATION WARNING */}
      {isStale && (
        <div className="mt-5 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#D97706]" />
            <span>
              The active analysis parameters have changed. This explanation reflects a previous calculation.
            </span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="text-xs font-semibold text-[#B45309] hover:underline flex-shrink-0"
          >
            Update now
          </button>
        </div>
      )}

      {/* STATE 5: ERROR STATE */}
      {errorMessage && (
        <div className="mt-5 p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#DC2626] mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Interpretation Unavailable</span>
              <p className="leading-relaxed text-[#7F1D1D]">{errorMessage}</p>
              <div className="mt-3">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FFF5F5] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: READY STATE (Waiting for user trigger) */}
      {analysisResult && !interpretation && !isLoading && !errorMessage && (
        <div className="py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/15 text-[#0071E3] flex items-center justify-center mx-auto mb-3">
            <Cpu className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#1D1D1F]">
            Ready to Interpret Analysis Results
          </h4>
          <p className="text-xs text-[#86868B] max-w-lg mx-auto mt-1 mb-5 leading-relaxed">
            The 8-stage DSP pipeline has produced verified deterministic metrics: frequency peaks, spectral kurtosis resonance, and Hilbert envelope statistics. Click below to generate an in-depth scientific explanation.
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Explain my analysis
          </button>
        </div>
      )}

      {/* STATE 3: GENERATING STATE */}
      {isLoading && (
        <div className="py-14 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] mb-4">
            <RefreshCw className="w-5 h-5 text-[#0071E3] animate-spin" />
          </div>
          <h4 className="text-sm font-semibold text-[#1D1D1F]">
            Interpreting analysis results…
          </h4>
          <p className="text-xs text-[#86868B] mt-1 max-w-md mx-auto leading-relaxed">
            Evaluating dominant spectral peaks, Fisher kurtosis across candidate bands, and bearing characteristic defect indicators…
          </p>
        </div>
      )}

      {/* STATE 4: SUCCESS STATE (Structured Apple Reading Layout) */}
      {interpretation && !isLoading && (
        <div className="mt-8 space-y-8">
          {/* A. EXECUTIVE SUMMARY */}
          <div className="p-5 rounded-2xl bg-[#FBFBFD] border border-[#E5E5EA] border-l-4 border-l-[#0071E3] shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase font-mono text-[#0071E3]">
                Executive Summary
              </span>
            </div>
            <p className="text-sm text-[#1D1D1F] font-medium leading-relaxed">
              {interpretation.executive_summary}
            </p>
          </div>

          {/* B. SIGNAL OVERVIEW */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Activity className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                Signal Overview & Ingestion Metrics
              </h4>
            </div>
            <p className="text-xs text-[#48484A] leading-relaxed bg-[#F5F5F7]/60 p-4 rounded-xl border border-[#E5E5EA]/80">
              {interpretation.signal_overview}
            </p>
          </div>

          {/* C. DSP PIPELINE EXPLANATION */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                DSP Pipeline Execution Breakdown
              </h4>
            </div>

            <div className="space-y-2.5">
              {interpretation.pipeline_explanation.map((item, idx) => {
                const isExpanded = expandedPipelineStages[idx] ?? true;
                return (
                  <div
                    key={idx}
                    className="border border-[#E5E5EA] rounded-xl overflow-hidden transition-all bg-white"
                  >
                    <button
                      onClick={() => toggleStage(idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left bg-[#FBFBFD] hover:bg-[#F5F5F7] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#E5E5EA] text-[#1D1D1F] text-[11px] font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          {item.stage}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#86868B]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#86868B]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-2.5 text-xs text-[#48484A] border-t border-[#E5E5EA]">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#86868B] block mb-0.5">
                            Physical & Mathematical Operation
                          </span>
                          <p className="leading-relaxed">{item.what_happened}</p>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#86868B] block mb-0.5">
                            Why It Matters
                          </span>
                          <p className="leading-relaxed text-[#6E6E73]">{item.why_it_matters}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA]/80 font-mono text-[11px] text-[#1D1D1F]">
                          <span className="text-[#86868B] block text-[10px] uppercase font-mono mb-0.5">
                            Observed Finding in this Run:
                          </span>
                          {item.observed_result}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* D. IMPORTANT FINDINGS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                Key Physical & Numerical Findings
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {interpretation.key_findings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E5E5EA] bg-[#FFFFFF] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="text-xs font-semibold text-[#1D1D1F]">
                        {f.title}
                      </h5>
                      {f.measurement && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#F5F5F7] border border-[#E5E5EA] text-[#1D1D1F] flex-shrink-0">
                          {f.measurement}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#48484A] leading-relaxed mb-2.5">
                      {f.explanation}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#F5F5F7] space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-[#86868B] font-medium">Significance: </span>
                      <span className="text-[#1D1D1F]">{f.significance}</span>
                    </div>
                    {f.limitations && (
                      <div>
                        <span className="text-[#86868B] font-medium">Caveat: </span>
                        <span className="text-[#6E6E73]">{f.limitations}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* E. BEARING FAULT INTERPRETATION */}
          <div className="p-5 rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#86868B]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                  Bearing Kinematic Defect Evaluation
                </h4>
              </div>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  interpretation.bearing_interpretation.available
                    ? 'bg-[#EBF7EE] text-[#1B7F39] border border-[#CDEED3]'
                    : 'bg-[#F5F5F7] text-[#86868B] border border-[#E5E5EA]'
                }`}
              >
                {interpretation.bearing_interpretation.available ? 'Evaluated' : 'Not Evaluated'}
              </span>
            </div>

            <p className="text-xs text-[#48484A] leading-relaxed mb-3.5">
              {interpretation.bearing_interpretation.summary}
            </p>

            {interpretation.bearing_interpretation.available &&
            interpretation.bearing_interpretation.indicators.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5EA] text-[#86868B] font-mono text-[10px] uppercase bg-white">
                      <th className="py-2 px-3">Fault Component</th>
                      <th className="py-2 px-3">Theoretical Freq</th>
                      <th className="py-2 px-3">Detected Peak</th>
                      <th className="py-2 px-3">Ratio (Rf)</th>
                      <th className="py-2 px-3">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] bg-white">
                    {interpretation.bearing_interpretation.indicators.map((ind, i) => (
                      <tr key={i} className="hover:bg-[#F5F5F7]/40 transition-colors">
                        <td className="py-2 px-3 font-mono font-semibold text-[#1D1D1F]">
                          {ind.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-[#6E6E73]">
                          {ind.reference_frequency_hz ? `${ind.reference_frequency_hz.toFixed(2)} Hz` : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-[#1D1D1F]">
                          {ind.observed_peak_frequency_hz ? `${ind.observed_peak_frequency_hz.toFixed(2)} Hz` : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium">
                          {ind.indicator_rf !== null && ind.indicator_rf !== undefined ? (
                            <span
                              className={
                                ind.indicator_rf >= 3.0
                                  ? 'text-[#B45309] font-bold'
                                  : 'text-[#6E6E73]'
                              }
                            >
                              {ind.indicator_rf.toFixed(2)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2 px-3 text-[#48484A] text-[11px] leading-relaxed">
                          {ind.interpretation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !interpretation.bearing_interpretation.available && (
                <div className="p-3 rounded-xl bg-white border border-[#E5E5EA] text-xs text-[#86868B] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 flex-shrink-0 text-[#86868B]" />
                  <span>
                    To calculate characteristic defect frequencies (BPFO, BPFI, BSF, FTF), supply shaft speed (RPM) and bearing geometry in the analysis configuration above.
                  </span>
                </div>
              )
            )}
          </div>

          {/* F. WHAT THIS MEANS IN SIMPLE TERMS */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                In Simple Terms: Intuitive Explanation
              </h4>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs text-[#1D1D1F] leading-relaxed font-normal">
              {interpretation.plain_language_explanation}
            </div>
          </div>

          {/* G. LIMITATIONS & UNCERTAINTIES */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                Limitations & Scientific Uncertainty
              </h4>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-xs text-[#6E6E73] bg-white p-4 rounded-xl border border-[#E5E5EA]">
              {interpretation.limitations.map((lim, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="text-[#1D1D1F]">{lim}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* H. RECOMMENDED NEXT STEPS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                Recommended Follow-up Steps
              </h4>
            </div>

            <div className="space-y-2">
              {interpretation.recommended_next_steps.map((step, idx) => {
                const isHigh = step.priority.toLowerCase() === 'high';
                const isMed = step.priority.toLowerCase() === 'medium';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[#E5E5EA] bg-white flex items-start gap-3 shadow-xs"
                  >
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                        isHigh
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          : isMed
                          ? 'bg-[#EBF5FF] text-[#1E40AF] border border-[#BFDBFE]'
                          : 'bg-[#F5F5F7] text-[#6E6E73] border border-[#E5E5EA]'
                      }`}
                    >
                      {step.priority}
                    </span>
                    <div className="text-xs">
                      <span className="font-semibold text-[#1D1D1F] block mb-0.5">
                        {step.action}
                      </span>
                      <p className="text-[#6E6E73] leading-relaxed">{step.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* I. GLOSSARY */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <HelpCircle className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] font-mono">
                Technical Glossary & Formulas
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {interpretation.glossary.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#E5E5EA] bg-[#FBFBFD] text-xs"
                >
                  <span className="font-semibold font-mono text-[#0071E3] block mb-0.5">
                    {item.term}
                  </span>
                  <p className="text-[#6E6E73] text-[11px] leading-relaxed">
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="pt-4 border-t border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[#86868B] font-mono">
            <span>
              Engine: {interpretation.model_used} • Generated: {new Date(interpretation.generated_at).toLocaleTimeString()}
            </span>
            <span className="text-[#86868B]">
              Analysis ID: {interpretation.analysis_id.slice(0, 15)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
