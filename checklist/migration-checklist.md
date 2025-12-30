# Next.js + Tailwind CSS 변환 체크리스트

## 진행 상황

### 1. Next.js 프로젝트 초기화 및 기본 설정 ✅
- [x] package.json 업데이트 (Next.js, React, Tailwind CSS 의존성 추가)
- [x] next.config.js 생성
- [x] .gitignore 생성

### 2. Tailwind CSS 설정 및 기본 스타일 변환 ✅
- [x] tailwind.config.js 생성
- [x] postcss.config.js 생성
- [x] styles/globals.css 생성 (Tailwind directives 포함)
- [x] 기존 style.css의 스타일을 Tailwind 클래스로 변환

### 3. 공통 컴포넌트 생성 ✅
- [x] Navigation 컴포넌트 생성
- [x] Layout 컴포넌트 생성
- [x] WorkContent 컴포넌트 생성

### 4. 페이지 변환 ✅
- [x] index.html → pages/index.js
- [x] work.html → pages/work.js (복잡한 로직 포함)
- [x] cv.html → pages/cv.js
- [x] contact.html → pages/contact.js
- [x] studio_edul.html → pages/studio-edul.js

### 5. JavaScript 로직 변환 ✅
- [x] notion-api.js → lib/notion-api.js (React hooks로 변환)
- [x] config.js → 환경 변수로 변환 (.env.local)
- [x] work.html의 복잡한 렌더링 로직을 React 컴포넌트로 변환

### 6. API 라우트 설정 ✅
- [x] api/notion.js → pages/api/notion.js (Next.js API route)
- [x] api/blocks.js → pages/api/blocks.js (Next.js API route)
- [x] CORS 설정 확인

### 7. 설정 파일 및 배포 ✅
- [x] vercel.json 확인 및 조정
- [x] README.md 업데이트
- [x] .gitignore 설정

### 8. 테스트 및 검증 ⏳
- [ ] 각 페이지 동작 확인
- [ ] Notion API 연동 확인
- [ ] 스타일 일관성 확인
- [ ] 반응형 디자인 확인

### 9. SSG 및 최적화 구현 ✅
- [x] getStaticProps를 사용하여 빌드 시 데이터 미리 로드
- [x] ISR (Incremental Static Regeneration) 구현 (revalidate: 60)
- [x] 컴포넌트 세분화 (ImageWithOverlay, ProjectItem, CVClassGroup, CVDataItem)
- [x] Next.js Image 컴포넌트로 이미지 최적화
- [x] 반응형 이미지 처리 (sizes 속성 사용)
- [x] 서버 사이드 Notion API 호출 함수 분리

## 주요 변경사항

### SSG 구현
- 모든 페이지에 `getStaticProps` 추가
- 빌드 시 Notion 데이터를 미리 가져와서 정적 HTML 생성
- ISR을 통해 60초마다 자동 재생성

### 컴포넌트 구조
```
components/
├── Layout.js           # 레이아웃
├── Navigation.js       # 네비게이션
├── WorkContent.js      # Work 페이지 콘텐츠
├── ProjectItem.js      # 프로젝트 아이템
├── ImageWithOverlay.js # 이미지 오버레이
├── CVClassGroup.js     # CV 클래스 그룹
└── CVDataItem.js       # CV 데이터 아이템
```

### 이미지 최적화
- Next.js Image 컴포넌트 사용
- 반응형 이미지 처리 (sizes 속성)
- 자동 이미지 최적화 및 WebP 변환
- Lazy loading 적용

## 다음 단계

1. `npm install` 실행하여 의존성 설치
2. `.env.local` 파일 생성 및 환경 변수 설정
3. `npm run build` 실행하여 빌드 테스트
4. `npm run dev` 실행하여 개발 서버 시작
5. 각 페이지 테스트 및 버그 수정
6. Vercel에 배포하여 프로덕션 환경에서 테스트

