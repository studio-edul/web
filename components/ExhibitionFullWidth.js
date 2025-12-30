import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createSlug } from '../lib/slug-utils';

export default function ExhibitionFullWidth({ exhibition }) {
  const { name, imageUrl } = exhibition;
  const slug = name ? createSlug(name) : null;
  
  const [fullWidth, setFullWidth] = useState(1000);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const computedFullWidth = getComputedStyle(root).getPropertyValue('--full-width-image');
      
      if (computedFullWidth) {
        const fw = parseInt(computedFullWidth.replace('px', ''), 10);
        if (!isNaN(fw)) setFullWidth(fw);
      }
    }
  }, []);

  if (!imageUrl) return null;

  return (
    <Link href={slug ? `/work/${slug}` : '#'} className="image-link">
      <div className="image-container-full">
        <Image
          src={imageUrl}
          alt={name || ''}
          width={fullWidth}
          height={600}
          className="project-image-full"
          loading="lazy"
          quality={90}
          sizes={`${fullWidth}px`}
          style={{
            width: `${fullWidth}px`,
            height: 'auto',
            maxWidth: 'none',
          }}
        />
      </div>
    </Link>
  );
}

