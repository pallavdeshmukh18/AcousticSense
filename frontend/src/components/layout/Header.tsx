import React from 'react';
import { useSignal } from '../../context/SignalContext';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  description: string;
}

export const Header: React.FC<HeaderProps> = ({ title, description }) => {
  const { backendConnected, backendService, isCheckingHealth, checkBackendHealth } = useSignal();

  return (
    <header className="bg-white border-b border-industrial-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-industrial-800 tracking-tight">{title}</h1>
        <p className="text-sm text-industrial-500 mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            backendConnected === true
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : backendConnected === false
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-industrial-100 text-industrial-600 border-industrial-200'
          }`}
          title={
            backendConnected
              ? `Backend Connected: ${backendService || 'Acoustic Emission Fault Detection API'}`
              : 'Backend Disconnected: Ensure backend is running on http://localhost:8000'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendConnected === true
                ? 'bg-emerald-500 animate-pulse'
                : backendConnected === false
                ? 'bg-rose-500'
                : 'bg-industrial-400'
            }`}
          />
          <span>
            {backendConnected === true
              ? 'Backend Connected'
              : backendConnected === false
              ? 'Backend Offline'
              : 'Checking API...'}
          </span>
        </div>

        <button
          onClick={() => checkBackendHealth()}
          disabled={isCheckingHealth}
          className="p-1.5 text-industrial-400 hover:text-industrial-600 hover:bg-industrial-100 rounded-md transition-colors"
          title="Re-check backend status"
          aria-label="Re-check backend status"
        >
          <RefreshCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin text-primary-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
