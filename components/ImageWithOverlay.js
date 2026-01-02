import Image from 'next/image';
import Link from 'next/link';
import { createSlug } from '@/lib/slug-utils';

export default function ImageWithOverlay({
  imageUrl,
  name,
  timeline,
  description,
  isFullWidth = false,
  priority = false
}) {
  const WIDTH_COLUMN = 595;
  const WIDTH_FULL = 1200;

  if (!imageUrl) return null;

  const containerClass = isFullWidth ? 'image-container-full' : 'image-container';
  const imageWidth = isFullWidth ? WIDTH_FULL : WIDTH_COLUMN;
  const imageHeight = isFullWidth ? 600 : 400;
  
  // sizes 속성으로 반응형 이미지 최적화
  const sizes = isFullWidth
    ? `${WIDTH_FULL}px`
    : `${WIDTH_COLUMN}px`;

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
          loading={priority ? undefined : "lazy"}
          priority={priority}
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

