// Notion API 헬퍼 함수 (백엔드 방식)
async function fetchNotionDatabase(databaseName) {
    try {
        const response = await fetch(NOTION_CONFIG.API_ENDPOINT, {
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
async function getCVData() {
    return await fetchNotionDatabase(NOTION_CONFIG.DATABASES.CV);
}

/**
 * WORK 데이터베이스에서 데이터 가져오기
 */
async function getWORKData() {
    return await fetchNotionDatabase(NOTION_CONFIG.DATABASES.WORK);
}

/**
 * ARTWORK 데이터베이스에서 데이터 가져오기
 */
async function getARTWORKData() {
    return await fetchNotionDatabase(NOTION_CONFIG.DATABASES.ARTWORK);
}

/**
 * 모든 데이터베이스 데이터 가져오기
 */
async function getAllNotionData() {
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

