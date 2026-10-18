# ERD ↔ Figma 점검 정리

> 작성일 2026-10-05. 기준: 코드 `origin/feat/base`(PR #1 머지본, `11b29c3`), Figma `03. 🚧 1차 MVP (26.04.24~)` 페이지(node `2:24`).
>
> 확인 범위: 엔티티 21개 · enum · 컨트롤러/서비스 전체, Figma의 온보딩 / 홈 / 질문 확인·답장 작성 / 일지 / 캐릭터 꾸미기 / 휴게실 / 원장실 화면과 정책 코멘트.
> Figma의 `스캘레톤`, `에러케이스` 구역은 비어 있고 `웹 뷰` 구역은 다른 서비스 참고 캡처라 대상에서 뺐다.

## 0. 먼저 알아둘 것

- **`dev` 브랜치에는 뼈대만 있다.** ERD(엔티티)와 API 구현은 전부 `origin/feat/base`에 있고 `dev`/`main`에는 머지되지 않았다. 로컬 `feat/base`도 원격보다 9커밋 뒤처져 있다. 이번 작업은 `origin/feat/base`에서 딴 `feat/erd-figma-sync` 브랜치에서 했다.
- ERD 원본 문서(dbml, 이미지 등)는 레포에 없다. 이 문서에서 "ERD"는 TypeORM 엔티티를 뜻한다.
- 표기: 🔴 구조가 달라 결정이 필요 · 🟠 값/정책 불일치 · 🟡 어색하거나 확인하면 좋은 것 · ✅ 이번에 반영함

> **2026-10-18 이후 반영 현황** (`feat/todo-cleanup`): 이 문서는 작성 시점 기준이라 아래 항목은 이미 해결됐다. 남은 일은 `TODO.md`가 기준이다.
> - 3-11 설정 API: `GET/PATCH /auth/me/settings` 추가 (화면은 아직 없음). 작성 후 공개·SNS 소개 선택은 그 일지와 내 설정에 함께 저장되고 다음 일지의 기본값이 된다
> - 4장 `characters.use_yn` 제거, 본인 탈퇴 `DELETE /auth/me`·로그아웃 `POST /auth/logout` 추가
> - 5-3 인덱스, 5-4 `user.friend_invite_code` 제거, 5-5 `user.email` nullable, 5-6 `ai_reply.user_id` 제거, 5-8 아이템 구매도 `reward_history`에 음수로 기록, 5-10 일시 컬럼 `timestamptz`
> - 6-5 리프레시 토큰: `POST /auth/refresh` 추가

---

## 결정 사항 (2026-10-05)

| 항목 | 결정 | 반영 |
|---|---|---|
| 1-1 질문 모델 | **달력 날짜 고정 365문항.** 같은 월/일은 매년 같은 질문 | ✅ `question.order_num` = 1월 1일부터 센 순번(1~365), 2월 29일은 2월 28일 질문. `letter.letter_date` 추가, 하루 1통(유니크), `user.current_question_id` 제거 |
| 1-2 비회원 | 오늘 질문 하나만 서버에서 받고 나머지는 프론트 로컬 저장 | ✅ `GET /questions/guest/today` (인증 불필요) |
| 1-3 캐릭터 종류/이름 | 계속 추가·수정됨 | 보류(`TODO.md`). enum이 아니라 테이블로 설계 |
| 1-4 아이템 소유 | 캐릭터에 묶는 현재 구조가 맞음. 졸업하면 사라짐 | 변경 없음 |
| 1-5 광고 | Figma 흐름에 맞춤 | ✅ 볼 때마다 3개, 횟수·유형 제한 제거 |
| 1-6 AI 답장 | 보류 | `TODO.md` |
| 기분 종류 | 보류 | `TODO.md` |
| 운영 영향 | 아직 운영 환경 없음. 스키마 변경 자유 | 5장의 유니크 제약도 이번에 추가 |

아래 1장은 결정 전 시점의 비교 기록이다.

## 1. 결정이 필요한 것 (구현 방향이 갈리는 항목)

### 1-1. 🔴 질문이 "순번"인가 "날짜"인가

| | 내용 |
|---|---|
| Figma | 모든 답장 화면 상단에 날짜 선택(`2026년 5월 5일 ⌄`)이 있고, 일지 탭은 월간 캘린더다. 지난 날짜를 눌러 "답장이 없어요 → 답장 쓰기"가 가능하고(꿈 조각 3개 또는 광고), "이전 기록"에는 같은 질문에 대한 과거 답(`2024.01.02`, `2025.01.02`)이 쌓인다. 홈은 "오늘 편지 받음? / 답장함?"으로 분기한다. 즉 **질문은 날짜에 묶여 있고 하루 1통**이다. |
| 코드 | `user.currentQuestionId` 포인터가 답장할 때마다 `orderNum` 다음 질문으로 넘어간다. `letter`에는 날짜 컬럼이 없고(`createdDate`뿐), 하루 여러 통 작성이 가능하며, 지난 날짜 답장이라는 개념이 없다. |

정해야 할 것

1. 날짜 → 질문 매핑 규칙. 후보: (a) 시리즈 시작일(캐릭터 생성일) 기준 N일차 = `orderNum` N, (b) 달력 날짜(월/일) 고정 365문항. Figma 메모의 "1년마다 캐릭터를 다시 받는다 / 지금 키우는 캐릭터는 ~ 주제의 질문 리스트로 키우는 것"은 (a)에 가깝고, "이전 기록"에 여러 해가 쌓이는 화면은 (b)에 가깝다.
2. Figma 메모 "질문리스트를 스왑 vs 한번에 다 답변 → 2번으로 결정"의 정확한 의미. 일지 탭 햄버거의 "질문 리스트(001~, 광고 보고 답장 쓰기)" 화면과 연결되는 것으로 보이는데, 날짜와 무관하게 임의 질문에 답할 수 있다는 뜻인지 확인 필요.
3. 결정되면 `letter.letter_date`(date) 추가, `(user_id, letter_date)` 유니크, `current_question_id` 제거 여부가 따라온다.

**이 항목이 정해지기 전까지 지난 날짜 답장(꿈 조각 3개 차감), 하루 1통 제한, 연속 5일 보상은 구현하지 않았다.**

### 1-2. 🔴 비회원(게스트) 사용

- Figma: 로그인 화면에 "비회원으로 시작하기"가 있고, 비회원도 답장을 쓰고 꿈 조각을 받은 뒤 "로그인을 해야 기록이 저장돼요" 바텀시트를 본다.
- 코드: 모든 API가 `JwtGuard` 필수. 게스트 개념이 없다.
- 결정: 비회원 기록을 (a) 기기 로컬에만 두고 로그인 시 한 번에 올릴지, (b) 서버에 익명 계정(`login_type = guest`)을 만들지. (a)면 "가입 시 로컬 기록 일괄 업로드" API가, (b)면 계정 병합이 필요하다.

### 1-3. 🔴 캐릭터 종류/이름

- Figma: 캐릭터 이름 정책 `햄스터: 몽찌 / 고양이: 몽 / 강아지: 몽구 / 병아리: 몽`, 졸업 카드에 `몽몽이: 햄몽이`, 디자인 TODO에 "햄몽/냥몽".
- 코드: `characters`에 종류·이름 컬럼이 없다. 어떤 동물인지 저장할 곳이 없다.
- 결정: 종류를 누가 정하는가(랜덤/선택/질문 시리즈에 종속). Figma에 선택 화면은 없다. "고양이: 몽"과 "병아리: 몽"이 같은 이름인 것도 오타인지 확인.

### 1-4. 🔴 아이템은 캐릭터 소유인가 유저 소유인가

- 코드: `character_item_map`이 `character_id`에 묶여 있어 **졸업하면 산 아이템이 새 캐릭터에 따라오지 않는다.**
- Figma: 졸업 카드 코멘트가 "치장 아이템 X, 고정 배경 1개로 돌리기"다. 카드에는 아이템을 안 그린다는 뜻이라 `graduation_card.equipped_items_snapshot`은 쓰임이 없어진다. 졸업 후 아이템 유지 여부는 언급이 없다.
- 결정: 유지한다면 매핑을 `user_id` 기준으로 바꾸는 게 맞다.

### 1-5. 🔴 광고 보상 방식과 횟수

- Figma: "광고 보고 3개 받기", 꿈 조각이 모자랄 때마다 "광고 보기 → 전면 광고 → 진행". 광고를 볼 때마다 쓰는 구조다.
- 코드: `ad_view_log`가 `(user, ad_type, view_date)` 유니크라 **유형별 하루 1회**. 보상은 `rewarded`만 주고 Figma가 그린 `전면 광고(interstitial)`는 0개다.
- 결정: 일일 한도(무제한/N회), 전면 광고에도 보상을 줄지. "광고 보고 답장 쓰는 유저에게는 (꿈 조각 사용 토스트를) 노출하지 않음" 코멘트로 보면 광고는 꿈 조각을 주는 게 아니라 **1회 무료 통과권**일 수도 있다. 이 경우 광고 시청 검증(SSV)도 같이 정해야 한다.

### 1-6. 🔴 AI 답장(캐릭터 답장)

- Figma 정책: "리워드 지불 – 캐릭터 답장 5개", 온보딩 "열심히 편지를 보내다 보면 제 답장을 받을 수 있을지도?". 그런데 **답장을 읽는 화면이 Figma에 없다.**
- 코드: `ai_reply` 조회/읽음 API는 있는데 생성 로직이 없고(`TODO.md`), `user.ai_reply_cycle`은 어디서도 쓰지 않는다. 꿈 조각 5개를 차감하는 경로도 없다.
- 결정: 유저가 5개를 내고 요청하는 방식인지, 주기적으로 자동 도착하는지. 화면 설계가 먼저다.

---

## 2. 값·정책이 다른 것

| # | 항목 | Figma | 코드(변경 전) | 상태 |
|---|---|---|---|---|
| 2-1 | 답장 쓰기 보상 | 1개 | 10개 | ✅ 1개로 변경 |
| 2-2 | 광고 보상 | 3개 | 20개 | ✅ 3개로 변경 |
| 2-3 | 친구 초대 보상 | 5개 | 30개 | ✅ 5개로 변경 |
| 2-4 | 출석체크(편지 확인) | 1개, 꿈 조각 공장에 별도 버튼 | 전용 API 없음. 광고 API(`rewarded`)로 대신 처리한다는 주석만 있어 광고와 하루 한도를 나눠 씀 | ✅ `POST /rewards/attendance` 추가 |
| 2-5 | 연속 5일 답장 | 5개 | 없음 | 미구현 (1-1 결정 후. 5일마다 반복인지 1회인지도 확인) |
| 2-6 | 답장 글자 수 | 1~1000자, 공백만 입력 불가 | 최대 2000자, 공백만 입력 가능 | ✅ 1000자 + 공백 차단 |
| 2-7 | 이름(닉네임) | 2~8자, 한글·영문 소문자·숫자, 공백/특수문자/대문자 불가 | 최대 50자, 형식 검증 없음 | ✅ 검증 추가 |
| 2-8 | 카카오 가입 시 이름 | 가입 후 "닉네임 있음?"이 아니면 이름 입력 화면으로 | 카카오 프로필 닉네임을 그대로 넣고, **로그인할 때마다 카카오 닉네임으로 덮어씀**(직접 정한 이름이 사라짐) | ✅ 가입 시 `null`, 로그인 시 덮어쓰지 않음 |
| 2-9 | 지난 날짜 답장 | 꿈 조각 3개 | 없음 | 미구현 (1-1) |
| 2-10 | 아이템 가격 | 10~20개 | `cost` 자유값 | 시드 데이터 넣을 때 맞추면 됨 |
| 2-11 | 아이템 분류 | 옷 / 얼굴 / 배경 (디자인 메모: 슬라임, 홍조, 왕관) | `hat / clothes / accessory / background` | 미변경. 탭 3개에 enum 4개를 어떻게 대응시킬지 확인 |
| 2-12 | 기분 | 화면 6종(기분 좋아·신나·그냥 그래·화가 나·슬퍼·우울해), 디자인 메모에는 6종/8종 안이 따로 있음 | `mood_number` int, 1~10 허용, 번호↔기분 정의 없음 | 미변경. 종류 확정 후 enum으로 |
| 2-13 | 친구 초대 지급 시점 | "친구가 가입하면 / 초대 코드를 입력해야 받아요" | 피초대자가 **첫 일지를 쓸 때** 양쪽에 지급 | 미변경. 어뷰징 방지로는 현재 방식이 낫다. 문구와 맞출지 확인 |
| 2-14 | 초대 코드 입력 위치 | 화면 없음 | 로컬 회원가입 요청에만 `friendInviteCode`가 있다. **카카오 가입자는 코드를 넣을 방법이 없다** | 미구현. 입력 화면이 먼저 |

---

## 3. Figma에는 있는데 API가 없는 것

| # | 화면 | 필요한 것 | 상태 |
|---|---|---|---|
| 3-1 | 답장 후 "답장을 공개할까요?" → "인스타그램에 소개해도 될까요?" | 작성 뒤 공개 여부를 바꾸는 API. 기존에는 작성 요청에만 `isPrivate`/`isPrivateSns`가 있었다 | ✅ `PATCH /letters/:id` |
| 3-2 | 답장 화면 우상단 "수정", 코멘트 "이전 기록 수정(당일날만 가능)" | 내용 수정 API + 당일 제한 | ✅ `PATCH /letters/:id` (본문은 작성 당일 KST만) |
| 3-3 | 휴게실, "다른 사람이 쓴 답장 보기", 답장 후 홈 하단 카드 | 같은 질문의 타인 공개 답장 목록(익명) | ✅ `GET /letters/public?questionId=` |
| 3-4 | 일지 월간 캘린더(답장한 날 하트 표시) | 월별 작성일 목록 | ✅ `GET /letters/calendar?year=&month=` |
| 3-5 | 답장 화면 "이전 기록" | 같은 질문에 대한 내 과거 답 | ✅ `GET /letters?questionId=` 필터 |
| 3-6 | 꿈 조각 공장 "출석체크하고 1개 받기" | 출석 API | ✅ 2-4 |
| 3-7 | 일지 → 질문 리스트(001~) | 시리즈의 질문 전체 목록 | 미구현 (1-1) |
| 3-8 | 홈 "편지가 도착했어요" / 답장 여부 분기 | 오늘 편지 확인·답장 여부 | 미구현 (1-1). 지금은 `GET /questions/today` + 캘린더로 프론트에서 판단 가능 |
| 3-9 | 졸업 카드 "보낸 편지 234개 / 가장 많이 보낸 기분 / 몽몽이 이름" | `graduation_card`에 편지 수·대표 기분·캐릭터 이름 스냅샷 | 미구현 (1-3, 2-12) |
| 3-10 | 원장실 "자주 묻는 질문", "의견 보내기", "서비스 팀명" | 외부 링크/웹뷰면 백엔드 불필요. FAQ를 서버에서 내려줄지 확인 | 확인 필요 |
| 3-11 | 답장 공유 바텀시트 "공유 조건은 설정에서 바꿀 수 있어요" | `user_setting` 조회/수정 API. 엔티티만 있고 API가 없다. 그런데 원장실에 **설정 메뉴가 없다** | 확인 필요 |
| 3-12 | 홈 캐릭터 `LV.1` | 레벨/경험치를 올리는 규칙. `level`, `experience` 컬럼은 있는데 값을 바꾸는 코드가 없다 | 확인 필요 |
| 3-13 | 사진 찍기(저장/공유) | 클라이언트 캡처면 백엔드 불필요 | - |

---

## 4. ERD/코드에는 있는데 Figma에 없는 것

| 항목 | 내용 |
|---|---|
| `letter_reaction` + `POST /letters/:id/reactions` (like/empathy/cheer) | 휴게실 카드에는 "신고"만 있다. Figma의 "스티커 선택"은 타인 글 반응이 아니라 **내 기분 선택**이다. 반응 기능이 MVP 범위인지 확인 |
| `user_block` | 차단 화면·API 모두 없음. 신고만으로 갈지 확인 (✅ 휴게실 목록에서는 차단한 유저 글을 빼도록 해둠) |
| `user_device`, `user_setting.push_enabled` | 푸시 관련 화면 없음. "편지 도착"이 푸시인지 앱 진입 시 팝업인지 확인 |
| `user_setting.locale_type`, `letter.locale_type`, `question_content` | 디자인 TODO에 "다국어"가 있으나 언어 선택 화면 없음 |
| `characters.last_watered_at` | 물 주기 기능은 Figma에 없다. 쓰는 코드도 없다 |
| `characters.use_yn`, `status = inactive` | `status`와 의미가 겹친다. `inactive`로 만드는 코드가 없다 |
| 로컬 회원가입/로그인(이메일·비밀번호) | Figma는 카카오 + 비회원뿐. 관리자·테스트용으로 남길지 확인 |
| 회원 탈퇴(`deleted_request_at`, `status = deleted`) | 원장실에 탈퇴·로그아웃 메뉴가 없다. 스토어 심사에는 탈퇴 경로가 필요하다 |
| `notice.type` (notice/event/update) | 공지 목록은 `004 2025.05.25 업데이트` 한 형태뿐 |
| `question_series.thumbnail_url`, 시리즈 선택(`PATCH /auth/me`의 `questionSeriesId`) | 시리즈 선택 화면이 없다. 온보딩에서 자동 배정인지 확인. 지금은 시리즈를 고르지 않으면 `QUESTION_SERIES_NOT_SELECTED`로 **홈의 오늘 질문이 실패**한다 |

---

## 5. ERD 자체의 어색한 부분

1. **`user_setting`이 1:N.** `user`에서 `@OneToMany`이고 `user_id`에 유니크가 없다. 유저당 1행이어야 한다.
2. **유니크 제약 누락.** 서비스에서만 중복을 막고 있어 동시 요청에 뚫린다.
   - `character_item_map (character_id, item_id)`
   - `letter_reaction (letter_id, user_id)`
   - `user_block (blocker_user_id, blocked_user_id)`
   - `user_invite (invitee_user_id)` (한 사람은 한 번만 초대받는다)
   - `question (question_series_id, order_num)`, `question_content (question_id, locale_type)`
3. **인덱스.** `@Index`는 `user`, `ad_view_log`에만 있다. `letter.user_id`, `letter.question_id`(휴게실 조회), `reward_history.user_id` 등 FK 컬럼에 필요하다(`TODO.md`에 이미 있음).
4. **`user.friend_invite_code` ↔ `user_invite` 이중 관리.** 같은 사실을 두 곳에 적는다. `user_invite`만 남겨도 된다.
5. **`user.email`이 NOT NULL + 유니크.** 카카오가 이메일을 안 주면 `kakao_{id}@kakao.local` 가짜 주소를 넣는다. nullable로 두는 편이 깔끔하다.
6. **`ai_reply.user_id`.** `letter.user_id`로 알 수 있는 값이다. 조회 편의용이라면 유지해도 된다.
7. **`graduation_card.user_id` / `graduated_at`.** `characters`에 같은 값이 있다. 카드를 스냅샷으로 본다면 유지 가능.
8. **`reward_history`에 사용(차감) 내역이 없다.** 적립만 기록해서 `user.reward_count`와 이력 합계가 맞지 않는다. 아이템 구매·지난 날짜 답장도 음수로 남기면 원장으로 쓸 수 있다.
9. **enum 컬럼이 전부 `varchar`.** DB 제약이 없다. 의도라면 유지.
10. **날짜 컬럼 타입.** `timestamp`(타임존 없음)라 서버 타임존에 의존한다. 날짜 기준이 중요한 서비스(하루 1통, 출석)라 `timestamptz` + KST 기준 명시가 안전하다.

---

## 6. 코드에서 발견한 문제

| # | 내용 | 상태 |
|---|---|---|
| 6-1 | `PATCH /auth/me`가 관리자용 DTO를 같이 써서 **일반 유저가 자기 `status`와 `friendInviteCode`를 마음대로 바꿀 수 있었다** | ✅ 본인용 DTO 분리(`nickname`, `questionSeriesId`만) |
| 6-2 | 광고 `view_date`를 UTC로 계산해 KST 자정~오전 9시에 전날로 기록됨 | ✅ KST 기준으로 수정 |
| 6-3 | 꿈 조각 증감이 읽고-더하고-저장 방식이라 동시 요청에 유실/중복 가능 | 미수정 (`TODO.md` 기존 항목) |
| 6-4 | `synchronize` 의존, 마이그레이션 없음 | 미수정 (`TODO.md` 기존 항목). 이번에 `user.nickname`을 nullable로 바꿨으니 운영 DB가 있다면 수동 반영 필요 |
| 6-5 | 액세스 토큰 1시간, 리프레시 토큰 없음 → 앱에서 1시간마다 재로그인 | 확인 필요 |
| 6-6 | 휴게실에 올라간 글의 `letter_report`를 처리하는 관리자 API가 없다. 신고가 쌓여도 글이 내려가지 않는다 | 확인 필요 |
| 6-7 | Swagger 제목이 `Nest.js API 문서 제목` 그대로, `README.md`가 Nest 템플릿 그대로 | 미수정 |

---

## 7. Figma 쪽에서 정리하면 좋은 것

- 재화 이름이 섞여 있다: "꿈 조각"이 기본인데 편지 확인 토스트는 "**별 조각**을 받았어요", 원장실 코멘트는 "**리워드** 공장", 화면 제목은 "꿈 조각 공장".
- 캐릭터 이름이 섞여 있다: 온보딩 "저는 **몽몽이**에요", 졸업 카드 "**햄몽이**", 정책 "햄스터: **몽찌**".
- 홈 상단 우측 하트 아이콘 3개의 용도가 표시돼 있지 않다(친구 초대 / 사진 찍기 / 꿈 조각 공장으로 추정).
- 꿈 조각 부족 다이얼로그가 화면마다 문구가 다르다. 꾸미기에서는 가격이 10개인데 "꿈 조각 **3개**가 부족해요"로 고정돼 있다(부족분을 계산해 넣는 것인지 확인).
- "이전 기록" 예시 날짜(`2024.01.02`)가 화면 날짜(`5월 5일`)와 맞지 않아 1-1 해석이 갈린다.
- 초대 코드 입력, AI 답장 열람, 설정, 탈퇴/로그아웃, 시리즈·캐릭터 선택 화면이 없다.

---

## 8. 반영한 것 요약

1차 (Figma에서 뜻이 분명한 것)

- 보상 수량을 Figma 정책으로 변경(답장 1 / 광고 3 / 초대 5), 출석체크 API 추가(하루 1회, 1개)
- 답장 1000자·공백 차단, 이름 정책 검증, 카카오 가입/로그인 시 이름 처리 수정(`user.nickname` nullable)
- `PATCH /auth/me` 본인용 DTO 분리
- `PATCH /letters/:id`, `GET /letters/public`, `GET /letters/calendar`, `GET /letters?questionId=`
- 광고 시청일 KST 기준으로 수정

2차 (결정 사항 반영)

- 질문을 달력 날짜 고정으로 전환: `GET /questions/daily?date=`(그 날짜에 쓴 일지 ID 포함), `GET /questions`(질문 리스트), `GET /questions/guest/today`(비회원). 기존 `GET /questions/today`는 제거
- 시리즈를 고르지 않은 회원과 비회원은 가장 먼저 등록된 시리즈를 쓴다(시리즈 선택 화면이 없어서). `QUESTION_SERIES_NOT_SELECTED` 에러 제거
- `POST /letters`에 `letterDate` 추가: 하루 1통, 미래 불가, 지난 날짜는 꿈조각 3개 차감(작성 보상 없음, 이력에 음수로 기록)
- 연속 5일 작성 보상 5개(5일마다 반복)
- 광고: 볼 때마다 3개, 일일 제한 제거
- 유니크 제약 추가: `letter(user, letter_date)`, `question(series, order_num)`, `question_content(question, locale)`, `letter_reaction(letter, user)`, `character_item_map(character, item)`, `user_block`, `user_invite(invitee)`, `user_setting(user)`

남은 것은 `TODO.md`의 "보류 중" 참고.

---

## 9. 화면별 API 매핑 (프론트 연동용, 2026-10-05 검수)

OpenAPI 스펙은 `/api-docs-json`. OpenAPI Generator(`typescript-axios`)로 실제 생성해 확인했다(43개 오퍼레이션, 모델에 `object`/누락 타입 없음).

| Figma 화면 | API | 비고 |
|---|---|---|
| 로그인 (카카오) | `POST /auth/kakao` | 응답 `user.nickname`이 `null`이면 이름 설정으로 |
| 비회원으로 시작 | `GET /questions/guest/today` | 인증 불필요. 답변은 프론트 로컬 저장 |
| 이름 설정 | `PATCH /auth/me` `{ nickname }` | 2~8자, 한글·영문 소문자·숫자. 위반 시 `VALIDATION_FAILED` |
| 홈 상단 (LV, 꿈조각) | `GET /characters/me`, `GET /auth/me` | `level`, `rewardCount` |
| 홈 오늘의 편지 / 답장 여부 | `GET /questions/daily` | `letterId`가 있으면 답장한 상태 |
| 편지 도착(확인) → 꿈조각 1개 | `GET /rewards/attendance`, `POST /rewards/attendance` | 조회로 오늘 받았는지 확인, 이미 받았으면 POST는 409 |
| 답장 쓰기 (날짜 선택) | `GET /questions/daily?date=` | 미래 날짜는 `DATE_IN_FUTURE` |
| 이전 기록 | `GET /letters?questionId=` | 날짜 오름차순. 오늘 쓴 일지도 포함되니 필요하면 제외 |
| 다른 사람이 쓴 답장 / 휴게실 / 답장 후 홈 카드 | `GET /letters/public?questionId=` | 익명. 내 글·비공개·차단 유저 제외 |
| 답장 보내기 | `POST /letters` `{ answer, moodNumber?, letterDate? }` | 응답 `rewardAmount`로 "꿈 조각 N개 받았어요" 표시. 기본 비공개로 저장 |
| 지난 날짜 답장 | `POST /letters` `{ letterDate }` | 3개 차감. 모자라면 `REWARD_INSUFFICIENT`(`details.required/current`) → 광고 후 재시도 |
| 스티커(기분) 선택 | `POST /letters`의 `moodNumber` 또는 `PATCH /letters/:id` | 번호 체계는 보류(1~10 허용) |
| 답장을 공개할까요? / 인스타 소개 | `PATCH /letters/:id` `{ isPrivate: false }`, `{ isPrivateSns: false }` | |
| 답장 수정 (당일만) | `PATCH /letters/:id` `{ answer }` | 다음 날부터 `LETTER_EDIT_EXPIRED` |
| 일지 월간 캘린더 | `GET /letters/calendar?year=&month=` | 일지가 있는 날만 내려감 |
| 날짜의 내 답장 보기 | `GET /questions/daily?date=` → `GET /letters/:id` | |
| 질문 리스트 | `GET /questions` | `orderNum` 1 = 1월 1일 |
| 꿈 조각 공장 | `GET /auth/me`, `POST /rewards/attendance`, `POST /rewards/ad-view` | 광고는 볼 때마다 3개 |
| 꿈 조각 내역 | `GET /rewards/history` | 사용 내역은 음수 |
| 친구 초대 | `GET /auth/me`의 `myInviteCode` | 코드 입력 API는 보류 |
| 꾸미기 목록 | `GET /items?itemType=`, `GET /character-items` | 보유·장착 여부는 뒤 API로 판단 |
| 아이템 구매 / 장착 | `POST /character-items`, `PATCH /character-items/:id` | 부족 시 `REWARD_INSUFFICIENT` |
| 신고 | `POST /letters/:id/reports` | `reasonType` 필수. 화면에 사유 선택이 없으면 `other` |
| 원장실 | `GET /auth/me` | "함께한지 N일"은 `createdDate`로 계산 |
| 졸업 앨범 | `GET /characters/graduation-cards` | 편지 수·기분·캐릭터 이름은 보류 |
| 공지사항 | `GET /notices`, `GET /notices/:id` | 최신순, 공개된 것만 |

프론트에서 알아둘 것

- ID는 전부 문자열이다(bigint).
- 날짜(`letterDate`, `date`)는 KST 기준 `YYYY-MM-DD` 문자열, 일시(`createdDate` 등)는 ISO 문자열이다.
- 에러는 `ErrorResponseDto.code`(`ErrorCode` enum)로 분기한다. 상세는 `docs/error-codes.md`.
- 액세스 토큰은 1시간이다. 만료 시 `AUTH_TOKEN_EXPIRED`가 오면 `POST /auth/refresh`로 갱신한다(2026-10-18 추가).
- 스펙에는 관리자용 API(`/users`, `POST /items`, `POST /notices` 등)도 같이 들어 있다.
