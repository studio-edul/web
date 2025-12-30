// Timeline 데이터 처리 유틸리티

import { extractText, extractNumber, findProperty } from './notion-utils.js';

/**
 * Timeline 항목에서 데이터 추출
 */
export function extractTimelineData(item) {
  const properties = item.properties || {};

  const nameProperty = findProperty(
    properties,
    'Name', 'name', 'NAME',
    'Title', 'title', 'TITLE'
  );
  const name = extractText(nameProperty);

  const indexProperty = findProperty(
    properties,
    'Index', 'index', 'INDEX',
    'Order', 'order', 'ORDER',
    'Position', 'position', 'POSITION'
  );
  const index = extractNumber(indexProperty);

  return {
    name: name || null,
    index: index !== null && !isNaN(index) ? index : null
  };
}

/**
 * Work 데이터에서 TIMELINE 클래스 항목만 필터링 및 정렬
 */
export function processTimelineData(workData) {
  const timelineItems = workData
    .filter(item => {
      const properties = item.properties || {};
      const classProperty = findProperty(
        properties,
        'Class', 'class', 'CLASS',
        'Type', 'type', 'TYPE',
        'Category', 'category', 'CATEGORY'
      );

      if (!classProperty) return false;

      const classValue = extractText(classProperty);
      return classValue.toUpperCase() === 'TIMELINE';
    })
    .map(extractTimelineData)
    .filter(item => item.name !== null);

  // Index 기준으로 오름차순 정렬 (1, 2, 3... 순서)
  // Index가 없는 항목은 맨 뒤로
  timelineItems.sort((a, b) => {
    if (a.index === null && b.index === null) return 0;
    if (a.index === null) return 1;
    if (b.index === null) return -1;
    return a.index - b.index;
  });

  return timelineItems;
}

