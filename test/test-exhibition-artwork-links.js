// 테스트: WORK DB의 Exhibition 페이지 내부 ARTWORK DB 링크 확인

import { extractText, findProperty } from '../lib/notion-utils.js';
import { processExhibitionData } from '../lib/exhibition-processor.js';
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
  console.warn('⚠️  .env.local 파일을 찾을 수 없습니다. 환경 변수를 확인하세요.\n');
}

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASES = {
  CV: process.env.NOTION_DB_CV,
  WORK: process.env.NOTION_DB_WORK,
  ARTWORK: process.env.NOTION_DB_ARTWORK
};

/**
 * Notion 데이터베이스 쿼리 (직접 API 호출)
 */
async function fetchNotionDatabase(databaseName) {
  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  const databaseId = DATABASES[databaseName];
  if (!databaseId) {
    throw new Error(`${databaseName} 데이터베이스 ID가 설정되지 않았습니다.`);
  }
  
  const cleanedId = databaseId.trim().replace(/-/g, '');
  
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${cleanedId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Database ${databaseName} 쿼리 오류:`, errorData);
      return [];
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Database ${databaseName} 쿼리 실패:`, error);
    return [];
  }
}

/**
 * 페이지 블록 가져오기 (직접 API 호출, 재귀적으로 children 포함)
 */
async function getPageBlocks(pageId, allBlocks = []) {
  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  const cleanedPageId = pageId.trim().replace(/-/g, '');
  
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${cleanedPageId}/children`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Page ${pageId} 블록 가져오기 오류:`, errorData);
      return allBlocks;
    }
    
    const data = await response.json();
    const blocks = data.results || [];
    
    // 모든 블록을 결과에 추가
    allBlocks.push(...blocks);
    
    // 각 블록의 children도 재귀적으로 가져오기
    for (const block of blocks) {
      if (block.has_children) {
        await getPageBlocks(block.id, allBlocks);
      }
    }
    
    return allBlocks;
  } catch (error) {
    console.error(`Page ${pageId} 블록 가져오기 실패:`, error);
    return allBlocks;
  }
}

/**
 * 페이지의 블록에서 child_database 블록 찾기
 */
function findChildDatabases(blocks) {
  const childDatabases = [];
  
  for (const block of blocks) {
    if (block.type === 'child_database') {
      childDatabases.push({
        id: block.id,
        title: block.child_database?.title || 'Untitled Database',
        blockId: block.id
      });
    }
    
    // 재귀적으로 children 블록도 확인
    if (block.children && Array.isArray(block.children)) {
      const nestedDatabases = findChildDatabases(block.children);
      childDatabases.push(...nestedDatabases);
    }
  }
  
  return childDatabases;
}

/**
 * child_database의 데이터 쿼리 (Notion API 직접 호출)
 */
async function queryChildDatabase(databaseId) {
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  
  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  // 데이터베이스 ID 정리 (공백 제거, 하이픈 제거)
  const cleanedId = databaseId.trim().replace(/-/g, '');
  
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${cleanedId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Database ${databaseId} 쿼리 오류:`, errorData);
      return [];
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Database ${databaseId} 쿼리 실패:`, error);
    return [];
  }
}

/**
 * ARTWORK 페이지인지 확인 (ARTWORK DB의 페이지 ID와 비교)
 */
function isArtworkPage(pageId, artworkData) {
  const cleanedPageId = pageId.trim().replace(/-/g, '');
  
  return artworkData.some(artwork => {
    const artworkId = artwork.id ? artwork.id.trim().replace(/-/g, '') : '';
    return artworkId === cleanedPageId;
  });
}

/**
 * 페이지에서 ARTWORK 페이지 링크 찾기
 */
function findArtworkLinksInPage(page, artworkData) {
  const artworkLinks = [];
  
  // relation 속성에서 ARTWORK 링크 찾기
  const properties = page.properties || {};
  
  for (const [propName, prop] of Object.entries(properties)) {
    if (prop.type === 'relation') {
      const relations = prop.relation || [];
      
      for (const relation of relations) {
        if (relation.id && isArtworkPage(relation.id, artworkData)) {
          // ARTWORK 페이지 정보 찾기
          const artwork = artworkData.find(a => {
            const artworkId = a.id ? a.id.trim().replace(/-/g, '') : '';
            const relationId = relation.id.trim().replace(/-/g, '');
            return artworkId === relationId;
          });
          
          if (artwork) {
            const nameProperty = findProperty(
              artwork.properties || {},
              'Name', 'name', 'NAME',
              'Title', 'title', 'TITLE'
            );
            const artworkName = extractText(nameProperty);
            
            artworkLinks.push({
              id: relation.id,
              name: artworkName || 'Untitled',
              propertyName: propName
            });
          }
        }
      }
    }
  }
  
  return artworkLinks;
}

/**
 * 메인 테스트 함수
 */
async function testExhibitionArtworkLinks() {
  console.log('🧪 Exhibition-Artwork 링크 테스트 시작...\n');
  
  try {
    // 1. WORK 데이터 가져오기
    console.log('1️⃣ WORK DB 데이터 로드 중...');
    const workData = await fetchNotionDatabase('WORK');
    console.log(`   ✅ ${workData.length}개의 WORK 항목 로드 완료\n`);
    
    // 2. ARTWORK 데이터 가져오기
    console.log('2️⃣ ARTWORK DB 데이터 로드 중...');
    const artworkData = await fetchNotionDatabase('ARTWORK');
    console.log(`   ✅ ${artworkData.length}개의 ARTWORK 항목 로드 완료\n`);
    
    // 3. Exhibition 데이터 필터링 (SOLO EXHIBITION, GROUP EXHIBITION)
    console.log('3️⃣ Exhibition 클래스 필터링 중...');
    const exhibitionItems = await processExhibitionData(workData);
    console.log(`   ✅ ${exhibitionItems.length}개의 Exhibition 항목 발견\n`);
    
    if (exhibitionItems.length === 0) {
      console.log('⚠️  Exhibition 항목이 없습니다.');
      return;
    }
    
    // 4. 각 Exhibition 페이지의 블록 확인
    console.log('4️⃣ 각 Exhibition 페이지의 블록 및 링크 확인 중...\n');
    
    const results = [];
    
    for (let i = 0; i < exhibitionItems.length; i++) {
      const exhibition = exhibitionItems[i];
      
      // 원본 WORK 데이터에서 페이지 ID 찾기
      const workPage = workData.find(item => {
        const properties = item.properties || {};
        const nameProperty = findProperty(
          properties,
          'Name', 'name', 'NAME',
          'Title', 'title', 'TITLE'
        );
        const name = extractText(nameProperty);
        return name === exhibition.name;
      });
      
      if (!workPage || !workPage.id) {
        console.log(`   ⚠️  "${exhibition.name}" 페이지를 찾을 수 없습니다.`);
        continue;
      }
      
      const pageId = workPage.id;
      
      console.log(`   [${i + 1}/${exhibitionItems.length}] ${exhibition.name} (${exhibition.classType})`);
      
      // 페이지 블록 가져오기
      const blocks = await getPageBlocks(pageId);
      
      // child_database 블록 찾기
      const childDatabases = findChildDatabases(blocks);
      
      // 페이지의 relation 속성에서 ARTWORK 링크 찾기
      const artworkLinks = findArtworkLinksInPage(workPage, artworkData);
      
      const result = {
        exhibition: {
          name: exhibition.name,
          classType: exhibition.classType,
          pageId: pageId
        },
        childDatabases: childDatabases.map(db => ({
          id: db.id,
          title: db.title
        })),
        artworkLinks: artworkLinks,
        childDatabaseArtworks: []
      };
      
      // 각 child_database에서 ARTWORK 페이지 찾기
      for (const db of childDatabases) {
        console.log(`      📊 Child Database 발견: ${db.title} (${db.id})`);
        
        const dbPages = await queryChildDatabase(db.id);
        console.log(`         → ${dbPages.length}개의 페이지 발견`);
        
        const dbArtworks = [];
        for (const dbPage of dbPages) {
          if (isArtworkPage(dbPage.id, artworkData)) {
            const nameProperty = findProperty(
              dbPage.properties || {},
              'Name', 'name', 'NAME',
              'Title', 'title', 'TITLE'
            );
            const artworkName = extractText(nameProperty);
            
            dbArtworks.push({
              id: dbPage.id,
              name: artworkName || 'Untitled'
            });
            
            console.log(`            ✓ ARTWORK: ${artworkName || 'Untitled'}`);
          }
        }
        
        result.childDatabaseArtworks.push({
          databaseId: db.id,
          databaseTitle: db.title,
          artworks: dbArtworks
        });
      }
      
      // relation 속성에서 찾은 ARTWORK 링크 출력
      if (artworkLinks.length > 0) {
        console.log(`      🔗 Relation 속성에서 ${artworkLinks.length}개의 ARTWORK 링크 발견:`);
        artworkLinks.forEach(link => {
          console.log(`         → ${link.name} (속성: ${link.propertyName})`);
        });
      }
      
      results.push(result);
      console.log('');
    }
    
    // 5. 결과 요약
    console.log('\n📊 테스트 결과 요약\n');
    console.log('='.repeat(80));
    
    let totalChildDatabases = 0;
    let totalArtworkLinks = 0;
    let totalChildDatabaseArtworks = 0;
    
    results.forEach((result, index) => {
      const { exhibition, childDatabases, artworkLinks, childDatabaseArtworks } = result;
      
      totalChildDatabases += childDatabases.length;
      totalArtworkLinks += artworkLinks.length;
      
      const dbArtworkCount = childDatabaseArtworks.reduce((sum, db) => sum + db.artworks.length, 0);
      totalChildDatabaseArtworks += dbArtworkCount;
      
      console.log(`\n${index + 1}. ${exhibition.name} (${exhibition.classType})`);
      console.log(`   페이지 ID: ${exhibition.pageId}`);
      console.log(`   Child Databases: ${childDatabases.length}개`);
      childDatabases.forEach(db => {
        console.log(`     - ${db.title} (${db.id})`);
      });
      console.log(`   Relation 속성 ARTWORK 링크: ${artworkLinks.length}개`);
      artworkLinks.forEach(link => {
        console.log(`     - ${link.name} (${link.propertyName})`);
      });
      console.log(`   Child Database 내 ARTWORK: ${dbArtworkCount}개`);
      childDatabaseArtworks.forEach(dbArt => {
        if (dbArt.artworks.length > 0) {
          console.log(`     - ${dbArt.databaseTitle}: ${dbArt.artworks.length}개`);
          dbArt.artworks.forEach(art => {
            console.log(`       • ${art.name}`);
          });
        }
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 전체 통계:');
    console.log(`   총 Exhibition 항목: ${results.length}개`);
    console.log(`   총 Child Databases: ${totalChildDatabases}개`);
    console.log(`   총 Relation 속성 ARTWORK 링크: ${totalArtworkLinks}개`);
    console.log(`   총 Child Database 내 ARTWORK: ${totalChildDatabaseArtworks}개`);
    console.log('\n✅ 테스트 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 테스트 실행
testExhibitionArtworkLinks();

