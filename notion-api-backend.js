// Notion API 호출 함수들 (백엔드 프록시 사용 버전)
// 배포 시 이 파일을 notion-api.js로 사용하세요.

/**
 * 백엔드 API를 통한 Notion 데이터 가져오기
 * @param {string} database - 데이터베이스 이름 (CV, WORK, ARTWORK)
 */
async function fetchNotionDataFromBackend(database) {
    const apiEndpoint = NOTION_CONFIG.API_ENDPOINT;
    
    if (!apiEndpoint) {
        throw new Error('API_ENDPOINT가 설정되지 않았습니다. config.js에서 API_ENDPOINT를 설정해주세요.');
    }
    
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                database: database
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`백엔드 API 오류: ${response.status} ${response.statusText}\n\n상세 정보:\n${JSON.stringify(errorData, null, 2)}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('백엔드 API 호출 오류:', error);
        throw error;
    }
}

/**
 * CV 데이터베이스에서 데이터 가져오기
 */
async function getCVData() {
    return await fetchNotionDataFromBackend('CV');
}

/**
 * WORK 데이터베이스에서 데이터 가져오기
 */
async function getWORKData() {
    return await fetchNotionDataFromBackend('WORK');
}

/**
 * ARTWORK 데이터베이스에서 데이터 가져오기
 */
async function getARTWORKData() {
    return await fetchNotionDataFromBackend('ARTWORK');
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

