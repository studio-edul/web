// Artwork 상세 페이지 데이터 처리 유틸리티

import { getARTWORKDataServer } from './notion-api-server';
import { getPageBlocksServer } from './notion-api-server';
import { extractText, findProperty } from './notion-utils';
import { createSlug } from './slug-utils';

/**
 * Artwork 항목에서 이미지 URL 추출
 */
async function extractImageFromArtwork(item) {
  const pageId = item.id;
  
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
 * Artwork 항목에서 상세 데이터 추출
 */
function extractArtworkDetail(item) {
  const properties = item.properties || {};
  
  const nameProperty = findProperty(
    properties,
    'Name', 'name', 'NAME',
    'Title', 'title', 'TITLE'
  );
  const name = extractText(nameProperty);
  
  const projectProperty = findProperty(
    properties,
    'Project', 'project', 'PROJECT'
  );
  const project = extractText(projectProperty);
  
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
  
  return {
    name,
    project,
    timeline,
    description,
    pageId: item.id
  };
}

/**
 * slug로 Artwork 상세 데이터 가져오기
 */
export async function getArtworkBySlug(slug) {
  try {
    const artworkData = await getARTWORKDataServer();
    
    // slug와 일치하는 항목 찾기
    const matchingItem = artworkData.find(item => {
      const detail = extractArtworkDetail(item);
      const itemSlug = createSlug(detail.name);
      return itemSlug === slug;
    });
    
    if (!matchingItem) {
      return null;
    }
    
    const detail = extractArtworkDetail(matchingItem);
    const imageUrl = await extractImageFromArtwork(matchingItem);
    
    return {
      ...detail,
      imageUrl,
      slug: createSlug(detail.name)
    };
  } catch (error) {
    console.error('Artwork 상세 데이터 로드 오류:', error);
    return null;
  }
}

/**
 * 모든 Artwork의 slug 목록 가져오기 (getStaticPaths용)
 */
export async function getAllArtworkSlugs() {
  try {
    const artworkData = await getARTWORKDataServer();
    
    const slugs = artworkData
      .map(item => {
        const detail = extractArtworkDetail(item);
        return createSlug(detail.name);
      })
      .filter(slug => slug); // 빈 slug 제거
    
    return slugs;
  } catch (error) {
    console.error('Artwork slug 목록 로드 오류:', error);
    return [];
  }
}

