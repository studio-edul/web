import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createSlug } from '@/lib/slug-utils';

export default function ExhibitionItem({ exhibition, isFull, priority = false }) {
  const { name, period, description, imageUrl, index } = exhibition;
  const slug = name ? createSlug(name) : null;

  // Exhibition 텍스트와 이미지 콘텐츠 생성
  const periodHtml = period ? <div className="exhibition-period">{period}</div> : '';
  const descriptionContent = description || '';
  const descriptionHtml = (periodHtml || descriptionContent) ? (
    <div className="description-box">
      {periodHtml}
      {descriptionContent.split('\n').map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
  ) : null;

  return (
    <div className={`exhibition-item ${isFull ? 'is-full-width-item' : ''}`}>
      <Link href={slug ? `/exhibition/${slug}` : '#'} className="exhibition-item-link">
        <div className="exhibition-name">{name}</div>
        {descriptionHtml}
        {imageUrl && (
          <div className="image-container">
            <Image
              src={imageUrl}
              alt={name || ''}
              width={595}
              height={400}
              className="project-image exhibition-image"
              loading={priority ? undefined : "lazy"}
              priority={priority}
              quality={90}
              sizes="595px"
            />
          </div>
        )}
      </Link>
    </div>
  );
}

