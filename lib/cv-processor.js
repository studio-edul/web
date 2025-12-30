// CV 데이터 처리 유틸리티

import { extractText, extractDate, findProperty } from './notion-utils';

/**
 * CV 항목에서 데이터 추출
 */
export function extractCVItemData(item) {
  const properties = item.properties || {};
  
  const periodProperty = findProperty(
    properties,
    'Period', 'period', 'PERIOD',
    'Date', 'date', 'DATE',
    'Year', 'year', 'YEAR'
  );
  const period = extractDate(periodProperty);
  
  const nameProperty = findProperty(
    properties,
    'Name', 'name', 'NAME',
    'Title', 'title', 'TITLE'
  );
  const name = extractText(nameProperty);
  
  const clientProperty = findProperty(
    properties,
    'Client', 'client', 'CLIENT',
    'Cline', 'cline', 'CLINE',
    'Venue', 'venue', 'VENUE'
  );
  const client = clientProperty ? extractText(clientProperty) : '';
  
  const placeProperty = findProperty(
    properties,
    'Place', 'place', 'PLACE',
    'Location', 'location', 'LOCATION'
  );
  const place = extractDate(placeProperty);
  
  return { period, name, client, place };
}

/**
 * CV 데이터를 Class별로 그룹화
 */
export function groupCVDataByClass(cvData) {
  const classGroups = {};
  
  cvData.forEach(item => {
    const properties = item.properties || {};
    const classProperty = findProperty(properties, 'Class', 'class', 'CLASS');
    
    if (classProperty && classProperty.select) {
      const className = classProperty.select.name;
      if (className) {
        if (!classGroups[className]) {
          classGroups[className] = [];
        }
        classGroups[className].push(extractCVItemData(item));
      }
    }
  });
  
  // 순서 정의
  const order = [
    'EDUCATION',
    'SOLO EXHIBITION',
    'GROUP EXHIBITION',
    'AWARDS',
    'RESIDENCY',
    'PARTICIPATED WORK'
  ];
  
  // 순서대로 정렬된 Class 목록
  const sortedClasses = Object.keys(classGroups).sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  
  return { classGroups, sortedClasses };
}

