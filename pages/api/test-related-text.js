// Related Text 토글 안의 데이터 확인 테스트 (API 라우트)

import { getWORKDataServer } from '../../lib/notion-api-server.js';
import { getPageBlocksServer, getBlockChildrenServer } from '../../lib/notion-api-server.js';
import { extractText, findProperty } from '../../lib/notion-utils.js';

/**
 * 전시 상세 데이터 추출 (간단 버전)
 */
function extractExhibitionDetail(item) {
  const properties = item.properties || {};
  const nameProperty = findProperty(
    properties,
    'Name', 'name', 'NAME',
    'Title', 'title', 'TITLE'
  );
  const name = extractText(nameProperty);
  return { name, pageId: item.id };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. WORK DB에서 전시 찾기
    const workData = await getWORKDataServer();
    
    const exhibitionFiltered = workData.filter(item => {
      const properties = item.properties || {};
      const classProperty = findProperty(
        properties,
        'Class', 'class', 'CLASS',
        'Type', 'type', 'TYPE',
        'Category', 'category', 'CATEGORY'
      );
      
      if (!classProperty) return false;
      
      const classValue = extractText(classProperty);
      const normalizedClass = classValue ? classValue.toUpperCase().trim() : '';
      return normalizedClass === 'SOLO EXHIBITION' || normalizedClass === 'GROUP EXHIBITION';
    });
    
    const results = [];
    
    // 2. 각 전시의 블록 확인 (모두 확인)
    for (let i = 0; i < exhibitionFiltered.length; i++) {
      const item = exhibitionFiltered[i];
      const detail = extractExhibitionDetail(item);
      
      const result = {
        exhibition: {
          name: detail.name,
          pageId: detail.pageId
        },
        blocks: {
          total: 0,
          toggles: []
        }
      };
      
      // 블록 가져오기
      const blocks = await getPageBlocksServer(detail.pageId);
      result.blocks.total = blocks.length;
      
      // 토글 블록 찾기
      const toggleBlocks = blocks.filter(b => b.type === 'toggle');
      
      for (const toggle of toggleBlocks) {
        const richText = toggle.toggle?.rich_text || [];
        const toggleText = richText.map(t => t.plain_text).join('').trim();
        
        const toggleInfo = {
          text: toggleText,
          has_children: toggle.has_children,
          isRelatedText: toggleText.toLowerCase() === 'related text',
          children: []
        };
        
        if (toggleInfo.isRelatedText && toggle.has_children) {
          const children = await getBlockChildrenServer(toggle.id);
          
          if (children && children.length > 0) {
            children.forEach((child, idx) => {
              const childInfo = {
                index: idx,
                type: child.type,
                data: null
              };
              
              if (child.type === 'paragraph') {
                const paragraphRichText = child.paragraph?.rich_text || [];
                childInfo.rich_text_count = paragraphRichText.length;
                childInfo.rich_text_items = paragraphRichText.map((textItem, textIdx) => {
                  const itemInfo = {
                    index: textIdx,
                    type: textItem.type,
                    plain_text: textItem.plain_text || '',
                    mention_type: textItem.mention?.type || null,
                    mention_page_id: textItem.mention?.page?.id || null,
                    link_url: textItem.annotations?.link || null
                  };
                  return itemInfo;
                });
              } else {
                childInfo.data = JSON.stringify(child, null, 2);
              }
              
              toggleInfo.children.push(childInfo);
            });
          }
        }
        
        result.blocks.toggles.push(toggleInfo);
      }
      
      results.push(result);
    }
    
    return res.status(200).json({
      totalExhibitions: exhibitionFiltered.length,
      testedExhibitions: results.length,
      results: results
    });
  } catch (error) {
    console.error('테스트 실패:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
}

