# Helpernote — Employment Agency Management Platform

Helpernote는 구인/구직 매칭, 커미션 정산, 메모 관리에 특화된 취업 중개 플랫폼 템플릿입니다. 실제 배포 전에는 모든 도메인, 비밀 값, 브랜딩 요소를 본인 환경에 맞게 교체해야 합니다.

## 주요 기능
- 고객/공고/매칭/정산을 아우르는 통합 관리자 대시보드
- 매칭 이력, 커미션 계산, 일정 알림 등 중개 업무 자동화
- 메모 및 파일 첨부를 지원하는 상세 기록 기능
- PostgreSQL + MinIO 기반의 확장 가능한 데이터 저장 구조

## 기술 스택
- **Backend**: Rust, Axum, SQLx, JWT, PostgreSQL
- **Frontend**: Next.js 15, Typescript, Tailwind CSS, shadcn/ui
- **Storage**: MinIO (S3 호환 오브젝트 스토리지)
- **Infra**: Docker Compose, Kubernetes, ArgoCD, Kong Ingress, GHCR

## 디렉터리 구조
```
backend/       Rust API 서버
frontend/      Next.js 웹 클라이언트
database/      스키마 및 마이그레이션
docs/          환경/배포/운영/보안 문서
k8s/           Kubernetes 매니페스트 (base/overlays)
argocd/        ArgoCD 애플리케이션 정의
scripts/       자동화 스크립트
Makefile       로컬 개발 및 CI 유틸리티
```

## 빠른 시작

### 1. 요구 사항
- Docker & Docker Compose
- Rust 1.83+, Node.js 20+, npm 10 (로컬 개발 시)

### 2. 환경 변수 복사
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
자세한 설정은 `docs/environment.md`를 참고하세요.

### 3. 로컬 개발
```bash
make dev-up          # PostgreSQL + MinIO 기동
make backend-dev     # 백엔드 실행 (별도 터미널)
make frontend-dev    # 프런트엔드 실행 (별도 터미널)
```
- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- MinIO Console: http://localhost:9001

### 4. 테스트 & 빌드
```bash
make test            # 백엔드/프런트엔드 테스트
make build           # Docker 이미지 빌드
make down            # 로컬 리소스 정리
```

## 배포 개요
- GitHub Actions가 `main` 브랜치에 push되면 백엔드/프런트엔드 Docker 이미지를 빌드하여 GHCR에 푸시합니다.
- 워크플로가 `k8s/overlays/production` 이미지 태그를 갱신하면 ArgoCD가 Kubernetes에 자동 배포합니다.
- Ingress는 Kong Gateway를 사용하며, TLS는 cert-manager 또는 수동 Secret으로 관리할 수 있습니다.
- 상세 절차는 `docs/deployment.md`에서 확인하세요.

## 문서
- `docs/environment.md` – 환경 변수 및 시크릿 구성
- `docs/deployment.md` – CI/CD, Kubernetes, ArgoCD 배포 가이드
- `docs/workflow.md` – 브랜치 전략, 코드 리뷰, 테스트 정책
- `docs/operations.md` – 브랜드 가이드, 데이터 관리, 운영 체크리스트
- `docs/security.md` – 비밀 관리, 접근 제어, 공개 전 점검표

## 유지보수 팁
- 모든 개인정보는 암호화/마스킹 처리 후 저장하고, 감사 로그를 보관합니다.
- `cargo audit`, `npm audit`, 컨테이너 이미지 스캔 도구로 취약점을 주기적으로 점검합니다.
- PostgreSQL/MinIO 백업과 복구 테스트를 월 1회 이상 수행합니다.
- 공개 저장소로 전환할 때는 `reset-git-history.sh` 스크립트로 히스토리를 정리하세요.
- 자동화 에이전트 작업은 `agent/<issue-id>-slug` 브랜치에서 진행하고, 사람 검토 후 develop/main에 반영합니다.
- 민감한 환경 변수는 `./scripts/seal-secrets.sh`로 SealedSecret을 생성해 `k8s/sealed-secrets/`에 커밋합니다.
