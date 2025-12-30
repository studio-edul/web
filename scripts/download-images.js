// 빌드 전에 실행하는 이미지 다운로드 스크립트
// 사용법: node scripts/download-images.js

const { getWORKDataServer, getARTWORKDataServer } = require('../lib/notion-api-server');
const { processWorkData } = require('../lib/work-processor');
const { preloadAllArtworkImages } = require('../lib/artwork-processor');
const { downloadAndReplaceImages } = require('../lib/image-downloader');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔄 이미지 다운로드 시작...');
  
  try {
    // Notion 데이터 가져오기
    console.log('📡 Notion 데이터 로드 중...');
    const [workData, artworkData] = await Promise.all([
      getWORKDataServer(),
      getARTWORKDataServer()
    ]);
    
    const projects = processWorkData(workData);
    const artworkMap = await preloadAllArtworkImages(workData, artworkData);
    
    console.log(`✅ ${Object.keys(artworkMap).length}개 프로젝트의 이미지 처리 시작`);
    
    // 이미지 다운로드 및 변환
    const outputDir = path.join(process.cwd(), 'public/images');
    const processedMap = await downloadAndReplaceImages(artworkMap, outputDir);
    
    // 처리된 맵을 JSON 파일로 저장 (getStaticProps에서 사용)
    const mapPath = path.join(process.cwd(), 'lib/artwork-map.json');
    fs.writeFileSync(mapPath, JSON.stringify(processedMap, null, 2));
    
    console.log('✅ 이미지 다운로드 완료!');
    console.log(`📁 저장 위치: ${outputDir}`);
    console.log(`📄 맵 파일: ${mapPath}`);
  } catch (error) {
    console.error('❌ 이미지 다운로드 오류:', error);
    process.exit(1);
  }
}

main();

