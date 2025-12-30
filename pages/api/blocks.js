// Next.js API Route - Notion Blocks API 프록시
export default async function handler(req, res) {
  // CORS 헤더 설정
  const origin = req.headers.origin;
  
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId } = req.body;

  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required' });
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;

  if (!NOTION_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // 페이지 ID에서 하이픈 제거
  const cleanedPageId = pageId.trim().replace(/-/g, '');

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
      return res.status(response.status).json({ 
        error: 'Notion Blocks API Error',
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

