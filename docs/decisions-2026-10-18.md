# 2026-10-18 정책 결정 정리

> 회의록 공유용. 결정한 내용, 백엔드에 반영한 것, 프론트엔드·디자인(Figma)에서 할 일을 한곳에 모았다.
> 백엔드 작업 브랜치: `feat/todo-cleanup`. API 상세는 Swagger(`/api-docs`)와 [`error-codes.md`](error-codes.md).

## 1. 결정 사항

| # | 주제 | 결정 | 백엔드 |
|---|---|---|---|
| 1 | 신고 사유 | 선택 입력. 사유 선택 UI는 프론트에서 처리 | ✅ `reasonType` 선택값(없으면 `null`) |
| 2 | 신고 중복 | 같은 일지는 한 사람이 **한 번만** 신고 | ✅ 두 번째는 `LETTER_REPORT_ALREADY_EXISTS`(409) |
| 3 | 신고 처리 | 자동 숨김 없이 **관리자가 확인** 후 처리 | ✅ 관리자가 `resolved`로 바꾸면 휴게실에서 내려감 |
| 4 | 탈퇴 후 재가입 | 허용 | ✅ 탈퇴하면 이메일·카카오 연결을 비워 같은 계정으로 새로 가입(이전 기록은 이어지지 않음) |
| 5 | 카카오 이메일이 기존 이메일 가입자와 겹칠 때 | 카카오 기준. 카카오 가입을 막지 않음 | ✅ 카카오 계정을 새로 만들고 이메일은 비워 둠 |
| 6 | 아이템 삭제 | **판매 중지**로 처리 | ✅ 상점에서 숨기고 새로 못 삼. 이미 산 사람은 계속 보유 |
| 7 | 광고 보상 검증 | 나중에 Google AdMob 붙일 예정 | ⏸ 아래 "나중에 할 일" 참고 |
| 8 | 졸업 시 아이템 | 아이템은 캐릭터별이라 졸업하면 사라지는 게 맞음 | ✅ 현재 동작 유지 |
| 9 | 졸업 시점 | 키우기 시작한 날부터 **1년 사이클**이 돌면 졸업. 편지를 안 쓴 날도 날짜 기준으로 사이클은 돈다. 졸업은 **프론트가 호출** | ✅ 아래 "캐릭터" 참고 |
| 10 | 기분 | 6종: 기분 좋아 / 신나 / 그냥그래 / 화가 나 / 슬퍼 / 우울해 (Figma "스티커 선택") | ✅ `mood` enum |
| 11 | 꾸미기 탭 | Figma 기준 **옷 / 얼굴 / 배경**. 탭은 나중에 늘 수 있음 | ✅ `ItemType` = `clothes` / `face` / `background` |
| 12 | 캐릭터 종류·이름 | **몽몽이, 햄몽이, 빼몽이** 3종. 늘 수 있음. 새 캐릭터는 **랜덤** 배정 | ✅ 종류 테이블 + 관리자 API |
| 13 | 레벨 | Lv1에서 시작, 그 사이클에 쓴 편지 **90통마다 +1**, 캐릭터별 **최대 Lv4** (90통 Lv2, 180통 Lv3, 270통 Lv4) | ✅ 편지 수로 계산 |
| 14 | 친구 초대 코드 입력 | 첫 로그인 후 닉네임 정할 때 같이 입력(선택). 입력한 사람이 **첫 일지를 쓸 때** 양쪽 보상 | ✅ `PATCH /auth/me`에 `friendInviteCode` |
| 15 | 질문 데이터 입력 | 관리자 화면 또는 CSV 일괄 입력. 둘 다 가능하게 | ✅ 관리자 API + `pnpm import:questions` |
| 16 | 설정·탈퇴·로그아웃 등 화면 | 화면은 프론트에서 추가. 백엔드는 기능만 | ✅ API 준비됨 |
| 17 | AI 답장 생성 | 주기적으로 모아서 생성(배치) | ⏸ 나중에 배치로 구현 |
| 18 | 카카오 로그인 실기기 테스트 | 담당: 백엔드 개발자(본인)가 직접 확인 | ⏸ 확인 필요 |
| 19 | 일지 공개 설정 (`setLetterIsPrivate`) | 내 일지를 다른 사람에게 보여줄지 고르는 설정. 작성 후 "답장을 공개할까요?" 선택을 설정에 저장하고 다음 일지 기본값으로 사용. SNS 소개 질문도 같은 방식 | ✅ |

### 캐릭터 동작 (9·12·13번 상세)

- 가입 후 처음 캐릭터를 조회하면 사용 중인 종류 중 랜덤으로 Lv1 캐릭터가 생긴다. 시작일(`cycleStartDate`)은 그날(KST)이다.
- 졸업일(`graduationDate`) = 시작일 + 1년. 그날부터 `canGraduate = true`가 된다.
- 프론트는 `canGraduate`가 true면 졸업 연출을 보여주고 `POST /characters/graduate`를 호출한다. 졸업일 전에는 `CHARACTER_GRADUATION_NOT_READY`(409).
- 졸업하면 졸업 카드(이름 · 레벨 · 보낸 편지 수 · 가장 많이 보낸 기분 · 기간)가 남고, 새 캐릭터(랜덤 종류)가 생긴다.
- 새 캐릭터는 졸업한 날(KST)부터 시작한다. 졸업을 늦게 해도 마찬가지다. 예: 2026-10-18 시작 → 2029-01-05에 졸업하면 새 캐릭터 시작일은 2029-01-05.
- 레벨은 그 사이클 기간(시작일 ~ 졸업일 전날)에 쓴 편지 수로 계산한다. 편지 날짜(`letterDate`) 기준이라 지난 날짜 일지도 그 날짜가 속한 사이클에 들어간다.
- 가장 많이 보낸 기분이 동률이면 최근에 고른 기분을 쓴다. 기분을 고른 편지가 없으면 `null`.

## 2. 프론트엔드 할 일

### 새로 만들거나 바꿀 화면·연동

| 화면 | 할 일 | API |
|---|---|---|
| 신고 | 사유 선택 UI(선택 사항). 이미 신고한 글이면 `LETTER_REPORT_ALREADY_EXISTS` 안내 | `POST /letters/:id/reports` (`reasonType` 생략 가능) |
| 온보딩(이름 작성) | 친구 초대 코드 입력칸(선택). 닉네임과 함께 보낸다 | `PATCH /auth/me` `{ nickname, friendInviteCode }` |
| 일지 작성 후 공개 질문 | "답장을 공개할까요?"·"몽몽이가 소개해도 될까요?" 답을 보낸다. 기본 선택은 내 설정값 | `PATCH /letters/:id` `{ isPrivate, isPrivateSns }`, 기본값은 `GET /auth/me/settings` |
| 설정 (원장실에 메뉴 추가) | 일지 공개·SNS 소개·푸시·언어 설정 | `GET/PATCH /auth/me/settings` |
| 로그아웃 | Refresh Token 폐기 후 토큰 삭제 | `POST /auth/logout` |
| 탈퇴 | 확인 후 탈퇴. 같은 계정으로 다시 가입하면 새 계정이 된다는 안내 | `DELETE /auth/me` |
| 캐릭터 홈 | 캐릭터 이름·레벨·다음 레벨까지 편지 수 표시 | `GET /characters/me` (`characterType.name`, `level`, `letterCount`, `nextLevelLetterCount`) |
| 졸업 연출 | `canGraduate`가 true면 졸업 연출 → 졸업 API 호출 → 졸업 카드 표시 | `POST /characters/graduate` |
| 졸업 앨범 | 카드에 이름·편지 수·가장 많이 보낸 기분 표시 | `GET /characters/graduation-cards` (`characterName`, `letterCount`, `topMood`) |
| 꾸미기 탭 | 옷/얼굴/배경 탭별 조회 | `GET /items?itemType=` `clothes` / `face` / `background` |
| 기분 선택 | 6종 값 매핑 | `mood`: `good` 기분 좋아, `excited` 신나, `soso` 그냥그래, `angry` 화가 나, `sad` 슬퍼, `depressed` 우울해 |
| 토큰 갱신 | `AUTH_TOKEN_EXPIRED`면 갱신 후 재요청. 갱신 요청은 한 번만 보내고 나머지는 기다리게 | `POST /auth/refresh` |
| 관리자(필요 시) | 아이템 판매 중지/재개, 캐릭터 종류 관리, 질문 등록, 신고 처리 | `DELETE·PATCH /items/:id`, `/character-types`, `POST /questions/series`, `PUT /questions/series/:id/questions`, `/letter-reports` |

### 바뀐 API (기존 연동 코드 수정 필요)

- 일지: `moodNumber`(숫자) → `mood`(문자열 enum). 요청·응답·캘린더 모두.
- 아이템 유형: `hat`, `accessory` 없어짐 → `clothes`, `face`, `background`. 아이템 응답에 `isOnSale` 추가.
- `DELETE /items/:id`: 행 삭제 → 판매 중지. 다시 팔려면 `PATCH /items/:id { isOnSale: true }`.
- 캐릭터 응답: `experience` 없어짐. `characterType`, `maxLevel`, `letterCount`, `nextLevelLetterCount`, `cycleStartDate`, `graduationDate`, `canGraduate` 추가.
- 졸업 카드 응답: `characterName`, `letterCount`, `topMood`, `periodStart`, `periodEnd` 추가.
- 신고: `reasonType` 선택값, 응답의 `reasonType`은 `null`일 수 있음.
- 로그인 응답에 `refreshToken` 추가. 사용자 응답에서 `friendInviteCode` 없어짐, `email`은 `null`일 수 있음(카카오가 이메일을 주지 않았거나 다른 계정이 이미 쓰는 경우).
- 새 일지의 공개 여부 기본값은 내 설정(마지막 선택). 가입 직후는 비공개.

## 3. 디자인(Figma) 추가가 필요한 화면

- 신고 사유 선택 (선택 입력)
- 온보딩의 친구 초대 코드 입력칸
- 원장실의 설정 메뉴와 설정 화면 (일지 공개, SNS 소개, 푸시, 언어), 로그아웃, 탈퇴
- 캐릭터 종류별 이미지(몽몽이·햄몽이·빼몽이)와 레벨(Lv1~4)별 모습
- 졸업 연출(1년 사이클이 끝났을 때)과 새 캐릭터 소개
- 이미 신고한 글, 판매 중지된 아이템, 졸업일 전 등 에러 안내 문구

## 4. 운영 준비 (백엔드·운영)

- **캐릭터 종류 등록**: 종류가 하나도 없으면 캐릭터를 만들 수 없다(`CHARACTER_TYPE_NOT_REGISTERED`). 개발 DB는 `pnpm seed:dev`, 운영은 관리자 API(`POST /character-types`)로 몽몽이·햄몽이·빼몽이를 넣는다.
- **질문 입력**: 시리즈를 만들고(`POST /questions/series`) 365개를 채운다. 관리자 API(`PUT /questions/series/:id/questions`) 또는 CSV(`pnpm import:questions <시리즈ID> <CSV>`, 형식은 [`samples/questions-sample.csv`](samples/questions-sample.csv)). 응답·출력의 `missingOrderNums`로 빈 날짜를 확인한다.
- **관리자 계정**: `user.role = 'admin'`으로 DB에서 직접 지정한다.

## 5. 나중에 할 일

- **광고 보상 (AdMob)**: 지금은 앱이 "광고 봤다"고 보내면 바로 꿈조각을 준다. AdMob 보상형 광고는 서버 측 확인(SSV) 콜백을 지원하므로, 붙일 때 보상 지급을 이 콜백으로 옮긴다(서명 검증 + 거래 ID 중복 방지). 그 전까지는 연타하면 중복 지급될 수 있다. 전면 광고는 보상이 없어 해당 없음.
- **AI 답장 생성**: 배치(스케줄러)로 주기적으로 모아서 생성. 실행 주기, LLM 호출 실패 시 재시도, 비용 한도, 꿈조각 5개 차감 규칙을 정해야 한다.
- **카카오 로그인 실기기 테스트**: 닉네임 비어 있는 가입, 재로그인 시 이름 유지, 이메일 미동의 가입, 탈퇴 후 재가입.
- **배포 직전**: TypeORM 마이그레이션 도입(캐릭터 종류 3종을 초기 데이터로 포함), 프록시 뒤 `trust proxy` 설정, 서버 여러 대면 요청 제한 저장소 Redis.
