import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Maximize2,
  Edit2,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isLightSection, setIsLightSection] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState<number>(0);

  // Mouse parallax state for 3D hero tilt
  const [heroMouse, setHeroMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cardsMouse, setCardsMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 2000 });
        setBackendOnline(res.data?.status === 'ok');
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);
      const pipelineEl = document.getElementById('pipeline');
      const threshold = pipelineEl ? pipelineEl.offsetTop - 120 : 650;
      if (currentScroll > threshold) {
        setIsLightSection(true);
      } else {
        setIsLightSection(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse move handler for Hero section
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroMouse({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setHeroMouse({ x: 0, y: 0 });
  };

  // Mouse move handler for Analytics Cards section
  const handleCardsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardsMouse({ x, y });
  };

  return (
    <div className="min-h-screen bg-[#07090e] font-sans antialiased text-slate-100 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION BAR (Exact Video Grid Structure) */}
      {/* ======================================================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          isLightSection
            ? 'bg-[#f4f6fa]/90 backdrop-blur-md border-b border-slate-200 text-slate-800'
            : 'bg-[#07090e]/85 backdrop-blur-md border-b border-white/10 text-white'
        }`}
      >
        <div className="w-full flex items-center justify-between h-14 px-6 lg:px-10">
          {/* Logo (Six-pointed star mark + AcousticSense) */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-6 h-6 transition-transform duration-300 group-hover:rotate-45 ${
                isLightSection ? 'text-slate-900' : 'text-white'
              }`}
              fill="currentColor"
            >
              <path d="M12 2L13.8 8.2L20 6.5L15.8 11.2L21.5 14L15.5 15.5L16.8 21.8L12 17.5L7.2 21.8L8.5 15.5L2.5 14L8.2 11.2L4 6.5L10.2 8.2L12 2Z" />
            </svg>
            <span
              className={`text-lg font-medium tracking-tight ${
                isLightSection ? 'text-slate-900' : 'text-white'
              }`}
            >
              AcousticSense
            </span>
          </div>

          {/* Center Navigation with Exact 1px Grid Border Dividers */}
          <nav
            className={`hidden md:flex items-center h-14 border-x ${
              isLightSection ? 'border-slate-200' : 'border-white/10'
            }`}
          >
            <div
              onClick={() => {
                const el = document.getElementById('pipeline');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`h-full flex items-center gap-1.5 px-6 border-r text-xs font-medium cursor-pointer transition-colors ${
                isLightSection
                  ? 'border-slate-200 text-slate-600 hover:text-slate-950'
                  : 'border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <span>DSP Pipeline</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </div>
            <div
              onClick={() => {
                const el = document.getElementById('pipeline');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`h-full flex items-center gap-1.5 px-6 border-r text-xs font-medium cursor-pointer transition-colors ${
                isLightSection
                  ? 'border-slate-200 text-slate-600 hover:text-slate-950'
                  : 'border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <span>Kinematics</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </div>
            <div
              onClick={() => {
                const el = document.getElementById('diagnostics');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`h-full flex items-center px-6 border-r text-xs font-medium cursor-pointer transition-colors ${
                isLightSection
                  ? 'border-slate-200 text-slate-600 hover:text-slate-950'
                  : 'border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <span>Diagnostics</span>
            </div>
            <div
              onClick={() => navigate('/experiments')}
              className={`h-full flex items-center px-6 text-xs font-medium cursor-pointer transition-colors ${
                isLightSection
                  ? 'text-slate-600 hover:text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Experiment Lab</span>
            </div>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isLightSection
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-[#181a20] hover:bg-[#252830] text-slate-200 border border-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/analysis')}
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-white hover:bg-slate-100 text-slate-950 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              Analyse a Signal
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* 2. HERO SECTION (Dark to Royal-Blue Full Screen Aura + 3D Platform) */}
      {/* Parallax Depth: Full Screen Aura, Platform, and Wireframe Cube */}
      {/* ======================================================== */}
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative min-h-screen pt-28 pb-28 sm:pb-32 flex flex-col justify-between overflow-hidden bg-[#07090e]"
        style={{
          background:
            'radial-gradient(ellipse 110% 75% at 80% 85%, #1d4ed8 0%, #1e40af 18%, #172554 36%, #07090e 58%, #05070c 100%)',
        }}
      >
        {/* Parallax Radiant Royal-Blue Ambient Aura in Bottom-Right & Platform */}
        <div
          className="absolute -bottom-24 -right-16 w-[950px] h-[950px] pointer-events-none rounded-full blur-[140px] opacity-85 transition-transform duration-700 ease-out animate-aura-pulse"
          style={{
            transform: `translate3d(${heroMouse.x * -50}px, ${heroMouse.y * -50 + scrollY * 0.15}px, 0)`,
            background:
              'radial-gradient(circle, rgba(37,99,235,0.95) 0%, rgba(29,78,216,0.75) 35%, rgba(30,58,138,0.3) 65%, transparent 85%)',
          }}
        />

        {/* Parallax Radiant Royal-Blue Accent in Lower-Left (Under CTA & Logos, keeping headline on black) */}
        <div
          className="absolute -bottom-36 -left-12 w-[550px] h-[550px] pointer-events-none rounded-full blur-[130px] opacity-65 transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(${heroMouse.x * -25}px, ${heroMouse.y * -25 + scrollY * 0.1}px, 0)`,
            background:
              'radial-gradient(circle, rgba(37,99,235,0.7) 0%, rgba(29,78,216,0.4) 40%, transparent 75%)',
          }}
        />

        {/* Parallax ambient fill on lower region - keeping top half inky black */}
        <div
          className="absolute bottom-16 left-0 right-0 h-[420px] pointer-events-none opacity-75 blur-[90px] transition-transform duration-700"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            background:
              'linear-gradient(to top, transparent 0%, rgba(29,78,216,0.85) 15%, rgba(37,99,235,0.5) 45%, transparent 85%)',
          }}
        />

        {/* Seamless Soft Diffusion into Light Canvas (No lines, natural alpha feathering into #f4f6fa) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[360px] pointer-events-none z-[2]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(244, 246, 250, 0) 0%, rgba(244, 246, 250, 0.04) 20%, rgba(244, 246, 250, 0.16) 40%, rgba(244, 246, 250, 0.45) 65%, rgba(244, 246, 250, 0.8) 85%, #f4f6fa 100%)',
          }}
        />

        <div className="max-w-[1360px] mx-auto w-full px-6 lg:px-12 relative z-10 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
            {/* Left Column (Hero Content with gentle scroll parallax) */}
            <div
              className="lg:col-span-6 flex flex-col items-start pt-6 transition-transform duration-500 ease-out"
              style={{
                transform: `translate3d(${heroMouse.x * 12}px, ${heroMouse.y * 12 - scrollY * 0.1}px, 0)`,
              }}
            >
              {/* Badges: ISO 10816-3 & Classical DSP Monitoring */}
              <div className="flex items-center gap-2.5 mb-8">
                <div className="inline-flex items-center px-3 py-1 rounded bg-black/60 border border-white/15 text-[11px] font-mono tracking-wider text-slate-300 uppercase shadow-sm">
                  ISO 10816-3 VIBRATION STANDARD
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/60 border border-white/15 text-[11px] font-mono tracking-wider text-slate-300 uppercase shadow-sm">
                  <span>STATUS:</span>
                  <span
                    className={`w-1.5 h-1.5 inline-block ${
                      backendOnline === false ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>ACQUIRING / DSP</span>
                </div>
              </div>

              {/* Headline (Video Cadence Adapted for Acoustic Emission Fault Detection) */}
              <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-normal tracking-[-0.035em] text-white leading-[1.04] mb-6">
                Investigated before <br />
                <span className="text-white">it&apos;s a breakdown.</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-xl mb-9">
                Navigate every microsecond transient impact with deterministic, real-time DSP detection
              </p>

              {/* CTA Split Button */}
              <div className="inline-flex rounded-lg overflow-hidden bg-[#2563eb] hover:bg-[#1d4ed8] transition-all duration-300 shadow-xl shadow-blue-600/35 hover:scale-[1.02] active:scale-[0.98]">
                <button
                  onClick={() => navigate('/analysis')}
                  className="px-6 py-3 text-sm font-medium text-white transition-colors"
                >
                  Analyse a Signal
                </button>
                <div className="w-[1px] bg-blue-400/30 my-2" />
                <button
                  onClick={() => navigate('/analysis')}
                  className="px-3.5 py-3 text-white flex items-center justify-center transition-colors hover:translate-x-0.5"
                  aria-label="Analyse a Signal arrow"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: 3D Parallax Isometric Platform & Floating Wireframe Box */}
            <div
              className="lg:col-span-6 relative flex items-center justify-center min-h-[440px] perspective-1000"
              style={{
                perspective: '1200px',
              }}
            >
              {/* Outer 3D Container responsive to mouse & levitation */}
              <div
                className="relative w-full max-w-[540px] aspect-[4/3] transition-transform duration-300 ease-out"
                style={{
                  transform: `rotateX(${heroMouse.y * -20}deg) rotateY(${heroMouse.x * 20}deg) translateY(${scrollY * -0.08}px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* SVG Isometric Grid & Coordinate Lines */}
                <svg
                  viewBox="0 0 600 450"
                  className="w-full h-full overflow-visible select-none pointer-events-none"
                >
                  <defs>
                    <linearGradient id="slabGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.35" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="14" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Parallax Layer 1: Isometric Axis Guide Lines with DSP Parameters */}
                  <g
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="transition-transform duration-500 ease-out"
                    style={{
                      transform: `translate3d(${heroMouse.x * -15}px, ${heroMouse.y * -15}px, 0)`,
                    }}
                  >
                    <line x1="300" y1="260" x2="100" y2="140" />
                    <line x1="300" y1="260" x2="180" y2="340" />
                    <line x1="300" y1="260" x2="520" y2="130" />
                    <line x1="300" y1="260" x2="480" y2="370" />
                  </g>

                  {/* Diagonal Axis Labels: Real DSP Parameters */}
                  <g
                    className="transition-transform duration-500 ease-out"
                    style={{
                      transform: `translate3d(${heroMouse.x * -10}px, ${heroMouse.y * -10}px, 0)`,
                    }}
                  >
                    <text
                      x="200"
                      y="180"
                      transform="rotate(-30 200 180)"
                      fill="rgba(255,255,255,0.35)"
                      fontSize="9"
                      fontFamily="monospace"
                      letterSpacing="1"
                    >
                      RESONANCE BAND: 8–16 kHz
                    </text>
                    <text
                      x="410"
                      y="360"
                      transform="rotate(30 410 360)"
                      fill="rgba(255,255,255,0.35)"
                      fontSize="9"
                      fontFamily="monospace"
                      letterSpacing="1"
                    >
                      SPECTRAL KURTOSIS: 8.42
                    </text>
                    <text
                      x="480"
                      y="270"
                      transform="rotate(-30 480 270)"
                      fill="rgba(255,255,255,0.35)"
                      fontSize="9"
                      fontFamily="monospace"
                      letterSpacing="1"
                    >
                      SAMPLING RATE: 48 kHz
                    </text>
                  </g>

                  {/* Parallax Layer 2: Base Isometric Platform Slab */}
                  <g
                    className="transition-transform duration-300 ease-out"
                    style={{
                      transform: `translate3d(${heroMouse.x * 10}px, ${heroMouse.y * 10}px, 0)`,
                    }}
                  >
                    <polygon
                      points="300,320 480,240 300,160 120,240"
                      fill="rgba(29, 78, 216, 0.45)"
                      filter="url(#glow)"
                    />
                    <polygon
                      points="120,240 300,320 300,335 120,255"
                      fill="#1e3a8a"
                      opacity="0.85"
                    />
                    <polygon
                      points="480,240 300,320 300,335 480,255"
                      fill="#172554"
                      opacity="0.85"
                    />
                    <polygon
                      points="300,310 470,235 300,160 130,235"
                      fill="url(#slabGradient)"
                      stroke="rgba(255, 255, 255, 0.45)"
                      strokeWidth="1.5"
                    />

                    <circle cx="300" cy="310" r="2.5" fill="#ffffff" />
                    <circle cx="470" cy="235" r="2.5" fill="#ffffff" />
                    <circle cx="300" cy="160" r="2.5" fill="#ffffff" />
                    <circle cx="130" cy="235" r="2.5" fill="#ffffff" />

                    {/* Acoustic Emission Transient Burst Waveform */}
                    <path
                      d="M 180,235 
                         C 210,230 225,245 245,230 
                         C 265,215 275,190 295,230 
                         C 315,270 330,210 355,215 
                         C 380,220 405,240 430,235"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      filter="drop-shadow(0 2px 8px rgba(255,255,255,0.7))"
                      className="animate-wave-pulse"
                    />

                    {/* Centered Pill on slab: [ BEARING RESONANCE: BPFO ] */}
                    <g transform="translate(225, 260) rotate(-26)">
                      <rect
                        x="0"
                        y="0"
                        width="150"
                        height="20"
                        rx="4"
                        fill="rgba(255, 255, 255, 0.18)"
                        stroke="rgba(255, 255, 255, 0.45)"
                        strokeWidth="1"
                      />
                      <text
                        x="75"
                        y="13"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        letterSpacing="0.8"
                      >
                        BEARING RESONANCE: BPFO
                      </text>
                    </g>
                  </g>

                  {/* Parallax Layer 3: Floating 3D Wireframe Box (DEFECT DETECTED: 93.9 Hz) */}
                  <g
                    className="animate-float transition-transform duration-200 ease-out"
                    style={{
                      transform: `translate3d(${heroMouse.x * 35}px, ${heroMouse.y * 35}px, 60px)`,
                    }}
                  >
                    <polygon
                      points="300,175 430,115 300,60 170,120"
                      fill="rgba(37, 99, 235, 0.1)"
                      stroke="rgba(255, 255, 255, 0.75)"
                      strokeWidth="1.25"
                    />
                    <line x1="300" y1="175" x2="300" y2="245" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="430" y1="115" x2="430" y2="185" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="300" y1="60" x2="300" y2="130" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="170" y1="120" x2="170" y2="190" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />

                    <circle cx="300" cy="175" r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #60a5fa)" />
                    <circle cx="430" cy="115" r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #60a5fa)" />
                    <circle cx="300" cy="60" r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #60a5fa)" />
                    <circle cx="170" cy="120" r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #60a5fa)" />

                    {/* Top Right Label on Wireframe: DEFECT DETECTED: 93.9 Hz */}
                    <text
                      x="395"
                      y="85"
                      transform="rotate(26 395 85)"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      letterSpacing="0.5"
                    >
                      DEFECT DETECTED: 93.9 Hz
                    </text>

                    {/* Side text label: Sub-millisecond transient burst isolation */}
                    <text
                      x="230"
                      y="110"
                      transform="rotate(-26 230 110)"
                      fill="rgba(255,255,255,0.7)"
                      fontSize="7.5"
                      fontFamily="sans-serif"
                    >
                      Sub-millisecond transient burst isolation
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Logos: METHODOLOGY VALIDATED ON ROTATING MACHINERY DATASETS */}
          <div
            className="pt-12 pb-4 transition-transform duration-500 ease-out"
            style={{
              transform: `translateY(${scrollY * -0.05}px)`,
            }}
          >
            <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-4">
              METHODOLOGY VALIDATED ON ROTATING MACHINERY DATASETS
            </p>
            <div className="flex items-center gap-12 sm:gap-16 opacity-85">
              <div className="flex items-center gap-2 text-white font-semibold text-lg tracking-tight">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 2L24 22H0L12 2Z" />
                </svg>
                <span>ISO 10816-3</span>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold text-base tracking-wider uppercase font-mono">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M3 3L11 21L14 13L22 10L3 3Z" />
                </svg>
                <span>CWRU LAB</span>
              </div>
              <div className="text-white font-bold text-xl tracking-tight lowercase font-sans">
                scipy dsp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. 4-COLUMN FEATURE SECTION (Clean Light Sky-White) */}
      {/* 8-Stage Classical DSP Architecture */}
      {/* ======================================================== */}
      <section
        id="pipeline"
        className="bg-[#f4f6fa] text-slate-900 pt-20 sm:pt-28 pb-24 border-b border-slate-200 transition-colors"
      >
        <div className="max-w-[1360px] mx-auto px-6 lg:px-12">
          {/* Main Heading */}
          <div
            className="max-w-2xl mb-16 transition-transform duration-700 ease-out"
            style={{
              transform: `translateY(${Math.max(0, (680 - scrollY) * 0.12)}px)`,
            }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-normal tracking-[-0.03em] text-slate-900 leading-[1.08] mb-4">
              Built for the alerts <br />
              <span className="text-[#3b82f6]">that actually matter</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
              AcousticSense clears baseline machine noise so researchers can isolate true bearing resonance
            </p>
          </div>

          {/* 4 Vertical Columns with Delicate 1px Borders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-y border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* COLUMN 1: STAGE 01 (Zero-Loss Memory Buffering) */}
            <div className="p-7 lg:p-8 flex flex-col justify-between min-h-[380px] hover:bg-white/70 transition-all duration-300 group cursor-default">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-4 group-hover:text-blue-600 transition-colors">
                STAGE 01
              </span>

              {/* Isometric 5-Layer Stack with Hover Spread Animation */}
              <div className="my-auto py-4 flex items-center justify-center">
                <svg viewBox="0 0 200 160" className="w-44 h-36 overflow-visible">
                  {[
                    { y: 120, opacity: 0.3, hoverDy: 10 },
                    { y: 100, opacity: 0.5, hoverDy: 5 },
                    { y: 80, opacity: 0.7, hoverDy: 0 },
                    { y: 60, opacity: 0.85, hoverDy: -8 },
                    { y: 40, opacity: 1.0, hoverDy: -16 },
                  ].map((layer, idx) => (
                    <g
                      key={idx}
                      className="transition-transform duration-300 ease-out group-hover:[transform:translateY(var(--hover-dy))]"
                      style={{ '--hover-dy': `${layer.hoverDy}px` } as React.CSSProperties}
                    >
                      <polygon
                        points={`100,${layer.y} 155,${layer.y + 28} 100,${layer.y + 56} 45,${layer.y + 28}`}
                        fill="#ffffff"
                        stroke="#94a3b8"
                        strokeWidth="1"
                        opacity={layer.opacity}
                      />
                      {idx === 4 && (
                        <>
                          <ellipse
                            cx="100"
                            cy="68"
                            rx="18"
                            ry="9"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            className="animate-pulse"
                          />
                          <circle cx="100" cy="68" r="2.5" fill="#3b82f6" className="animate-ping" />
                          <circle cx="100" cy="68" r="2" fill="#3b82f6" />
                          <circle cx="92" cy="65" r="1.5" fill="#3b82f6" />
                          <circle cx="108" cy="71" r="1.5" fill="#3b82f6" />
                          <circle cx="95" cy="72" r="1.5" fill="#3b82f6" />
                          <circle cx="105" cy="64" r="1.5" fill="#3b82f6" />
                        </>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Every microsecond, accounted for
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Zero-loss memory buffering captures raw acoustic emission stress waves up to 2 MHz without downsampling distortion
                </p>
              </div>
            </div>

            {/* COLUMN 2: STAGE 02 (Spectral Kurtosis Band Selection) */}
            <div className="p-7 lg:p-8 flex flex-col justify-between min-h-[380px] hover:bg-white/70 transition-all duration-300 group cursor-default">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-4 group-hover:text-blue-600 transition-colors">
                STAGE 02
              </span>

              {/* Stepped Blocks with Animated Flow Line */}
              <div className="my-auto py-4 flex items-center justify-center">
                <svg viewBox="0 0 200 160" className="w-44 h-36 overflow-visible">
                  <polygon
                    points="70,40 100,55 70,70 40,55"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="transition-transform duration-300 group-hover:-translate-y-1"
                  />
                  <polygon
                    points="130,65 160,80 130,95 100,80"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                  <polygon
                    points="70,95 100,110 70,125 40,110"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="transition-transform duration-300 group-hover:-translate-x-1"
                  />
                  <polygon
                    points="105,120 135,135 105,150 75,135"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="transition-transform duration-300 group-hover:translate-y-1"
                  />

                  {/* Flowing animated blue connector line */}
                  <path
                    d="M 70,55 L 85,55 L 85,80 L 115,80 M 115,80 L 115,100 L 70,100 L 70,110 M 70,110 L 85,110 L 85,135 L 105,135"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="5 5"
                    className="animate-flow-dash"
                  />

                  <circle cx="70" cy="55" r="2.5" fill="#3b82f6" />
                  <circle cx="130" cy="80" r="2.5" fill="#3b82f6" />
                  <circle cx="70" cy="110" r="2.5" fill="#3b82f6" />
                  <circle cx="105" cy="135" r="3" fill="#3b82f6" className="animate-pulse" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Isolates resonance, not noise
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  AcousticSense computes 4th-order spectral kurtosis across candidate bands to locate the resonant carrier band automatically
                </p>
              </div>
            </div>

            {/* COLUMN 3: STAGE 03 (Hilbert Transform Demodulation) */}
            <div className="p-7 lg:p-8 flex flex-col justify-between min-h-[380px] hover:bg-white/70 transition-all duration-300 group cursor-default">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-4 group-hover:text-blue-600 transition-colors">
                STAGE 03
              </span>

              {/* Converging Micro-Cubes Animation */}
              <div className="my-auto py-4 flex items-center justify-center">
                <svg viewBox="0 0 200 160" className="w-44 h-36 overflow-visible">
                  {[
                    { x: 100, y: 30, delay: '0s' },
                    { x: 120, y: 40, delay: '0.2s' },
                    { x: 140, y: 50, delay: '0.4s' },
                    { x: 80, y: 40, delay: '0.1s' },
                    { x: 100, y: 50, delay: '0.3s' },
                    { x: 120, y: 60, delay: '0.5s' },
                    { x: 60, y: 50, delay: '0.2s' },
                    { x: 80, y: 60, delay: '0.4s' },
                    { x: 100, y: 70, delay: '0.6s' },
                  ].map((cube, i) => (
                    <polygon
                      key={i}
                      points={`${cube.x},${cube.y} ${cube.x + 10},${cube.y + 5} ${cube.x},${cube.y + 10} ${cube.x - 10},${cube.y + 5}`}
                      fill="#ffffff"
                      stroke="#94a3b8"
                      strokeWidth="1"
                      className="animate-cube-bob"
                      style={{ animationDelay: cube.delay }}
                    />
                  ))}

                  <line x1="100" y1="80" x2="100" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="70" y1="65" x2="70" y2="110" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="130" y1="65" x2="130" y2="110" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />

                  <polygon
                    points="100,95 155,123 100,150 45,123"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <line x1="45" y1="123" x2="45" y2="135" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="100" y1="150" x2="100" y2="162" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="155" y1="123" x2="155" y2="135" stroke="#94a3b8" strokeWidth="1" />

                  <ellipse cx="100" cy="122" rx="22" ry="11" fill="rgba(59, 130, 246, 0.15)" className="animate-pulse" />
                  <circle cx="100" cy="122" r="3.5" fill="#3b82f6" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  From thousands down to one
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Thousands of frequency bins come in. Hilbert demodulation strips carrier dynamics down to single envelope impact spikes
                </p>
              </div>
            </div>

            {/* COLUMN 4: STAGE 04 (Kinematic Defect Frequency Resolution) */}
            <div className="p-7 lg:p-8 flex flex-col justify-between min-h-[380px] hover:bg-white/70 transition-all duration-300 group cursor-default">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-4 group-hover:text-blue-600 transition-colors">
                STAGE 04
              </span>

              {/* Orbiting Satellite Animation */}
              <div className="my-auto py-4 flex items-center justify-center">
                <svg viewBox="0 0 200 160" className="w-44 h-36 overflow-visible">
                  <polygon
                    points="100,85 150,110 100,135 50,110"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <polygon
                    points="100,65 135,82 100,100 65,82"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <polygon
                    points="100,45 125,58 100,70 75,58"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />

                  <circle cx="100" cy="58" r="1.5" fill="#3b82f6" />
                  <circle cx="95" cy="55" r="1.5" fill="#3b82f6" />
                  <circle cx="105" cy="61" r="1.5" fill="#3b82f6" />

                  <ellipse
                    cx="100"
                    cy="95"
                    rx="68"
                    ry="32"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  <g className="animate-spin-orbit origin-[100px_95px]">
                    <circle cx="32" cy="95" r="3.5" fill="#3b82f6" filter="drop-shadow(0 0 2px #60a5fa)" />
                    <circle cx="168" cy="95" r="3.5" fill="#3b82f6" filter="drop-shadow(0 0 2px #60a5fa)" />
                    <circle cx="100" cy="63" r="3" fill="#3b82f6" filter="drop-shadow(0 0 2px #60a5fa)" />
                  </g>
                </svg>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Resolves bearing kinematics
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every signal resolves bearing geometry — identifying BPFO, BPFI, BSF, and FTF characteristic impact frequencies
                </p>
              </div>
            </div>
          </div>

          {/* Bottom link: Explore DSP methodology → */}
          <div className="mt-8">
            <button
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-blue-600 transition-colors group"
            >
              <span>Explore complete DSP methodology</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. ANALYTICS & 3 VISUAL CARDS SECTION (Light/White) */}
      {/* Real Acoustic Emission DSP Metrics & Diagnostics */}
      {/* ======================================================== */}
      <section
        id="diagnostics"
        onMouseMove={handleCardsMouseMove}
        className="bg-[#f4f6fa] text-slate-900 pt-16 pb-32 overflow-hidden"
      >
        <div className="max-w-[1360px] mx-auto px-6 lg:px-12">
          {/* Section Heading */}
          <div className="max-w-2xl mb-12">
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-normal tracking-[-0.03em] text-slate-900 leading-[1.08] mb-4">
              Your machinery already signals <br />
              <span className="text-[#3b82f6]">something&apos;s developing</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed mb-4">
              AcousticSense turns microsecond acoustic bursts into deterministic fault signatures — automatically, the moment stress waves occur
            </p>
            <div
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-blue-600 cursor-pointer group"
            >
              <span>Signal processed</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* The Exact 3 Cards Grid with Dynamic Multiplane Depth */}
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns Container for Card 1 & Card 2 (Base Parallax Layer) */}
            <div
              className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 transition-transform duration-500 ease-out"
              style={{
                transform: `translate3d(${cardsMouse.x * 12}px, ${cardsMouse.y * 12}px, 0)`,
              }}
            >
              {/* CARD 1: Acoustic Impact Matrix (Time vs Frequency Heatmap) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between min-h-[360px] hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-5">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Acoustic Impact Matrix (Time vs Frequency)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Maximize2 className="w-3 h-3 hover:text-slate-600 cursor-pointer" />
                      <Edit2 className="w-3 h-3 hover:text-slate-600 cursor-pointer" />
                      <MoreHorizontal className="w-3 h-3 hover:text-slate-600 cursor-pointer" />
                    </div>
                  </div>

                  {/* Real DSP Metrics: Sample Count & Impacts Classified */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-2xl font-normal text-slate-900 tracking-tight">142,029</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">AE samples analyzed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-normal text-slate-900 tracking-tight">42,562</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Deterministic bursts resolved</div>
                    </div>
                  </div>

                  {/* 2D Heatmap Grid showing periodic ~10.6ms impact train */}
                  <div className="flex gap-2">
                    <div className="flex flex-col justify-between text-[9px] font-mono text-slate-400 py-0.5">
                      <span>24k</span>
                      <span>12k</span>
                      <span>4k</span>
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-1 py-1">
                      {Array.from({ length: 60 }).map((_, idx) => {
                        const col = idx % 12;
                        const row = Math.floor(idx / 12);
                        // Burst clusters repeating periodically
                        const isDense = (col % 3 === 0 && row === 1) || (col === 4 && row === 1);
                        const isMid = col % 3 === 0 || row === 1;
                        const colorClass = isDense
                          ? 'bg-[#2563eb]'
                          : isMid
                          ? 'bg-[#60a5fa]'
                          : 'bg-[#e0f2fe]';

                        return (
                          <div
                            key={idx}
                            className={`w-2.5 h-2.5 rounded-[2px] ${colorClass} transition-transform hover:scale-125 cursor-pointer`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Window labels */}
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pl-6 pt-2">
                    <span>0ms</span>
                    <span>20ms</span>
                    <span>40ms</span>
                    <span>60ms</span>
                    <span>80ms</span>
                    <span>100ms</span>
                    <span>120ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                  <span className="hover:text-slate-600 cursor-pointer">Learn more</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <span className="w-1.5 h-1.5 rounded-[1px] bg-[#e0f2fe]" />
                    <span className="w-1.5 h-1.5 rounded-[1px] bg-[#93c5fd]" />
                    <span className="w-1.5 h-1.5 rounded-[1px] bg-[#60a5fa]" />
                    <span className="w-1.5 h-1.5 rounded-[1px] bg-[#2563eb]" />
                    <span>More (AE Energy dB)</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: Demodulated Envelope Spectrum & Harmonics */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between min-h-[360px] hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-5">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Demodulated Envelope Spectrum</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Maximize2 className="w-3 h-3 hover:text-slate-600 cursor-pointer" />
                      <Edit2 className="w-3 h-3 hover:text-slate-600 cursor-pointer" />
                      <MoreHorizontal className="w-3 h-3 hover:text-slate-600 cursor-pointer" />
                    </div>
                  </div>

                  {/* BPFO Dominant Peak & Energy Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-[10px] text-slate-400">BPFO Outer Race</div>
                      <div className="text-xl font-normal text-slate-900 mt-0.5">93.9 Hz</div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">↑ 99.8% match</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Resonance Peak</div>
                      <div className="text-xl font-normal text-slate-900 mt-0.5">+18.4 dB</div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">↑ 3σ threshold</div>
                    </div>
                  </div>

                  {/* Symmetrical Density Envelope with 1X, 2X, 3X Harmonics */}
                  <div className="relative h-28 w-full my-auto flex items-center justify-center">
                    <svg viewBox="0 0 320 100" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="waveFillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                        </linearGradient>
                      </defs>

                      <line x1="0" y1="50" x2="320" y2="50" stroke="#e2e8f0" strokeWidth="1" />

                      <path
                        d="M 10,50 
                           C 60,50 100,10 160,8 
                           C 220,10 260,50 310,50 
                           C 260,50 220,90 160,92 
                           C 100,90 60,50 10,50 Z"
                        fill="url(#waveFillGrad)"
                        className="animate-wave-breathe origin-[160px_50px]"
                      />

                      <path
                        d="M 40,50 
                           C 80,50 120,22 160,20 
                           C 200,22 240,50 280,50 
                           C 240,50 200,78 160,80 
                           C 120,78 80,50 40,50 Z"
                        fill="rgba(59, 130, 246, 0.28)"
                        className="animate-wave-breathe origin-[160px_50px]"
                      />

                      <path
                        d="M 80,50 
                           C 110,50 135,35 160,33 
                           C 185,35 210,50 240,50 
                           C 210,50 185,65 160,67 
                           C 135,65 110,50 80,50 Z"
                        fill="rgba(59, 130, 246, 0.45)"
                      />

                      {/* Milestone Harmonic Badges: 1X, 2X, 3X BPFO */}
                      <g transform="translate(100, 40)">
                        <rect x="-14" y="-8" width="28" height="16" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" fill="#1e293b" fontSize="8" fontWeight="bold">1X</text>
                      </g>

                      <g transform="translate(160, 40)">
                        <rect x="-14" y="-8" width="28" height="16" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" fill="#1e293b" fontSize="8" fontWeight="bold">2X</text>
                      </g>

                      <g transform="translate(220, 40)">
                        <rect x="-14" y="-8" width="28" height="16" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" fill="#1e293b" fontSize="8" fontWeight="bold">3X</text>
                      </g>
                    </svg>
                  </div>

                  {/* Horizontal Stage Markers */}
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                    <span>Raw Signal</span>
                    <span>Detrended</span>
                    <span>Kurtosis Band</span>
                    <span>Hilbert Env</span>
                    <span>BPFO Matched</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Fault Diagnostics Digest (Floating Parallax Overlay Layer) */}
            <div
              className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out z-20 hover:scale-[1.02]"
              style={{
                transform: `translate3d(${cardsMouse.x * -25}px, ${cardsMouse.y * -25}px, 40px)`,
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Fault Diagnostics Digest
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    LIVE
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-4">
                  Active Kinematic Diagnoses
                </div>

                <div className="space-y-4">
                  {/* Fault 1: Outer race spall (BPFO) */}
                  <div className="pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-800">
                        Outer race spall — BPFO 93.9 Hz
                      </span>
                      <span className="text-[9px] font-medium text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                        Defect Confirmed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      • 93.88 Hz peak detected in 8–16 kHz band with 8.42 kurtosis
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      • Periodic impact repetition matches outer raceway geometry
                    </p>
                    <span className="text-[9px] text-slate-400 block mt-1.5">
                      By AcousticSense DSP · Real-time
                    </span>
                  </div>

                  {/* Fault 2: Inner race raceway (BPFI) */}
                  <div className="pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-800">
                        Inner race raceway — BPFI 146.2 Hz
                      </span>
                      <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Nominal
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      • Demodulated envelope energy within standard baseline limits
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      • No spectral spikes detected above 3σ fault threshold
                    </p>
                    <span className="text-[9px] text-slate-400 block mt-1.5">
                      By AcousticSense DSP · Real-time
                    </span>
                  </div>

                  {/* Fault 3: Rolling element spin (BSF) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-800">
                        Rolling element spin — BSF 59.4 Hz
                      </span>
                      <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Nominal
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      • Ball contact surfaces operating smoothly with zero spall impacts
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      • Harmonics absent across high-frequency demodulated spectrum
                    </p>
                    <span className="text-[9px] text-slate-400 block mt-1.5">
                      By AcousticSense DSP · Real-time
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ======================================================== */}
      {/* 6. KEYFRAME STYLES FOR FLUID PARALLAX & CONTINUOUS MOTION */}
      {/* ======================================================== */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(0.4deg);
          }
        }
        .animate-float {
          animation: float 4.5s ease-in-out infinite;
        }

        @keyframes auraPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.65;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.85;
          }
        }
        .animate-aura-pulse {
          animation: auraPulse 6s ease-in-out infinite;
        }

        @keyframes wavePulse {
          0%, 100% {
            stroke-width: 1.75;
          }
          50% {
            stroke-width: 2.3;
          }
        }
        .animate-wave-pulse {
          animation: wavePulse 3s ease-in-out infinite;
        }

        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-dash {
          animation: flowDash 1.2s linear infinite;
        }

        @keyframes cubeBob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-cube-bob {
          animation: cubeBob 2.5s ease-in-out infinite;
        }

        @keyframes spinOrbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-orbit {
          animation: spinOrbit 12s linear infinite;
        }

        @keyframes waveBreathe {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.06);
          }
        }
        .animate-wave-breathe {
          animation: waveBreathe 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
