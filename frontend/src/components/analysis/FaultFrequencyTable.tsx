import React from 'react';
import { FaultIndicator } from '../../types/api';
import { HelpCircle } from 'lucide-react';

interface FaultFrequencyTableProps {
  faultFrequencies: Record<string, number>;
  faultIndicators: FaultIndicator[];
  threshold?: number | null;
}

const FAULT_DESCRIPTIONS: Record<string, { name: string; formula: string; description: string }> = {
  BPFO: {
    name: 'Ball Pass Frequency Outer Race',
    formula: '(n/2) × fr × (1 - (d/D) cos θ)',
    description: 'Impact frequency as rolling elements pass across a defect on the stationary outer raceway.',
  },
  BPFI: {
    name: 'Ball Pass Frequency Inner Race',
    formula: '(n/2) × fr × (1 + (d/D) cos θ)',
    description: 'Impact frequency as rolling elements pass across a defect on the rotating inner raceway.',
  },
  BSF: {
    name: 'Ball Spin Frequency',
    formula: '(D / 2d) × fr × (1 - ((d/D) cos θ)²)',
    description: 'Rotational frequency of an individual rolling element around its own axis.',
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
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-[#86868B]" />
          <h3 className="text-[15px] font-semibold text-[#1D1D1F]">
            Bearing kinematic frequencies
          </h3>
        </div>
        <p className="text-[13px] text-[#6E6E73]">
          Bearing geometry parameters were not evaluated. Enable bearing kinematics in Analysis Settings to compute theoretical defect frequencies.
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
      noiseFloor: ind?.noise_floor ?? null,
      indicatorRf: ind?.indicator_rf ?? null,
      isExceeded,
    };
  });

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] overflow-hidden shadow-subtle">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FFFFFF]">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
            Kinematic defect frequencies
          </h3>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Normalized fault indicator: Rf = Mf / (PN + ε), evaluated against local median noise floor.
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#6E6E73] bg-[#F5F5F7] px-3 py-1.5 rounded-lg border border-[#E5E5EA] self-start sm:self-auto tabular-nums">
          Cutoff: {threshold !== null ? threshold.toFixed(2) : '3.00'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5EA] text-[#86868B] font-mono text-[10px] uppercase tracking-wider bg-[#FBFBFD]">
              <th className="py-3 px-5 font-medium">Harmonic</th>
              <th className="py-3 px-4 font-medium">Kinematic Description</th>
              <th className="py-3 px-4 text-right font-medium">Theoretical (Hz)</th>
              <th className="py-3 px-4 text-right font-medium">Detected (Hz)</th>
              <th className="py-3 px-4 text-right font-medium">Noise Floor (PN)</th>
              <th className="py-3 px-4 text-right font-medium">Indicator (Rf)</th>
              <th className="py-3 px-5 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F2F7] font-sans">
            {rows.map((row) => (
              <tr
                key={row.code}
                className={`transition-colors ${
                  row.isExceeded
                    ? 'bg-[#FF9500]/5 hover:bg-[#FF9500]/10'
                    : 'hover:bg-[#FBFBFD]'
                }`}
              >
                <td className="py-3 px-5 font-mono font-semibold text-[#1D1D1F]">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.isExceeded
                          ? 'bg-[#FF9500]'
                          : row.code === '1X'
                          ? 'bg-[#86868B]'
                          : 'bg-[#34C759]'
                      }`}
                    />
                    {row.code}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <div className="font-medium text-[#1D1D1F]">{row.name}</div>
                  <div
                    className="text-[11px] text-[#86868B] font-mono mt-0.5 truncate max-w-sm"
                    title={row.description}
                  >
                    {row.formula}
                  </div>
                </td>

                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6E6E73]">
                  {row.theoreticalHz !== null ? row.theoreticalHz.toFixed(2) : '—'}
                </td>

                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#1D1D1F]">
                  {row.detectedHz !== null ? row.detectedHz.toFixed(2) : '—'}
                </td>

                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6E6E73]">
                  {row.noiseFloor !== null ? row.noiseFloor.toFixed(5) : '—'}
                </td>

                <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                  {row.indicatorRf !== null ? (
                    <span className={row.isExceeded ? 'text-[#B25000]' : 'text-[#1D1D1F]'}>
                      {row.indicatorRf.toFixed(2)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="py-3 px-5 text-center">
                  {row.isExceeded ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FF9500]/10 text-[#B25000]">
                      Exceeds Cutoff
                    </span>
                  ) : row.code === '1X' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F7] text-[#6E6E73]">
                      Shaft Reference
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#34C759]/10 text-[#248A3D]">
                      Nominal
                    </span>
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

export default FaultFrequencyTable;
