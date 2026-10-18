# 아키텍처 설계 근거

> 코드와 커밋 이력에서 읽히는 의도를 정리한 문서. 별도 ADR이 없어 일부는 추론이다.

## 1. 기술 스택

| 선택 | 근거 |
|---|---|
| NestJS 11 + TypeScript | 모듈/DI/가드/파이프/필터 내장. 도메인이 많아 구조를 강제해 주는 프레임워크가 유리 |
| PostgreSQL + TypeORM | 유저·편지·리워드·캐릭터 간 관계가 많음. FK, `onDelete` 정책, 트랜잭션 필요 |
| Passport + JWT (+ Kakao) | local/jwt 전략과 카카오 로그인을 `AuthModule`에 집중. Access Token(1시간) + Refresh Token(30일, DB에 해시 저장) |
| Swagger + orval | 스펙 기준으로 프론트 클라이언트 코드 생성 (`enumName` 추가 커밋 참고) |
| nestjs-pino | 구조화 로그 |

## 2. 도메인 단위 모듈 분리 (`src/modules/*`)

- 기능 층이 아니라 도메인(auth, user, letter, character, item, reward, question, notice, health)으로 분리.
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
- **helmet**: 보안 헤더. HTTPS 없는 개발 서버에서도 Swagger UI가 뜨도록 `upgrade-insecure-requests`만 끈다.
- **ThrottlerGuard(전역)**: IP 기준 요청 제한. 기본 분당 120회, 로그인·가입·카카오·토큰 갱신 10회, 광고 보상·일지 작성 20회(`throttle.constants.ts`). 저장소는 인메모리라 서버가 여러 대가 되면 Redis 저장소로 바꾼다.

## 5. 트랜잭션은 서비스에서 명시적으로

- 여러 테이블을 바꾸는 로직은 `dataSource.transaction`으로 묶는다.
- 예: `LetterService.create`는 일지 저장, 꿈조각 적립(연속 작성 보상 포함), `RewardHistory` 기록, 첫 일지 시 초대 보상을 한 트랜잭션에서 처리.
- 근거: 재화(꿈조각) 정합성. 보상 누락/중복 지급 방지.
- 꿈조각 지급/차감은 `RewardService.applyRewards`로만 한다. 잔액(`user.reward_count`)을 바꾸고 같은 트랜잭션에서 `reward_history`에 이력을 남긴다(차감은 음수). 그래서 이력 합계와 잔액이 항상 맞는다.
- 보상 금액은 `reward-amount.constants.ts` 상수로 분리.
- 질문은 달력 날짜에 고정된다(시리즈당 `order_num` 1~365, 1월 1일 = 1). 일지는 `letter_date`(KST 날짜)로 질문을 정하고 사용자당 날짜별 1통이다.
- 캐릭터는 `cycle_start_date`부터 1년이 한 사이클이다. 레벨은 저장하지 않고 그 사이클에 쓴 편지 수(`letter_date` 기준)로 매번 계산한다(90통마다 +1, 최대 4). 저장한 값과 실제 편지 수가 어긋날 일이 없고, 지난 날짜 일지도 날짜가 속한 사이클에 들어간다. 졸업할 때 레벨·편지 수·가장 많이 보낸 기분을 졸업 카드에 스냅샷으로 남긴다.

## 6. 환경 설정

- `ConfigModule`(global)이 `.env/{NODE_ENV}.env`를 로드. DB 옵션은 `forRootAsync`로 주입. 셸 환경변수가 파일 값보다 우선한다(예: `DB_DATABASE=... pnpm start`).
- `synchronize`는 환경변수가 `'true'`일 때만 활성화해 운영 스키마 자동 변경 사고를 방지. 아직 배포 전이라 마이그레이션 대신 `synchronize`를 쓰고, 첫 배포 직전에 마이그레이션으로 바꾼다.
- 일시 컬럼은 모두 `timestamptz`. "오늘" 판정은 `toKstDateString()`으로 KST 날짜 문자열을 만들어 비교한다.

## 7. 알려진 약점 / 미결정

1. **AI 답장 생성 방식 미결정** (`TODO.md`): 실시간 LLM 호출 vs 배치/스케줄러.
2. **모듈 간 결합**: 서비스가 타 도메인 엔티티(`User`, `UserInvite`)를 직접 다룬다. 재화는 `RewardService`를 거치도록 모았다. 트랜잭션 일관성에는 유리하지만 도메인 경계는 느슨하다 (의도한 트레이드오프).
3. `AuthModule` ↔ `UserModule` 순환 의존 (`forwardRef`).
4. 테스트: 서비스 단위 spec(`pnpm test`, 목 사용)과 실제 PostgreSQL에 붙는 e2e(`pnpm test:e2e`, 동시 요청·토큰·신고 처리). HTTP 레이어(가드·파이프·필터)를 거치는 e2e는 아직 없다.

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

## 9. 동시 요청 처리 원칙

네트워크가 느리면 클라이언트가 같은 POST를 두 번 보낸다. "조회해서 없으면 저장" 코드는 두 요청 모두 통과하므로 서버에서 막는다. 재현 테스트는 `test/concurrency.e2e-spec.ts`.

- **하나만 있어야 하는 행은 DB 유니크 제약으로 막는다.** 위반(PostgreSQL `23505`)은 `HttpExceptionFilter`가 `DUPLICATE_RESOURCE`(409)로 바꾼다.
  - 예: `letter(user_id, letter_date)`, `character_item_map(character_id, item_id)`, `characters(user_id) WHERE status = 'growing'`(부분 유니크), `graduation_card(character_id)`, `letter_reaction(letter_id, user_id)`
- **재화처럼 읽고 고쳐 쓰는 값은 트랜잭션 첫 쿼리에서 user 행을 잠근다** (`RewardService.lockUser`, `pessimistic_write`). 같은 사용자의 재화 요청이 순서대로 처리되므로 잔액 확인·중복 확인(출석, 첫 일지)이 정확해진다. 잠금보다 앞에 조회가 있으면 그 조회는 보호받지 못한다.
- **트랜잭션 안에서 "있으면 쓰고 없으면 만들기"는 `insert().orIgnore()` 후 다시 조회한다.** PostgreSQL은 트랜잭션 안에서 에러가 한 번 나면 이후 쿼리가 모두 실패하므로 예외를 잡고 재조회할 수 없다. (예: `CharacterService.getOrCreateActiveCharacter`)
- **상태 전이는 조건부 UPDATE로 한다.** 바뀐 행이 0이면 다른 요청이 먼저 처리한 것이다. (예: 졸업 `UPDATE ... WHERE status = 'growing'`)
- **멱등이어야 하는 요청은 upsert로 처리한다.** (예: 반응)
- 트랜잭션 밖이면 예외를 잡고 다시 조회해도 된다. (예: 카카오 첫 로그인)

## 10. 삭제 규칙 (FK `onDelete`)

지금은 사용자 삭제가 소프트 삭제(`status = deleted`, 이메일·카카오 연결은 비워 재가입 허용)이고, 아이템은 판매 중지, 캐릭터 종류는 사용 중지로 처리해 실제로 행이 지워지는 경우는 관리자 공지 삭제뿐이다. 하드 삭제 API를 추가할 때는 아래 연쇄를 확인한다.

| 지우는 행 | 함께 지워지는 행 (CASCADE) | 막는 행 (RESTRICT) / 기타 |
|---|---|---|
| `user` | `letter`(→ `ai_reply`, `letter_reaction`, `letter_report`), `characters`(→ `character_item_map`, `graduation_card`), `reward_history`, `ad_view_log`, `user_setting`, `user_device`, `user_invite`, `user_block`, `refresh_token`, 그 사용자가 남긴 `letter_reaction`·`letter_report` | |
| `item` | | 산 기록 `character_item_map`이 있으면 실패(409 `RESOURCE_IN_USE`). 아이템은 지우지 않고 판매 중지한다 |
| `character_type` | | 그 종류의 `characters`가 있으면 실패(409 `RESOURCE_IN_USE`). 지우지 않고 `is_active = false`로 바꾼다 |
| `question_series` | `question`(→ `question_content`) | `question`을 참조하는 `letter`가 있으면 실패(409 `RESOURCE_IN_USE`) |
| `question` | `question_content` | `letter`가 참조하면 실패(409 `RESOURCE_IN_USE`) |
| `letter` | `ai_reply`, `letter_reaction`, `letter_report` | |
| `characters` | `character_item_map`, `graduation_card` | |

`user.question_series_id`는 시리즈가 지워지면 `NULL`(기본 시리즈 사용)이 된다.
