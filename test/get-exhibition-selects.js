// ARTWORK DB에서 Exhibition 속성의 모든 선택지 찾기

import { getARTWORKDataServer } from '../lib/notion-api-server.js';
import { findProperty, extractText } from '../lib/notion-utils.js';
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

async function getExhibitionSelects() {
  try {
    console.log('📊 ARTWORK DB에서 Exhibition 속성 선택지 수집 중...\n');
    
    const artworkData = await getARTWORKDataServer();
    console.log(`✅ 전체 작품 개수: ${artworkData.length}개\n`);
    
    const exhibitionSelects = new Set();
    const exhibitionValues = [];
    
    for (const item of artworkData) {
      const properties = item.properties || {};
      const exhibitionProperty = findProperty(
        properties,
        'Exhibition', 'exhibition', 'EXHIBITION'
      );
      
      if (!exhibitionProperty) {
        continue;
      }
      
      let exhibitionValue = '';
      
      // select 타입인 경우
      if (exhibitionProperty.type === 'select' && exhibitionProperty.select) {
        exhibitionValue = exhibitionProperty.select.name || '';
      } else {
        // 다른 타입인 경우 extractText 사용
        exhibitionValue = extractText(exhibitionProperty);
      }
      
      if (exhibitionValue && exhibitionValue.trim() !== '') {
        exhibitionSelects.add(exhibitionValue.trim());
        exhibitionValues.push({
          name: exhibitionValue.trim(),
          type: exhibitionProperty.type || 'unknown'
        });
      }
    }
    
    console.log('='.repeat(80));
    console.log('📋 Exhibition 속성 선택지 목록:\n');
    
    const sortedSelects = Array.from(exhibitionSelects).sort();
    
    sortedSelects.forEach((select, index) => {
      const count = exhibitionValues.filter(v => v.name === select).length;
      console.log(`${index + 1}. "${select}" (${count}개 작품)`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📈 총 ${exhibitionSelects.size}개의 고유한 Exhibition 선택지 발견`);
    console.log(`📊 Exhibition 속성이 설정된 작품: ${exhibitionValues.length}개\n`);
    
    // 타입별 통계
    const typeStats = {};
    exhibitionValues.forEach(v => {
      typeStats[v.type] = (typeStats[v.type] || 0) + 1;
    });
    
    console.log('타입별 통계:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}개`);
    });
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 실행
getExhibitionSelects();

