# 파일 정리 요약

## 삭제된 파일들

### HTML 파일들 (Next.js 페이지로 대체됨)
- ✅ `index.html` → `pages/index.js`
- ✅ `work.html` → `pages/work.js`
- ✅ `cv.html` → `pages/cv.js`
- ✅ `contact.html` → `pages/contact.js`
- ✅ `studio_edul.html` → `pages/studio-edul.js`
- ✅ `test-notion.html` (테스트 파일)

### CSS 파일
- ✅ `style.css` → `styles/globals.css` (Tailwind CSS로 변환)

### JavaScript 파일들
- ✅ `notion-api-backend.js` (사용 안 함)
- ✅ `api/blocks.js` → `pages/api/blocks.js`
- ✅ `api/notion.js` → `pages/api/notion.js`

### 설정 파일
- ✅ `config.js` → 환경 변수 (`.env.local`)로 대체

## 유지된 파일들

### 클라이언트 사이드용 (필요시 사용 가능)
- `lib/notion-api.js` - 클라이언트 사이드에서 API 호출용 (현재는 사용 안 함, 하지만 나중에 필요할 수 있음)

### 서버 사이드용
- `lib/notion-api-server.js` - getStaticProps에서 사용
- `lib/notion-utils.js` - 데이터 파싱 유틸리티
- `lib/work-processor.js` - Work 데이터 처리
- `lib/cv-processor.js` - CV 데이터 처리
- `lib/artwork-processor.js` - Artwork 데이터 처리

### 설정 파일
- `config.example.js` - 예시 파일 (참고용으로 유지)

## 빈 폴더
- `api/` - 빈 폴더 (삭제해도 무방하지만 자동으로 정리됨)

