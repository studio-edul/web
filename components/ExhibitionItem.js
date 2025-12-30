import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createSlug } from '../lib/slug-utils';

export default function ExhibitionItem({ exhibition }) {
  const { name, period, description, imageUrl, index } = exhibition;
  const slug = name ? createSlug(name) : null;
  
  const [columnWidth, setColumnWidth] = useState(495);
  const [columnGap, setColumnGap] = useState(10);
  const [fullWidth, setFullWidth] = useState(1000);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const computedColumnWidth = getComputedStyle(root).getPropertyValue('--column-width');
      const computedColumnGap = getComputedStyle(root).getPropertyValue('--column-gap');
      const computedFullWidth = getComputedStyle(root).getPropertyValue('--full-width-image');
      
      if (computedColumnWidth) {
        const width = parseInt(computedColumnWidth.replace('px', ''), 10);
        if (!isNaN(width)) setColumnWidth(width);
      }
      if (computedColumnGap) {
        const gap = parseInt(computedColumnGap.replace('px', ''), 10);
        if (!isNaN(gap)) setColumnGap(gap);
      }
      if (computedFullWidth) {
        const fw = parseInt(computedFullWidth.replace('px', ''), 10);
        if (!isNaN(fw)) setFullWidth(fw);
      }
    }
  }, []);

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
    <div className="exhibition-item">
      <Link href={slug ? `/work/${slug}` : '#'} className="exhibition-item-link">
        <div className="exhibition-name">{name}</div>
        {descriptionHtml}
        {imageUrl && (
          <div className="image-container">
            <Image
              src={imageUrl}
              alt={name || ''}
              width={columnWidth}
              height={400}
              className="project-image exhibition-image"
              loading="lazy"
              quality={90}
              sizes={`${columnWidth}px`}
              style={{
                width: `${columnWidth}px`,
                height: 'auto',
                maxWidth: 'none',
              }}
            />
          </div>
        )}
      </Link>
    </div>
  );
}

