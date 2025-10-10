# Helpernote

인력소개소 구인/구직 매칭 중개 서비스

## 프로젝트 개요

Helpernote는 인력소개소 중개자가 구인자와 구직자를 효율적으로 관리하고 매칭하는 서비스입니다. 고도화된 메모 기능을 기반으로 업무 효율성을 극대화합니다.

### 주요 기능

- **대시보드**: 전체 업무 현황 한눈에 파악
- **고객 관리**: 구인자/구직자 정보 통합 관리
- **구인 공고 관리**: 구인 공고 등록 및 관리
- **구직 공고 관리**: 구직 공고 등록 및 관리
- **매칭 관리**: 구인자-구직자 매칭 프로세스
- **정산 관리**: 중개 수수료 정산 관리
- **계정 설정**: 사용자 설정 및 기본 수수료율 관리

## 기술 스택

### Backend
- **Language**: Rust
- **Framework**: Axum
- **Database ORM**: SQLx
- **Authentication**: JWT

### Frontend
- **Framework**: Next.js 15
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS

### Infrastructure
- **Database**: PostgreSQL
- **Object Storage**: MinIO
- **Container Orchestration**: Kubernetes
- **GitOps**: ArgoCD
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (GHCR)
- **Development**: Docker Compose

## 시작하기

### 필수 요구사항

- Docker & Docker Compose
- Rust (1.83+) - 로컬 개발 시
- Node.js (22+) - 로컬 개발 시

### 개발 환경 설정

1. **환경 변수 설정**

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

2. **데이터베이스 및 MinIO 시작**

```bash
make dev-up
```

3. **Backend 개발 서버 실행**

```bash
make backend-dev
```

4. **Frontend 개발 서버 실행** (새 터미널)

```bash
cd frontend
npm install
npm run dev
```

### Docker로 전체 서비스 실행

```bash
# 이미지 빌드
make build

# 서비스 시작
make up

# 로그 확인
make logs

# 서비스 중지
make down
```

## 개발 명령어

전체 명령어 목록은 다음 명령어로 확인:

```bash
make help
```

주요 명령어:
- `make dev` - 개발 환경 시작 (DB + MinIO)
- `make backend-dev` - Backend 개발 서버 실행
- `make frontend-dev` - Frontend 개발 서버 실행
- `make test` - 테스트 실행
- `make clean` - 모든 데이터 및 빌드 아티팩트 제거

## 접속 정보

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

## 데이터베이스

PostgreSQL 스키마는 `database/schema.sql`에 정의되어 있으며, Docker Compose 실행 시 자동으로 초기화됩니다.

### 샘플 계정

- Username: `admin`
- Password: `password123`

## 배포

### CI/CD 파이프라인

#### GitHub Actions Workflows

**develop 브랜치** (`.github/workflows/ci-develop.yaml`):
- Backend: rustfmt, clippy, tests, build
- Frontend: lint, type check, build
- Docker: build test

**main 브랜치** (`.github/workflows/cd-production.yaml`):
- Docker 이미지 빌드 및 GHCR 푸시
- Kubernetes 매니페스트 업데이트
- ArgoCD 자동 배포 트리거

### Kubernetes 배포

#### 구조
```
k8s/
├── base/                    # Base manifests
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-statefulset.yaml
│   └── minio-statefulset.yaml
└── overlays/
    └── production/          # Production overrides
        ├── kustomization.yaml
        ├── resources-patch.yaml
        └── ingress-patch.yaml
```

#### ArgoCD 설정
- **Application**: `helpernote-production`
- **Namespace**: `helpernote`
- **Sync Policy**: Automated (prune, selfHeal)
- **Source**: `https://github.com/e16tae/helpernote.git` (main 브랜치)

### 배포 문서

상세한 배포 가이드는 다음 문서를 참고하세요:
- [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) - 현재 배포 상태
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 체크리스트
- [CLAUDE.md](./CLAUDE.md) - 프로젝트 상세 문서

### 배포 확인

```bash
# GitHub Actions 워크플로우 확인
https://github.com/e16tae/helpernote/actions

# ArgoCD UI 접속 (포트 포워딩)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Kubernetes 리소스 확인
kubectl get all -n helpernote

# 애플리케이션 health check
curl https://api.helpernote.com/health
curl https://www.helpernote.com/api/health
```

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
