import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createSlug } from '../lib/slug-utils';

export default function ExhibitionText({ exhibition }) {
  const { name, period, description, imageUrl } = exhibition;
  const slug = name ? createSlug(name) : null;
  
  const [columnWidth, setColumnWidth] = useState(495);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const computedColumnWidth = getComputedStyle(root).getPropertyValue('--column-width');
      
      if (computedColumnWidth) {
        const width = parseInt(computedColumnWidth.replace('px', ''), 10);
        if (!isNaN(width)) setColumnWidth(width);
      }
    }
  }, []);

  return (
    <div>
      <Link href={slug ? `/work/${slug}` : '#'} className="exhibition-name-link">
        <div className="exhibition-name">{name}</div>
      </Link>
      {period && <div className="exhibition-period">{period}</div>}
      {description && (
        <div className="exhibition-description">
          {description.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      )}
      {imageUrl && (
        <Link href={slug ? `/work/${slug}` : '#'} className="image-link">
          <div className="image-container">
            <Image
              src={imageUrl}
              alt={name || ''}
              width={columnWidth}
              height={400}
              className="project-image"
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
        </Link>
      )}
    </div>
  );
}

