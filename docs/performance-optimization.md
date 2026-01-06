# Next.js 성능 최적화 가이드

## 현재 상황 분석

### 느린 로딩의 원인
1. **SSG (Static Site Generation)**: 빌드 시 HTML 생성
2. **fallback: 'blocking'**: 첫 방문 시 서버에서 HTML 생성 (느림)
3. **Notion API 호출**: 여러 API 호출이 순차적으로 발생
4. **캐싱 부재**: 프로덕션에서 캐싱 미사용

## 최적화 방안

### 1. fallback 전략 변경 (즉시 적용 가능)

**현재**: `fallback: 'blocking'` - 서버에서 HTML 생성 후 반환
**개선**: `fallback: true` - 즉시 로딩 상태 표시, 백그라운드에서 생성

```javascript
// pages/exhibition/[slug].js
export async function getStaticPaths() {
  return {
    paths: [], // 빈 배열로 시작
    fallback: true // 즉시 로딩 상태 표시
  };
}

// 컴포넌트에서 로딩 상태 처리
export default function Exhibition({ exhibition }) {
  const router = useRouter();
  
  if (router.isFallback) {
    return <div>Loading...</div>;
  }
  
  // ... 나머지 코드
}
```

**장점**: 
- 첫 방문 시 즉시 응답 (로딩 상태 표시)
- 사용자 경험 개선
- 서버 부하 감소

### 2. 프로덕션 캐싱 추가

```javascript
// lib/notion-api-server.js
// 프로덕션에서도 캐싱 사용 (Redis 또는 파일 시스템)
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 프로덕션 환경에서도 캐싱 활성화
function getCachedData(key) {
  const cached = cache[key];
  if (!cached || !cached.data) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    return null;
  }
  
  return cached.data;
}
```

### 3. 데이터 페칭 병렬화

```javascript
// 여러 API 호출을 병렬로 처리
const [exhibition, artworks, relatedTexts] = await Promise.all([
  getExhibitionBySlug(slug),
  getArtworksByExhibition(exhibitionName),
  extractRelatedText(blocks)
]);
```

### 4. 이미지 최적화 강화

```javascript
// next.config.js
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'], // 최신 포맷 사용
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 압축 강화
  compress: true,
}
```

### 5. 프리렌더링 전략 변경

**옵션 A: On-Demand ISR**
```javascript
// 특정 경로만 프리렌더링
export async function getStaticPaths() {
  // 인기 있는 전시만 미리 생성
  const popularSlugs = await getPopularExhibitionSlugs();
  
  return {
    paths: popularSlugs.map(slug => ({ params: { slug } })),
    fallback: true
  };
}
```

**옵션 B: 빌드 시 모든 페이지 생성**
```javascript
// 모든 페이지를 빌드 시 생성 (느린 빌드, 빠른 로딩)
export async function getStaticPaths() {
  const slugs = await getAllExhibitionSlugs();
  
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: false // 모든 페이지 미리 생성
  };
}
```

## 프레임워크 변경 고려사항

### Next.js의 장점
- ✅ SEO 최적화 (SSG/SSR)
- ✅ 자동 코드 스플리팅
- ✅ 이미지 최적화 내장
- ✅ Vercel 배포 최적화
- ✅ 풍부한 생태계

### 다른 프레임워크 옵션

#### 1. **Remix** (React 기반)
- ✅ 빠른 초기 로딩
- ✅ 서버 컴포넌트 지원
- ❌ SEO는 SSR 필요
- ❌ 생태계가 Next.js보다 작음

#### 2. **Astro** (멀티 프레임워크)
- ✅ 매우 빠른 로딩 (최소한의 JS)
- ✅ SEO 최적화
- ❌ React 컴포넌트 사용 시 제한적
- ❌ 동적 기능 제한

#### 3. **SvelteKit**
- ✅ 빠른 성능
- ✅ 작은 번들 크기
- ❌ React 코드 재작성 필요
- ❌ 생태계가 작음

#### 4. **Gatsby** (Static Site Generator)
- ✅ 매우 빠른 로딩
- ✅ 강력한 플러그인 시스템
- ❌ 빌드 시간이 길 수 있음
- ❌ 동적 콘텐츠 처리 복잡

## 권장 사항

### 단기 (즉시 적용 가능)
1. ✅ `fallback: true`로 변경
2. ✅ 프로덕션 캐싱 추가
3. ✅ 데이터 페칭 병렬화
4. ✅ 이미지 최적화 강화

### 중기 (1-2주)
1. Redis 캐싱 도입
2. CDN 사용 (Vercel 자동 제공)
3. 프리렌더링 전략 최적화

### 장기 (프레임워크 변경 고려)
- 위 최적화 후에도 만족스럽지 않으면 프레임워크 변경 검토
- **Astro**가 가장 빠른 로딩을 제공하지만, React 컴포넌트 사용 시 제한적
- **Remix**는 Next.js와 유사하지만 더 빠른 초기 로딩

## 결론

**프레임워크를 바꾸기 전에** 위 최적화 방법들을 먼저 시도해보세요. 특히 `fallback: true` 변경만으로도 사용자 경험이 크게 개선될 수 있습니다.

Next.js는 이미 잘 최적화된 프레임워크이며, 설정만 조정하면 충분히 빠른 성능을 얻을 수 있습니다.

