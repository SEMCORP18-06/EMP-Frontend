import React from 'react';

export default function Spinner({ active }) {
  if (!active) return null;
  
  return (
    <div className="spinner-overlay">
      <div className="spinner" aria-label="Loading"></div>
    </div>
  );
}
