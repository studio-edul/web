import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSlug } from '../lib/slug-utils';

export default function ImageWithOverlay({ 
  imageUrl, 
  name, 
  timeline, 
  description, 
  isFullWidth = false 
}) {
  const [dimensions, setDimensions] = useState({ width: 595, height: 400, fullWidth: 1200 });

  useEffect(() => {
    // CSS 변수에서 값을 읽어오기
    const root = document.documentElement;
    const columnWidth = parseInt(getComputedStyle(root).getPropertyValue('--column-width')) || 595;
    const columnGap = parseInt(getComputedStyle(root).getPropertyValue('--column-gap')) || 10;
    const fullWidth = columnWidth * 2 + columnGap;
    
    setDimensions({
      width: columnWidth,
      height: isFullWidth ? 600 : 400,
      fullWidth: fullWidth
    });
  }, [isFullWidth]);

  if (!imageUrl) return null;

  const containerClass = isFullWidth ? 'image-container-full' : 'image-container';
  const imageWidth = isFullWidth ? dimensions.fullWidth : dimensions.width;
  const imageHeight = dimensions.height;
  
  // sizes 속성으로 반응형 이미지 최적화
  const sizes = isFullWidth 
    ? `${dimensions.fullWidth}px`
    : `${dimensions.width}px`;

  const slug = name ? createSlug(name) : null;
  const href = slug ? `/work/${slug}` : '#';

  return (
    <Link href={href} className="image-link">
      <div className={containerClass}>
        <Image
          src={imageUrl}
          alt={name || ''}
          width={imageWidth}
          height={imageHeight}
          className={isFullWidth ? 'project-image-full' : 'project-image'}
          loading="lazy"
          quality={90}
          sizes={sizes}
        />
        <div className="overlay-text">
          <div className="overlay-text-title">{name || 'none'}</div>
          <div className="overlay-text-year">{timeline || 'none'}</div>
          <div className="overlay-text-caption">{description || 'none'}</div>
        </div>
      </div>
    </Link>
  );
}

