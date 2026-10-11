# AcousticSense Frontend

Interactive industrial engineering dashboard for **Acoustic Emission Fault Detection in Rotating Machinery**, built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Plotly.js**.

Connects directly to the classical DSP FastAPI backend (`http://localhost:8000`).

---

## 1. Technology Stack

- **Framework**: React 18 with Vite 5 and TypeScript
- **Styling**: Tailwind CSS (clean industrial aesthetics, slate/charcoal tones, subtle borders)
- **Routing**: React Router v6
- **Data Visualizations**: Plotly.js (`plotly.js-dist-min`) with `react-plotly.js`
- **HTTP Client**: Axios with centralized error parsing
- **Icons**: Lucide React

---

## 2. Getting Started

### Prerequisites

Ensure the Python backend is running:
```bash
# In backend/
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Installation

```bash
cd frontend
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Start Development Server

```bash
npm run dev
```

The frontend dashboard will be available at:
`http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

---

## 3. Application Workspaces

1. **Dashboard (`/`)**:
   - System overview and live backend connection badge.
   - Comprehensive interactive walkthrough of the 8-stage classical DSP pipeline.
   - Current session active signal summary card.
2. **Signal Analysis (`/analysis`)**:
   - File ingestion supporting WAV audio recordings and CSV numerical datasets.
   - Analysis parameter controls: sampling frequency, shaft speed (RPM), candidate sub-bands, detection threshold cutoff ($R_f$).
   - Bearing geometry inputs: rolling elements $n$, ball diameter $d$, pitch diameter $D$, contact angle $\theta$.
   - Live diagnostic results:
     - Status badge (`POTENTIAL_FAULT`, `NO_FAULT_INDICATED`, `INCONCLUSIVE`).
     - Measured moments statistics (RMS, Peak, Std, Crest Factor, Excess Kurtosis).
     - Kinematic defect frequencies table (BPFO, BPFI, BSF, FTF, 1X) with peak-to-noise ratio ($R_f$) comparison.
     - Interactive Plotly visualizations: FFT magnitude spectrum with peak markers, spectral kurtosis sub-band screening, Hilbert analytic envelope, and demodulated envelope spectrum.
3. **Experiment Lab (`/experiments`)**:
   - Non-overlapping block-length sensitivity testing (256, 512, 1024, 2048, 4096, and custom sample lengths).
   - Real-time comparison table of complete blocks, discarded remainder, mean kurtosis, max kurtosis, variability ($\sigma$), and Python execution time.
   - Interactive Plotly comparison charts.
   - Engineering disclaimers regarding statistical validity and embedded DSP hardware (TI TMS320C6748) latency comparisons.
