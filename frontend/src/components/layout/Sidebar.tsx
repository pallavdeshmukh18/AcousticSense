import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSignal } from '../../context/SignalContext';
import {
  Activity,
  Waves,
  FlaskConical,
  ShieldCheck,
  Menu,
  X,
  Trash2,
  FileText,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { uploadedSignal, clearSession } = useSignal();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: Activity,
    },
    {
      to: '/analysis',
      label: 'Signal Analysis',
      icon: Waves,
    },
    {
      to: '/experiments',
      label: 'Experiment Lab',
      icon: FlaskConical,
    },
    {
      to: '/benchmark',
      label: 'Benchmark Suite',
      icon: ShieldCheck,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E5E5EA] w-64 select-none text-[#1D1D1F]">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-[#E5E5EA] flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          {/* Restrained Precision Sensor Symbol */}
          <div className="w-7 h-7 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-[#1D1D1F] transition-colors group-hover:bg-[#E5E5EA]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#0071E3]" aria-hidden="true">
              <path d="M12 2L13.8 8.2L20 6.5L15.8 11.2L21.5 14L15.5 15.5L16.8 21.8L12 17.5L7.2 21.8L8.5 15.5L2.5 14L8.2 11.2L4 6.5L10.2 8.2L12 2Z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-[15px] tracking-tight text-[#1D1D1F]">
              AcousticSense
            </span>
            <span className="text-[10px] text-[#86868B] font-mono tracking-normal">
              v2.4
            </span>
          </div>
        </NavLink>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[#86868B] hover:text-[#1D1D1F] p-1 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#0071E3]/10 text-[#0071E3] font-medium'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7] font-normal'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#0071E3]' : 'text-[#6E6E73]'
                    }`}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Active Signal Mini Inspector (native macOS inspector style) */}
      {uploadedSignal && (
        <div className="mx-3 mb-3 p-3 bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl text-xs">
          <div className="flex items-center justify-between text-[#6E6E73] mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-[11px] text-[#1D1D1F] font-medium">
              <FileText className="w-3.5 h-3.5 text-[#0071E3]" />
              Active Signal
            </span>
            <button
              onClick={clearSession}
              title="Remove signal from working session"
              className="text-[#86868B] hover:text-[#FF3B30] p-0.5 rounded transition-colors"
              aria-label="Clear active signal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            className="text-[12px] font-medium text-[#1D1D1F] truncate"
            title={uploadedSignal.filename}
          >
            {uploadedSignal.filename}
          </div>
          <div className="text-[11px] text-[#86868B] mt-1 flex justify-between font-mono tabular-nums">
            <span>{uploadedSignal.sample_count.toLocaleString()} pts</span>
            <span>
              {uploadedSignal.sampling_frequency
                ? `${uploadedSignal.sampling_frequency >= 1000 ? `${(uploadedSignal.sampling_frequency / 1000).toFixed(0)} kHz` : `${uploadedSignal.sampling_frequency} Hz`}`
                : 'No Fs'}
            </span>
          </div>
        </div>
      )}

    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden bg-[#FFFFFF] border-b border-[#E5E5EA] px-4 py-3 flex items-center justify-between text-[#1D1D1F]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-[#0071E3]">
              <path d="M12 2L13.8 8.2L20 6.5L15.8 11.2L21.5 14L15.5 15.5L16.8 21.8L12 17.5L7.2 21.8L8.5 15.5L2.5 14L8.2 11.2L4 6.5L10.2 8.2L12 2Z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#1D1D1F]">
            AcousticSense
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[#6E6E73] hover:text-[#1D1D1F] p-1.5 rounded-md"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
