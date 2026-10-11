# CWRU Bearing Benchmark Dataset Guide

Official accelerometer recordings from the **Case Western Reserve University (CWRU) Bearing Data Center**.

### Tested Bearing Geometry (SKF 6205-2RS Drive End)
- **Rolling elements ($n$)**: 9
- **Ball diameter ($d$)**: 7.94 mm
- **Pitch diameter ($D$)**: 39.04 mm
- **Contact angle ($\theta$)**: 0°

### Ingested Files & Operating Parameters

| File (.wav / .csv) | Fault Category | Expected Defect | Fs (Hz) | RPM | BPFO (Hz) | BPFI (Hz) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `cwru_normal_baseline_12k.wav` | NORMAL | None | 12000 | 1796.0 | 107.3 | 162.1 |
| `cwru_outer_race_fault_12k.wav` | OUTER_RACE | BPFO | 12000 | 1796.0 | 107.3 | 162.1 |
| `cwru_inner_race_fault_12k.wav` | INNER_RACE | BPFI | 12000 | 1797.0 | 107.36 | 162.19 |
| `cwru_ball_fault_12k.wav` | BALL | BSF | 12000 | 1796.0 | 107.3 | 162.1 |
| `cwru_outer_race_fault_48k.wav` | OUTER_RACE | BPFO | 48000 | 1796.0 | 107.3 | 162.1 |
| `cwru_inner_race_fault_48k.wav` | INNER_RACE | BPFI | 48000 | 1796.0 | 107.3 | 162.1 |

### How to Run in AcousticSense
1. Open `http://localhost:5173/analysis`
2. Upload any `.wav` or `.csv` from `data/cwru/`
3. In the Analysis Form, enter the corresponding parameters:
   - **Sampling Frequency (Fs)**: 12000 (or 48000 for 48k files)
   - **Shaft Speed (RPM)**: 1797 (or from table above)
   - **Rolling Elements ($n$)**: 9
   - **Ball Diameter ($d$)**: 7.94
   - **Pitch Diameter ($D$)**: 39.04
   - **Contact Angle ($\theta$)**: 0
4. Click **Run DSP Analysis** and review the detected kinematic defect harmonics.
