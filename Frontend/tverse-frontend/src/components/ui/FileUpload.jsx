import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import './FileUpload.css';

export function FileUpload({ onFileSelect, accept = '.csv,.xlsx,.xls', maxSize = 52428800, disabled = false, className = '' }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (f.size > maxSize) { alert(`File too large. Max: ${Math.round(maxSize/1024/1024)}MB`); return; }
    setFile(f);
    onFileSelect?.(f);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const remove = () => { setFile(null); onFileSelect?.(null); if (inputRef.current) inputRef.current.value = ''; };

  return (
    <div className={`file-upload ${dragOver ? 'file-upload-dragover' : ''} ${disabled ? 'file-upload-disabled' : ''} ${className}`}
      onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
      onClick={() => !file && !disabled && inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
      {file ? (
        <div className="file-upload-selected">
          <FileText size={24} className="file-upload-file-icon" />
          <div className="file-upload-file-info">
            <span className="file-upload-file-name">{file.name}</span>
            <span className="file-upload-file-size">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
          <button className="file-upload-remove" onClick={(e) => { e.stopPropagation(); remove(); }}><X size={16} /></button>
        </div>
      ) : (
        <div className="file-upload-empty">
          <Upload size={40} className="file-upload-icon" />
          <p className="file-upload-text">Drag & drop your file here</p>
          <p className="file-upload-link">or <span>click to browse</span></p>
          <p className="file-upload-formats">Accepted: CSV, XLSX, XLS</p>
        </div>
      )}
    </div>
  );
}
