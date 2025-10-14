# Helpernote | Operations Guide

플랫폼 운영자와 디자이너, 고객 지원 담당자가 일관된 경험을 제공할 수 있도록 브랜드 가이드, 데이터 관리, 점검 절차를 정리했습니다.

## 1. 브랜드 & UI 가이드

- **브랜드 컨셉**: 전문성·연결성·효율성·성장의 가치를 전달하는 B2B SaaS
- **로고 파일**: `public/logo.svg`, `public/logo-icon.svg`, `public/favicon.svg`
- **컬러 팔레트**
  - Primary Blue: `#2563eb` (Light) / `#3b82f6` (Dark)
  - Secondary Green: `#16a34a` / `#22c55e`
  - Accent Amber: `#f59e0b` / `#fbbf24`
  - Semantic: Red(위험), Green(성공), Amber(경고), Blue(정보)
- **타이포그래피**
  - Sans: Inter (기본 UI)
  - Serif: Merriweather (강조 텍스트)
  - Mono: JetBrains Mono (데이터, 코드)
- **컴포넌트 원칙**
  - 버튼 높이 40px, 라운드 6~8px
  - 입력 필드 포커스 링은 Primary Blue, outline 명확히 표시
  - 카드 그림자 최소화, 경계선 1px 유지
- Figma 또는 디자인 소스가 있다면 최신 버전을 문서화하고 링크를 유지합니다.

## 2. 데이터 & 콘텐츠 관리

| 영역 | 위치 | 운영 지침 |
| ---- | ---- | ---- |
| 구인자/구직자 | PostgreSQL (`matching`, `employers`, `candidates` 테이블) | 개인정보 보호법 준수, 민감 데이터 암호화 |
| 매칭 메모 | Backend API (`notes` 테이블) | 변경 이력 로깅, 접근 권한 검사 |
| 첨부 파일 | MinIO 버킷 `helpernote` | 폴더 구조 `employers/<id>` / `candidates/<id>` |
| 정산 데이터 | PostgreSQL `settlements` | 금액/지급일 검증 로직 유지, 회계팀 협의 |
| UI 복사본 | `frontend/content/` 혹은 JSON 리소스 | 텍스트 변경 시 QA 및 번역 확인 |

### 데이터 마이그레이션
- 스키마 변경 전 `database/schema.sql` 및 `migrations/` 확인
- `make migrate` 또는 `sqlx migrate run` 사용
- 롤백 플랜을 PR에 명시하고, 테스트 데이터베이스에서 먼저 검증합니다.

## 3. 체크리스트

### 배포 전
- [ ] `.env`, Kubernetes Secret에 실제 도메인/키가 반영되었는가?
- [ ] `make test`(백엔드/프런트엔드)가 통과되는가?
- [ ] Lighthouse ≥ 90 (Performance/Accessibility) 유지
- [ ] MinIO 버킷 권한 및 CORS 정책 검토
- [ ] 운영 팀 공지 (새 기능, 릴리스 노트) 준비

### 배포 후
- [ ] `/health` 엔드포인트와 주요 API 응답 200 확인
- [ ] 신규 매칭 등록 → 정산 → 보고서 다운로드까지 스모크 테스트
- [ ] MinIO 업로드/다운로드 테스트
- [ ] 로그 모니터링 (backend, frontend, minio, ingress)
- [ ] 주요 지표 (활성 세션, 오류율, DB 커넥션) 확인

### 정기 점검
- **주간**: 에러 트래킹, 고객 문의/지원 티켓 검토, MinIO 사용량 점검
- **월간**: PostgreSQL 백업 복원 테스트, JWT/MinIO 키 로테이션, 드래프트 기능 리뷰
- **분기**: 도메인/TLS 만료일 확인, CI/CD 시크릿 리뷰, 문서 업데이트

## 4. 자동화 스크립트 & 도구

- `Makefile` 주요 명령
  - `make dev-up/down`: 로컬 인프라 부팅/종료
  - `make backend-dev` / `frontend-dev`: 핫 리로드 개발 서버
  - `make test`: 백엔드/프런트엔드 테스트 실행
  - `make clean`: 볼륨/캐시 정리
- `scripts/` 예시
  - `create-k8s-secrets.sh`: Kubernetes Secret 생성
  - `backup-database.sh`: 수동 백업 템플릿
  - `post-deploy-smoke.sh`: 배포 후 검증 시나리오(필요 시 추가)

스크립트 실행 전 `chmod +x scripts/<name>.sh`로 실행 권한을 부여합니다.

## 5. 고객 지원 & 운영 정책

- **문의 채널**: 고객 지원 이메일, Slack, 전화 등 운영 채널 정의
- **SLA**: 티켓 분류(긴급, 보통, 문의)에 따라 응답/해결 목표 시간 설정
- **접근 제어**: 운영자 계정은 RBAC(역할 기반)로 관리, 비정상 접근 모니터링
- **감사 로그**: 중요 변경(정산 수정, 메모 삭제 등)은 감사 테이블에 기록

## 6. 백업 & 복구 개요

- PostgreSQL: `CronJob` + `pg_dump` (보존 30일), 복구 테스트는 월 1회 이상
- MinIO: 필요 시 버킷 버전닝/라이프사이클 정책 적용
- 백업 위치: Cloudflare R2 또는 S3 호환 스토리지 (환경에 맞게 설정)
- 복구 절차는 `docs/security.md` 또는 별도 런북에 상세화하고, 운영팀이 주기적으로 훈련합니다.

