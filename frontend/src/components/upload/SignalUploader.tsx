import React, { useState, useRef } from 'react';
import { useSignal } from '../../context/SignalContext';
import { apiService, extractErrorMessage } from '../../services/api';
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  Clock,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  FileAudio,
} from 'lucide-react';

interface SignalUploaderProps {
  onUploadSuccess?: () => void;
}

export const SignalUploader: React.FC<SignalUploaderProps> = ({ onUploadSuccess }) => {
  const { uploadedSignal, setUploadedSignal } = useSignal();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columnName, setColumnName] = useState('');
  const [samplingFrequency, setSamplingFrequency] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'wav') {
      setErrorMessage('Unsupported file format. Please provide a .wav audio or .csv time-series file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50 MB limit.');
      return;
    }
    setSelectedFile(file);
    setIsReplacing(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const fs = samplingFrequency ? parseFloat(samplingFrequency) : undefined;
      const res = await apiService.uploadSignal(
        selectedFile,
        columnName.trim() || undefined,
        fs,
        (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        }
      );
      setUploadedSignal(res);
      setSelectedFile(null);
      setIsReplacing(false);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const fileExtension = selectedFile?.name.split('.').pop()?.toUpperCase() || '';
  const isCSV = fileExtension === 'CSV';

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5EA] p-6 shadow-subtle transition-shadow">
      {/* Section Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
            Signal input
          </h2>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            {uploadedSignal && !isReplacing
              ? 'Active waveform loaded in working session.'
              : 'Import a recording to begin.'}
          </p>
        </div>

        {uploadedSignal && !selectedFile && !isReplacing && (
          <button
            type="button"
            onClick={() => setIsReplacing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-[#0071E3] hover:text-[#0077ED] bg-[#F0F6FF] hover:bg-[#E5F0FF] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Replace signal</span>
          </button>
        )}
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.wav,audio/wav,text/csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
          }
        }}
      />

      {/* View 1: Staged File (Preparing to Upload) */}
      {selectedFile ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#0071E3]/30 bg-[#F0F6FF]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1D1D1F] font-mono truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-[#6E6E73] font-mono tabular-nums">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {fileExtension} format
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-[12px] text-[#0071E3] hover:text-[#0077ED] font-medium underline"
            >
              Choose different
            </button>
          </div>

          {/* Optional Staging Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {isCSV && (
              <div>
                <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
                  CSV Signal Column <span className="text-[#86868B] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="e.g. DE_time, vibration"
                  disabled={isUploading}
                  className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono text-[#1D1D1F] transition-colors"
                />
                <span className="text-[11px] text-[#86868B] mt-1 block">
                  Select channel if multiple columns exist.
                </span>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1">
                Sampling Frequency <span className="text-[#86868B] font-normal">(Optional for WAV)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={samplingFrequency}
                  onChange={(e) => setSamplingFrequency(e.target.value)}
                  placeholder={isCSV ? 'e.g. 12000 or 48000' : 'Extracted from WAV header'}
                  disabled={isUploading}
                  min="1"
                  step="any"
                  className="w-full text-[13px] px-3 py-2 bg-[#FFFFFF] border border-[#E5E5EA] rounded-lg focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 font-mono tabular-nums text-[#1D1D1F] transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-[#86868B] font-mono pointer-events-none">
                  Hz
                </span>
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block">
                {isCSV ? 'Required for accurate Fourier axes.' : 'WAV file headers provide this automatically.'}
              </span>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-[#6E6E73]">
                <span>Ingesting & validating waveform...</span>
                <span className="font-semibold text-[#0071E3] tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#F5F5F7] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#0071E3] h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setIsReplacing(false);
              }}
              disabled={isUploading}
              className="px-3.5 py-1.5 text-[13px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full shadow-subtle transition-colors disabled:opacity-50"
            >
              <span>{isUploading ? 'Uploading…' : 'Import signal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : uploadedSignal && !isReplacing ? (
        /* View 2: Loaded Active Signal Summary */
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#E5E5EA] bg-[#FBFBFD] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shrink-0">
                <FileAudio className="w-5 h-5 text-[#248A3D]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#1D1D1F] font-mono truncate max-w-xs sm:max-w-md">
                    {uploadedSignal.filename}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                </div>
                <p className="text-[11px] font-mono text-[#86868B]">
                  ID: {uploadedSignal.signal_id}
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#6E6E73] bg-[#FFFFFF] px-2.5 py-1 rounded-md border border-[#E5E5EA] self-start sm:self-auto">
              In-Memory Session
            </div>
          </div>

          {/* Signal Metadata Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E5E5EA]">
              <span className="text-[#86868B] block text-[10px] uppercase font-mono flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#86868B]" /> Samples
              </span>
              <span className="font-semibold text-[#1D1D1F] font-mono tabular-nums text-[13px] mt-1 block">
                {uploadedSignal.sample_count.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E5E5EA]">
              <span className="text-[#86868B] block text-[10px] uppercase font-mono flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#86868B]" /> Sampling Rate
              </span>
              <span className="font-semibold text-[#1D1D1F] font-mono tabular-nums text-[13px] mt-1 block">
                {uploadedSignal.sampling_frequency
                  ? `${uploadedSignal.sampling_frequency.toLocaleString()} Hz`
                  : 'Not specified'}
              </span>
            </div>

            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E5E5EA]">
              <span className="text-[#86868B] block text-[10px] uppercase font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#86868B]" /> Duration
              </span>
              <span className="font-semibold text-[#1D1D1F] font-mono tabular-nums text-[13px] mt-1 block">
                {uploadedSignal.duration_seconds
                  ? `${uploadedSignal.duration_seconds.toFixed(3)} s`
                  : 'N/A'}
              </span>
            </div>

            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E5E5EA]">
              <span className="text-[#86868B] block text-[10px] uppercase font-mono">
                Peak Amplitude
              </span>
              <span className="font-semibold text-[#1D1D1F] font-mono tabular-nums text-[13px] mt-1 block">
                {uploadedSignal.statistics?.peak !== undefined
                  ? uploadedSignal.statistics.peak.toFixed(4)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* View 3: Clean Drag & Drop Surface */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 ${
            isDragging
              ? 'border-[#0071E3] bg-[#F0F6FF]'
              : 'border-[#D1D1D6] hover:border-[#0071E3] bg-[#FBFBFD] hover:bg-[#FFFFFF]'
          }`}
        >
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E5E5EA] text-[#6E6E73] flex items-center justify-center mb-3 shadow-subtle">
              <UploadCloud className="w-5 h-5 text-[#0071E3]" />
            </div>
            <p className="text-[13px] font-medium text-[#1D1D1F]">
              Drop your signal here{' '}
              <span className="text-[#0071E3] font-medium underline underline-offset-2">
                or choose a file
              </span>
            </p>
            <p className="text-[11px] text-[#86868B] mt-1">
              WAV audio or CSV time-series data &bull; Up to 50 MB
            </p>
          </div>
        </div>
      )}

      {/* Error Message Feedback */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex items-start gap-2.5 text-[12px] text-[#D70015]">
          <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
          <div className="flex-1 font-sans">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};

export default SignalUploader;
