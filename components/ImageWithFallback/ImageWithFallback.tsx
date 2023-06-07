import { useEffect, useState } from 'react';

import Image from 'next/image';

interface Props {
  fallback?: string;
  alt: string;
  src: string;
  width: number;
  height: number;
  className?: string;
}

const FALLBACK_IMG = '/pdf.png';

const ImageWithFallback = ({
  fallback = FALLBACK_IMG,
  alt,
  src,
  ...props
}: Props) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
  }, [src]);

  return (
    <Image
      alt={alt}
      // @ts-ignore
      onError={setError}
      src={error ? FALLBACK_IMG : src}
      {...props}
    />
  );
};

export default ImageWithFallback;
