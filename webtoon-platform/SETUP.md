# 웹툰 플랫폼 설정 가이드 📋

## 🔧 사전 요구사항

이 프로젝트가 제대로 작동하려면 다음이 필요합니다:

### 필수 설치
- ✅ **Node.js** (v18 이상) - [다운로드](https://nodejs.org)
- ✅ **npm** (보통 Node.js와 함께 설치됨)

### 선택사항 (나중에 필요)
- PHP (7.4+ 또는 8.0+) - 백엔드 서버용
- MySQL/PostgreSQL/MongoDB - 데이터베이스용

## 🚀 설치 및 실행

### 1단계: 프로젝트 설치

```bash
cd c:\dev\webtoon-platform
npm install
```

이 명령어는 `package.json`에 정의된 모든 의존성을 설치합니다.

### 2단계: 환경 변수 설정 (선택사항)

프로젝트 루트에 `.env.local` 파일을 생성하세요:

```env
# API 기본 URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 향후 추가될 환경 변수들
# NEXT_PUBLIC_PHP_API_URL=http://localhost:8000/api
# NEXT_PUBLIC_DATABASE_URL=mysql://user:password@localhost:3306/webtoon
```

### 3단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 다음 주소를 방문하세요:
- 🌐 **메인 페이지**: http://localhost:3000
- 📱 **웹툰 목록**: http://localhost:3000/webtoons
- 📖 **API 테스트**: http://localhost:3000/api/webtoons

## 📁 주요 파일 설명

### 프론트엔드 파일들
- `app/page.tsx` - 홈페이지 (웹툰 목록)
- `app/webtoons/page.tsx` - 웹툰 전체 목록
- `app/webtoons/[id]/page.tsx` - 웹툰 상세 정보
- `app/episodes/[id]/page.tsx` - 에피소드 뷰어

### 백엔드 API 라우트
- `app/api/webtoons/route.ts` - 웹툰 목록 & 생성 API
- `app/api/webtoons/[id]/route.ts` - 특정 웹툰 API
- `app/api/episodes/route.ts` - 에피소드 목록 & 생성 API
- `app/api/episodes/[id]/route.ts` - 특정 에피소드 API

### 상태 관리 및 유틸리티
- `lib/types.ts` - TypeScript 타입 정의
- `lib/store.ts` - Zustand 상태 관리 스토어
- `lib/api.ts` - API 함수들 (axios 래퍼)

### 컴포넌트
- `components/layout/Header.tsx` - 헤더 네비게이션
- `components/layout/Footer.tsx` - 푸터
- `components/webtoon/WebtoonCard.tsx` - 웹툰 카드 컴포넌트

## 🧪 API 테스트

### cURL을 사용한 테스트

**1. 모든 웹툰 조회**
```bash
curl http://localhost:3000/api/webtoons
```

**2. 특정 웹툰 조회**
```bash
curl http://localhost:3000/api/webtoons/1
```

**3. 특정 웹툰의 에피소드 조회**
```bash
curl "http://localhost:3000/api/episodes?webtoonId=1"
```

### Postman 사용
1. Postman 열기
2. 새 요청 생성
3. URL: `http://localhost:3000/api/webtoons`
4. 메서드: `GET`
5. Send 클릭

## 📦 설치된 패키지

```json
{
  "next": "15.2.5",           // React 프레임워크
  "react": "19.0.0",          // UI 라이브러리
  "react-dom": "19.0.0",      // React DOM
  "axios": "^1.x",            // HTTP 클라이언트
  "zustand": "^4.x",          // 상태 관리
  "tailwindcss": "^3.x",      // CSS 프레임워크
  "typescript": "^5.x"        // 타입 체크
}
```

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint

# TypeScript 타입 검사
npx tsc --noEmit
```

## 🐛 문제 해결

### "npm: 명령을 찾을 수 없습니다"
- Node.js가 설치되지 않음
- 해결책: https://nodejs.org에서 최신 LTS 버전 설치

### "포트 3000이 이미 사용 중입니다"
```bash
# 다른 포트에서 실행
npm run dev -- -p 3001
```

### "모듈을 찾을 수 없습니다"
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### API 응답이 `success: false`인 경우
현재는 더미 데이터를 사용하고 있습니다. 나중에 데이터베이스를 연동하면 실제 데이터가 반환됩니다.

## 🌐 다음 단계

### 1. 데이터베이스 설정 (Phase 3)
```bash
# MySQL 예시
npm install mysql2 sequelize
```

### 2. 인증 구현 (Phase 2)
```bash
npm install next-auth bcryptjs jsonwebtoken
```

### 3. PHP 서버 추가 (Phase 4)
- 별도의 PHP 프로젝트 생성
- Next.js API와 분리된 구조로 운영

## 📞 도움말

문제가 있으면:
1. 터미널에서 오류 메시지 확인
2. `npm install` 다시 실행
3. Node.js 버전 확인: `node --version`
4. 포트 충돌 확인: `lsof -i :3000`

## 🎯 개발 팁

### Hot Reload
코드를 저장하면 자동으로 브라우저가 새로고침됩니다.

### 타입 안정성
TypeScript를 사용하므로 타입 오류는 컴파일 시간에 잡힙니다.

### API 테스트
`lib/api.ts`의 함수들은 자동으로 에러 핸들링을 합니다.

### 상태 관리
Zustand 스토어를 사용하여 전역 상태를 간단하게 관리합니다.

```typescript
// 컴포넌트에서 사용
const { webtoons, setWebtoons } = useWebtoonStore();
```

## ✅ 체크리스트

- [ ] Node.js 설치 확인
- [ ] `npm install` 완료
- [ ] `.env.local` 파일 생성 (선택사항)
- [ ] `npm run dev` 실행 확인
- [ ] http://localhost:3000 접속 확인
- [ ] 웹툰 목록이 표시되는지 확인
- [ ] API 엔드포인트가 작동하는지 확인

준비 완료! 행운을 빕니다! 🚀
