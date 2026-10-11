# AcousticSense: Technical Implementation Specification
## Hypothesis H2 (Arithmetic Precision Limits) & Hypothesis H3 (Filter Ringing Quantification)

This document provides the mathematical theory, numerical models, algorithmic implementation, and evaluation protocols for **Hypothesis H2** and **Hypothesis H3** as specified in:
*Real-Time Acoustic Emission Fault Detection for Industrial Machinery: Block-Length and Precision Limits on Embedded Transient Isolation Under Non-Stationary Factory Noise*.

---

# Part 1: Hypothesis H2 — Arithmetic Precision Limits (Q15, Q31, Block-Floating-Point)

## 1.1 The Research Hypothesis
> **H2**: *Single-precision floating point is sufficient throughout, while a fixed-point realization fails first in the Levinson–Durbin recursion at high order $p$ and in the fourth-moment accumulation, and meets the operating point only with block-floating-point scaling whose required exponent range can be stated.*

### The Theoretical Obstacles in Fixed-Point Embedded DSP:
1. **Fourth-Moment ($μ_4$) Dynamic Range & Accumulator Headroom**:
   - Let $x[n]$ be a quantized 16-bit integer signal: $-2^{15} \le x[n] < 2^{15}$.
   - The fourth power $x[n]^4$ requires:
     $$4 \times 16 = 64\text{ bits of dynamic range}$$
   - Accumulating over a processing block of $N$ samples requires:
     $$\text{Headroom} = 64 + \log_2(N)\text{ bits}$$
   - For $N = 1024$ samples ($\log_2(1024) = 10$), an accumulator needs **74 bits** of headroom!
   - On a typical 32-bit DSP or 40-bit extended accumulator (like the TI TMS320C674x), raw fixed-point accumulation will catastrophic-overflow unless **Block-Floating-Point (BFP)** scaling with a shared exponent is applied.

2. **Levinson–Durbin LPC Ill-Conditioning**:
   - The linear prediction error filter models deterministic shaft lines:
     $$e[n] = x[n] - \sum_{k=1}^p a_k x[n-k]$$
   - The reflection coefficients $k_m$ are updated via:
     $$k_m = -\frac{\Delta_m}{E_{m-1}}, \quad E_m = E_{m-1}(1 - k_m^2)$$
   - When the signal contains strong narrowband sinusoids, the prediction error energy $E_{m-1} \to 0$. In Q15 or Q31 fixed-point, finite word-length truncation causes round-off noise to blow up the division, leading to reflection coefficients $|k_m| \ge 1$, which makes the whitening filter unstable (poles move outside the unit circle).

---

## 1.2 Mathematical Formulation of Fixed-Point Number Formats

A fixed-point number in $Qm.n$ format consists of 1 sign bit, $m$ integer bits, and $n$ fractional bits (total word length $W = 1 + m + n$):

### 1. Q15 Format (16-bit DSP Standard: TI TMS320C55x, C674x 16-bit SIMD)
- Total bits: 16 ($m = 0, n = 15$).
- Numerical range: $[-1.0, 1.0 - 2^{-15}] = [-1.0, +0.9999694824]$.
- Resolution / LSB: $\epsilon = 2^{-15} \approx 3.0518 \times 10^{-5}$.

### 2. Q31 Format (32-bit DSP Standard)
- Total bits: 32 ($m = 0, n = 31$).
- Numerical range: $[-1.0, 1.0 - 2^{-31}]$.
- Resolution / LSB: $\epsilon = 2^{-31} \approx 4.6566 \times 10^{-10}$.

### 3. Bit-True Quantization Operator
To simulate hardware fixed-point truncation bit-for-bit in Python:
```python
def quantize_fixed_point(x: np.ndarray, word_length: int, frac_bits: int) -> np.ndarray:
    scale = 2.0 ** frac_bits
    max_int = (1 << (word_length - 1)) - 1
    min_int = -(1 << (word_length - 1))
    
    # Scale, round, clip, and rescale
    x_scaled = np.round(x * scale)
    x_clipped = np.clip(x_scaled, min_int, max_int)
    return x_clipped / scale
```

---

## 1.3 Block-Floating-Point (BFP) Moment Accumulator Algorithm

To compute the fourth moment $\mu_4 = \frac{1}{N} \sum_{n=0}^{N-1} x[n]^4$ on fixed-point architectures without 74-bit accumulators:

1. **Find Peak Exponent**:
   For block $x = [x[0], \dots, x[N-1]]$, find maximum absolute value:
   $$M = \max_n |x[n]|$$
2. **Determine Shared Scaling Factor $S$**:
   $$S = 2^{\lceil \log_2(M) \rceil}$$
3. **Normalize Block to Range $[-1, 1]$**:
   $$y[n] = \text{quantize}_{Q15}\left(\frac{x[n]}{S}\right)$$
4. **Accumulate Fourth Power**:
   $$A = \sum_{n=0}^{N-1} y[n]^4$$
   Because $y[n] \in [-1, 1]$, $y[n]^4 \le 1.0$. Summing $N$ terms requires only $\log_2(N)$ bits above the binary point (easily fitting into a standard 32-bit or 40-bit accumulator).
5. **Reconstruct True Moment**:
   $$\mu_4 = \frac{A}{N} \cdot S^4$$

---

## 1.4 Verification Metrics for H2
- **Kurtosis Error Bias**:
  $$\text{Bias}(K) = \frac{K_{\text{fixed}} - K_{\text{float64}}}{K_{\text{float64}}} \times 100\%$$
- **Operating Point Criterion**: Does the fixed-point implementation still reach:
  $$P_D \ge 0.90 \quad \text{at} \quad P_{FA} \le 10^{-3}$$
- **Breakdown Point**: Lowest order $p$ and lowest word-length $W$ before Levinson–Durbin produces unstable poles.

---

# Part 2: Hypothesis H3 — Resonance-Band Filter Ringing Quantification

## 2.1 The Research Hypothesis
> **H3**: *The resonance-band filter's own ringing reduces measured kurtosis by a predictable amount once its effective duration approaches the impact spacing, and a minimum bandwidth-to-fault-rate ratio can be specified per realization.*

### The Physical Mechanism:
1. When an impact excites a structural resonance, the acoustic emission burst decays exponentially:
   $$s(t) = e^{-\alpha t} \sin(\omega_0 t)$$
2. When this burst passes through a bandpass filter of bandwidth $B$ (in Hz), the filter's own impulse response $h(t)$ has an effective impulse duration (ringing decay time):
   $$\tau_{\text{filter}} \approx \frac{1}{\pi B} \quad (\text{or } \frac{2}{\pi B})$$
3. **Impact Smearing Condition**:
   - The mechanical defect impacts repeat at interval:
     $$T_{\text{impact}} = \frac{1}{f_{\text{fault}}}$$
   - If the filter is chosen too narrow ($B$ is small), then $\tau_{\text{filter}} > T_{\text{impact}}$.
   - The ringing tail of impact $k$ overlaps with the arrival of impact $k+1$.
   - **Consequence**: The discrete train of sparse impacts smears into a continuous quasi-stationary pseudo-sinusoid.
   - **Kurtosis Collapse**: By the Central Limit Theorem, the summation of smeared overlapping transients drives the probability density function toward Gaussian ($K \to 0$ excess kurtosis), causing the fault detector to fail!

---

## 2.2 Mathematical Model of Impulsiveness Loss

Let the dimensionless bandwidth-to-fault-rate ratio be:
$$\beta = \frac{B}{f_{\text{fault}}}$$

- **Regime 1: Severe Smearing ($\beta \ll 2.0$)**:
  $\tau_{\text{filter}} \gg T_{\text{impact}}$. Kurtosis drops by $> 70\%$. Harmonics disappear into noise.
- **Regime 2: Transitional ($\beta \approx 3.0 - 5.0$)**:
  Moderate smearing. Filter ringing smears pulse shapes, reducing excess kurtosis by $20\% - 40\%$.
- **Regime 3: Negligible Smearing ($\beta \ge 8.0 - 10.0$)**:
  $\tau_{\text{filter}} \ll T_{\text{impact}}$. The impulse response completely rings down before the next impact arrives. Measured kurtosis approaches true physical kurtosis.

---

## 2.3 Filter Realization Comparison: FIR vs. IIR

The research report explicitly compares **FIR versus IIR** and **full-rate vs. decimated**:

| Realization | Ringing Characteristics | Phase Distortion | Computational Complexity |
| :--- | :--- | :--- | :--- |
| **IIR (Butterworth SOS)** | Infinite tail with exponential decay $\tau \sim Q/\omega_0$ | Non-linear phase (unless filtered bidirectional with `sosfiltfilt`) | Very low: $O(2p)$ operations/sample |
| **IIR (Chebyshev II)** | Steeper roll-off, sharper ringing in stopband | Phase distortion in passband | Low |
| **FIR (Parks-McClellan)** | Strictly bounded duration $T_{\text{FIR}} = M / F_s$ ($M = \text{taps}$) | Perfect linear phase ($0$ phase distortion) | High: $M \approx \frac{4 F_s}{\Delta f}$ taps |
| **Decimated Complex FIR** | Filter duration scales with downsampling rate $D$ | Zero phase, analytic envelope directly output | Low: Operations amortized by $D$ |

---

# Part 3: Architecture & Python Simulation Module Design

To add H2 and H3 to the AcousticSense backend without modifying the existing stable pipeline:

```
backend/
├── app/
│   ├── main.py              # Existing 8-stage pipeline
│   ├── fixed_point.py       # [NEW] Q15, Q31, BFP simulation & LPC stability
│   └── filter_ringing.py    # [NEW] Ringing decay sweeper & Beta ratio curve
```

### Module 1: `fixed_point.py`
Simulates:
1. `simulate_q15_pipeline(signal, fs, block_len)`
2. `simulate_q31_pipeline(signal, fs, block_len)`
3. `simulate_bfp_kurtosis(signal, fs, block_len)`
4. `levinson_durbin_stability_sweep(signal, orders=[4, 8, 12, 16, 24, 32])`

### Module 2: `filter_ringing.py`
Simulates:
1. `sweep_filter_bandwidth(signal, fs, fault_freq, bandwidths=[100, 200, 500, 1000, 2000])`
2. `compare_fir_vs_iir_ringing(signal, fs, fault_freq, bandwidth)`
3. Returns kurtosis retention ratio: $\eta = \frac{K_{\text{measured}}}{K_{\text{wideband}}}$.

---

# Part 4: Frontend UI Integration Plan

Add an **"Embedded DSP Feasibility"** view or expand **Experiment Lab** with two tabs:
1. **Precision Sweep (H2)**:
   - Bar chart comparing Float64 vs. Float32 vs. Q31 vs. Q15 kurtosis estimates.
   - Indicator of LPC Levinson-Durbin condition number vs order $p$.
2. **Filter Ringing & Bandwidth (H3)**:
   - Line chart of Measured Kurtosis vs. $\beta = B / f_{\text{fault}}$.
   - Critical threshold line marked at $\beta = 5.0$.
