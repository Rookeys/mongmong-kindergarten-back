# TODO

> **현재 상태: 개발 중, 미배포.** 운영 서버가 없고 운영 데이터도 없다. 스키마 변경 시 기존 데이터 이전·정리는 고려하지 않아도 되고, 로컬/개발 DB는 필요하면 초기화한다. 마이그레이션 도입은 첫 배포 직전에 한다.

> ERD ↔ Figma 점검 내용과 결정 배경은 `docs/erd-figma-review.md` 참고.

## 프론트 연동 시 막힐 수 있는 것 (나중에 한 번에 작업)

화면별 API 매핑은 `docs/erd-figma-review.md` 9장 참고. 아래는 연동하다 걸릴 수 있는 지점이다.

1. **리프레시 토큰 없음 (우선)**: 액세스 토큰이 1시간이고 갱신 수단이 없다. 만료되면 `AUTH_TOKEN_EXPIRED`가 오고 다시 카카오 로그인을 해야 한다. 리프레시 토큰 발급·갱신 API(`POST /auth/refresh`)와 로그아웃 처리가 필요하다.
2. **신고 사유**: `POST /letters/:id/reports`는 `reasonType`이 필수인데 Figma에는 "신고" 버튼만 있다. 사유 선택 화면을 만들지, `reasonType`을 선택값으로 바꿀지 정한다. 그 전까지 프론트는 `other`로 보낸다.
3. **졸업 시점**: `POST /characters/graduate`를 누가 언제 호출하는지 정해지지 않았다(Figma 메모는 "1년마다 캐릭터를 다시 받는다"). 서버가 자동으로 졸업시킬지, 프론트가 조건을 보고 호출할지 정한다.
4. **졸업 카드 필드 부족**: 카드 화면의 "보낸 편지 수 / 가장 많이 보낸 기분 / 캐릭터 이름"이 응답에 없다. (캐릭터 종류·기분 보류와 묶임)
5. **꾸미기 탭 매핑**: Figma 탭(옷/얼굴/배경)과 `ItemType`(`hat/clothes/accessory/background`)이 맞지 않아 프론트가 탭별 조회를 확정할 수 없다.
6. **초대 코드 입력**: 카카오 가입자가 친구 코드를 넣을 API가 없다. 지금은 초대 보상이 로컬 회원가입 경로에서만 동작한다.
7. **기분 번호**: `moodNumber`가 1~10 정수일 뿐 번호↔기분 정의가 없다. 프론트와 번호 약속이 필요하다.
8. **질문 데이터 등록**: 시리즈 1개와 `order_num` 1~365 질문·콘텐츠가 DB에 있어야 `GET /questions/daily`가 동작한다. 관리자 등록 API나 시드 스크립트가 없다.
9. **설정/탈퇴/로그아웃**: 공유 바텀시트 문구는 "설정에서 바꿀 수 있어요"인데 `user_setting` API가 없고, 탈퇴 API도 본인용이 없다(관리자용 `DELETE /users/:id`만 있음).

## 보류 중 (결정 또는 화면 설계 대기)

- **캐릭터 AI 답장**: 보류. `ai_reply` 조회/읽음 API만 있고 생성 로직, 꿈조각 5개 차감 경로, 열람 화면이 없다. `user.ai_reply_cycle`도 미사용. (아래 "AI 답장 생성 방식 결정 필요" 참고)
- **기분 종류**: 보류. Figma 화면은 6종, 디자인 메모는 6종/8종 안이 따로 있다. 지금은 `mood_number` 1~10 정수만 받는다. 확정되면 enum으로 바꾸고, 졸업 카드의 "가장 많이 보낸 기분"도 그때 추가한다.
- **질문 시리즈 선택**: 보류. Figma에 선택 화면이 없고 당분간 만들 계획도 없다. 백엔드는 확장만 열어둔 상태다: `user.question_series_id`(nullable), `GET /questions/series`, `PATCH /auth/me`의 `questionSeriesId`. 시리즈를 고르지 않은 회원과 비회원은 가장 먼저 등록된 시리즈를 쓴다. 시리즈가 여러 개가 되면 기본 시리즈 지정 방식과 시리즈 변경 시 기존 일지 처리를 정한다.
- **캐릭터 종류/이름**: 종류와 이름은 계속 추가·수정될 예정이라 enum이 아니라 테이블(`character_type`: 이름, 종, 이미지, 사용 여부 + 관리자 CRUD)로 만들고 `characters.character_type_id`로 참조한다. 새 캐릭터에 어떤 종류를 줄지(랜덤/선택/시리즈 종속) 규칙이 정해지면 구현한다.
- **졸업 카드**: Figma는 "보낸 편지 수 / 가장 많이 보낸 기분 / 캐릭터 이름"을 보여주고 치장 아이템은 그리지 않는다. `graduation_card`에 편지 수·캐릭터 이름 스냅샷을 추가하고 `equipped_items_snapshot`은 제거 검토. (캐릭터 종류, 기분 결정 후)
- **아이템 분류**: Figma 탭은 옷/얼굴/배경, 코드 enum은 `hat/clothes/accessory/background`. 대응 관계 확정 필요.
- **친구 초대 코드 입력**: 카카오 가입자가 코드를 넣을 화면과 API가 없다(로컬 회원가입 요청에만 `friendInviteCode`가 있음). 지급 시점도 Figma 문구("친구가 가입하면")와 코드(피초대자 첫 일지 작성 시)가 다르다.
- **레벨/경험치 규칙**: `characters.level`, `experience`를 올리는 규칙이 없다. `last_watered_at`도 미사용.
- **설정/탈퇴/로그아웃**: `user_setting` API와 화면이 없고, 원장실에 탈퇴 메뉴가 없다.
- **신고 처리**: `letter_report`를 처리하는 관리자 API가 없어 신고된 글이 휴게실에서 내려가지 않는다. `letter_reaction`, `user_block`은 Figma에 화면이 없다(MVP 범위 확인).
- **리프레시 토큰**: 액세스 토큰 1시간뿐이라 앱에서 1시간마다 재로그인이 필요하다.
- **광고 시청 검증**: `POST /rewards/ad-view`는 클라이언트 신고만 믿고 횟수 제한 없이 3개를 준다. 광고 SDK 서버 검증(SSV) 또는 일일 한도 필요.
- **질문 데이터**: 시리즈마다 `order_num` 1~365(1월 1일 = 1)를 모두 채워야 한다. 관리자용 질문 등록 API가 없어 지금은 DB에 직접 넣어야 한다.
- **아이템 구매 이력**: 지난 날짜 일지는 `reward_history`에 음수로 남기지만 아이템 구매는 아직 남기지 않는다.

## 아직 직접 확인하지 못한 것

- **카카오 로그인**: 실제 카카오 토큰으로 호출해 보지 못했다. 가입 시 `nickname = null`, 재로그인 시 이름을 덮어쓰지 않는 동작을 실기기/테스트 앱으로 확인 필요.
- **꾸미기(구매·장착)와 졸업**: 단위 테스트만 통과한 상태다. 서버를 띄워 실제 호출로 확인하지 않았다.

## 남은 정리 (ERD/코드)

- **날짜 컬럼이 `timestamp`(타임존 없음)**: 서버 타임존에 의존한다. 출석·당일 수정처럼 "오늘" 판정이 걸린 값이라 `timestamptz` 전환 검토.
- **`user.email` NOT NULL**: 카카오가 이메일을 안 주면 `kakao_{id}@kakao.local` 가짜 주소를 넣는다. nullable 전환 검토.
- **중복 컬럼**: `user.friend_invite_code`(↔ `user_invite`), `characters.use_yn`(↔ `status`), `ai_reply.user_id`(↔ `letter.user_id`).
- **`docs/architecture.md`가 옛 구조 기준**: "다음 질문 진행" 등 순번 방식 설명이 남아 있다. 날짜 모델에 맞게 갱신.

## AI 답장 생성 방식 결정 필요 (Phase 2)

`letter` 도메인에 AI 답장(`ai_reply`) 조회/읽음 처리/반응/신고 API는 구현했지만,
**AI 답장을 실제로 생성하는 로직은 아직 없다.** 아래 중 하나로 결정 필요:

- 외부 LLM 실시간 호출: 일지(`POST /letters`) 작성 직후 즉시 LLM API를 호출해 답장 생성
- 배치/스케줄러: `user.aiReplyCycle` 조건에 맞는 사용자를 주기적으로 모아 일괄 생성

결정 후 `letter` 모듈에 생성 트리거(서비스 메서드 또는 스케줄러)를 추가한다.

## 동시 요청(중복 POST) / 재화 정합성 (우선순위 높음)

네트워크가 느려 클라이언트가 같은 POST를 두 번 보내면, "조회해서 없으면 저장" 코드가 두 요청 모두 통과한다. 프론트에서 요청 중 버튼을 막아도 재시도·연타를 다 막을 수 없으므로 서버에서 막는다.

원칙:

- **하나만 있어야 하는 행**은 DB 유니크 제약으로 막는다. 유니크 위반(PostgreSQL `23505`)은 `HttpExceptionFilter`가 `DUPLICATE_RESOURCE`(409)로 바꿔 준다.
- **잔액처럼 읽고 고쳐 쓰는 값**은 트랜잭션 첫 쿼리에서 행을 잠근다(`pessimistic_write`).
- 트랜잭션 안에서 유니크 위반이 나면 PostgreSQL 트랜잭션이 aborted 상태가 되어 이후 쿼리가 모두 실패한다. 트랜잭션 안에서 "충돌하면 다시 조회"가 필요하면 `insert().orIgnore()`(`ON CONFLICT DO NOTHING`) 후 조회한다.

### 1. GROWING 캐릭터 중복 생성 (GET 응답이 꼬이는 원인)

- `CharacterService.getOrCreateActiveCharacter`가 GROWING 캐릭터를 조회하고 없으면 생성한다. `GET /characters/me`, `GET /character-items`, 아이템 구매, 장착이 모두 이 함수를 거친다.
- 캐릭터가 없는 사용자가 동시에 요청하면 GROWING 캐릭터가 2개 생긴다. 이후 `findOneBy`가 둘 중 아무거나 돌려줘서 구매한 아이템이 두 캐릭터에 흩어지고, 조회할 때마다 다른 캐릭터가 나올 수 있다.
- 해결:
  - `Character`에 부분 유니크 인덱스 추가: `@Index(['userId'], { unique: true, where: "status = 'growing'" })`
  - `getOrCreateActiveCharacter`는 GET에서도 쓰이므로 409를 내면 안 된다. `insert().orIgnore()`로 생성을 시도하고 다시 조회해서 반환한다. (`purchaseItem`, `updateEquip`처럼 트랜잭션 안에서 호출돼도 동작한다)

### 2. 졸업 중복

- `POST /characters/graduate`를 두 번 보내면 같은 캐릭터로 졸업 카드 2장, 새 GROWING 캐릭터 2개가 생길 수 있다.
- 해결:
  - 1번 인덱스가 있으면 두 번째 요청의 새 캐릭터 저장이 실패해 롤백된다(409).
  - 추가로 `GraduationCard`에 `@Unique(['characterId'])`를 걸어 캐릭터당 카드 1장을 DB에서 보장한다.

### 3. 꿈조각 잔액 갱신 유실·초과 차감

- `user.rewardCount += n` 후 `save`(read-modify-write)하는 곳: `LetterService.create`, `LetterService.grantPendingInviteReward`, `RewardService.recordAdView`, `RewardService.checkAttendance`, `CharacterService.purchaseItem`
- 예: 잔액 10에서 5짜리 아이템과 8짜리 아이템을 동시에 사면 두 요청 모두 10을 읽어 잔액 검사를 통과하고, 나중에 저장한 값으로 덮어써 차감 하나가 사라진다.
- 해결: 각 트랜잭션의 **첫 쿼리**로 user 행을 잠근다. 같은 사용자의 재화 요청이 순서대로 처리된다.

  ```ts
  const user = await manager.findOne(User, {
    where: { id: userId },
    lock: { mode: 'pessimistic_write' },
  });
  ```

- 잠금이 첫 쿼리가 아니면(중복 검사 조회가 잠금보다 앞에 있으면) 아래 4·5번 문제가 남는다.
- 원자적 증감(`reward_count = reward_count + :n`, 차감은 `WHERE reward_count >= :n`)도 가능하지만, 잔액 확인·첫 일지 판정 같은 검사가 함께 있어서 잠금 쪽이 고칠 곳이 적다.

### 4. 출석 중복 지급

- `checkAttendance`가 오늘 출석 이력을 먼저 조회하고 그다음에 user를 조회한다. 동시 요청 두 개가 모두 "출석 안 함"으로 읽고 두 번 지급한다.
- 해결: 3번의 user 잠금을 트랜잭션 맨 앞으로 옮긴다. 두 번째 요청은 첫 요청이 커밋한 이력을 보고 `ATTENDANCE_ALREADY_CHECKED`로 막힌다. `(user_id, 날짜)` 유니크 컬럼은 따로 만들지 않아도 된다. 코드의 `ponytail:` 주석도 함께 정리한다.

### 5. 첫 일지 초대 보상 중복 지급

- 같은 날짜 일지 중복은 `letter (user_id, letter_date)` 유니크로 이미 막힌다(409).
- 하지만 **서로 다른 날짜** 일지(오늘 + 지난 날짜)를 동시에 쓰면 두 요청 모두 `isFirstLetter = true`, `user_invite.reward_given_yn = false`로 읽어 초대 보상이 초대한 사람·받은 사람 모두에게 두 번 나간다.
- 해결:
  - 3번의 user 잠금으로 같은 사용자의 일지 작성이 순서대로 처리되면 두 번째 요청은 일지 수를 1로 읽는다.
  - `grantPendingInviteReward`의 inviter 조회도 `pessimistic_write`로 잠근다. 초대한 사람 본인의 재화 요청과 겹치면 inviter 잔액이 유실된다.

### 6. 카카오 로그인 연타

- `AuthService.findOrCreateKakaoUser`가 `(loginType, providerId)`로 조회하고 없으면 생성한다. 유니크 인덱스 덕분에 사용자가 2명 생기지는 않지만, 첫 로그인을 두 번 보내면 두 번째 요청이 유니크 위반(409) 또는 `ensureEmailIsAvailable`의 이메일 중복 에러로 로그인에 실패한다.
- 해결: `createKakaoUser`에서 위 에러가 나면 `(loginType, providerId)`로 다시 조회해서 그 사용자로 로그인시킨다. (`createSocialUser` 트랜잭션 밖이라 재조회 가능)

### 7. 반응 연타

- `LetterService.addReaction`이 조회 후 insert/update한다. `letter_reaction (letter_id, user_id)` 유니크가 있어 중복 행은 안 생기지만 동시 요청 시 두 번째가 409로 실패한다.
- 해결: `letterReactionRepository.upsert({ letterId, userId, reactionType }, ['letterId', 'userId'])` 후 조회해서 반환한다.

### 8. 신고 중복 (정책 결정 필요)

- `LetterService.addReport`에 중복 방지가 없어 같은 사람이 같은 글을 여러 번 신고할 수 있다(연타 포함).
- 한 글에 1회만 신고하게 할지 정한다. 1회로 정하면 `LetterReport`에 `@Unique(['letterId', 'reporterUserId'])`를 추가한다(두 번째는 409, 필요하면 전용 에러 코드).

### 9. 광고 보상 중복

- `POST /rewards/ad-view`는 횟수 제한이 없는 정책이라 연타하면 그대로 두 번 지급된다. 서버가 중복 요청과 정상 재시청을 구분할 근거가 없다. 위 "광고 시청 검증"(SSV 또는 일일 한도)과 함께 해결한다.

### 검증

- 각 항목을 고칠 때 같은 요청을 `Promise.all`로 동시에 2번 보내는 테스트를 남긴다(실제 DB가 필요하므로 e2e). 예: 캐릭터 GET 2번 → GROWING 1개, 아이템 동시 구매 → 잔액 음수 아님, 출석 2번 → 지급 1번.

### 그 외 정합성

- `user.rewardCount`(잔액)와 `reward_history`(이력)가 이중 관리됨. 이력을 원장으로 삼을지 정하고, 정합성 점검 쿼리 마련
- 보상 규칙이 `LetterService`, `RewardService` 등에 흩어져 있음. `RewardService`에 `grant`/`spend`를 모아 위 3번 잠금을 한곳에서 처리
- Idempotency-Key 같은 공통 중복 요청 방지 장치는 위 제약·잠금으로 막히지 않는 사례(9번 등)가 실제로 문제 될 때 검토

## DB / 성능

- 조회 컬럼 인덱스 추가 검토: `letter.userId`, `character_item_map.characterId`, `reward_history.userId`, `ai_reply.letterId` 등 (현재 `@Index`는 `ad_view_log`, `user`에만 있음. PostgreSQL은 FK 컬럼에 인덱스를 자동 생성하지 않음)
- `synchronize` 의존 제거, TypeORM 마이그레이션 도입 (운영 전)

## 기능 / 정책

- AI 답장 생성 방식 결정 시 함께 정할 것: 타임아웃, 재시도, 비용 제어, 실패 처리 (위 "AI 답장 생성 방식 결정 필요" 참고)

## 보안 / 운영

- `helmet`, rate limit(`@nestjs/throttler`: 로그인, 광고 시청, 편지 작성), 헬스체크 엔드포인트 없음

## 테스트 / 문서

- e2e 테스트 부재. 최소한 재화 흐름(편지 작성 → 보상 → 아이템 구매) 통합 테스트
- `README.md`가 NestJS 템플릿 그대로. `docs/architecture.md`, `docs/error-codes.md`로 연결
- 하드 삭제 API 추가 시 자식 데이터 정리 규칙 문서화 (`Question` 삭제는 참조 여부 검사 필요)
