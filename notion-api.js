// Notion API 헬퍼 함수 (script.js 방식)
async function fetchNotionDatabase(databaseId) {
    try {
        // 데이터베이스 ID 검증 및 정리
        // 하이픈 제거 (Notion API는 하이픈 없는 형식 사용)
        let cleanId = databaseId.trim();
        // ?v= 뒷부분 제거 (뷰 ID 제거)
        if (cleanId.includes('?')) {
            cleanId = cleanId.split('?')[0];
        }
        // 하이픈 제거
        cleanId = cleanId.replace(/-/g, '');
        
        // 32자리인지 확인
        if (cleanId.length !== 32) {
            console.error(`데이터베이스 ID 길이 오류: ${cleanId.length}자리 (32자리여야 함)`);
            return [];
        }
        
        console.log('사용하는 데이터베이스 ID:', cleanId);
        const notionUrl = `https://api.notion.com/v1/databases/${cleanId}/query`;
        
        // 여러 CORS 프록시를 순차적으로 시도
        const proxies = NOTION_CONFIG.CORS_PROXIES || ['https://corsproxy.io/?'];
        let lastError = null;
        
        for (const proxy of proxies) {
            try {
                const proxyUrl = `${proxy}${encodeURIComponent(notionUrl)}`;
                console.log(`시도 중: ${proxy}`);
                
                const response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${NOTION_CONFIG.API_KEY}`,
                        'Notion-Version': '2022-06-28',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sorts: []
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ 데이터 로드 성공: ${data.results.length}개 항목`);
                    return data.results;
                } else {
                    const errorText = await response.text();
                    console.warn(`프록시 실패 (${proxy}):`, response.status, errorText);
                    lastError = new Error(`프록시 실패: ${response.status}`);
                }
            } catch (error) {
                console.warn(`프록시 오류 (${proxy}):`, error.message);
                lastError = error;
                continue;
            }
        }
        
        // 모든 프록시 실패
        console.error('모든 CORS 프록시 실패');
        return [];
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

