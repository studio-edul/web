// 서버 사이드에서 사용하는 Notion API 헬퍼 함수

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASES = {
  CV: process.env.NOTION_DB_CV,
  WORK: process.env.NOTION_DB_WORK,
  ARTWORK: process.env.NOTION_DB_ARTWORK
};

// 개발 모드용 캐시 (메모리 기반)
const isDev = process.env.NODE_ENV === 'development';
const CACHE_TTL = 5 * 60 * 1000; // 5분
const cache = {
  CV: { data: null, timestamp: null },
  WORK: { data: null, timestamp: null },
  ARTWORK: { data: null, timestamp: null },
  blocks: new Map() // 페이지별 블록 캐시
};

function getCachedData(key) {
  if (!isDev) return null;

  const cached = cache[key];
  if (!cached || !cached.data) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache[key] = { data: null, timestamp: null };
    return null;
  }


  return cached.data;
}

function setCachedData(key, data) {
  if (!isDev) return;
  cache[key] = { data, timestamp: Date.now() };
}

function getCachedBlocks(pageId) {
  if (!isDev) return null;

  const cached = cache.blocks.get(pageId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.blocks.delete(pageId);
    return null;
  }


  return cached.data;
}

function setCachedBlocks(pageId, data) {
  if (!isDev) return;
  cache.blocks.set(pageId, { data, timestamp: Date.now() });
}

/**
 * Notion 데이터베이스를 직접 호출하여 데이터를 가져옵니다.
 *
 * @param {string} databaseName - 'CV', 'WORK', 'ARTWORK' 중 하나
 * @returns {Promise<Array>} 데이터베이스 항목 배열
 * @throws {Error} API 키 누락 또는 요청 실패 시
 */

async function fetchNotionDatabaseDirect(databaseName) {
  // 캐시 확인
  const cached = getCachedData(databaseName);
  if (cached) {
    return cached;
  }

  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.');
  }

  const databaseId = DATABASES[databaseName];
  if (!databaseId) {
    throw new Error(`데이터베이스 ${databaseName}의 ID가 설정되지 않았습니다.`);
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
        page_size: 100,
        sorts: []
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API Error:', errorData);
      throw new Error(`Notion API 오류: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results;

    // 캐시에 저장
    setCachedData(databaseName, results);

    return results;
  } catch (error) {
    console.error('Error fetching Notion database:', error);
    throw error;
  }
}

async function fetchPageBlocksDirect(pageId) {
  const cleanedPageId = pageId.trim().replace(/-/g, '');

  // 캐시 확인
  const cached = getCachedBlocks(cleanedPageId);
  if (cached) {
    return cached;
  }

  if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.');
  }

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
      console.error('Notion Blocks API Error:', errorData);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];

    // 캐시에 저장
    setCachedBlocks(cleanedPageId, results);

    return results;
  } catch (error) {
    console.error('Error fetching page blocks:', error);
    return [];
  }
}

/**
 * CV 데이터베이스에서 데이터 가져오기 (서버 사이드)
 */
export async function getCVDataServer() {
  return await fetchNotionDatabaseDirect('CV');
}

/**
 * WORK 데이터베이스에서 데이터 가져오기 (서버 사이드)
 */
export async function getWORKDataServer() {
  return await fetchNotionDatabaseDirect('WORK');
}

/**
 * ARTWORK 데이터베이스에서 데이터 가져오기 (서버 사이드)
 */
export async function getARTWORKDataServer() {
  return await fetchNotionDatabaseDirect('ARTWORK');
}

/**
 * 페이지의 블록 가져오기 (서버 사이드)
 */
export async function getPageBlocksServer(pageId) {
  return await fetchPageBlocksDirect(pageId);
}

/**
 * 모든 데이터베이스 데이터 가져오기 (서버 사이드)
 */
export async function getAllNotionDataServer() {
  try {
    const [cvData, workData, artworkData] = await Promise.all([
      getCVDataServer(),
      getWORKDataServer(),
      getARTWORKDataServer()
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

