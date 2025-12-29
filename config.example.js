// 설정 파일 예시
// 이 파일을 복사해서 config.js로 만들고 값을 입력하세요.
// config.js는 .gitignore에 포함되어 있어 GitHub에 업로드되지 않습니다.

const NOTION_CONFIG = {
    // 백엔드 API 엔드포인트
    // Vercel 배포 후 여기에 Vercel URL 입력
    // 예: 'https://your-project.vercel.app/api/notion'
    API_ENDPOINT: 'https://your-project.vercel.app/api/notion',
    
    // 개발용 (로컬 테스트 시)
    // 로컬에서 Vercel 개발 서버 실행 시: 'http://localhost:3000/api/notion'
    // 또는 CORS 프록시 사용 시 아래 주석 해제
    /*
    API_KEY: 'YOUR_NOTION_API_KEY_HERE',
    DATABASES: {
        CV: 'YOUR_CV_DATABASE_ID_HERE',
        WORK: 'YOUR_WORK_DATABASE_ID_HERE',
        ARTWORK: 'YOUR_ARTWORK_DATABASE_ID_HERE'
    },
    CORS_PROXIES: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
    ]
    */
};

