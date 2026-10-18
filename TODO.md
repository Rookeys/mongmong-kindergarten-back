# TODO

> **현재 상태: 개발 중, 미배포.** 운영 서버가 없고 운영 데이터도 없다. 스키마 변경 시 기존 데이터 이전·정리는 고려하지 않아도 되고, 로컬/개발 DB는 필요하면 초기화한다. 마이그레이션 도입은 첫 배포 직전에 한다.

> 2026-10-18 정책 결정과 프론트·디자인 할 일은 [`docs/decisions-2026-10-18.md`](docs/decisions-2026-10-18.md). ERD ↔ Figma 점검은 `docs/erd-figma-review.md`, 동시 요청 처리 원칙과 삭제 규칙은 `docs/architecture.md` 9·10장.

## 프론트·디자인 작업 대기 (백엔드 API는 준비됨)

- 신고 사유 선택 UI, 온보딩 초대 코드 입력칸, 설정·로그아웃·탈퇴 메뉴, 졸업 연출, 캐릭터 종류·레벨별 이미지. 목록과 API는 결정 문서 2·3장.
- 토큰 갱신: 같은 Refresh Token으로 동시에 갱신하면 하나만 성공하므로 갱신 요청은 한 번만 보내고 나머지 요청은 기다리게 한다.

## 운영 준비

- 캐릭터 종류(몽몽이·햄몽이·빼몽이) 등록. 없으면 캐릭터를 만들 수 없다(`CHARACTER_TYPE_NOT_REGISTERED`). 개발 DB는 `pnpm seed:dev`, 운영은 `POST /character-types`. 마이그레이션 도입 시 초기 데이터로 넣는다.
- 실제 질문 365개 입력: 관리자 API(`PUT /questions/series/:id/questions`) 또는 `pnpm import:questions <시리즈ID> <CSV>`.

## 보류 중 (결정 또는 설계 대기)

- **AI 답장 생성 (배치)**: 주기적으로 모아서 생성하기로 했다. `ai_reply` 조회/읽음 API만 있고 생성 로직, 꿈조각 5개 차감 경로, 열람 화면이 없다. 실행 주기, `user.ai_reply_cycle` 의미, LLM 실패 시 재시도, 비용 한도를 정한 뒤 스케줄러를 추가한다. 차감은 `RewardService.lockUser` + `applyRewards`를 쓴다.
- **광고 보상 검증 (AdMob)**: 나중에 Google AdMob을 붙인다. 보상형 광고는 SSV(서버 측 확인) 콜백으로 지급하도록 옮긴다(서명 검증 + `transaction_id` 중복 방지). 그 전까지 `POST /rewards/ad-view`는 클라이언트 신고만 믿고 횟수 제한 없이 지급한다(IP당 분당 20회 요청 제한만 있음).
- **질문 시리즈 선택**: Figma에 선택 화면이 없고 당분간 만들 계획도 없다. 백엔드는 확장만 열어둔 상태다: `user.question_series_id`(nullable), `GET /questions/series`, `PATCH /auth/me`의 `questionSeriesId`. 시리즈를 고르지 않은 회원과 비회원은 가장 먼저 등록된 시리즈를 쓴다.
- **졸업 카드 아이템 스냅샷**: Figma 카드는 치장 아이템을 그리지 않는다. `equipped_items_snapshot`은 그대로 두었다. 필요 없으면 제거.
- **`characters.last_watered_at`**: 쓰는 곳이 없다(물주기 기능 미정).
- **`letter_reaction`, `user_block`**: Figma에 화면이 없다(MVP 범위 확인).

## 아직 직접 확인하지 못한 것

- **카카오 로그인 (담당: 백엔드 개발자)**: 실제 카카오 토큰으로 호출해 보지 못했다. 가입 시 `nickname = null`, 재로그인 시 이름을 덮어쓰지 않는 동작, 이메일 동의를 안 한 계정의 `email = null` 가입, 탈퇴 후 재로그인 시 새 계정 생성을 실기기/테스트 앱으로 확인.

## 재화 정합성

- `user.rewardCount`(잔액)와 `reward_history`(이력)를 같은 트랜잭션에서 함께 바꾸므로 이력 합계 = 잔액이다(`RewardService.applyRewards`). 이력을 원장으로 삼아 잔액 컬럼을 없앨지는 정하지 않았다. 관리자 지급(`RewardType.ADMIN`) 경로가 생기면 그것도 `applyRewards`를 거치게 한다.
- Idempotency-Key 같은 공통 중복 요청 방지 장치는 지금의 제약·잠금으로 막히지 않는 사례(광고 보상 등)가 실제로 문제 될 때 검토.
- 초대 코드 등록과 첫 일지 작성이 정확히 동시에 들어오면 보상이 안 나갈 수 있다(등록 시점에 일지가 없었지만 일지 트랜잭션이 먼저 초대를 확인한 경우). 온보딩에서 등록하므로 실제로는 일어나기 어렵다.

## 배포 전 할 일

- `synchronize` 의존 제거, TypeORM 마이그레이션 도입 (첫 배포 직전). 캐릭터 종류 3종을 초기 데이터로 포함.
- 로드밸런서·프록시 뒤에 두면 `app.set('trust proxy', ...)`를 설정해야 요청 제한이 실제 클라이언트 IP 기준으로 동작한다. 지금은 프록시 IP 하나로 묶인다.
- 서버를 여러 대 띄우면 요청 제한 저장소를 Redis로 바꾼다(지금은 인메모리).

## 테스트

- HTTP 레이어(가드·파이프·필터·요청 제한)를 거치는 e2e는 없다. 지금 e2e는 실제 DB에 붙어 서비스를 직접 호출한다.
