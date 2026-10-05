# 아키텍처 설계 근거

> 코드와 커밋 이력에서 읽히는 의도를 정리한 문서. 별도 ADR이 없어 일부는 추론이다.

## 1. 기술 스택

| 선택 | 근거 |
|---|---|
| NestJS 11 + TypeScript | 모듈/DI/가드/파이프/필터 내장. 도메인이 많아 구조를 강제해 주는 프레임워크가 유리 |
| PostgreSQL + TypeORM | 유저·편지·리워드·캐릭터 간 관계가 많음. FK, `onDelete` 정책, 트랜잭션 필요 |
| Passport + JWT (+ Kakao) | local/jwt 전략과 카카오 로그인을 `AuthModule`에 집중 |
| Swagger + orval | 스펙 기준으로 프론트 클라이언트 코드 생성 (`enumName` 추가 커밋 참고) |
| nestjs-pino | 구조화 로그 |

## 2. 도메인 단위 모듈 분리 (`src/modules/*`)

- 기능 층이 아니라 도메인(auth, user, letter, character, item, reward, question, notice)으로 분리.
- 각 모듈은 `controller`, `service`, `entities/`, `dto/`, `enums/`, `constants/`를 함께 가진다.
- 근거: 변경이 한 폴더에 모이고, ERD 경계와 1:1 대응하며, 개발도 Phase 단위(일지 → AI 답장 → 캐릭터 → 리워드 → 공지)로 진행했다.
- `common/`에는 도메인에 속하지 않는 것만 둔다 (에러 코드, 예외, 필터, 로케일 enum).

## 3. DTO를 HTTP 메서드별로 분리 (`dto/get|post|patch|delete`)

- 요청/응답 DTO를 분리하고 파일당 export 1개 (`.cursor/rules` 규칙).
- 근거: Swagger 스펙이 명확해지고, 전역 `whitelist`가 DTO를 화이트리스트로 쓰며, 엔티티가 API로 그대로 노출되지 않는다.

## 4. 횡단 관심사는 전역 레이어에 집중 (`main.ts`)

- **ValidationPipe**: `whitelist`, `forbidNonWhitelisted`, `transform`. 서비스에서 입력 검증 코드 제거. 검증 에러도 표준 에러 포맷으로 변환.
- **HttpExceptionFilter + AppException/ErrorCode**: 모든 에러를 `{ success, statusCode, code, message, details, errors }`로 통일. 프론트는 `code`로 분기 (`docs/error-codes.md`). `@ApiErrors` 데코레이터로 Swagger 에러 문서를 같은 코드에서 생성해 문서와 동작이 어긋나지 않게 한다.
- **JwtGuard / RolesGuard**: `AuthModule`에서 export해 재사용. 사용자 관리 API는 관리자 전용.
- **fail-fast**: `CORS_ORIGIN`, `CORS_METHODS` 누락 시 부팅 실패.

## 5. 트랜잭션은 서비스에서 명시적으로

- 여러 테이블을 바꾸는 로직은 `dataSource.transaction`으로 묶는다.
- 예: `LetterService.create`는 편지 저장, 다음 질문 진행, 꿈조각 적립, `RewardHistory` 기록, 첫 편지 시 초대 보상을 한 트랜잭션에서 처리.
- 근거: 재화(꿈조각) 정합성. 보상 누락/중복 지급 방지.
- 보상 금액은 `reward-amount.constants.ts` 상수로 분리.

## 6. 환경 설정

- `ConfigModule`(global)이 `.env/{NODE_ENV}.env`를 로드. DB 옵션은 `forRootAsync`로 주입.
- `synchronize`는 환경변수가 `'true'`일 때만 활성화해 운영 스키마 자동 변경 사고를 방지.

## 7. 알려진 약점 / 미결정

1. **AI 답장 생성 방식 미결정** (`TODO.md`): 실시간 LLM 호출 vs 배치/스케줄러.
2. **모듈 간 결합**: 서비스가 타 도메인 엔티티(`User`, `RewardHistory`, `UserInvite`)를 직접 주입받는다. 트랜잭션 일관성에는 유리하지만 도메인 경계는 느슨하다 (의도한 트레이드오프).
3. `AuthModule` ↔ `UserModule` 순환 의존 (`forwardRef`).
4. 서비스 단위 spec은 있으나 e2e 테스트는 없다.

## 8. FK 제약 유지

- 모든 관계(`@ManyToOne`)에 DB 레벨 FK와 `onDelete` 정책(CASCADE, RESTRICT, SET NULL)을 둔다.
- 근거
  - 재화(꿈조각)와 편지를 다루므로 DB가 마지막 방어선으로 정합성을 보장하는 것이 안전하다.
  - 단일 PostgreSQL이고 초기 규모라 FK로 인한 성능 병목이 측정된 적이 없다.
  - FK 없이 쌓인 데이터는 나중에 FK를 다시 걸기 어렵다. FK를 유지하면 이후 선택지가 더 넓다.
- 확장 대비
  - 샤딩, DB 분리, 서비스 분리가 필요해지면 관계에 `createForeignKeyConstraints: false`를 지정해 논리 관계로 전환한다.
  - 전환이 쉽도록 `userId`, `questionId` 같은 FK 컬럼을 엔티티에 명시적으로 선언해 두었다.
  - 전환 시에는 삭제 연쇄를 서비스에서 트랜잭션으로 처리하고, 고아 데이터 점검 체계를 함께 갖춘다.
