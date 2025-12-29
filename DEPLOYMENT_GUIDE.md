# GitHub Pages + Vercel 백엔드 배포 가이드

## 보안 문제

GitHub Pages는 정적 사이트 호스팅이므로:
- 모든 프론트엔드 코드가 공개됨
- API 키를 프론트엔드에 넣으면 GitHub에 노출됨
- 브라우저에서 실행되므로 소스 코드가 모두 보임

**따라서 백엔드 프록시가 필수입니다.**

## 해결 방법: Vercel Serverless Functions 사용

### 1. 프로젝트 구조

```
Portfolio/
├── index.html
├── work.html
├── cv.html
├── contact.html
├── studio_edul.html
├── style.css
├── config.js (프론트엔드용 - API 키 제거)
├── notion-api.js (프론트엔드용 - 백엔드 호출로 변경)
├── api/ (Vercel 백엔드)
│   └── notion.js (Serverless Function)
└── vercel.json (Vercel 설정)
```

### 2. Vercel 설정

#### vercel.json 생성
```json
{
  "functions": {
    "api/notion.js": {
      "memory": 1024
    }
  }
}
```

#### api/notion.js 생성 (백엔드)
```javascript
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { database, action } = req.body;

  // 환경 변수에서 API 키 가져오기
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const DATABASES = {
    CV: process.env.NOTION_DB_CV,
    WORK: process.env.NOTION_DB_WORK,
    ARTWORK: process.env.NOTION_DB_ARTWORK
  };

  if (!NOTION_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const databaseId = DATABASES[database];
  if (!databaseId) {
    return res.status(400).json({ error: 'Invalid database name' });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### 3. 환경 변수 설정 (Vercel)

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가:
   - `NOTION_API_KEY`: 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
   - `NOTION_DB_CV`: 2d72b9a3-7076-8037-b948-000bae70f693
   - `NOTION_DB_WORK`: 2d72b9a3-7076-80c9-bc59-000bc308e698
   - `NOTION_DB_ARTWORK`: 2d72b9a3-7076-80e1-bb09-000b8d10ae55

### 4. 프론트엔드 코드 수정

#### config.js 수정
```javascript
const NOTION_CONFIG = {
    // 백엔드 API 엔드포인트 (Vercel 배포 후 URL로 변경)
    API_ENDPOINT: 'https://your-project.vercel.app/api/notion'
};
```

#### notion-api.js 수정
- CORS 프록시 제거
- 백엔드 API 호출로 변경

### 5. 배포 순서

1. **Vercel에 백엔드 배포**
   - GitHub 저장소 연결
   - 환경 변수 설정
   - 배포

2. **GitHub Pages에 프론트엔드 배포**
   - config.js에서 API_ENDPOINT를 Vercel URL로 설정
   - GitHub Pages 활성화

## 대안: Netlify Functions

Netlify도 비슷한 방식으로 사용 가능:
- `netlify/functions/notion.js` 생성
- 환경 변수는 Netlify 대시보드에서 설정

## 대안: Railway

Railway도 무료 티어 제공:
- Node.js 서버 구축
- 환경 변수 설정
- API 엔드포인트 생성

## .gitignore 설정

다음 파일들을 .gitignore에 추가:
```
config.js (API 키가 포함된 경우)
.env
.env.local
```

## 보안 체크리스트

- [ ] API 키가 프론트엔드 코드에 없음
- [ ] 환경 변수로 관리됨
- [ ] 백엔드에서만 API 키 사용
- [ ] CORS 설정 적절히 구성됨
- [ ] .gitignore에 민감 정보 제외됨

