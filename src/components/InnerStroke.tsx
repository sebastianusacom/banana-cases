import React from 'react';

interface InnerStrokeProps {
  /** The border radius of the stroke container */
  borderRadius?: string;
  /** The inset spacing from the parent container edges */
  inset?: string;
  /** Additional classes for styling (opacity, z-index, etc.) */
  className?: string;
}

export const InnerStroke: React.FC<InnerStrokeProps> = ({ 
  borderRadius = "2rem", 
  inset = "1px",
  className = "opacity-35" 
}) => {
  return (
    <div 
      className={`absolute pointer-events-none ${className}`}
      style={{
        inset: inset,
        borderRadius: borderRadius,
        padding: '1px',
        background: 'linear-gradient(163deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.6) 100%)',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    />
  );
};
