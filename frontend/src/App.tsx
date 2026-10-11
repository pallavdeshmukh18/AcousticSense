import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SignalProvider } from './context/SignalContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { SignalAnalysis } from './pages/SignalAnalysis';
import { ExperimentLab } from './pages/ExperimentLab';
import { LandingPage } from './pages/LandingPage';

const AppLayout: React.FC = () => {
  const location = useLocation();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/analysis':
        return {
          title: 'Signal Analysis',
          description: 'Upload audio/CSV waveforms and run full 8-stage DSP defect detection.',
        };
      case '/experiments':
        return {
          title: 'Experiment Lab',
          description: 'Evaluate block segmentation effects on kurtosis and execution time.',
        };
      case '/dashboard':
      default:
        return {
          title: 'AcousticSense Dashboard',
          description: 'Rotating machinery acoustic emission fault diagnosis platform.',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={meta.title} description={meta.description} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis" element={<SignalAnalysis />} />
            <Route path="/experiments" element={<ExperimentLab />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SignalProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </SignalProvider>
    </BrowserRouter>
  );
};

export default App;
