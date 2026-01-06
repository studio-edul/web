// Artwork 상세 페이지 데이터 처리 유틸리티

import { getARTWORKDataServer } from './notion-api-server.js';
import { getPageBlocksServer, getBlockChildrenServer } from './notion-api-server.js';
import { extractText, findProperty } from './notion-utils.js';
import { createSlug } from './slug-utils.js';

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
 * 이미지 파일명에서 위치 정보 추출
 * 예: artwork-newborn-space-v200-1-1.jpg -> { column: 1, row: 1 }
 * 파일명 끝에 있는 -숫자-숫자 패턴을 찾음
 */
function parseImagePosition(filename) {
  // 파일명에서 마지막 -숫자-숫자.확장자 패턴 찾기
  // 예: artwork-newborn-space-v200-1-1.jpg -> -1-1 추출
  const pattern = /-(\d+)-(\d+)(?:\.(jpg|jpeg|png|gif|webp))?$/i;
  const match = filename.match(pattern);
  
  if (match) {
    return {
      column: parseInt(match[1], 10), // 1 = 2번째 열, 2 = 3번째 열
      row: parseInt(match[2], 10)
    };
  }
  
  return null;
}

/**
 * Image 필드에서 이미지 목록 추출 및 정렬
 */
function extractImagesFromImageField(imageText) {
  if (!imageText || imageText.trim() === '') {
    return [];
  }

  // 줄바꿈으로 분리
  const filenames = imageText.split('\n')
    .map(f => f.trim())
    .filter(f => f !== '');

  const images = filenames.map(filename => {
    const normalizedFilename = filename.trim();
    const position = parseImagePosition(normalizedFilename);
    
    return {
      filename: normalizedFilename,
      path: `/assets/images/${normalizedFilename}`,
      column: position ? position.column : null,
      row: position ? position.row : null
    };
  });

  // 위치가 있는 이미지만 필터링하고 정렬 (열 우선, 그 다음 행)
  const positionedImages = images.filter(img => img.column !== null && img.row !== null);
  positionedImages.sort((a, b) => {
    if (a.column !== b.column) {
      return a.column - b.column;
    }
    return a.row - b.row;
  });

  return positionedImages;
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

  const artistProperty = findProperty(
    properties,
    'Artist', 'artist', 'ARTIST',
    'Author', 'author', 'AUTHOR'
  );
  const artist = extractText(artistProperty);

  const captionProperty = findProperty(
    properties,
    'Caption', 'caption', 'CAPTION'
  );
  const caption = extractText(captionProperty);

  // Image 필드에서 이미지 목록 추출
  const imageProperty = findProperty(
    properties,
    'Image', 'image', 'IMAGE'
  );
  
  let images = [];
  if (imageProperty) {
    const imageText = extractText(imageProperty);
    images = extractImagesFromImageField(imageText);
  }

  return {
    name,
    project,
    timeline,
    description,
    artist,
    caption,
    images,
    pageId: item.id
  };
}

/**
 * 블록에서 텍스트 추출 (재귀적으로 children 처리)
 * rich_text 구조를 유지하여 bold 등의 스타일 정보 보존
 */
async function extractTextFromBlocks(blocks) {
  const textBlocks = [];
  
  for (const block of blocks) {
    if (block.type === 'paragraph' || block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      const richText = block[block.type]?.rich_text || [];
      // rich_text 배열을 그대로 저장 (bold 등의 스타일 정보 포함)
      // 빈 블록도 포함 (두 번 줄바꿈을 위해)
      textBlocks.push(richText.length > 0 ? richText : null);
    } else if (block.type === 'toggle') {
      // 토글 블록의 텍스트 확인
      const richText = block.toggle?.rich_text || [];
      const toggleText = richText.map(t => t.plain_text).join('').trim();
      
      // EN 토글인 경우 children 가져오기
      if (toggleText === 'EN' && block.has_children) {
        const children = await getBlockChildrenServer(block.id);
        if (children && children.length > 0) {
          const childrenTexts = await extractTextFromBlocks(children);
          textBlocks.push(...childrenTexts);
        }
      }
    }
  }
  
  return textBlocks;
}

/**
 * 페이지 블록에서 텍스트 내용 추출 (EN 토글 내부만)
 */
async function extractPageText(pageId) {
  try {
    const blocks = await getPageBlocksServer(pageId);
    if (!blocks || blocks.length === 0) {
      return '';
    }

    // EN 토글을 찾아서 그 안의 텍스트만 추출
    const textBlocks = await extractTextFromBlocks(blocks);

    // 각 블록을 문단으로 분리하여 배열로 반환 (빈 블록은 문단 구분으로 사용)
    const paragraphs = [];
    
    for (let i = 0; i < textBlocks.length; i++) {
      const block = textBlocks[i];
      
      // null이거나 빈 배열이면 문단 구분 마커
      if (!block || (Array.isArray(block) && block.length === 0)) {
        paragraphs.push(null);
      } else if (Array.isArray(block)) {
        // rich_text 배열인 경우 그대로 저장
        paragraphs.push(block);
      } else {
        // 문자열인 경우 (하위 호환성)
        const isEmpty = !block || block.trim() === '';
        paragraphs.push(isEmpty ? null : block);
      }
    }
    
    // 문단 배열을 반환 (렌더링에서 처리)
    return paragraphs;
  } catch (error) {
    console.error('페이지 텍스트 추출 오류:', error);
    return '';
  }
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
    const pageText = await extractPageText(matchingItem.id);

    return {
      ...detail,
      imageUrl,
      pageText,
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

