import React, { useEffect, useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * SafeImage renders remote images with sensible defaults to reduce blocking from referrer/cors
 * and provides a lightweight fallback if the source fails to load.
 */
export function SafeImage({ src, alt, fallbackSrc = '/Simplification.svg', ...rest }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      loading="lazy"
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
