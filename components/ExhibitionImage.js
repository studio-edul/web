import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createSlug } from '@/lib/slug-utils';

export default function ExhibitionImage({ exhibition }) {
  const { name, imageUrl } = exhibition;
  const slug = name ? createSlug(name) : null;
  const href = slug ? `/work/${slug}` : '#';

  if (!imageUrl) return null;

  return (
    <Link href={href} className="project-link">
      <div className="image-container">
        <Image
          src={imageUrl}
          alt={name || ''}
          width={595}
          height={400}
          className="project-image"
          loading="lazy"
          quality={90}
          sizes="595px"
        />
      </div>
    </Link>
  );
}

