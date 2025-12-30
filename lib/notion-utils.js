// Notion 데이터 파싱 유틸리티 함수들

/**
 * Notion property에서 텍스트 추출
 */
export function extractText(property) {
  if (!property) return '';
  
  if (property.title && property.title.length > 0) {
    return property.title.map(t => t.plain_text).join('');
  }
  if (property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map(t => t.plain_text).join('');
  }
  if (property.select) {
    return property.select.name || '';
  }
  if (property.date) {
    const date = property.date;
    if (date.start) {
      return date.end ? `${date.start} - ${date.end}` : date.start;
    }
  }
  if (typeof property.number === 'number') {
    return property.number.toString();
  }
  
  return '';
}

/**
 * Notion property에서 날짜 추출
 */
export function extractDate(property) {
  if (!property) return '';
  
  if (property.date) {
    const date = property.date;
    if (date.start) {
      return date.end ? `${date.start} - ${date.end}` : date.start;
    }
  }
  if (property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map(t => t.plain_text).join('');
  }
  if (property.title && property.title.length > 0) {
    return property.title.map(t => t.plain_text).join('');
  }
  if (property.select) {
    return property.select.name || '';
  }
  
  return '';
}

/**
 * Notion property에서 숫자 추출
 */
export function extractNumber(property) {
  if (!property) return null;
  
  if (typeof property.number === 'number') {
    return property.number;
  }
  if (property.rich_text && property.rich_text.length > 0) {
    const text = property.rich_text[0].plain_text || '';
    const num = parseInt(text, 10);
    return isNaN(num) ? null : num;
  }
  if (property.title && property.title.length > 0) {
    const text = property.title[0].plain_text || '';
    const num = parseInt(text, 10);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

/**
 * Notion property에서 인덱스 문자열 추출 (예: "2,3" 또는 "full")
 */
export function extractIndex(property) {
  if (!property) return null;
  
  if (property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map(t => t.plain_text).join('').trim() || null;
  }
  if (property.title && property.title.length > 0) {
    return property.title.map(t => t.plain_text).join('').trim() || null;
  }
  if (typeof property.number === 'number') {
    return property.number.toString();
  }
  if (property.select) {
    return property.select.name ? property.select.name.trim() : null;
  }
  if (property.formula) {
    if (property.formula.string) {
      return property.formula.string.trim();
    }
    if (property.formula.number) {
      return property.formula.number.toString();
    }
  }
  
  return null;
}

/**
 * Notion property에서 다양한 필드명으로 값 찾기
 */
export function findProperty(properties, ...fieldNames) {
  for (const fieldName of fieldNames) {
    const property = properties[fieldName];
    if (property) return property;
  }
  return null;
}

