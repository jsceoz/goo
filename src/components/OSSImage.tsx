'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface OSSImageProps {
  objectKey: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export function OSSImage({ objectKey, alt, className, width = 800, height = 600 }: OSSImageProps) {
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        // 从完整URL中提取key部分
        const key = objectKey.includes('http') ? new URL(objectKey).pathname.slice(1) : objectKey;
        const response = await fetch(`/api/images/sign?key=${encodeURIComponent(key)}`);
        if (!response.ok) throw new Error('Failed to get signed URL');
        const data = await response.json();
        setSignedUrl(data.url);
      } catch (error) {
        console.error('Error fetching signed URL:', error);
      }
    };

    if (objectKey) {
      fetchSignedUrl();
      // 设置定时器，在 URL 即将过期时刷新
      const timer = setInterval(fetchSignedUrl, 45 * 60 * 1000); // 45分钟刷新一次
      return () => clearInterval(timer);
    }
  }, [objectKey]);

  if (!signedUrl) return null;

  return (
    <Image
      src={signedUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}