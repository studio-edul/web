# 백엔드 설정 가이드 (Vercel)

이 프로젝트는 Vercel Serverless Functions를 사용하여 Notion API를 안전하게 호출합니다.

## 1. Vercel 계정 생성 및 프로젝트 설정

1. [Vercel](https://vercel.com)에 가입/로그인
2. GitHub 저장소 연결
3. 프로젝트 Import

## 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

### Settings → Environment Variables

- `NOTION_API_KEY`: `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`
- `NOTION_DB_CV`: `2d72b9a3-7076-8037-b948-000bae70f693`
- `NOTION_DB_WORK`: `2d72b9a3-7076-80c9-bc59-000bc308e698`
- `NOTION_DB_ARTWORK`: `2d72b9a3-7076-80e1-bb09-000b8d10ae55`

## 3. 로컬 개발

### Vercel CLI 설치
```bash
npm install -g vercel
```

### 로컬 서버 실행
```bash
vercel dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

### config.js 수정
로컬 개발 시 `config.js`의 `API_ENDPOINT`를 다음과 같이 설정:
```javascript
API_ENDPOINT: 'http://localhost:3000/api/notion'
```

## 4. 배포 후 설정

Vercel 배포 후:

1. Vercel 대시보드에서 배포 URL 확인 (예: `https://your-project.vercel.app`)
2. `config.js`의 `API_ENDPOINT`를 배포 URL로 변경:
```javascript
API_ENDPOINT: 'https://your-project.vercel.app/api/notion'
```

## 5. 파일 구조

```
Portfolio/
├── api/
│   └── notion.js          # Vercel Serverless Function
├── config.js              # 프론트엔드 설정
├── notion-api.js          # 프론트엔드 API 호출 함수
├── package.json           # Node.js 프로젝트 설정
├── vercel.json            # Vercel 설정
└── ...
```

## 6. 테스트

브라우저 콘솔에서 다음을 실행하여 테스트:
```javascript
getCVData().then(data => console.log('CV Data:', data));
getWORKData().then(data => console.log('WORK Data:', data));
getARTWORKData().then(data => console.log('ARTWORK Data:', data));
```

## 주의사항

- `config.js`는 `.gitignore`에 포함되어 있어 GitHub에 업로드되지 않습니다.
- API 키와 데이터베이스 ID는 환경 변수로 관리되어 안전합니다.
- 로컬 개발 시에는 `vercel dev`를 실행해야 백엔드 API가 작동합니다.

