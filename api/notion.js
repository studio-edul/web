// Vercel Serverless Function - Notion API 프록시
// 이 파일은 백엔드에서 실행되므로 API 키가 안전하게 보호됩니다.

export default async function handler(req, res) {
  // CORS 헤더 설정 (모든 로컬 개발 환경 허용)
  const origin = req.headers.origin;
  
  // 로컬 개발 환경 허용
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('file://'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // 프로덕션 도메인 (배포 후 설정)
  // const allowedOrigins = ['https://your-username.github.io'];
  // if (allowedOrigins.includes(origin)) {
  //   res.setHeader('Access-Control-Allow-Origin', origin);
  // }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { database } = req.body;

  // 환경 변수에서 API 키와 데이터베이스 ID 가져오기
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const DATABASES = {
    CV: process.env.NOTION_DB_CV,
    WORK: process.env.NOTION_DB_WORK,
    ARTWORK: process.env.NOTION_DB_ARTWORK
  };

  // API 키 확인
  if (!NOTION_API_KEY) {
    console.error('NOTION_API_KEY 환경 변수가 설정되지 않았습니다.');
    return res.status(500).json({ error: 'API key not configured' });
  }

  // 데이터베이스 이름 확인
  if (!database || !DATABASES[database]) {
    return res.status(400).json({ error: 'Invalid database name. Use: CV, WORK, or ARTWORK' });
  }

  const databaseId = DATABASES[database];
  
  // 데이터베이스 ID에서 하이픈 제거
  const formattedDatabaseId = databaseId.replace(/-/g, '');

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${formattedDatabaseId}/query`, {
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
      return res.status(response.status).json({ 
        error: 'Notion API Error',
        details: errorData 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

