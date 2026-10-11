import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSignal } from '../../context/SignalContext';
import {
  Activity,
  Waves,
  FlaskConical,
  Radio,
  FileAudio,
  Menu,
  X,
  Server,
  Trash2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { uploadedSignal, backendConnected, clearSession } = useSignal();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: Activity,
      description: 'System overview & DSP pipeline',
    },
    {
      to: '/analysis',
      label: 'Signal Analysis',
      icon: Waves,
      description: 'Upload & complete 8-stage DSP',
    },
    {
      to: '/experiments',
      label: 'Experiment Lab',
      icon: FlaskConical,
      description: 'Block-length evaluations',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-industrial-200 w-64 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-industrial-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-industrial-900 tracking-tight leading-none text-base">
              AcousticSense
            </div>
            <div className="text-[11px] text-industrial-500 font-medium mt-1 leading-tight">
              Acoustic Emission Fault Detection
            </div>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-industrial-400 hover:text-industrial-600 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-start gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-100/80 shadow-xs'
                    : 'text-industrial-600 hover:text-industrial-900 hover:bg-industrial-100/60'
                }`
              }
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="leading-tight">{item.label}</div>
                <div className="text-[11px] text-industrial-400 font-normal mt-0.5 leading-tight">
                  {item.description}
                </div>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Active Session Signal Badge */}
      {uploadedSignal && (
        <div className="mx-3 mb-3 p-2.5 rounded-lg bg-industrial-50 border border-industrial-200/80 text-xs">
          <div className="flex items-center justify-between text-industrial-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5 text-primary-600" />
              Active Signal
            </span>
            <button
              onClick={clearSession}
              title="Clear current session signal"
              className="text-industrial-400 hover:text-rose-600 p-0.5 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="font-mono text-industrial-800 truncate font-medium text-[11px]" title={uploadedSignal.filename}>
            {uploadedSignal.filename}
          </div>
          <div className="text-[10px] text-industrial-500 mt-1 flex justify-between font-mono">
            <span>{uploadedSignal.sample_count.toLocaleString()} samples</span>
            <span>{uploadedSignal.sampling_frequency ? `${uploadedSignal.sampling_frequency} Hz` : 'No Fs'}</span>
          </div>
        </div>
      )}

      {/* Footer Backend Connection Status */}
      <div className="p-3.5 border-t border-industrial-100 bg-industrial-50/50 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-industrial-600 font-medium">
            <Server className="w-3.5 h-3.5 text-industrial-400" />
            DSP Backend
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium text-[11px] ${
              backendConnected === true
                ? 'text-emerald-700'
                : backendConnected === false
                ? 'text-rose-600'
                : 'text-industrial-500'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendConnected === true
                  ? 'bg-emerald-500'
                  : backendConnected === false
                  ? 'bg-rose-500'
                  : 'bg-industrial-400'
              }`}
            />
            {backendConnected === true ? 'Online' : backendConnected === false ? 'Offline' : 'Connecting...'}
          </span>
        </div>
        <div className="text-[10px] text-industrial-400 mt-1 font-mono">http://localhost:8000</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button Bar */}
      <div className="md:hidden bg-white border-b border-industrial-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary-600 flex items-center justify-center text-white">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-semibold text-industrial-800 text-sm">AcousticSense</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-industrial-600 hover:text-industrial-900 p-1 rounded"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0">{sidebarContent}</aside>

      {/* Mobile Overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
