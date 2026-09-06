import React from 'react';
import './BackgroundAurora.css';

export function BackgroundAurora({ variant = 'multi' }) {
  if (variant === 'multi') {
    return (
      <div className="bg-aurora-container">
        <div className="aurora-blob aurora-1"></div>
        <div className="aurora-blob aurora-2"></div>
        <div className="aurora-blob aurora-3"></div>
        <div className="aurora-blob aurora-4"></div>
      </div>
    );
  }

  return (
    <div className="bg-aurora-container">
      <div className={`aurora-blob aurora-single ${variant}`}></div>
    </div>
  );
}
