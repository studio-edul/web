# 배포 가이드 - GitHub Pages + Vercel

## 개요

이 프로젝트는 GitHub Pages로 프론트엔드를 배포하고, Vercel로 백엔드 API를 배포합니다.

## 보안 구조

```
[브라우저] → [GitHub Pages] → [Vercel API] → [Notion API]
              (프론트엔드)      (백엔드)        (데이터)
              API 키 없음      API 키 보호됨
```

## 배포 단계

### 1단계: Vercel에 백엔드 배포

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 배포**
   - "New Project" 클릭
   - GitHub 저장소 선택
   - Root Directory: 프로젝트 루트 그대로
   - Framework Preset: "Other"
   - "Deploy" 클릭

3. **환경 변수 설정**
   - 배포 후 프로젝트 설정으로 이동
   - Settings → Environment Variables
   - 다음 변수 추가:
     ```
     NOTION_API_KEY = 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
     NOTION_DB_CV = 2d72b9a3-7076-8037-b948-000bae70f693
     NOTION_DB_WORK = 2d72b9a3-7076-80c9-bc59-000bc308e698
     NOTION_DB_ARTWORK = 2d72b9a3-7076-80e1-bb09-000b8d10ae55
     ```
   - "Save" 클릭
   - "Redeploy" 클릭 (환경 변수 적용)

4. **Vercel URL 확인**
   - 배포 완료 후 Vercel이 제공하는 URL 확인
   - 예: `https://your-project.vercel.app`
   - API 엔드포인트: `https://your-project.vercel.app/api/notion`

### 2단계: 프론트엔드 설정 수정

1. **config.js 수정**
   ```javascript
   const NOTION_CONFIG = {
       API_ENDPOINT: 'https://your-project.vercel.app/api/notion'
   };
   ```

2. **notion-api.js 교체**
   - `notion-api-backend.js`의 내용을 `notion-api.js`로 복사
   - 또는 `notion-api-backend.js`를 `notion-api.js`로 이름 변경

### 3단계: GitHub Pages 배포

1. **GitHub 저장소에 푸시**
   ```bash
   git add .
   git commit -m "배포 준비 완료"
   git push
   ```

2. **GitHub Pages 활성화**
   - GitHub 저장소 → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` (또는 `master`)
   - Folder: `/ (root)`
   - "Save" 클릭

3. **GitHub Pages URL 확인**
   - 예: `https://your-username.github.io/Portfolio/`

### 4단계: CORS 설정 업데이트

`api/notion.js` 파일에서 GitHub Pages URL을 허용 목록에 추가:

```javascript
const allowedOrigins = [
  'https://your-username.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
```

그리고 Vercel에서 다시 배포합니다.

## 로컬 개발

### 방법 1: Vercel CLI 사용 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 로컬에서 Vercel 함수 실행
vercel dev

# 브라우저에서 http://localhost:3000 접속
# API 엔드포인트: http://localhost:3000/api/notion
```

`config.js`에서:
```javascript
API_ENDPOINT: 'http://localhost:3000/api/notion'
```

### 방법 2: 개발용 CORS 프록시 사용

로컬 개발 시에는 기존 `notion-api.js`를 사용하고, `config.js`에 CORS 프록시 설정을 유지할 수 있습니다.

## 파일 구조

```
Portfolio/
├── api/
│   └── notion.js          # Vercel 백엔드 (API 키 보호됨)
├── index.html
├── work.html
├── cv.html
├── contact.html
├── studio_edul.html
├── style.css
├── config.js              # 프론트엔드 설정 (API 키 없음)
├── config.example.js       # 설정 예시 파일
├── notion-api.js           # 프론트엔드 API 호출 (백엔드 사용)
├── notion-api-backend.js   # 백엔드 버전 (참고용)
├── vercel.json             # Vercel 설정
├── .gitignore              # 민감 정보 제외
└── README_DEPLOYMENT.md    # 이 파일
```

## 보안 체크리스트

- [ ] `config.js`에 API 키가 없음
- [ ] `config.js`가 `.gitignore`에 포함됨
- [ ] Vercel 환경 변수에 API 키 설정됨
- [ ] GitHub Pages URL이 CORS 허용 목록에 추가됨
- [ ] `test-notion.html`이 `.gitignore`에 포함됨

## 문제 해결

### CORS 에러 발생 시
- `api/notion.js`의 `allowedOrigins`에 GitHub Pages URL 추가 확인
- Vercel 재배포 필요

### 403 에러 발생 시
- Vercel 환경 변수가 올바르게 설정되었는지 확인
- Notion 데이터베이스에 Integration이 연결되었는지 확인

### API 엔드포인트를 찾을 수 없음
- Vercel 배포 URL 확인
- `config.js`의 `API_ENDPOINT`가 올바른지 확인

