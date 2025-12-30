// 빌드 시 Notion 이미지를 다운로드하여 로컬에 저장하는 유틸리티
const fs = require('fs');
const path = require('path');

/**
 * 이미지 URL에서 파일명 생성
 */
function getImageFilename(imageUrl, projectName, index) {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const ext = path.extname(pathname) || '.jpg';

    // 프로젝트 이름과 인덱스를 사용하여 파일명 생성
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeIndex = index ? index.toString().replace(/[^a-zA-Z0-9]/g, '_') : '0';

    return `${safeProjectName}_${safeIndex}${ext}`;
  } catch (error) {
    console.error('파일명 생성 오류:', error);
    return `image_${Date.now()}.jpg`;
  }
}

/**
 * 이미지 다운로드
 */
async function downloadImage(imageUrl, outputPath) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    return true;
  } catch (error) {
    console.error(`이미지 다운로드 오류 (${imageUrl}):`, error);
    return false;
  }
}

/**
 * Artwork 이미지들을 다운로드하고 로컬 경로로 변환
 */
async function downloadAndReplaceImages(artworkMap, outputDir = 'public/images') {
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const processedMap = {};

  for (const [projectName, images] of Object.entries(artworkMap)) {
    const processedImages = await Promise.all(
      images.map(async (imageData, idx) => {
        if (!imageData.url) {
          return imageData;
        }

        try {
          const filename = getImageFilename(imageData.url, projectName, imageData.index || idx);
          const outputPath = path.join(outputDir, filename);
          const relativePath = `/images/${filename}`;

          // 이미 파일이 존재하면 다운로드 건너뛰기
          if (fs.existsSync(outputPath)) {
            console.log(`⏩ 이미지 건너뜀 (이미 존재함): ${filename}`);
            return {
              ...imageData,
              url: relativePath,
              originalUrl: imageData.url
            };
          }

          // 이미지 다운로드
          const success = await downloadImage(imageData.url, outputPath);

          if (success) {
            console.log(`✅ 이미지 다운로드 완료: ${filename}`);
            return {
              ...imageData,
              url: relativePath, // 로컬 경로로 변경
              originalUrl: imageData.url // 원본 URL 보관 (필요시)
            };
          } else {
            console.warn(`⚠️ 이미지 다운로드 실패, 원본 URL 사용: ${imageData.url}`);
            return imageData; // 실패 시 원본 URL 유지
          }
        } catch (error) {
          console.error(`이미지 처리 오류:`, error);
          return imageData; // 오류 시 원본 URL 유지
        }
      })
    );
    processedMap[projectName] = processedImages;
  }

  return processedMap;
}

module.exports = { downloadAndReplaceImages };

