// Exhibition 상세 페이지 데이터 처리 유틸리티

import { getWORKDataServer, getARTWORKDataServer } from './notion-api-server.js';
import { getPageBlocksServer, getBlockChildrenServer } from './notion-api-server.js';
import { extractText, extractDate, findProperty } from './notion-utils.js';
import { createSlug } from './slug-utils.js';

/**
 * 페이지 정보 가져오기 (제목 추출용)
 */
async function fetchPageInfo(pageId) {
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  
  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  const cleanedPageId = pageId.trim().replace(/-/g, '');
  
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${cleanedPageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Page ${pageId} 정보 가져오기 오류:`, errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Page ${pageId} 정보 가져오기 실패:`, error);
    return null;
  }
}

/**
 * 이미지 파일명에서 위치 정보 추출
 * 예: poster-exhibition-name-1-1.jpg -> { column: 1, row: 1 }
 * poster로 시작하는 이미지는 1-1 위치
 */
function parseImagePosition(filename) {
  const normalizedFilename = filename.toLowerCase();
  
  // poster로 시작하는 이미지는 항상 1-1 위치
  if (normalizedFilename.startsWith('poster')) {
    return {
      column: 1,
      row: 1
    };
  }
  
  // 파일명 끝에 있는 -숫자-숫자.확장자 패턴 찾기
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
 * Exhibition 항목에서 상세 데이터 추출
 */
function extractExhibitionDetail(item) {
  const properties = item.properties || {};

  const nameProperty = findProperty(
    properties,
    'Name', 'name', 'NAME',
    'Title', 'title', 'TITLE'
  );
  const name = extractText(nameProperty);

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
    period,
    description,
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
 * Related Text 토글에서 관련 페이지 정보 추출
 */
async function extractRelatedText(blocks) {
  const relatedTexts = [];
  
  console.log(`[extractRelatedText] 블록 개수: ${blocks.length}`);
  
  for (const block of blocks) {
    if (block.type === 'toggle') {
      const richText = block.toggle?.rich_text || [];
      const toggleText = richText.map(t => t.plain_text).join('').trim();
      
      console.log(`[extractRelatedText] 토글 발견: "${toggleText}"`);
      
      // Related Text 토글인 경우
      if (toggleText.toLowerCase() === 'related text' && block.has_children) {
        console.log(`[extractRelatedText] Related Text 토글 발견! children 가져오기...`);
        const children = await getBlockChildrenServer(block.id);
        console.log(`[extractRelatedText] children 개수: ${children ? children.length : 0}`);
        
        if (children && children.length > 0) {
          // children에서 페이지 링크 찾기
          for (const child of children) {
            console.log(`[extractRelatedText] child 타입: ${child.type}`);
            
            // child_page 타입 (페이지 블록)
            if (child.type === 'child_page') {
              const pageId = child.id;
              const pageTitle = child.child_page?.title || '';
              
              console.log(`[extractRelatedText] ✓ child_page 발견: "${pageTitle}" (${pageId})`);
              
              if (pageId && pageTitle && pageTitle.trim() !== '') {
                relatedTexts.push({
                  pageId: pageId,
                  title: pageTitle.trim(),
                  url: null
                });
              }
            }
            // paragraph 타입 (텍스트 블록 안의 링크)
            else if (child.type === 'paragraph') {
              const paragraphRichText = child.paragraph?.rich_text || [];
              console.log(`[extractRelatedText] paragraph rich_text 개수: ${paragraphRichText.length}`);
              
              for (const textItem of paragraphRichText) {
                // mention 타입 (페이지 링크)
                if (textItem.type === 'mention' && textItem.mention?.type === 'page') {
                  const pageId = textItem.mention.page.id;
                  let pageTitle = textItem.plain_text || '';
                  
                  // 페이지 제목이 없으면 페이지 정보를 가져와서 제목 추출
                  if (!pageTitle || pageTitle.trim() === '') {
                    try {
                      const pageInfo = await fetchPageInfo(pageId);
                      if (pageInfo && pageInfo.properties) {
                        const titleProperty = findProperty(
                          pageInfo.properties,
                          'title', 'Title', 'TITLE', 'Name', 'name', 'NAME'
                        );
                        pageTitle = extractText(titleProperty) || '';
                      }
                    } catch (error) {
                      console.error(`[extractRelatedText] 페이지 정보 가져오기 실패 (${pageId}):`, error);
                    }
                  }
                  
                  console.log(`[extractRelatedText] ✓ mention 페이지 발견: "${pageTitle}" (${pageId})`);
                  
                  if (pageId && pageTitle && pageTitle.trim() !== '') {
                    relatedTexts.push({
                      pageId: pageId,
                      title: pageTitle.trim(),
                      url: null
                    });
                  }
                }
                // link 타입 (외부 링크 또는 Notion 페이지 링크)
                else if (textItem.annotations?.link) {
                  const linkUrl = textItem.annotations.link;
                  let pageTitle = textItem.plain_text || '';
                  
                  console.log(`[extractRelatedText] link 발견: "${pageTitle}" (${linkUrl})`);
                  
                  // Notion 페이지 URL에서 페이지 ID 추출
                  if (linkUrl && linkUrl.includes('notion.so/')) {
                    const urlParts = linkUrl.split('/');
                    const pageIdPart = urlParts[urlParts.length - 1];
                    const pageId = pageIdPart.split('?')[0].split('#')[0];
                    
                    // 페이지 제목이 없으면 페이지 정보를 가져와서 제목 추출
                    if (!pageTitle || pageTitle.trim() === '') {
                      try {
                        const pageInfo = await fetchPageInfo(pageId);
                        if (pageInfo && pageInfo.properties) {
                          const titleProperty = findProperty(
                            pageInfo.properties,
                            'title', 'Title', 'TITLE', 'Name', 'name', 'NAME'
                          );
                          pageTitle = extractText(titleProperty) || '';
                        }
                      } catch (error) {
                        console.error(`[extractRelatedText] 페이지 정보 가져오기 실패 (${pageId}):`, error);
                      }
                    }
                    
                    console.log(`[extractRelatedText] ✓ Notion 페이지 링크 발견: "${pageTitle}" (${pageId})`);
                    
                    if (pageId && pageTitle && pageTitle.trim() !== '') {
                      relatedTexts.push({
                        pageId: pageId,
                        title: pageTitle.trim(),
                        url: linkUrl
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`[extractRelatedText] 최종 Related Text 개수: ${relatedTexts.length}`);
  return relatedTexts;
}

/**
 * Related Text 페이지 내용 가져오기
 */
export async function getRelatedTextPage(pageId) {
  try {
    const blocks = await getPageBlocksServer(pageId);
    if (!blocks || blocks.length === 0) {
      return null;
    }

    // 페이지 제목 가져오기 (페이지 속성에서)
    // 블록에서 텍스트 추출
    const textBlocks = await extractTextFromBlocks(blocks);
    
    // 페이지 제목은 첫 번째 블록에서 추출하거나 별도로 처리 필요
    // 일단 블록 내용만 반환
    const paragraphs = [];
    
    for (let i = 0; i < textBlocks.length; i++) {
      const block = textBlocks[i];
      
      if (!block || (Array.isArray(block) && block.length === 0)) {
        paragraphs.push(null);
      } else if (Array.isArray(block)) {
        paragraphs.push(block);
      } else {
        const isEmpty = !block || block.trim() === '';
        paragraphs.push(isEmpty ? null : block);
      }
    }
    
    return {
      pageId: pageId,
      content: paragraphs
    };
  } catch (error) {
    console.error('Related Text 페이지 내용 추출 오류:', error);
    return null;
  }
}

/**
 * 전시 이름으로 ARTWORK DB에서 작품 목록 가져오기
 */
/**
 * 문자열 정규화 함수 (공백, 대소문자, 특수문자 정규화)
 * 콤마, 콜론, 하이픈 등을 제거하여 매칭 정확도 향상
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/,/g, '') // 콤마 제거
    .replace(/[:\-]/g, ' ') // 콜론과 하이픈을 공백으로
    .replace(/\s+/g, ' ') // 여러 공백을 하나로
    .trim();
}

async function getArtworksByExhibition(exhibitionName) {
  try {
    const artworkData = await getARTWORKDataServer();
    
    if (!exhibitionName) {
      console.log('[getArtworksByExhibition] 전시 이름이 없습니다.');
      return [];
    }

    const normalizedExhibitionName = normalizeString(exhibitionName);
    console.log(`[getArtworksByExhibition] 검색 중인 전시 이름: "${exhibitionName}" (정규화: "${normalizedExhibitionName}")`);
    console.log(`[getArtworksByExhibition] 전체 작품 개수: ${artworkData.length}`);
    
    // 디버깅: 모든 작품의 Exhibition 속성 값 확인
    const allExhibitionValues = new Set();
    artworkData.forEach(item => {
      const properties = item.properties || {};
      const exhibitionProperty = findProperty(
        properties,
        'Exhibition', 'exhibition', 'EXHIBITION'
      );
      
      if (exhibitionProperty) {
        if (exhibitionProperty.type === 'multi_select' && exhibitionProperty.multi_select) {
          exhibitionProperty.multi_select.forEach(select => {
            if (select && select.name) {
              allExhibitionValues.add(select.name);
            }
          });
        } else if (exhibitionProperty.type === 'select' && exhibitionProperty.select) {
          if (exhibitionProperty.select.name) {
            allExhibitionValues.add(exhibitionProperty.select.name);
          }
        } else {
          const value = extractText(exhibitionProperty);
          if (value) {
            allExhibitionValues.add(value);
          }
        }
      }
    });
    
    console.log(`[getArtworksByExhibition] ARTWORK DB의 모든 Exhibition 값 (${allExhibitionValues.size}개):`, Array.from(allExhibitionValues).slice(0, 10));

    // ARTWORK DB에서 Exhibition 속성이 해당 전시 이름과 일치하는 작품 필터링
    const matchingArtworks = artworkData.filter(item => {
      const properties = item.properties || {};
      const exhibitionProperty = findProperty(
        properties,
        'Exhibition', 'exhibition', 'EXHIBITION'
      );

      if (!exhibitionProperty) {
        return false;
      }

      // multi_select 타입 속성 처리
      if (exhibitionProperty.type === 'multi_select' && exhibitionProperty.multi_select) {
        // multi_select는 배열이므로 각 항목을 확인
        const matches = exhibitionProperty.multi_select.some(select => {
          if (!select || !select.name) return false;
          const normalizedValue = normalizeString(select.name);
          const isMatch = normalizedValue === normalizedExhibitionName;
          
          if (isMatch) {
            const nameProperty = findProperty(properties, 'Name', 'name', 'NAME', 'Title', 'title', 'TITLE');
            const artworkName = extractText(nameProperty);
            console.log(`[getArtworksByExhibition] ✓ 매칭된 작품: "${artworkName}" - Exhibition 값: "${select.name}" (정규화: "${normalizedValue}")`);
          }
          
          return isMatch;
        });
        
        return matches;
      } else if (exhibitionProperty.type === 'select' && exhibitionProperty.select) {
        // select 타입 속성 처리
        const exhibitionValue = exhibitionProperty.select.name || '';
        const normalizedExhibitionValue = normalizeString(exhibitionValue);
        const isMatch = normalizedExhibitionValue === normalizedExhibitionName;
        
        if (isMatch) {
          const nameProperty = findProperty(properties, 'Name', 'name', 'NAME', 'Title', 'title', 'TITLE');
          const artworkName = extractText(nameProperty);
          console.log(`[getArtworksByExhibition] ✓ 매칭된 작품: "${artworkName}" - Exhibition 값: "${exhibitionValue}" (정규화: "${normalizedExhibitionValue}")`);
        }
        
        return isMatch;
      } else {
        // 다른 타입인 경우 extractText 사용
        const exhibitionValue = extractText(exhibitionProperty);
        const normalizedExhibitionValue = normalizeString(exhibitionValue);
        return normalizedExhibitionValue === normalizedExhibitionName;
      }
    });
    
    console.log(`[getArtworksByExhibition] 매칭된 작품 개수: ${matchingArtworks.length}`);

    // 작품 데이터 추출
    const artworks = matchingArtworks.map(item => {
      const properties = item.properties || {};
      
      const nameProperty = findProperty(
        properties,
        'Name', 'name', 'NAME',
        'Title', 'title', 'TITLE'
      );
      const name = extractText(nameProperty);

      const artistProperty = findProperty(
        properties,
        'Artist', 'artist', 'ARTIST',
        'Author', 'author', 'AUTHOR'
      );
      const artist = extractText(artistProperty);

      const dimensionProperty = findProperty(
        properties,
        'Dimension', 'dimension', 'DIMENSION',
        'Size', 'size', 'SIZE',
        'Dimensions', 'dimensions', 'DIMENSIONS'
      );
      const dimension = extractText(dimensionProperty);

      const captionProperty = findProperty(
        properties,
        'Caption', 'caption', 'CAPTION'
      );
      const caption = extractText(captionProperty);

      return {
        name,
        artist,
        dimension,
        caption,
        slug: createSlug(name),
        pageId: item.id
      };
    }).filter(artwork => artwork.name); // 이름이 있는 작품만

    return artworks;
  } catch (error) {
    console.error('전시 작품 목록 로드 오류:', error);
    return [];
  }
}

/**
 * slug로 Exhibition 상세 데이터 가져오기
 */
export async function getExhibitionBySlug(slug) {
  try {
    const workData = await getWORKDataServer();

    // WORK DB에서 Exhibition 클래스 항목만 필터링
    const exhibitionFiltered = workData.filter(item => {
      const properties = item.properties || {};
      const classProperty = findProperty(
        properties,
        'Class', 'class', 'CLASS',
        'Type', 'type', 'TYPE',
        'Category', 'category', 'CATEGORY'
      );

      if (!classProperty) {
        return false;
      }

      const classValue = extractText(classProperty);
      const normalizedClass = classValue ? classValue.toUpperCase().trim() : '';

      // SOLO EXHIBITION 또는 GROUP EXHIBITION인지 확인
      return normalizedClass === 'SOLO EXHIBITION' || normalizedClass === 'GROUP EXHIBITION';
    });

    // slug와 일치하는 항목 찾기
    const matchingItem = exhibitionFiltered.find(item => {
      const detail = extractExhibitionDetail(item);
      const itemSlug = createSlug(detail.name);
      return itemSlug === slug;
    });

    if (!matchingItem) {
      return null;
    }

    const detail = extractExhibitionDetail(matchingItem);
    const blocks = await getPageBlocksServer(matchingItem.id);
    const pageText = await extractPageText(matchingItem.id);
    const relatedTexts = await extractRelatedText(blocks);
    
    console.log(`[Exhibition Detail] 전시 이름: "${detail.name}"`);
    console.log(`[Exhibition Detail] 블록 개수: ${blocks.length}`);
    console.log(`[Exhibition Detail] Related Text 개수: ${relatedTexts.length}`);
    if (relatedTexts.length > 0) {
      console.log(`[Exhibition Detail] Related Text 목록:`, relatedTexts.map(rt => rt.title));
    } else {
      console.log(`[Exhibition Detail] Related Text가 없습니다.`);
    }
    
    // 해당 전시의 작품 목록 가져오기
    const artworks = await getArtworksByExhibition(detail.name);
    
    console.log(`[Exhibition Detail] 작품 개수: ${artworks.length}`);
    if (artworks.length > 0) {
      console.log(`[Exhibition Detail] 작품 목록:`, artworks.map(a => a.name));
    } else {
      console.log(`[Exhibition Detail] 작품이 없습니다. Exhibition 속성에 "${detail.name}"이 있는 작품을 찾지 못했습니다.`);
    }

    return {
      ...detail,
      pageText,
      relatedTexts,
      artworks: artworks || [], // 항상 배열로 보장
      slug: createSlug(detail.name)
    };
  } catch (error) {
    console.error('Exhibition 상세 데이터 로드 오류:', error);
    return null;
  }
}

/**
 * 모든 Exhibition의 slug 목록 가져오기 (getStaticPaths용)
 */
export async function getAllExhibitionSlugs() {
  try {
    const workData = await getWORKDataServer();

    // WORK DB에서 Exhibition 클래스 항목만 필터링
    const exhibitionFiltered = workData.filter(item => {
      const properties = item.properties || {};
      const classProperty = findProperty(
        properties,
        'Class', 'class', 'CLASS',
        'Type', 'type', 'TYPE',
        'Category', 'category', 'CATEGORY'
      );

      if (!classProperty) {
        return false;
      }

      const classValue = extractText(classProperty);
      const normalizedClass = classValue ? classValue.toUpperCase().trim() : '';

      return normalizedClass === 'SOLO EXHIBITION' || normalizedClass === 'GROUP EXHIBITION';
    });

    const slugs = exhibitionFiltered
      .map(item => {
        const detail = extractExhibitionDetail(item);
        return createSlug(detail.name);
      })
      .filter(slug => slug); // 빈 slug 제거

    return slugs;
  } catch (error) {
    console.error('Exhibition slug 목록 로드 오류:', error);
    return [];
  }
}

