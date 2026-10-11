import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SignalProvider } from './context/SignalContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { SignalAnalysis } from './pages/SignalAnalysis';
import { ExperimentLab } from './pages/ExperimentLab';
import { LandingPage } from './pages/LandingPage';
import { BenchmarkEvaluation } from './pages/BenchmarkEvaluation';

const AppLayout: React.FC = () => {
  const location = useLocation();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/analysis':
        return {
          title: 'Signal Analysis',
          description: 'Prepare a signal, configure parameters, and investigate frequency-domain and bearing-fault characteristics.',
        };
      case '/experiments':
        return {
          title: 'Experiment Lab',
          description: 'Investigate how signal-processing choices affect detection, numerical precision, and transient preservation.',
        };
      case '/benchmark':
        return {
          title: 'Benchmark Evaluation',
          description: 'CWRU dataset test suite, interactive confusion matrix, and ROC curves.',
        };
      case '/dashboard':
      case '/':
      default:
        return {
          title: 'AcousticSense Dashboard',
          description: 'Rotating machinery acoustic emission fault diagnosis platform.',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F5F5F7] text-[#1D1D1F] antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={meta.title} description={meta.description} />
        <main className="flex-1 overflow-y-auto bg-[#F5F5F7]">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis" element={<SignalAnalysis />} />
            <Route path="/experiments" element={<ExperimentLab />} />
            <Route path="/benchmark" element={<BenchmarkEvaluation />} />
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
