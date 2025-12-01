import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * SafeImage renders remote images with sensible defaults to reduce blocking from referrer/cors
 * and provides a lightweight fallback if the source fails to load.
 */
export function SafeImage({ src, alt, fallbackSrc = '/Simplification.svg', ...rest }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
