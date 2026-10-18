# 몽몽유치원 백엔드

하루 한 질문에 답하는 일지(편지) 앱의 API 서버. NestJS 11 + PostgreSQL + TypeORM.

> 현재 개발 중이며 아직 배포하지 않았다. 남은 작업과 결정 대기 항목은 [`TODO.md`](TODO.md).

## 문서

- [`docs/architecture.md`](docs/architecture.md): 구조와 설계 근거, 동시 요청 처리 원칙, 삭제 규칙
- [`docs/error-codes.md`](docs/error-codes.md): 프론트용 에러 응답 가이드와 API별 에러 코드
- [`docs/erd-figma-review.md`](docs/erd-figma-review.md): ERD ↔ Figma 점검과 화면별 API 매핑
- Swagger: 서버 실행 후 `http://localhost:4000/api-docs` (JSON: `/api-docs-json`)

## 시작하기

```bash
pnpm install
cp .env/.env.example .env/development.env   # DB 접속 정보, JWT_SECRET 채우기
createdb mongmong_kindergarten                # DB_DATABASE와 같은 이름
pnpm dev                                      # synchronize=true면 스키마 자동 생성
pnpm seed:dev                                 # 샘플 질문 365개 + 샘플 아이템
```

- API 경로는 `/api/v1` 아래에 있다. 헬스체크: `GET /api/v1/health`
- 관리자 API(아이템·공지·사용자·신고 처리)는 `user.role = 'admin'`인 계정만 쓸 수 있다. 관리자 계정은 DB에서 직접 바꾼다.
- 셸 환경변수가 `.env` 파일보다 우선한다. 예: `DB_DATABASE=other_db pnpm dev`

## 테스트

```bash
pnpm test        # 서비스 단위 테스트 (DB 불필요)
pnpm test:e2e    # 실제 PostgreSQL에 붙는 테스트 (동시 요청, 토큰, 신고 처리)
```

e2e는 매번 스키마를 지우고 다시 만든다. 개발 DB와 다른 DB를 쓴다.

```bash
createdb mongmong_kindergarten_test
```

접속 정보는 `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD`, `TEST_DB_DATABASE`로 바꿀 수 있다. 기본값은 `localhost:5432`, 현재 OS 사용자, 비밀번호 없음, `mongmong_kindergarten_test`.

## 주요 스크립트

| 스크립트 | 내용 |
|---|---|
| `pnpm dev` | 개발 서버 (watch) |
| `pnpm build` / `pnpm start:prod` | 빌드 / 운영 실행 |
| `pnpm seed:dev` | 개발 DB 샘플 데이터 (운영 환경에서는 거부) |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
