# 웹툰 플랫폼 🎨

웹툰 콘텐츠를 제공하는 풀스택 플랫폼입니다. Node.js/Next.js 프론트엔드, Next.js API 라우트 백엔드, 그리고 향후 PHP 서버를 지원하는 확장 가능한 아키텍처로 설계되었습니다.

## 📁 프로젝트 구조

```
webtoon-platform/
├── app/                          # Next.js App Router
│   ├── api/                       # REST API 라우트
│   │   ├── webtoons/             # 웹툰 API
│   │   │   ├── route.ts          # GET: 모든 웹툰, POST: 생성
│   │   │   └── [id]/route.ts     # GET/PUT/DELETE: 특정 웹툰
│   │   └── episodes/             # 에피소드 API
│   │       ├── route.ts          # GET: 조회, POST: 생성
│   │       └── [id]/route.ts     # GET/PUT/DELETE: 특정 에피소드
│   ├── page.tsx                  # 홈페이지
│   ├── webtoons/                 # 웹툰 관련 페이지
│   │   ├── page.tsx              # 웹툰 목록
│   │   └── [id]/page.tsx         # 웹툰 상세
│   └── episodes/                 # 에피소드 페이지
│       └── [id]/page.tsx         # 에피소드 뷰
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # 헤더
│   │   └── Footer.tsx            # 푸터
│   └── webtoon/
│       └── WebtoonCard.tsx        # 웹툰 카드 컴포넌트
│
├── lib/
│   ├── types.ts                  # TypeScript 타입 정의
│   ├── store.ts                  # Zustand 상태 관리
│   └── api.ts                    # API 함수들
│
├── package.json
└── README.md                     # 이 파일
```

## 🚀 빠른 시작

### 전제 조건
- Node.js 18+
- npm 또는 yarn

### 설치

```bash
cd webtoon-platform
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어보세요.

## 📚 주요 기능

### 프론트엔드 ✅
- 웹툰 목록 페이지
- 웹툰 상세 페이지
- 에피소드 뷰어
- 상태 관리 (Zustand)
- API 통신 (axios)
- Tailwind CSS 스타일링

### 백엔드 API ✅
- 웹툰 CRUD (Create, Read, Update, Delete)
- 에피소드 CRUD
- 필터링 & 정렬 기능
- 에러 핸들링
- 응답 표준화

## 🔧 향후 추가 기능

### Phase 2
- [ ] 사용자 인증 (로그인/회원가입)
- [ ] 댓글 및 평점 시스템
- [ ] 즐겨찾기 기능
- [ ] 검색 기능
- [ ] 소셜 로그인

### Phase 3
- [ ] 데이터베이스 연동 (MySQL/PostgreSQL/MongoDB)
- [ ] 파일 업로드 (이미지 관리)
- [ ] 작가 대시보드
- [ ] 관리자 패널

### Phase 4
- [ ] PHP 백엔드 서버 추가
- [ ] 캐싱 및 CDN 통합
- [ ] 실시간 알림
- [ ] 결제 시스템

## 📖 API 엔드포인트

### 웹툰 API

**GET /api/webtoons** - 모든 웹툰 조회
```bash
curl http://localhost:3000/api/webtoons
```

**GET /api/webtoons/:id** - 특정 웹툰 조회
```bash
curl http://localhost:3000/api/webtoons/1
```

**POST /api/webtoons** - 새 웹툰 생성
```bash
curl -X POST http://localhost:3000/api/webtoons \
  -H "Content-Type: application/json" \
  -d '{"title":"새 웹툰","author":"작가명","description":"...","genre":["액션"],"status":"ongoing","rating":0,"views":0}'
```

**PUT /api/webtoons/:id** - 웹툰 수정
```bash
curl -X PUT http://localhost:3000/api/webtoons/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"수정된 제목"}'
```

**DELETE /api/webtoons/:id** - 웹툰 삭제
```bash
curl -X DELETE http://localhost:3000/api/webtoons/1
```

### 에피소드 API

**GET /api/episodes?webtoonId=1** - 특정 웹툰의 에피소드 조회
```bash
curl "http://localhost:3000/api/episodes?webtoonId=1"
```

**GET /api/episodes/:id** - 특정 에피소드 조회
```bash
curl http://localhost:3000/api/episodes/1
```

**POST /api/episodes** - 새 에피소드 생성
```bash
curl -X POST http://localhost:3000/api/episodes \
  -H "Content-Type: application/json" \
  -d '{"webtoonId":"1","episodeNumber":1,"title":"첫화","description":"...","images":[],"views":0,"likes":0}'
```

## 🗄️ 데이터 모델

### Webtoon
```typescript
{
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  genre: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}
```

### Episode
```typescript
{
  id: string;
  webtoonId: string;
  episodeNumber: number;
  title: string;
  description: string;
  images: string[];
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}
```

## 🎨 기술 스택

- **프론트엔드**: Next.js 15+, React 19+, TypeScript
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand
- **HTTP 클라이언트**: Axios
- **패키지 매니저**: npm

## 📝 환경 변수

`.env.local` 파일 생성:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🚀 배포

### Vercel 배포 (추천)

```bash
npm install -g vercel
vercel
```

### 수동 배포

```bash
npm run build
npm start
```

## 📄 라이선스

MIT

## 🔗 관련 링크

- [Next.js 공식 문서](https://nextjs.org)
- [TypeScript 공식 문서](https://www.typescriptlang.org)
- [Tailwind CSS 공식 문서](https://tailwindcss.com)
- [Zustand 문서](https://github.com/pmndrs/zustand)

