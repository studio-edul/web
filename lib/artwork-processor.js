// Artwork 데이터 처리 유틸리티

import { getPageBlocksServer } from './notion-api-server';
import { extractText, extractIndex, findProperty } from './notion-utils';

/**
 * Artwork 항목에서 이미지 URL 추출
 */
async function extractImageFromArtwork(item) {
  const pageId = item.id;
  const properties = item.properties || {};
  
  // 페이지의 블록 가져오기
  const blocks = await getPageBlocksServer(pageId);
  let imageUrl = null;
  
  if (blocks && blocks.length > 0) {
    for (const block of blocks) {
      if (block.type === 'image') {
        const image = block.image;
        if (image) {
          if (image.file) {
            imageUrl = image.file.url;
          } else if (image.external) {
            imageUrl = image.external.url;
          }
        }
        if (imageUrl) break;
      }
    }
  }
  
  // 블록에서 이미지를 못 찾으면 cover 이미지 확인
  if (!imageUrl && item.cover) {
    if (item.cover.file) {
      imageUrl = item.cover.file.url;
    } else if (item.cover.external) {
      imageUrl = item.cover.external.url;
    }
  }
  
  return imageUrl;
}

/**
 * Artwork 항목에서 메타데이터 추출
 */
function extractArtworkMetadata(item) {
  const properties = item.properties || {};
  
  const indexProperty = findProperty(
    properties,
    'Index', 'index', 'INDEX',
    'Order', 'order', 'ORDER',
    'Position', 'position', 'POSITION'
  );
  const index = extractIndex(indexProperty);
  
  const nameProperty = findProperty(
    properties,
    'Name', 'name', 'NAME',
    'Title', 'title', 'TITLE'
  );
  const name = extractText(nameProperty);
  
  const timelineProperty = findProperty(
    properties,
    'Timeline', 'timeline', 'TIMELINE',
    'Date', 'date', 'DATE',
    'Time', 'time', 'TIME',
    'Year', 'year', 'YEAR'
  );
  const timeline = extractText(timelineProperty);
  
  const descriptionProperty = findProperty(
    properties,
    'Description', 'description', 'DESCRIPTION',
    'Description EN', 'description en', 'Description En', 'Description en'
  );
  const description = extractText(descriptionProperty);
  
  return { index, name, timeline, description };
}

/**
 * Artwork 항목에서 Timeline 메타데이터 추출 (Timeline-Index 포함)
 */
function extractTimelineArtworkMetadata(item) {
  const properties = item.properties || {};
  
  const timelineIndexProperty = findProperty(
    properties,
    'Timeline-Index', 'timeline-index', 'TIMELINE-INDEX', 'Timeline Index', 'timeline index', 'TIMELINE INDEX',
    'TimelineIndex', 'timelineIndex', 'TIMELINEINDEX'
  );
  const timelineIndex = extractIndex(timelineIndexProperty);
  
  const nameProperty = findProperty(
    properties,
    'Name', 'name', 'NAME',
    'Title', 'title', 'TITLE'
  );
  const name = extractText(nameProperty);
  
  return { timelineIndex, name };
}

/**
 * 프로젝트 이름에 해당하는 Artwork 이미지들 가져오기
 */
export async function loadArtworkImagesForProject(projectName, artworkData, allProjectNames) {
  try {
    const normalizedProjectName = projectName ? projectName.trim().toLowerCase() : '';
    
    const matchingItems = artworkData.filter(item => {
      const properties = item.properties || {};
      const projectProperty = findProperty(
        properties,
        'Project', 'project', 'PROJECT',
        'Name', 'name', 'NAME'
      );
      const projectValue = extractText(projectProperty);
      const normalizedProjectValue = projectValue ? projectValue.trim().toLowerCase() : '';
      
      // 1. Project 필드가 정확히 일치하는 경우
      if (normalizedProjectValue === normalizedProjectName) {
        return true;
      }
      
      // 2. Project 필드가 없거나 일치하지 않을 경우, Artwork Name에서 프로젝트 이름 추출 시도
      const artworkNameProperty = findProperty(properties, 'Name', 'name', 'NAME', 'Title', 'title', 'TITLE');
      const artworkName = extractText(artworkNameProperty);
      const extractedProjectName = extractProjectNameFromArtworkName(artworkName, allProjectNames);
      
      if (extractedProjectName && extractedProjectName.toLowerCase() === normalizedProjectName) {
        return true;
      }
      
      return false;
    });
    
    if (matchingItems.length === 0) {
      return [];
    }
    
    // 모든 일치하는 항목의 이미지와 메타데이터 가져오기
    const imagePromises = matchingItems.map(async (item) => {
      const imageUrl = await extractImageFromArtwork(item);
      const metadata = extractArtworkMetadata(item);
      
      return {
        url: imageUrl,
        ...metadata
      };
    });
    
    const imageData = await Promise.all(imagePromises);
    const filteredData = imageData.filter(data => data.url !== null);
    
    return filteredData;
  } catch (error) {
    console.error('Artwork 이미지 로드 오류:', error);
    return [];
  }
}

/**
 * Artwork 이름에서 프로젝트 이름 추출 (예: "Display for Newborn Language 1, 2, 3" → "The Speaker of Newborn Language")
 */
function extractProjectNameFromArtworkName(artworkName, projectNames) {
  if (!artworkName) return null;
  
  const normalizedArtworkName = artworkName.toLowerCase();
  
  // 각 프로젝트 이름과 매칭 시도
  for (const projectName of projectNames) {
    const normalizedProjectName = projectName.toLowerCase();
    
    // 프로젝트 이름이 artwork 이름에 포함되어 있는지 확인
    if (normalizedArtworkName.includes(normalizedProjectName)) {
      return projectName;
    }
    
    // 프로젝트 이름의 주요 키워드 추출 (예: "The Speaker of Newborn Language" → "newborn language")
    const projectKeywords = normalizedProjectName
      .split(/\s+/)
      .filter(word => word.length > 2 && !['the', 'of', 'for', 'a', 'an', 'speaker'].includes(word));
    
    // 키워드들이 artwork 이름에 포함되어 있는지 확인
    if (projectKeywords.length > 0 && projectKeywords.every(keyword => normalizedArtworkName.includes(keyword))) {
      return projectName;
    }
    
    // 특수 케이스: "Display for Newborn Language" → "The Speaker of Newborn Language"
    if (normalizedArtworkName.includes('display') && normalizedArtworkName.includes('newborn') && normalizedArtworkName.includes('language')) {
      if (normalizedProjectName.includes('newborn') && normalizedProjectName.includes('language')) {
        return projectName;
      }
    }
    
    // 특수 케이스: "'CHOWONJI' created __ out of space" → "chowonji" 또는 "CHOWONJI"
    if (normalizedArtworkName.includes('chowonji') && normalizedArtworkName.includes('created') && normalizedArtworkName.includes('out') && normalizedArtworkName.includes('space')) {
      if (normalizedProjectName.includes('chowonji')) {
        return projectName;
      }
    }
  }
  
  return null;
}

/**
 * 모든 프로젝트에 대한 Artwork 이미지 미리 로드
 */
export async function preloadAllArtworkImages(workData, artworkData) {
  const projectNames = workData
    .filter(item => {
      const properties = item.properties || {};
      const classProperty = findProperty(
        properties,
        'Class', 'class', 'CLASS',
        'Type', 'type', 'TYPE',
        'Category', 'category', 'CATEGORY'
      );
      const classValue = extractText(classProperty);
      return classValue.toUpperCase() === 'PROJECT';
    })
    .map(item => {
      const properties = item.properties || {};
      const nameProperty = findProperty(
        properties,
        'Name', 'name', 'NAME',
        'Title', 'title', 'TITLE'
      );
      return extractText(nameProperty);
    })
    .filter(name => name);
  
  const artworkMap = {};
  
  // 먼저 Project 필드로 매칭
  for (const projectName of projectNames) {
    artworkMap[projectName] = await loadArtworkImagesForProject(projectName, artworkData, projectNames);
  }
  
  // Project 필드가 없는 artwork들을 Name 필드로 매칭
  const unmatchedArtworks = artworkData.filter(item => {
    const properties = item.properties || {};
    const projectProperty = findProperty(
      properties,
      'Project', 'project', 'PROJECT',
      'Name', 'name', 'NAME'
    );
    const projectValue = extractText(projectProperty);
    return !projectValue || projectValue.trim() === '';
  });
  
  for (const artwork of unmatchedArtworks) {
    const properties = artwork.properties || {};
    const nameProperty = findProperty(
      properties,
      'Name', 'name', 'NAME',
      'Title', 'title', 'TITLE'
    );
    const artworkName = extractText(nameProperty);
    
    const matchedProjectName = extractProjectNameFromArtworkName(artworkName, projectNames);
    
    if (matchedProjectName) {
      const imageUrl = await extractImageFromArtwork(artwork);
      const metadata = extractArtworkMetadata(artwork);
      
      if (imageUrl) {
        if (!artworkMap[matchedProjectName]) {
          artworkMap[matchedProjectName] = [];
        }
        artworkMap[matchedProjectName].push({
          url: imageUrl,
          ...metadata
        });
      }
    }
  }
  
  return artworkMap;
}

/**
 * Timeline 이름에 해당하는 Artwork 이미지들 가져오기
 */
export async function loadArtworkImagesForTimeline(timelineName, artworkData) {
  try {
    const normalizedTimelineName = timelineName ? timelineName.trim().toLowerCase() : '';
    
    const matchingItems = artworkData.filter(item => {
      const properties = item.properties || {};
      const timelineProperty = findProperty(
        properties,
        'Timeline', 'timeline', 'TIMELINE',
        'Name', 'name', 'NAME'
      );
      const timelineValue = extractText(timelineProperty);
      const normalizedTimelineValue = timelineValue ? timelineValue.trim().toLowerCase() : '';
      
      return normalizedTimelineValue === normalizedTimelineName;
    });
    
    if (matchingItems.length === 0) {
      return [];
    }
    
    // 모든 일치하는 항목의 이미지와 메타데이터 가져오기
    const imagePromises = matchingItems.map(async (item) => {
      const imageUrl = await extractImageFromArtwork(item);
      const metadata = extractTimelineArtworkMetadata(item);
      
      return {
        url: imageUrl,
        ...metadata
      };
    });
    
    const imageData = await Promise.all(imagePromises);
    const filteredData = imageData.filter(data => data.url !== null);
    
    return filteredData;
  } catch (error) {
    console.error('Timeline Artwork 이미지 로드 오류:', error);
    return [];
  }
}

/**
 * 모든 Timeline에 대한 Artwork 이미지 미리 로드
 */
export async function preloadAllTimelineImages(timelineData, artworkData) {
  const timelineMap = {};
  
  for (const timeline of timelineData) {
    if (timeline.name) {
      timelineMap[timeline.name] = await loadArtworkImagesForTimeline(timeline.name, artworkData);
    }
  }
  
  return timelineMap;
}

