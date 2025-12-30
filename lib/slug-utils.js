// URL slug 유틸리티 함수

/**
 * 프로젝트 이름을 URL-safe slug로 변환
 */
export function createSlug(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * slug를 원본 이름으로 역변환 (정확하지 않을 수 있음)
 */
export function slugToName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

