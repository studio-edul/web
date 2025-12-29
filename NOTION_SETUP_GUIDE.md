# Notion API 403 에러 해결 가이드

## 403 Forbidden 에러의 주요 원인

1. **데이터베이스에 Integration이 연결되지 않음** (가장 흔한 원인)
2. **데이터베이스 ID가 잘못 입력됨**
3. **API 키 권한 문제**

## 해결 방법

### 1단계: 데이터베이스 ID 확인 및 입력

각 데이터베이스의 ID를 확인하는 방법:

1. Notion에서 **CV**, **WORK**, **ARTWORK** 데이터베이스 페이지를 각각 열기
2. 페이지 URL을 확인
   - 예: `https://www.notion.so/YOUR_WORKSPACE/abc123def456ghi789jkl012mno345pq?v=...`
   - 또는: `https://YOUR_WORKSPACE.notion.site/abc123def456ghi789jkl012mno345pq`
3. URL에서 **32자리 문자열** 부분이 데이터베이스 ID입니다
   - 하이픈(-)을 제거한 32자리 문자열
   - 예: `abc123def456ghi789jkl012mno345pq` → `abc123def456ghi789jkl012mno345pq`
4. `config.js` 파일의 `DATABASES` 객체에 각각 입력

### 2단계: 각 데이터베이스에 Integration 연결 (중요!)

**이 단계를 반드시 수행해야 합니다!**

각 데이터베이스(CV, WORK, ARTWORK)에 대해:

1. Notion에서 해당 데이터베이스 페이지 열기
2. 우측 상단의 **"..."** (점 3개) 메뉴 클릭
3. **"Connections"** 또는 **"연결"** 선택
4. 생성한 Integration 이름을 찾아서 **체크박스 선택**
5. 연결 완료

⚠️ **주의**: 각 데이터베이스마다 개별적으로 연결해야 합니다!

### 3단계: Integration 권한 확인

1. [Notion Integrations 페이지](https://www.notion.so/my-integrations) 접속
2. 생성한 Integration 클릭
3. "Capabilities" 섹션에서 필요한 권한이 활성화되어 있는지 확인
   - 일반적으로 "Read content" 권한이 필요합니다

## 데이터베이스 ID 형식

Notion 데이터베이스 ID는 다음과 같은 형식입니다:
- 32자리 문자열 (하이픈 포함 또는 제외)
- 예: `abc123def456ghi789jkl012mno345pq`
- 또는: `abc123de-f456-ghi7-89jk-l012mno345pq` (하이픈 포함)

**중요**: 하이픈이 포함되어 있어도 그대로 사용하거나, 제거해도 됩니다. Notion API는 둘 다 인식합니다.

## 확인 체크리스트

- [ ] `config.js`에 API 키가 올바르게 입력되어 있음
- [ ] `config.js`에 CV 데이터베이스 ID가 입력되어 있음
- [ ] `config.js`에 WORK 데이터베이스 ID가 입력되어 있음
- [ ] `config.js`에 ARTWORK 데이터베이스 ID가 입력되어 있음
- [ ] CV 데이터베이스에 Integration이 연결되어 있음
- [ ] WORK 데이터베이스에 Integration이 연결되어 있음
- [ ] ARTWORK 데이터베이스에 Integration이 연결되어 있음

## 테스트

모든 설정을 완료한 후 `test-notion.html` 파일을 브라우저에서 열어 테스트하세요.

