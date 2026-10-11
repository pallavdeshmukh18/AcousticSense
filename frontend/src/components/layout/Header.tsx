import React from 'react';
import { useSignal } from '../../context/SignalContext';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  description: string;
}

export const Header: React.FC<HeaderProps> = ({ title, description }) => {
  const { backendConnected, isCheckingHealth, checkBackendHealth } = useSignal();

  return (
    <header className="bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5E5EA] px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 select-none">
      <div className="flex flex-col">
        <h1 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight leading-snug">
          {title}
        </h1>
        <p className="text-[12px] text-[#6E6E73] font-normal leading-normal">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Subtle, understated backend health indicator */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F5F5F7] text-[11px] font-medium text-[#6E6E73]"
          title={
            backendConnected === true
              ? 'DSP Backend operational and connected'
              : backendConnected === false
              ? 'DSP Backend disconnected or unreachable'
              : 'Verifying DSP Backend status'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendConnected === true
                ? 'bg-[#34C759]'
                : backendConnected === false
                ? 'bg-[#FF3B30]'
                : 'bg-[#FF9500]'
            }`}
          />
          <span className="text-[#1D1D1F]">
            {backendConnected === true
              ? 'DSP Engine'
              : backendConnected === false
              ? 'Offline'
              : 'Connecting'}
          </span>
        </div>

        {/* Small, unobtrusive refresh action */}
        <button
          onClick={() => checkBackendHealth()}
          disabled={isCheckingHealth}
          className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-md transition-colors"
          title="Check backend connection"
          aria-label="Refresh backend status"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-[#0071E3]' : ''}`}
          />
        </button>
      </div>
    </header>
  );
};
