import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createSlug } from '../lib/slug-utils';

export default function ExhibitionImage({ exhibition }) {
  const { name, imageUrl } = exhibition;
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

  if (!imageUrl) return null;

  return (
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
  );
}

