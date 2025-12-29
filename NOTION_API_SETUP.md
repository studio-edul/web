# Notion API 설정 가이드

## 1. Notion API 키 발급

1. [Notion Integrations 페이지](https://www.notion.so/my-integrations)에 접속
2. "New integration" 클릭
3. 이름을 입력하고 "Submit" 클릭
4. 생성된 Integration의 "Internal Integration Token"을 복사
5. `config.js` 파일의 `API_KEY`에 붙여넣기

## 2. 데이터베이스 ID 확인

각 Notion 데이터베이스의 ID를 확인하는 방법:

1. Notion에서 해당 데이터베이스 페이지를 열기
2. 페이지 URL을 확인 (예: `https://www.notion.so/YOUR_WORKSPACE/32자리문자열?v=...`)
3. URL에서 32자리 문자열 부분이 데이터베이스 ID입니다
4. 하이픈(-)을 제거한 32자리 문자열을 `config.js`의 해당 데이터베이스 ID에 입력

예시:
- URL: `https://www.notion.so/abc123def456...`
- 데이터베이스 ID: `abc123def456...` (32자리)

## 3. 데이터베이스에 Integration 연결

각 데이터베이스에 생성한 Integration을 연결해야 합니다:

1. Notion에서 각 데이터베이스 페이지를 열기
2. 우측 상단의 "..." 메뉴 클릭
3. "Connections" 또는 "연결" 선택
4. 생성한 Integration 선택

## 4. CORS 프록시 설정

⚠️ **중요**: Notion API는 브라우저에서 직접 호출할 수 없습니다 (CORS 정책).

현재는 공개 CORS 프록시를 사용하도록 설정되어 있지만, 다음과 같은 옵션이 있습니다:

### 옵션 1: 공개 CORS 프록시 사용 (개발용)
- `config.js`의 `CORS_PROXY`를 사용
- 참고: cors-anywhere.herokuapp.com은 더 이상 공개적으로 사용 불가능할 수 있습니다
- 다른 공개 프록시 서비스를 사용하거나 자체 프록시 서버를 구축해야 할 수 있습니다

### 옵션 2: 백엔드 서버 사용 (권장, 추후 적용)
- 무료 백엔드 서비스 (예: Vercel, Netlify Functions, Railway 등) 사용
- `notion-api.js`의 `fetchNotionAPI` 함수를 백엔드 엔드포인트로 변경

## 5. 사용 방법

HTML 파일에서 다음과 같이 사용:

```html
<script src="config.js"></script>
<script src="notion-api.js"></script>
<script>
    // 모든 데이터 가져오기
    getAllNotionData().then(data => {
        console.log('CV 데이터:', data.CV);
        console.log('WORK 데이터:', data.WORK);
        console.log('ARTWORK 데이터:', data.ARTWORK);
    });

    // 개별 데이터 가져오기
    getCVData().then(data => console.log(data));
    getWORKData().then(data => console.log(data));
    getARTWORKData().then(data => console.log(data));
</script>
```

## 6. 보안 주의사항

⚠️ **경고**: `config.js`에 API 키를 직접 저장하는 것은 보안상 위험합니다.

- 현재는 개발용으로만 사용
- 실제 배포 시에는 반드시 백엔드 서버를 통해 API 키를 관리해야 합니다
- GitHub 등에 `config.js` 파일을 커밋하지 마세요 (`.gitignore`에 추가 권장)

