# TODO

## AI 답장 생성 방식 결정 필요 (Phase 2)

`letter` 도메인에 AI 답장(`ai_reply`) 조회/읽음 처리/반응/신고 API는 구현했지만,
**AI 답장을 실제로 생성하는 로직은 아직 없다.** 아래 중 하나로 결정 필요:

- 외부 LLM 실시간 호출: 일지(`POST /letters`) 작성 직후 즉시 LLM API를 호출해 답장 생성
- 배치/스케줄러: `user.aiReplyCycle` 조건에 맞는 사용자를 주기적으로 모아 일괄 생성

결정 후 `letter` 모듈에 생성 트리거(서비스 메서드 또는 스케줄러)를 추가한다.

## 재화(꿈조각) 동시성/정합성 (우선순위 높음)

- `user.rewardCount`를 read-modify-write(`+=` 후 `save`)로 갱신 중이라 동시 요청 시 유실/중복 가능. (`LetterService.create`, `RewardService`, `CharacterService.purchaseItem`)
  - `reward_count = reward_count + :n` 원자적 증감 또는 `pessimistic_write` 락 적용, 차감은 `WHERE reward_count >= :n` 조건 추가
- `user.rewardCount`(잔액)와 `reward_history`(이력)가 이중 관리됨. 이력을 원장으로 삼을지 정하고, 정합성 점검 쿼리 마련
- 보상 규칙이 `LetterService`, `RewardService` 등에 흩어져 있음. `RewardService`에 `grant`/`spend`를 모아 위 동시성 문제를 한곳에서 해결

## DB / 성능

- 조회 컬럼 인덱스 추가 검토: `letter.userId`, `character_item_map.characterId`, `reward_history.userId`, `ai_reply.letterId` 등 (현재 `@Index`는 `ad_view_log`, `user`에만 있음. PostgreSQL은 FK 컬럼에 인덱스를 자동 생성하지 않음)
- `synchronize` 의존 제거, TypeORM 마이그레이션 도입 (운영 전)

## 기능 / 정책

- `ad_view_log.viewDate`를 UTC(`toISOString`)로 계산해 KST 자정 기준과 9시간 어긋남. 기준 타임존을 정하고 반영
- AI 답장 생성 방식 결정 시 함께 정할 것: 타임아웃, 재시도, 비용 제어, 실패 처리 (위 "AI 답장 생성 방식 결정 필요" 참고)

## 보안 / 운영

- `helmet`, rate limit(`@nestjs/throttler`: 로그인, 광고 시청, 편지 작성), 헬스체크 엔드포인트 없음

## 테스트 / 문서

- e2e 테스트 부재. 최소한 재화 흐름(편지 작성 → 보상 → 아이템 구매) 통합 테스트
- `README.md`가 NestJS 템플릿 그대로. `docs/architecture.md`, `docs/error-codes.md`로 연결
- 하드 삭제 API 추가 시 자식 데이터 정리 규칙 문서화 (`Question` 삭제는 참조 여부 검사 필요)
