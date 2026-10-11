import React from 'react';
import { FaultIndicator } from '../../types/api';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface FaultFrequencyTableProps {
  faultFrequencies: Record<string, number>;
  faultIndicators: FaultIndicator[];
  threshold?: number | null;
}

const FAULT_DESCRIPTIONS: Record<string, { name: string; formula: string; description: string }> = {
  BPFO: {
    name: 'Ball Pass Frequency Outer Race',
    formula: '(n/2) × fr × (1 - (d/D) cos θ)',
    description: 'Rate at which rolling elements pass over a defect on the outer bearing ring.',
  },
  BPFI: {
    name: 'Ball Pass Frequency Inner Race',
    formula: '(n/2) × fr × (1 + (d/D) cos θ)',
    description: 'Rate at which rolling elements pass over a defect on the rotating inner ring.',
  },
  BSF: {
    name: 'Ball Spin Frequency',
    formula: '(D / 2d) × fr × (1 - ((d/D) cos θ)²)',
    description: 'Rotational frequency of a single rolling element around its own axis.',
  },
  FTF: {
    name: 'Fundamental Train Frequency',
    formula: '(1/2) × fr × (1 - (d/D) cos θ)',
    description: 'Rotational speed of the bearing retainer cage carrying the elements.',
  },
  '1X': {
    name: 'Shaft Rotational Frequency',
    formula: 'RPM / 60',
    description: 'Fundamental mechanical rotation rate of the drive shaft.',
  },
};

export const FaultFrequencyTable: React.FC<FaultFrequencyTableProps> = ({
  faultFrequencies,
  faultIndicators,
  threshold = 3.0,
}) => {
  const hasFrequencies = Object.keys(faultFrequencies).length > 0;

  if (!hasFrequencies) {
    return (
      <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-industrial-400" />
          <h3 className="text-sm font-semibold text-industrial-800">
            Bearing Kinematic Defect Frequencies
          </h3>
        </div>
        <p className="text-xs text-industrial-500">
          Bearing geometry (rolling elements, ball diameter, pitch diameter, contact angle) and shaft speed were not
          provided. Theoretical characteristic frequencies were not evaluated.
        </p>
      </div>
    );
  }

  // Combine theoretical frequencies and indicators
  const rows = ['BPFO', 'BPFI', 'BSF', 'FTF', '1X'].map((code) => {
    const theoretical = faultFrequencies[code];
    const ind = faultIndicators.find((i) => i.fault_type === code);
    const meta = FAULT_DESCRIPTIONS[code] || {
      name: code,
      formula: '',
      description: 'Bearing frequency harmonic',
    };
    const isExceeded = threshold !== null && ind && ind.indicator_rf >= threshold;

    return {
      code,
      name: meta.name,
      formula: meta.formula,
      description: meta.description,
      theoreticalHz: theoretical ?? null,
      detectedHz: ind?.detected_hz ?? null,
      magnitude: ind?.magnitude ?? null,
      noiseFloor: ind?.noise_floor ?? null,
      indicatorRf: ind?.indicator_rf ?? null,
      isExceeded,
    };
  });

  return (
    <div className="bg-white border border-industrial-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-industrial-800">
            Characteristic Bearing Fault Frequencies
          </h3>
          <p className="text-xs text-industrial-500 mt-0.5">
            Normalized fault indicator: Rf = Mf / (PN + ε), where Mf is magnitude near fault frequency and PN is local noise floor.
          </p>
        </div>
        <span className="text-[11px] font-mono text-industrial-400 bg-industrial-100 px-2.5 py-1 rounded">
          Threshold: {threshold !== null ? threshold?.toFixed(2) : '3.00'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-industrial-200 text-industrial-500 font-mono text-[11px] uppercase bg-industrial-50/60">
              <th className="py-2.5 px-3">Defect Code</th>
              <th className="py-2.5 px-3">Description & Kinematic Formula</th>
              <th className="py-2.5 px-3 text-right">Theoretical (Hz)</th>
              <th className="py-2.5 px-3 text-right">Detected Peak (Hz)</th>
              <th className="py-2.5 px-3 text-right">Noise Floor (PN)</th>
              <th className="py-2.5 px-3 text-right">Fault Indicator (Rf)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-100">
            {rows.map((row) => (
              <tr
                key={row.code}
                className={`transition-colors ${
                  row.isExceeded ? 'bg-amber-50/60 hover:bg-amber-100/50' : 'hover:bg-industrial-50/50'
                }`}
              >
                <td className="py-2.5 px-3 font-mono font-bold text-industrial-800">
                  {row.code}
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-medium text-industrial-800">{row.name}</div>
                  <div className="text-[10px] text-industrial-400 font-mono mt-0.5" title={row.description}>
                    {row.formula}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-industrial-700">
                  {row.theoreticalHz !== null ? `${row.theoreticalHz.toFixed(2)} Hz` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-industrial-700">
                  {row.detectedHz !== null ? `${row.detectedHz.toFixed(2)} Hz` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-industrial-500">
                  {row.noiseFloor !== null ? row.noiseFloor.toFixed(5) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {row.indicatorRf !== null ? (
                    <span
                      className={`font-semibold ${
                        row.isExceeded ? 'text-amber-800 text-sm' : 'text-industrial-700'
                      }`}
                    >
                      {row.indicatorRf.toFixed(2)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {row.code === '1X' ? (
                    <span className="text-[10px] text-industrial-400 font-mono">Reference</span>
                  ) : row.isExceeded ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      EXCEEDED
                    </span>
                  ) : row.indicatorRf !== null ? (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Nominal
                    </span>
                  ) : (
                    <span className="text-[10px] text-industrial-400 font-mono">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
