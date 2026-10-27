# T07 교차 계정 접근 제어 시험 · 2026-10-26

## 대상
- T06 최종 스냅샷: 9f3a49a261a2d7d937a95b73cba32ad4bf9df137
- T07 테이블: pds07_plans, pds07_tasks, pds07_runs, pds07_plan_revisions, pds07_completions, pds07_daily, pds07_rules.
- 사용자 식별정보와 세션값은 증거에서 제거한다.

## 실제 확인 · SQL 트랜잭션, ROLLBACK
- 유효한 B 계정 세션의 역할/클레임을 설정하여 A의 단일 계획 ID에 대해 SQL 조회/수정/삭제를 수행.
- B→A: foreign_read=0, foreign_update=0, foreign_delete=0, visible_list=1. SQL은 ROLLBACK으로 종료.
- A→B: 외부 계획 read/update/delete=0. 다만 A의 세션이 로그아웃으로 사라진 상태라 visible_list=0이므로 이 방향의 **유효한 로그인 상태 거절 증거로 간주하지 않음**. 재로그인 후 재시험 필요.
- 서버에서 확인된 세션 수: A=0, B=2 (확인 시점).
- 실제 자료 개수: A 계획 3건, B 테스트 계획 1건. B 브라우저에는 B 계획 1건만 표시됨.

## 남은 시험
- A 재로그인 후 A→B 3개 메서드 재시험.
- HTTP API 같은 경로/메서드에 대해 익명 401 및 타인 자료 404 요청·응답 기록 수집.
- 세션 로그아웃 및 비밀번호 변경 전후 이전 토큰 거절 실측.
- 계정 삭제, 암호 해시 비교, 5일 실사용 및 규칙 변경.

## 보안 판단
- SQL 결과의 0행 차단은 RLS 통과 자료이며 HTTP 응답코드 403/404 자체의 증거는 아니다.
- 노출 금지: 비밀번호, access/refresh token, secret key, 전체 비밀번호 해시.

## 추가 시험 · 2026-10-27
- A 본인 로그인으로 auth.sessions 내 유효 세션 1건 확인.
- A→B: foreign_read=0, foreign_update=0, foreign_delete=0, visible_plans=3. authenticated 역할 및 session_id claim 사용. BEGIN/ROLLBACK으로 원본 불변.
- 익명 anon 역할에서 pds07_plans 테이블 SELECT: PostgreSQL 42501 permission denied (직접 DB 역할 시험).
- SQL 차단 결과는 실측 완료. HTTP 401/404 응답 자체는 아직 네트워크 요청으로 실측하지 못함.
- A→B 및 B→A 모두 유효 로그인 시 자료 격리를 확인했으며 이전의 미확인 A→B 기록을 이번 시험으로 보완함.
