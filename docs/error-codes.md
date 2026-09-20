# 에러 응답 가이드 (프론트용)

모든 에러 응답은 아래 형태이며, **`code`로 분기**하세요. `statusCode`는 대분류, `message`는 사용자 표시용 기본 문구입니다.

```json
{ "success": false, "timestamp": "...", "path": "/api/...", "statusCode": 400,
  "code": "REWARD_INSUFFICIENT", "message": "리워드(꿈조각)가 부족합니다.",
  "details": { "required": 10, "current": 3 },   // 코드별 부가정보 (선택)
  "errors": [ { "field": "password", "code": "MIN_LENGTH", "message": "8자 이상이어야 합니다.", "details": { "limit": 8 } } ]  // VALIDATION_FAILED일 때만
}
```

## 요청 값 검증 (VALIDATION_FAILED, 400)
`errors[]`의 각 항목이 필드+사유 1건입니다. 한 필드에 여러 사유가 올 수 있습니다.

| errors[].code | 의미 | details |
|---|---|---|
| REQUIRED | 필수 값 누락/빈 값 | |
| EMAIL_INVALID | 이메일 형식 오류 | |
| MUST_BE_STRING / MUST_BE_BOOLEAN / MUST_BE_INTEGER / MUST_BE_NUMBER | 타입 오류 | |
| INVALID_ENUM | 허용되지 않은 값 | `allowed[]` |
| INVALID_UUID | UUID 형식 오류 | |
| MIN_LENGTH / MAX_LENGTH | 글자 수 제한 | `limit` |
| MIN_VALUE / MAX_VALUE | 숫자 범위 | `limit` |
| NOT_ALLOWED_FIELD | 정의되지 않은 필드를 보냄 | |
| INVALID_VALUE | 그 외 규칙 위반 | |

## 에러 코드 목록

| code | status | 기본 message |
|---|---|---|
| `VALIDATION_FAILED` | 400 | 요청 값이 올바르지 않습니다. |
| `BAD_REQUEST` | 400 | 잘못된 요청입니다. |
| `UNAUTHORIZED` | 401 | 인증이 필요합니다. |
| `FORBIDDEN` | 403 | 접근이 거부되었습니다. |
| `NOT_FOUND` | 404 | 요청한 리소스를 찾을 수 없습니다. |
| `CONFLICT` | 409 | 요청이 현재 상태와 충돌합니다. |
| `DUPLICATE_RESOURCE` | 409 | 이미 존재하는 값입니다. |
| `RESOURCE_IN_USE` | 409 | 다른 데이터에서 사용 중이라 처리할 수 없습니다. |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류가 발생했습니다. |
| `AUTH_EMAIL_NOT_FOUND` | 401 | 가입되지 않은 이메일입니다. |
| `AUTH_WRONG_PASSWORD` | 401 | 비밀번호가 올바르지 않습니다. |
| `AUTH_SOCIAL_ACCOUNT` | 401 | 소셜 로그인으로 가입된 계정입니다. 해당 방식으로 로그인해주세요. |
| `AUTH_PASSWORD_NOT_SET` | 401 | 비밀번호가 설정되지 않은 계정입니다. |
| `AUTH_ACCOUNT_INACTIVE` | 403 | 사용할 수 없는 계정입니다. |
| `AUTH_TOKEN_MISSING` | 401 | 인증 토큰이 없습니다. |
| `AUTH_TOKEN_EXPIRED` | 401 | 인증 토큰이 만료되었습니다. |
| `AUTH_TOKEN_INVALID` | 401 | 유효하지 않은 인증 토큰입니다. |
| `FORBIDDEN_ROLE` | 403 | 접근 권한이 없습니다. |
| `KAKAO_TOKEN_INVALID` | 401 | 유효하지 않은 카카오 Access Token입니다. |
| `KAKAO_PROFILE_UNAVAILABLE` | 401 | 카카오 사용자 정보를 확인할 수 없습니다. |
| `KAKAO_UPSTREAM_ERROR` | 502 | 카카오 서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요. |
| `USER_NOT_FOUND` | 404 | 사용자를 찾을 수 없습니다. |
| `EMAIL_ALREADY_EXISTS` | 409 | 이미 존재하는 이메일입니다. |
| `INVITE_CODE_INVALID` | 400 | 유효하지 않은 친구 초대 코드입니다. |
| `QUESTION_SERIES_NOT_FOUND` | 404 | 존재하지 않는 질문 시리즈입니다. |
| `QUESTION_SERIES_NOT_SELECTED` | 400 | 질문 시리즈를 먼저 선택해주세요. |
| `QUESTION_EMPTY_SERIES` | 404 | 시리즈에 등록된 질문이 없습니다. |
| `QUESTION_CONTENT_NOT_FOUND` | 404 | 질문 콘텐츠를 찾을 수 없습니다. |
| `LETTER_NOT_FOUND` | 404 | 일지를 찾을 수 없습니다. |
| `LETTER_REPORT_OWN_LETTER` | 403 | 본인 일지는 신고할 수 없습니다. |
| `AI_REPLY_NOT_FOUND` | 404 | AI 답장을 찾을 수 없습니다. |
| `ITEM_NOT_FOUND` | 404 | 아이템을 찾을 수 없습니다. |
| `CHARACTER_ITEM_ALREADY_OWNED` | 409 | 이미 보유한 아이템입니다. |
| `CHARACTER_ITEM_NOT_OWNED` | 404 | 보유한 아이템을 찾을 수 없습니다. |
| `REWARD_INSUFFICIENT` | 400 | 리워드(꿈조각)가 부족합니다. |
| `CHARACTER_NOT_FOUND` | 404 | 졸업 가능한 캐릭터를 찾을 수 없습니다. |
| `AD_ALREADY_VIEWED_TODAY` | 409 | 오늘은 이미 시청한 광고입니다. |
| `NOTICE_NOT_FOUND` | 404 | 공지를 찾을 수 없습니다. |

## message / details 규칙
- `message`는 **항상 한글**이며 화면에 그대로 표시해도 됩니다. (Nest/passport 기본 영문 문구는 쓰지 않음)
- 케이스별 상세 문구 예:
  - `REWARD_INSUFFICIENT`: "리워드(꿈조각)가 부족합니다. (필요 10개, 보유 3개)" / details `{required, current}`
  - `AUTH_SOCIAL_ACCOUNT`: "카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요." / details `{loginType}`
  - `AUTH_ACCOUNT_INACTIVE`: 탈퇴 → "탈퇴한 계정입니다." / 비활성 → "비활성화된 계정입니다. 고객센터에 문의해주세요." / details `{status}`
  - `CHARACTER_ITEM_ALREADY_OWNED`: "이미 보유한 아이템입니다. (아이템명)" / details `{itemId}`
  - `AD_ALREADY_VIEWED_TODAY`: details `{adType}`, `INVITE_CODE_INVALID`: details `{friendInviteCode}`
  - `*_NOT_FOUND`(사용자/일지/공지/아이템/AI답장/시리즈 등): "일지를 찾을 수 없습니다. (letterId: 12)" / details `{letterId}` 등 대상 식별값
  - `VALIDATION_FAILED`: "요청 값이 올바르지 않습니다. (email: 이메일 형식이 올바르지 않습니다. 외 2건)" + `errors[]` 전체 목록

## API별 발생 가능 에러
(모든 인증 API 공통: `AUTH_TOKEN_EXPIRED` 401 → 재로그인, `AUTH_TOKEN_MISSING`/`AUTH_TOKEN_INVALID` 401 → 로그인 화면. `INTERNAL_ERROR` 500은 전 API 공통.)

### POST /auth/login
`VALIDATION_FAILED`(400), `AUTH_EMAIL_NOT_FOUND`(401), `AUTH_WRONG_PASSWORD`(401), `AUTH_SOCIAL_ACCOUNT`(401), `AUTH_PASSWORD_NOT_SET`(401), `AUTH_ACCOUNT_INACTIVE`(403)

### POST /auth/register
`VALIDATION_FAILED`(400), `EMAIL_ALREADY_EXISTS`(409), `INVITE_CODE_INVALID`(400)

### POST /auth/kakao
`VALIDATION_FAILED`(400), `KAKAO_TOKEN_INVALID`(401), `KAKAO_PROFILE_UNAVAILABLE`(401), `KAKAO_UPSTREAM_ERROR`(502)

### GET /auth/me
`USER_NOT_FOUND`(404)

### PATCH /auth/me
`VALIDATION_FAILED`(400), `USER_NOT_FOUND`(404), `QUESTION_SERIES_NOT_FOUND`(404)

### GET /character-items
-

### POST /character-items
`VALIDATION_FAILED`(400), `ITEM_NOT_FOUND`(404), `CHARACTER_ITEM_ALREADY_OWNED`(409), `REWARD_INSUFFICIENT`(400), `USER_NOT_FOUND`(404)

### PATCH /character-items/:id
`VALIDATION_FAILED`(400), `CHARACTER_ITEM_NOT_OWNED`(404)

### GET /characters/me
-

### POST /characters/graduate
`CHARACTER_NOT_FOUND`(404)

### GET /characters/graduation-cards
-

### GET /items
`VALIDATION_FAILED`(400)

### POST /items
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403)

### PATCH /items/:id
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `ITEM_NOT_FOUND`(404)

### DELETE /items/:id
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `ITEM_NOT_FOUND`(404), `RESOURCE_IN_USE`(409)

### PATCH /ai-replies/:id/read
`VALIDATION_FAILED`(400), `AI_REPLY_NOT_FOUND`(404)

### GET /letters
`VALIDATION_FAILED`(400)

### GET /letters/:id
`VALIDATION_FAILED`(400), `LETTER_NOT_FOUND`(404)

### POST /letters
`VALIDATION_FAILED`(400), `USER_NOT_FOUND`(404), `QUESTION_SERIES_NOT_SELECTED`(400)

### GET /letters/:id/ai-replies
`VALIDATION_FAILED`(400), `LETTER_NOT_FOUND`(404)

### POST /letters/:id/reactions
`VALIDATION_FAILED`(400), `LETTER_NOT_FOUND`(404)

### POST /letters/:id/reports
`VALIDATION_FAILED`(400), `LETTER_REPORT_OWN_LETTER`(403), `LETTER_NOT_FOUND`(404)

### GET /notices
`VALIDATION_FAILED`(400)

### GET /notices/:id
`VALIDATION_FAILED`(400), `NOTICE_NOT_FOUND`(404)

### POST /notices
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403)

### PATCH /notices/:id
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `NOTICE_NOT_FOUND`(404)

### DELETE /notices/:id
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `NOTICE_NOT_FOUND`(404)

### GET /questions/series
-

### GET /questions/today
`VALIDATION_FAILED`(400), `USER_NOT_FOUND`(404), `QUESTION_SERIES_NOT_SELECTED`(400), `QUESTION_EMPTY_SERIES`(404), `QUESTION_CONTENT_NOT_FOUND`(404)

### GET /rewards/history
`VALIDATION_FAILED`(400)

### POST /rewards/ad-view
`VALIDATION_FAILED`(400), `AD_ALREADY_VIEWED_TODAY`(409), `USER_NOT_FOUND`(404)

### GET /users
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403)

### GET /users/:id
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `USER_NOT_FOUND`(404)

### POST /users
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `EMAIL_ALREADY_EXISTS`(409), `INVITE_CODE_INVALID`(400)

### PATCH /users/:id
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `USER_NOT_FOUND`(404), `QUESTION_SERIES_NOT_FOUND`(404)

### DELETE /users/:id
`VALIDATION_FAILED`(400), `FORBIDDEN_ROLE`(403), `USER_NOT_FOUND`(404)
