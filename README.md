# AcousticSense

**Acoustic Emission Fault Detection in Rotating Machinery Using Digital Signal Processing**

This repository contains the software implementation for our research project on diagnosing bearing defects in rotating machinery through classical Digital Signal Processing (DSP) applied to vibration and acoustic emission signals.

## Repository Structure

- [`backend/`](backend/): Complete Python DSP backend built with FastAPI, NumPy, SciPy, and Pandas.
  - [`app/main.py`](backend/app/main.py): REST API endpoints and classical 8-stage DSP fault detection pipeline.
  - [`tests/test_api.py`](backend/tests/test_api.py): Comprehensive Pytest test suite with synthetic and kinematic validation signals.
  - [`requirements.txt`](backend/requirements.txt): Python dependency definitions.
  - [`README.md`](backend/README.md): Detailed backend documentation, API specifications, and DSP methodology.

## Getting Started

### Backend Setup & Startup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### Running Backend Tests

```bash
cd backend
python -m pytest tests/test_api.py -v
```