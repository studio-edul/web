// Work 데이터 처리 유틸리티

import { extractText, extractNumber, extractDate, findProperty } from './notion-utils';

/**
 * Work 항목에서 프로젝트 데이터 추출
 */
export function extractProjectData(item) {
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
    'Number', 'number', 'NUMBER'
  );
  // Index를 숫자로 추출 (정수 하나)
  const index = extractNumber(indexProperty);
  
  const periodProperty = findProperty(
    properties,
    'Period', 'period', 'PERIOD',
    'Date', 'date', 'DATE',
    'Year', 'year', 'YEAR',
    'Time', 'time', 'TIME'
  );
  const period = extractDate(periodProperty);
  
  const descriptionProperty = findProperty(
    properties,
    'Description EN', 'description en', 'Description En', 'Description en',
    'DESCRIPTION EN', 'DescriptionEN', 'descriptionEN',
    'Description', 'description', 'DESCRIPTION'
  );
  const description = extractText(descriptionProperty);
  
  return {
    name: name || null,
    index: index !== null && !isNaN(index) ? index : null,
    period: period || '',
    description: description || ''
  };
}

/**
 * Work 데이터에서 PROJECT 클래스 항목만 필터링 및 정렬
 */
export function processWorkData(workData) {
  const projectItems = workData
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
      return classValue.toUpperCase() === 'PROJECT';
    })
    .map(extractProjectData)
    .filter(item => item.name !== null);
  
  // Index 기준으로 오름차순 정렬 (1, 2, 3... 순서)
  // Index가 없는 항목은 맨 뒤로
  projectItems.sort((a, b) => {
    if (a.index === null && b.index === null) return 0;
    if (a.index === null) return 1;
    if (b.index === null) return -1;
    // 오름차순 정렬: 1, 2, 3...
    return a.index - b.index;
  });
  
  return projectItems;
}

