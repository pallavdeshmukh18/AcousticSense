"""Automated CWRU Bearing Dataset Downloader & Ingestion Script.

Downloads official benchmark .mat files from Case Western Reserve University (CWRU)
Bearing Data Center (12 kHz and 48 kHz Drive End recordings), parses accelerometer
time-series using SciPy, and converts them to ready-to-use WAV audio and CSV formats
with full bearing kinematic metadata.
"""

from __future__ import annotations

import io
import json
import os
import urllib.request
from typing import Any

import numpy as np
import pandas as pd
import scipy.io
import scipy.io.wavfile

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "cwru"))
os.makedirs(DATA_DIR, exist_ok=True)

# SKF 6205-2RS Bearing Kinematic Parameters (Drive End)
BEARING_METADATA = {
    "bearing_model": "SKF 6205-2RS JEM",
    "rolling_elements": 9,
    "ball_diameter_mm": 7.94,
    "pitch_diameter_mm": 39.04,
    "contact_angle_deg": 0.0,
}

CWRU_FILES = [
    {
        "id": "97",
        "name": "cwru_normal_baseline_12k",
        "description": "Healthy baseline bearing with zero defect",
        "fault_type": "NORMAL",
        "expected_defect": None,
        "sampling_rate": 12000,
        "hp_load": 0,
        "defect_diameter_inch": 0.0,
        "url": "https://engineering.case.edu/sites/default/files/97.mat",
    },
    {
        "id": "130",
        "name": "cwru_outer_race_fault_12k",
        "description": "Outer race fault (BPFO) 0.007 inch defect @ 6:00 load zone",
        "fault_type": "OUTER_RACE",
        "expected_defect": "BPFO",
        "sampling_rate": 12000,
        "hp_load": 0,
        "defect_diameter_inch": 0.007,
        "url": "https://engineering.case.edu/sites/default/files/130.mat",
    },
    {
        "id": "105",
        "name": "cwru_inner_race_fault_12k",
        "description": "Inner race fault (BPFI) 0.007 inch defect",
        "fault_type": "INNER_RACE",
        "expected_defect": "BPFI",
        "sampling_rate": 12000,
        "hp_load": 0,
        "defect_diameter_inch": 0.007,
        "url": "https://engineering.case.edu/sites/default/files/105.mat",
    },
    {
        "id": "118",
        "name": "cwru_ball_fault_12k",
        "description": "Ball element fault (BSF) 0.007 inch defect",
        "fault_type": "BALL",
        "expected_defect": "BSF",
        "sampling_rate": 12000,
        "hp_load": 0,
        "defect_diameter_inch": 0.007,
        "url": "https://engineering.case.edu/sites/default/files/118.mat",
    },
    {
        "id": "135",
        "name": "cwru_outer_race_fault_48k",
        "description": "Outer race fault (BPFO) 0.007 inch defect (High-res 48 kHz)",
        "fault_type": "OUTER_RACE",
        "expected_defect": "BPFO",
        "sampling_rate": 48000,
        "hp_load": 0,
        "defect_diameter_inch": 0.007,
        "url": "https://engineering.case.edu/sites/default/files/135.mat",
    },
    {
        "id": "109",
        "name": "cwru_inner_race_fault_48k",
        "description": "Inner race fault (BPFI) 0.007 inch defect (High-res 48 kHz)",
        "fault_type": "INNER_RACE",
        "expected_defect": "BPFI",
        "sampling_rate": 48000,
        "hp_load": 0,
        "defect_diameter_inch": 0.007,
        "url": "https://engineering.case.edu/sites/default/files/109.mat",
    },
]


def calculate_theoretical_frequencies(rpm: float) -> dict[str, float]:
    fr = rpm / 60.0
    n = BEARING_METADATA["rolling_elements"]
    d = BEARING_METADATA["ball_diameter_mm"]
    D = BEARING_METADATA["pitch_diameter_mm"]
    theta = np.deg2rad(BEARING_METADATA["contact_angle_deg"])

    cos_th = np.cos(theta)
    gamma = (d / D) * cos_th

    bpfo = (n / 2.0) * fr * (1.0 - gamma)
    bpfi = (n / 2.0) * fr * (1.0 + gamma)
    bsf = (D / (2.0 * d)) * fr * (1.0 - gamma**2)
    ftf = 0.5 * fr * (1.0 - gamma)

    return {
        "shaft_frequency_hz": round(fr, 2),
        "bpfo_hz": round(bpfo, 2),
        "bpfi_hz": round(bpfi, 2),
        "bsf_hz": round(bsf, 2),
        "ftf_hz": round(ftf, 2),
    }


def download_and_process():
    catalog: list[dict[str, Any]] = []

    print(f"Ingesting CWRU Benchmark Dataset into: {DATA_DIR}")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AcousticSense/1.0"}

    for item in CWRU_FILES:
        print(f"\n--- Downloading {item['name']} ({item['url']}) ---")
        req = urllib.request.Request(item["url"], headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                content = resp.read()
            print(f"Successfully downloaded {len(content)} bytes.")

            mat = scipy.io.loadmat(io.BytesIO(content))
            keys = [k for k in mat.keys() if not k.startswith("__")]

            # Locate Drive End accelerometer signal (DE_time)
            de_key = next((k for k in keys if "_DE_time" in k or "DE_time" in k), None)
            if not de_key:
                print(f"Warning: No DE_time found in {keys}, trying first array key.")
                de_key = keys[0]

            de_data = mat[de_key].flatten().astype(np.float64)

            # Locate RPM
            rpm_key = next((k for k in keys if "RPM" in k), None)
            if rpm_key and mat[rpm_key].size > 0:
                motor_rpm = float(mat[rpm_key].flatten()[0])
            else:
                motor_rpm = 1797.0  # nominal 0 HP speed

            fs = item["sampling_rate"]
            sample_count = len(de_data)
            duration_s = sample_count / fs

            # 1. Save normalized 16-bit PCM WAV file
            peak = np.max(np.abs(de_data))
            if peak > 0:
                int16_sig = ((de_data / peak) * 32000.0).astype(np.int16)
            else:
                int16_sig = de_data.astype(np.int16)

            wav_filename = f"{item['name']}.wav"
            wav_path = os.path.join(DATA_DIR, wav_filename)
            scipy.io.wavfile.write(wav_path, fs, int16_sig)

            # 2. Save CSV format (first 24,000 samples for lightweight UI ingestion)
            csv_samples = min(sample_count, 24000)
            csv_filename = f"{item['name']}.csv"
            csv_path = os.path.join(DATA_DIR, csv_filename)
            df = pd.DataFrame({"de_acceleration_g": de_data[:csv_samples]})
            df.to_csv(csv_path, index=False)

            freqs = calculate_theoretical_frequencies(motor_rpm)

            meta_entry = {
                "id": item["id"],
                "file_base": item["name"],
                "wav_file": wav_filename,
                "csv_file": csv_filename,
                "fault_type": item["fault_type"],
                "expected_defect": item["expected_defect"],
                "description": item["description"],
                "sampling_frequency_hz": fs,
                "motor_rpm": motor_rpm,
                "total_samples": sample_count,
                "duration_seconds": round(duration_s, 3),
                "theoretical_frequencies": freqs,
                "bearing": BEARING_METADATA,
            }
            catalog.append(meta_entry)
            print(f"Saved: {wav_filename} & {csv_filename} (Fs={fs} Hz, RPM={motor_rpm})")

        except Exception as exc:
            print(f"Error processing {item['name']}: {exc}")

    # Write catalog JSON
    catalog_path = os.path.join(DATA_DIR, "catalog.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)

    # Write Markdown Guide
    guide_path = os.path.join(DATA_DIR, "DATASET_GUIDE.md")
    with open(guide_path, "w", encoding="utf-8") as f:
        f.write("# CWRU Bearing Benchmark Dataset Guide\n\n")
        f.write("Official accelerometer recordings from the **Case Western Reserve University (CWRU) Bearing Data Center**.\n\n")
        f.write("### Tested Bearing Geometry (SKF 6205-2RS Drive End)\n")
        f.write("- **Rolling elements ($n$)**: 9\n")
        f.write("- **Ball diameter ($d$)**: 7.94 mm\n")
        f.write("- **Pitch diameter ($D$)**: 39.04 mm\n")
        f.write("- **Contact angle ($\\theta$)**: 0°\n\n")
        f.write("### Ingested Files & Operating Parameters\n\n")
        f.write("| File (.wav / .csv) | Fault Category | Expected Defect | Fs (Hz) | RPM | BPFO (Hz) | BPFI (Hz) |\n")
        f.write("| :--- | :--- | :--- | :---: | :---: | :---: | :---: |\n")
        for c in catalog:
            tf = c["theoretical_frequencies"]
            f.write(f"| `{c['wav_file']}` | {c['fault_type']} | {c['expected_defect'] or 'None'} | {c['sampling_frequency_hz']} | {c['motor_rpm']} | {tf['bpfo_hz']} | {tf['bpfi_hz']} |\n")
        f.write("\n### How to Run in AcousticSense\n")
        f.write("1. Open `http://localhost:5173/analysis`\n")
        f.write("2. Upload any `.wav` or `.csv` from `data/cwru/`\n")
        f.write("3. In the Analysis Form, enter the corresponding parameters:\n")
        f.write("   - **Sampling Frequency (Fs)**: 12000 (or 48000 for 48k files)\n")
        f.write("   - **Shaft Speed (RPM)**: 1797 (or from table above)\n")
        f.write("   - **Rolling Elements ($n$)**: 9\n")
        f.write("   - **Ball Diameter ($d$)**: 7.94\n")
        f.write("   - **Pitch Diameter ($D$)**: 39.04\n")
        f.write("   - **Contact Angle ($\\theta$)**: 0\n")
        f.write("4. Click **Run DSP Analysis** and review the detected kinematic defect harmonics.\n")

    print(f"\nIngestion Complete! Catalog saved to: {catalog_path}")
    print(f"Dataset Guide saved to: {guide_path}")


if __name__ == "__main__":
    download_and_process()
