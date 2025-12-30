// Notion API 헬퍼 함수 (Next.js 버전)

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '/api/notion';

async function fetchNotionDatabase(databaseName) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        database: databaseName
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend API error:', errorData);
      return [];
    }

    const data = await response.json();
    console.log(`✅ 데이터 로드 성공: ${data.results.length}개 항목`);
    return data.results;
  } catch (error) {
    console.error('Error fetching Notion database:', error);
    return [];
  }
}

/**
 * CV 데이터베이스에서 데이터 가져오기
 */
export async function getCVData() {
  return await fetchNotionDatabase('CV');
}

/**
 * WORK 데이터베이스에서 데이터 가져오기
 */
export async function getWORKData() {
  return await fetchNotionDatabase('WORK');
}

/**
 * ARTWORK 데이터베이스에서 데이터 가져오기
 */
export async function getARTWORKData() {
  return await fetchNotionDatabase('ARTWORK');
}

/**
 * 모든 데이터베이스 데이터를 미리 로드
 */
export async function preloadAllData() {
  try {
    const [cvData, workData, artworkData] = await Promise.all([
      getCVData(),
      getWORKData(),
      getARTWORKData()
    ]);
    
    console.log('✅ 모든 데이터 미리 로드 완료');
    return { CV: cvData, WORK: workData, ARTWORK: artworkData };
  } catch (error) {
    console.error('데이터 미리 로드 실패:', error);
    throw error;
  }
}

/**
 * 페이지의 블록 가져오기 (이미지 등)
 */
export async function getPageBlocks(pageId) {
  try {
    const response = await fetch('/api/blocks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageId: pageId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Blocks API error:', errorData);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching page blocks:', error);
    return [];
  }
}

/**
 * 모든 데이터베이스 데이터 가져오기
 */
export async function getAllNotionData() {
  try {
    const [cvData, workData, artworkData] = await Promise.all([
      getCVData(),
      getWORKData(),
      getARTWORKData()
    ]);
    
    return {
      CV: cvData,
      WORK: workData,
      ARTWORK: artworkData
    };
  } catch (error) {
    console.error('데이터 가져오기 실패:', error);
    throw error;
  }
}

