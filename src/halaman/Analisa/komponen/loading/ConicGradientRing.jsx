import React from 'react';

export default function GradientRingSpinner({ color = '#3b82f6', speed = 1, scale = 1 }) {
  return (
    <div style={{ transform: `scale(${scale})` }}>
      <div 
        className="w-12 h-12 rounded-full animate-spin p-1 flex items-center justify-center"
        style={{ 
          background: `conic-gradient(from 0deg, transparent 0%, ${color} 100%)`, 
          animationDuration: `${speed}s` 
        }}
      >
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full" />
      </div>
    </div>
  );
}