import React, { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  const isLottie = src?.toLowerCase().endsWith('.json');

  useEffect(() => {
    if (isLottie && src) {
      setIsLoading(true);
      fetch(src)
        .then(response => response.json())
        .then(data => {
          setAnimationData(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load Lottie animation:', error);
          setIsLoading(false);
        });
    }
  }, [src, isLottie]);

  if (isLottie) {
    if (isLoading) {
      return <div className={className}>Loading...</div>;
    }

    if (!animationData) {
      return <div className={className}>Failed to load animation</div>;
    }

    return (
      <div className={className}>
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

