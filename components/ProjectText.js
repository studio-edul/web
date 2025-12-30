import Link from 'next/link';
import { createSlug } from '../lib/slug-utils';

export default function ProjectText({ project }) {
  const { name, period, description } = project;
  const slug = name ? createSlug(name) : null;

  const periodHtml = period ? <div className="project-period">{period}</div> : '';
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
    <Link href={slug ? `/work/${slug}` : '#'} className="project-link">
      <div className="project-item">{name}</div>
      {descriptionHtml}
    </Link>
  );
}

