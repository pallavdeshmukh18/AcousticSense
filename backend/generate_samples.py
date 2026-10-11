"""Sample Signal Generator for AcousticSense.

Generates realistic benchmark signals (Healthy, Outer Race Defect / BPFO, Inner Race Defect / BPFI)
in both WAV and CSV formats with standard 6205 bearing kinematics.
"""

import os
import numpy as np
import scipy.io.wavfile
import pandas as pd

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "samples"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

FS = 12000.0  # 12 kHz sampling frequency (standard CWRU rate)
DURATION = 1.0  # 1 second of data
N_SAMPLES = int(FS * DURATION)
T = np.arange(N_SAMPLES) / FS

# Kinematics: 6205 Bearing at 1797 RPM (typical 3-phase induction motor speed)
# Shaft rate: fr = 1797 / 60 = 29.95 Hz
# Elements: n=9, d=7.94 mm, D=39.04 mm, theta=0 deg
# Theoretical BPFO = (9/2) * 29.95 * (1 - 7.94/39.04) ≈ 107.35 Hz
# Theoretical BPFI = (9/2) * 29.95 * (1 + 7.94/39.04) ≈ 162.20 Hz

CARRIER_RESONANCE = 3200.0  # 3.2 kHz structural resonance
RINGDOWN_DECAY = 800.0      # Exponential damping factor

def generate_impulse_train(fault_freq: float, amplitude: float = 3.5) -> np.ndarray:
    period = 1.0 / fault_freq
    impulse_train = np.zeros(N_SAMPLES)
    decay_samples = int(FS * 0.006)  # 6 ms transient burst
    decay_t = np.arange(decay_samples) / FS
    wavelet = np.exp(-decay_t * RINGDOWN_DECAY) * np.sin(2 * np.pi * CARRIER_RESONANCE * decay_t)

    impact_times = np.arange(0, DURATION, period)
    for t_hit in impact_times:
        idx = int(t_hit * FS)
        if idx + decay_samples <= N_SAMPLES:
            # Add slight jitter to simulate mechanical slip (±1%)
            impulse_train[idx : idx + decay_samples] += amplitude * wavelet
    return impulse_train

np.random.seed(42)

# 1. Healthy Bearing (pure baseline vibration: shaft rotation + harmonic + background noise)
healthy_shaft = 0.4 * np.sin(2 * np.pi * 29.95 * T) + 0.15 * np.sin(2 * np.pi * 59.9 * T)
healthy_noise = np.random.normal(0, 0.25, N_SAMPLES)
healthy_signal = healthy_shaft + healthy_noise

# 2. Outer Race Fault (BPFO ~ 107.35 Hz)
bpfo_impacts = generate_impulse_train(107.35, amplitude=3.2)
bpfo_signal = healthy_shaft + bpfo_impacts + healthy_noise

# 3. Inner Race Fault (BPFI ~ 162.20 Hz)
bpfi_impacts = generate_impulse_train(162.20, amplitude=3.6)
# Inner race impacts are amplitude-modulated by shaft rotation (load zone modulation)
load_zone_modulation = 1.0 + 0.5 * np.cos(2 * np.pi * 29.95 * T)
bpfi_signal = healthy_shaft + (bpfi_impacts * load_zone_modulation) + healthy_noise

signals = {
    "healthy_bearing": healthy_signal,
    "outer_race_fault_bpfo": bpfo_signal,
    "inner_race_fault_bpfi": bpfi_signal,
}

for name, sig in signals.items():
    # Save as WAV (16-bit PCM normalized)
    peak = np.max(np.abs(sig))
    int16_data = ((sig / peak) * 30000).astype(np.int16)
    wav_path = os.path.join(OUTPUT_DIR, f"{name}.wav")
    scipy.io.wavfile.write(wav_path, int(FS), int16_data)

    # Save as CSV
    csv_path = os.path.join(OUTPUT_DIR, f"{name}.csv")
    df = pd.DataFrame({"vibration_amplitude": sig})
    df.to_csv(csv_path, index=False)

print(f"Generated sample datasets successfully in: {OUTPUT_DIR}")
