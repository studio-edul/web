// Related Text 토글 안의 데이터 확인 테스트

import { getWORKDataServer } from '../lib/notion-api-server.js';
import { getPageBlocksServer, getBlockChildrenServer } from '../lib/notion-api-server.js';
import { extractText, findProperty } from '../lib/notion-utils.js';
import { createSlug } from '../lib/slug-utils.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// .env.local 파일에서 환경 변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envLocalPath = join(__dirname, '..', '.env.local');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('✅ .env.local 파일에서 환경 변수 로드 완료\n');
} else {
  console.warn('⚠️  .env.local 파일을 찾을 수 없습니다.\n');
}

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

async function testRelatedText() {
  try {
    console.log('🧪 Related Text 토글 데이터 확인 테스트 시작...\n');
    
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
    
    console.log(`✅ ${exhibitionFiltered.length}개의 전시 발견\n`);
    
    if (exhibitionFiltered.length === 0) {
      console.log('⚠️  전시가 없습니다.');
      return;
    }
    
    // 2. 각 전시의 블록 확인
    for (let i = 0; i < Math.min(exhibitionFiltered.length, 5); i++) {
      const item = exhibitionFiltered[i];
      const detail = extractExhibitionDetail(item);
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`[${i + 1}] 전시: "${detail.name}"`);
      console.log(`페이지 ID: ${detail.pageId}\n`);
      
      // 블록 가져오기
      const blocks = await getPageBlocksServer(detail.pageId);
      console.log(`📦 전체 블록 개수: ${blocks.length}\n`);
      
      // 토글 블록 찾기
      const toggleBlocks = blocks.filter(b => b.type === 'toggle');
      console.log(`🔽 토글 블록 개수: ${toggleBlocks.length}\n`);
      
      for (const toggle of toggleBlocks) {
        const richText = toggle.toggle?.rich_text || [];
        const toggleText = richText.map(t => t.plain_text).join('').trim();
        
        console.log(`  토글 텍스트: "${toggleText}"`);
        console.log(`  has_children: ${toggle.has_children}`);
        
        if (toggleText.toLowerCase() === 'related text') {
          console.log(`  ✅ Related Text 토글 발견!\n`);
          
          if (toggle.has_children) {
            const children = await getBlockChildrenServer(toggle.id);
            console.log(`  📋 Children 개수: ${children ? children.length : 0}\n`);
            
            if (children && children.length > 0) {
              children.forEach((child, idx) => {
                console.log(`  [Child ${idx + 1}] 타입: ${child.type}`);
                
                if (child.type === 'paragraph') {
                  const paragraphRichText = child.paragraph?.rich_text || [];
                  console.log(`    rich_text 개수: ${paragraphRichText.length}`);
                  
                  paragraphRichText.forEach((textItem, textIdx) => {
                    console.log(`    [Text ${textIdx + 1}]`);
                    console.log(`      type: ${textItem.type}`);
                    console.log(`      plain_text: "${textItem.plain_text}"`);
                    
                    if (textItem.type === 'mention') {
                      console.log(`      mention.type: ${textItem.mention?.type}`);
                      if (textItem.mention?.type === 'page') {
                        console.log(`      mention.page.id: ${textItem.mention.page.id}`);
                      }
                    }
                    
                    if (textItem.annotations?.link) {
                      console.log(`      annotations.link: ${textItem.annotations.link}`);
                    }
                    
                    console.log(`      전체 구조:`, JSON.stringify(textItem, null, 2));
                    console.log('');
                  });
                } else {
                  console.log(`    전체 구조:`, JSON.stringify(child, null, 2));
                  console.log('');
                }
              });
            } else {
              console.log(`  ⚠️  Children이 없습니다.\n`);
            }
          } else {
            console.log(`  ⚠️  has_children이 false입니다.\n`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ 테스트 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 테스트 실행
testRelatedText();

