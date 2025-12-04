import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Lottie from 'lottie-react';

interface UniversalMediaProps {
  src: string;
  alt?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export const UniversalMedia: React.FC<UniversalMediaProps> = ({
  src,
  alt,
  className,
  loop = true,
  autoplay = true,
}) => {
  const [animationData, setAnimationData] = useState<any>(null);

  const isDotLottie = src?.toLowerCase().endsWith('.lottie');
  
  // Basic image extension check
  const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(src || '');

  useEffect(() => {
    // Reset state when src changes
    setAnimationData(null);

    if (!src || isDotLottie || isImage) return;

    const fetchLottie = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) return;
        
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          // Basic validation to see if it looks like a lottie
          if (json && (json.v || json.layers)) {
            setAnimationData(json);
          }
        } catch (e) {
          // Not valid JSON, ignore
        }
      } catch (e) {
        console.error('Error loading lottie:', e);
      }
    };

    fetchLottie();
  }, [src, isDotLottie, isImage]);

  if (isDotLottie) {
    return (
      <div className={className} style={{ background: 'transparent' }}>
        <DotLottieReact
          src={src}
          loop={loop}
          autoplay={autoplay}
          className="w-full h-full"
        />
      </div>
    );
  }

  if (animationData) {
    return (
      <div className={className} style={{ background: 'transparent' }}>
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          className="w-full h-full"
        />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
};
