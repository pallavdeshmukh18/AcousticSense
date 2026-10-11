import React, { useState, useRef } from 'react';
import { useSignal } from '../../context/SignalContext';
import { apiService, extractErrorMessage } from '../../services/api';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Clock,
  Activity,
  Layers,
  ArrowRight,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'wav') {
      setErrorMessage('Unsupported file format. Please upload a .wav audio or .csv numerical signal file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File exceeds the 50 MB maximum size limit.');
      return;
    }
    setSelectedFile(file);
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
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-industrial-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-industrial-800">Signal File Ingestion</h2>
          <p className="text-xs text-industrial-500 mt-0.5">
            Accepts raw acoustic emission and vibration sensor recordings in WAV or CSV formats.
          </p>
        </div>
        <span className="text-xs bg-industrial-100 text-industrial-600 px-2.5 py-1 rounded font-mono">
          Max: 50 MB
        </span>
      </div>

      {/* Drag & Drop Surface */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50/50'
            : selectedFile
            ? 'border-emerald-400 bg-emerald-50/30'
            : 'border-industrial-200 hover:border-industrial-300 hover:bg-industrial-50/50'
        }`}
      >
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

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <FileCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-industrial-800 font-mono">{selectedFile.name}</p>
            <p className="text-xs text-industrial-500 mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
            </p>
            <p className="text-[11px] text-primary-600 mt-2 underline">Click or drop another file to change</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-industrial-100 text-industrial-500 flex items-center justify-center mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-industrial-700">
              Drag and drop your signal file here, or{' '}
              <span className="text-primary-600 font-semibold underline">browse</span>
            </p>
            <p className="text-xs text-industrial-400 mt-1 font-mono">Supported: .WAV (PCM audio) or .CSV (numerical)</p>
          </div>
        )}
      </div>

      {/* Optional Metadata Controls */}
      {selectedFile && (
        <div className="mt-4 pt-4 border-t border-industrial-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-industrial-700 mb-1">
              CSV Signal Column Name <span className="text-industrial-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="e.g. vibration, acceleration"
              disabled={isUploading}
              className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
            />
            <p className="text-[11px] text-industrial-400 mt-1">
              Required if CSV contains multiple columns (e.g. time, ch1).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-industrial-700 mb-1">
              Sampling Frequency (Hz) <span className="text-industrial-400 font-normal">(Optional for WAV)</span>
            </label>
            <input
              type="number"
              value={samplingFrequency}
              onChange={(e) => setSamplingFrequency(e.target.value)}
              placeholder="e.g. 48000"
              disabled={isUploading}
              min="1"
              step="any"
              className="w-full text-xs px-3 py-2 border border-industrial-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-mono"
            />
            <p className="text-[11px] text-industrial-400 mt-1">
              WAV files extract Fs automatically; can be specified now or during analysis.
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-industrial-600 mb-1 font-mono">
            <span>Uploading & Validating...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-industrial-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && (
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
            className="px-3.5 py-1.5 text-xs font-medium text-industrial-600 hover:text-industrial-800 hover:bg-industrial-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-xs transition-colors disabled:opacity-50"
          >
            <span>Upload Signal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Currently Stored Signal Card */}
      {uploadedSignal && !selectedFile && (
        <div className="mt-4 p-4 bg-industrial-50 border border-industrial-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-industrial-700 font-mono">
                {uploadedSignal.filename}
              </span>
            </div>
            <span className="text-[11px] font-mono text-industrial-400 bg-white px-2 py-0.5 rounded border border-industrial-200">
              ID: {uploadedSignal.signal_id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2 rounded border border-industrial-200/60">
              <span className="text-industrial-400 block text-[10px] uppercase font-mono flex items-center gap-1">
                <Layers className="w-3 h-3 text-industrial-400" /> Samples
              </span>
              <span className="font-semibold text-industrial-800 font-mono mt-0.5 block">
                {uploadedSignal.sample_count.toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-industrial-200/60">
              <span className="text-industrial-400 block text-[10px] uppercase font-mono flex items-center gap-1">
                <Activity className="w-3 h-3 text-industrial-400" /> Sampling Rate
              </span>
              <span className="font-semibold text-industrial-800 font-mono mt-0.5 block">
                {uploadedSignal.sampling_frequency ? `${uploadedSignal.sampling_frequency.toLocaleString()} Hz` : 'Not Defined'}
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-industrial-200/60">
              <span className="text-industrial-400 block text-[10px] uppercase font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-industrial-400" /> Duration
              </span>
              <span className="font-semibold text-industrial-800 font-mono mt-0.5 block">
                {uploadedSignal.duration_seconds ? `${uploadedSignal.duration_seconds.toFixed(3)} s` : 'N/A'}
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-industrial-200/60">
              <span className="text-industrial-400 block text-[10px] uppercase font-mono">
                Peak Amplitude
              </span>
              <span className="font-semibold text-industrial-800 font-mono mt-0.5 block">
                {uploadedSignal.statistics?.peak?.toFixed(4) ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
