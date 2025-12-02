import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

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
  const isLottie = src?.toLowerCase().endsWith('.lottie');

  if (isLottie) {
    return (
      <div className={className}>
        <DotLottieReact
          src={src}
          loop={loop}
          autoplay={autoplay}
          className="w-full h-full"
        />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
};

