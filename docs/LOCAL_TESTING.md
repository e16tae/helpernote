# Helpernote | 로컬 테스트 환경 구축 가이드

이 문서는 로컬 환경에서 전체 테스트 스위트를 실행하기 위한 완전한 가이드입니다. Docker Compose와 nerdctl compose 두 가지 방법을 모두 지원합니다.

## 📋 목차

1. [개요](#개요)
2. [Docker Compose 방식](#docker-compose-방식)
3. [nerdctl compose 방식](#nerdctl-compose-방식)
4. [테스트 실행](#테스트-실행)
5. [트러블슈팅](#트러블슈팅)
6. [비교표](#비교표)

---

## 개요

### 테스트 환경 구성 요소

```
┌─────────────────────────────────────────┐
│         로컬 개발 머신                      │
├─────────────────────────────────────────┤
│  Frontend (Next.js)    :3000            │
│  Backend (Axum)        :8000            │
├─────────────────────────────────────────┤
│  컨테이너 런타임 (Docker/containerd)      │
│    ├─ PostgreSQL      :5432            │
│    └─ MinIO           :9000, :9001     │
└─────────────────────────────────────────┘
```

### 필요한 도구

**공통**:
- Git
- Rust 1.83+ (`rustup`, `cargo`)
- Node.js 20+ & npm 10+

**방식별**:
- **Docker Compose**: Docker Desktop 또는 Docker Engine + docker-compose
- **nerdctl compose**: containerd + nerdctl

---

## Docker Compose 방식

### 1. 설치 확인

```bash
# Docker 설치 확인
docker --version
# Docker version 24.0.0 이상

# Docker Compose 설치 확인
docker compose version
# Docker Compose version v2.20.0 이상
```

**설치가 필요한 경우**:
- Linux: https://docs.docker.com/engine/install/
- macOS/Windows: https://www.docker.com/products/docker-desktop/

### 2. 환경 변수 설정

```bash
cd /path/to/helpernote

# 1. 루트 디렉터리 환경 변수 (없으면 생략 가능)
cp .env.example .env

# 2. Backend 환경 변수
cp backend/.env.example backend/.env

# 3. Frontend 환경 변수
cp frontend/.env.example frontend/.env
```

**backend/.env 필수 설정**:
```bash
DATABASE_URL=postgresql://helpernote:helpernote@localhost:5432/helpernote
JWT_SECRET=your-secret-key-min-32-chars-long
JWT_EXPIRATION=3600

MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=helpernote
MINIO_USE_SSL=false
```

**frontend/.env 필수 설정**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 의존성 컨테이너 시작

```bash
# Makefile 사용 (권장)
make dev-up

# 또는 직접 명령
docker compose -f docker-compose.dev.yml up -d

# 로그 확인
docker compose -f docker-compose.dev.yml logs -f
```

**컨테이너 상태 확인**:
```bash
docker ps
# NAMES                      STATUS
# helpernote-postgres-dev    Up (healthy)
# helpernote-minio-dev       Up (healthy)
```

### 4. 데이터베이스 초기화 확인

```bash
# PostgreSQL 접속 테스트
docker exec -it helpernote-postgres-dev psql -U helpernote -d helpernote -c '\dt'

# 스키마가 로드되어 있어야 함 (users, customers, matchings 등)
```

### 5. MinIO 버킷 생성

```bash
# MinIO 콘솔 접속
open http://localhost:9001
# 또는: firefox http://localhost:9001

# 로그인: minioadmin / minioadmin
# Buckets → Create Bucket → Name: helpernote → Create
```

**또는 CLI로 버킷 생성**:
```bash
# mc (MinIO Client) 설치
brew install minio/stable/mc  # macOS
# 또는 https://min.io/docs/minio/linux/reference/minio-mc.html

# MinIO alias 설정
mc alias set local http://localhost:9000 minioadmin minioadmin

# 버킷 생성
mc mb local/helpernote

# 확인
mc ls local/
```

### 6. Backend 테스트 실행

```bash
cd backend

# 의존성 설치 (첫 실행 시)
cargo build

# 전체 테스트 실행
cargo test

# 특정 테스트만 실행
cargo test --test unit                    # 유닛 테스트
cargo test --test integration_workflows   # 통합 테스트
cargo test --test auth_integration_test   # 인증 테스트

# 테스트 커버리지 (cargo-tarpaulin 필요)
cargo install cargo-tarpaulin
cargo tarpaulin --out Html --output-dir ./coverage
open coverage/index.html
```

### 7. Frontend 테스트 실행

```bash
cd frontend

# 의존성 설치 (첫 실행 시)
npm install

# 유닛 테스트
npm run test

# 테스트 커버리지
npm run test:coverage
open coverage/lcov-report/index.html

# E2E 테스트 (백엔드 실행 필요)
# 터미널 1: Backend 실행
cd backend && cargo run

# 터미널 2: Frontend dev 서버 실행
cd frontend && npm run dev

# 터미널 3: E2E 테스트 실행
cd frontend
npx playwright install  # 첫 실행 시
npm run test:e2e

# UI 모드로 E2E 테스트 (권장)
npm run test:e2e:ui
```

### 8. 정리

```bash
# 컨테이너 중지
docker compose -f docker-compose.dev.yml down

# 데이터까지 삭제 (주의!)
docker compose -f docker-compose.dev.yml down -v

# 또는 Makefile 사용
make dev-down    # 컨테이너만 중지
make clean       # 모든 데이터 삭제
```

---

## nerdctl compose 방식

### 1. 설치 확인

```bash
# containerd 설치 확인
sudo systemctl status containerd
# Active: active (running)

# nerdctl 설치 확인
nerdctl --version
# nerdctl version 1.7.0 이상
```

**설치가 필요한 경우**:

**containerd** (이미 설치된 경우 건너뛰기):
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install containerd

# 또는 최신 버전
wget https://github.com/containerd/containerd/releases/download/v1.7.11/containerd-1.7.11-linux-amd64.tar.gz
sudo tar Cxzvf /usr/local containerd-1.7.11-linux-amd64.tar.gz

sudo systemctl enable --now containerd
```

**nerdctl**:
```bash
# 최신 릴리스 다운로드
wget https://github.com/containerd/nerdctl/releases/download/v1.7.2/nerdctl-full-1.7.2-linux-amd64.tar.gz

# 설치
sudo tar Cxzvf /usr/local nerdctl-full-1.7.2-linux-amd64.tar.gz

# 확인
nerdctl --version
```

### 2. 환경 변수 설정

Docker Compose 방식과 동일합니다 (위 섹션 2 참조).

### 3. 의존성 컨테이너 시작

```bash
# 헬퍼 스크립트 사용 (권장)
./scripts/nerd-compose-up.sh

# 빌드와 함께 시작
./scripts/nerd-compose-up.sh --build

# 특정 서비스만 시작
./scripts/nerd-compose-up.sh postgres

# 또는 직접 명령
sudo nerdctl compose -f nerd-compose.yaml up -d

# 로그 확인
sudo nerdctl compose -f nerd-compose.yaml logs -f
```

**컨테이너 상태 확인**:
```bash
sudo nerdctl ps
# NAMES                STATUS
# nerd-postgres-1      Up
# nerd-minio-1         Up
```

### 4. 데이터베이스 초기화 확인

```bash
# PostgreSQL 접속 테스트
sudo nerdctl exec -it nerd-postgres-1 psql -U helpernote -d helpernote -c '\dt'
```

### 5. MinIO 버킷 생성

Docker Compose 방식과 동일합니다 (위 섹션 5 참조).

### 6. Backend & Frontend 테스트 실행

Docker Compose 방식의 섹션 6, 7과 동일합니다.

### 7. 정리

```bash
# 컨테이너 중지
sudo nerdctl compose -f nerd-compose.yaml down

# 데이터까지 삭제 (주의!)
sudo nerdctl compose -f nerd-compose.yaml down -v

# 또는 헬퍼 스크립트 사용
./scripts/nerd-compose-down.sh
./scripts/nerd-compose-down.sh --volumes  # 데이터 삭제
```

---

## 테스트 실행

### 빠른 시작 (Makefile 사용)

```bash
# 1. 의존성 컨테이너 시작
make dev-up

# 2. 모든 테스트 실행
make test-all

# 3. 커버리지 리포트 생성
make test-coverage

# 4. E2E 테스트만 실행
make test-e2e

# 5. 정리
make dev-down
```

### 단계별 테스트

#### Backend 테스트
```bash
cd backend

# 1. 유닛 테스트 (빠름, ~5초)
cargo test --test unit

# 2. 통합 테스트 (DB 필요, ~30초)
cargo test --test integration_workflows
cargo test --test customer_repository_test
cargo test --test auth_integration_test

# 3. 전체 테스트
cargo test --verbose

# 4. 특정 테스트만
cargo test health_check
cargo test user_repository
```

#### Frontend 테스트
```bash
cd frontend

# 1. 유닛 테스트 (빠름, ~10초)
npm run test

# 2. 특정 테스트 파일만
npm run test src/lib/__tests__/api-client.test.ts

# 3. Watch 모드 (개발 시)
npm run test:watch

# 4. E2E 테스트 (느림, ~2분)
# Backend와 Frontend가 실행 중이어야 함
npm run test:e2e

# 5. E2E UI 모드 (디버깅 시)
npm run test:e2e:ui
```

### CI와 동일한 환경에서 테스트

```bash
# GitHub Actions CI와 동일한 순서로 실행

# Backend
cd backend
cargo fmt -- --check
cargo clippy -- -D warnings
cargo test --verbose

# Frontend
cd frontend
npm ci
npm run lint
npm run type-check
npm run test -- --runInBand
npm run build
npx playwright install chromium
npm run test:e2e
```

---

## 트러블슈팅

### Docker Compose 문제

#### 1. 포트 충돌 (5432, 9000, 9001)
```bash
# 기존 프로세스 확인
sudo lsof -i :5432
sudo lsof -i :9000

# PostgreSQL 서비스 중지 (시스템 설치된 경우)
sudo systemctl stop postgresql

# 다른 컨테이너 확인
docker ps -a | grep postgres
docker ps -a | grep minio
```

**해결**: `docker-compose.dev.yml`에서 포트 변경
```yaml
ports:
  - "15432:5432"  # PostgreSQL을 15432로 변경
```

#### 2. 권한 에러 (Permission denied)
```bash
# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER
newgrp docker

# 또는 sudo 사용
sudo docker compose -f docker-compose.dev.yml up -d
```

#### 3. 볼륨 데이터 초기화 안 됨
```bash
# 볼륨 완전 삭제 후 재생성
docker compose -f docker-compose.dev.yml down -v
rm -rf .docker/postgres-data .docker/minio-data
docker compose -f docker-compose.dev.yml up -d
```

#### 4. 헬스체크 실패 (Unhealthy)
```bash
# 로그 확인
docker compose -f docker-compose.dev.yml logs postgres
docker compose -f docker-compose.dev.yml logs minio

# 컨테이너 재시작
docker compose -f docker-compose.dev.yml restart postgres
```

### nerdctl compose 문제

#### 1. sudo 권한 필요
```bash
# rootless 모드 설정
containerd-rootless-setuptool.sh install

# 또는 항상 sudo 사용
alias nerdctl='sudo nerdctl'
```

#### 2. containerd 소켓 찾을 수 없음
```bash
# containerd 소켓 위치 확인
sudo systemctl status containerd | grep Listen

# 환경 변수 설정
export CONTAINERD_ADDRESS=/run/containerd/containerd.sock
```

#### 3. 네트워크 생성 실패
```bash
# CNI 플러그인 확인
ls /opt/cni/bin/

# 없으면 설치
wget https://github.com/containernetworking/plugins/releases/download/v1.3.0/cni-plugins-linux-amd64-v1.3.0.tgz
sudo mkdir -p /opt/cni/bin
sudo tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-v1.3.0.tgz
```

### 테스트 실패

#### Backend 테스트 실패

**DATABASE_URL 에러**:
```bash
# .env 파일 확인
cat backend/.env | grep DATABASE_URL

# 연결 테스트
psql postgresql://helpernote:helpernote@localhost:5432/helpernote -c 'SELECT 1'
```

**MinIO 연결 에러**:
```bash
# MinIO 상태 확인
curl http://localhost:9000/minio/health/live

# 버킷 존재 확인
mc ls local/helpernote

# 버킷이 없으면 생성
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/helpernote
mc ls local/  # 확인
```

**파일 업로드 500 에러** (`/api/users/files`):
```bash
# 원인: MinIO 버킷이 생성되지 않음
# 증상: 파일 업로드 시 500 Internal Server Error

# 해결: 버킷 생성
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/helpernote

# 확인: 파일 업로드 테스트
echo "test" > /tmp/test.txt
curl -i -X POST http://localhost:8000/api/users/files \
  -H "Cookie: token=YOUR_TOKEN_HERE" \
  -F "file=@/tmp/test.txt"
# 200 OK 응답과 file_id, file_path, file_url 반환
```

**SQLX_OFFLINE 에러**:
```bash
# sqlx-data.json 재생성
cd backend
cargo sqlx prepare -- --tests
```

#### Frontend 테스트 실패

**Module not found**:
```bash
# node_modules 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**E2E 테스트 타임아웃**:
```bash
# Backend가 실행 중인지 확인
curl http://localhost:8000/health

# Frontend가 실행 중인지 확인
curl http://localhost:3000

# 타임아웃 증가 (playwright.config.ts)
timeout: 60000,  # 30초 → 60초
```

---

## 비교표

| 항목 | Docker Compose | nerdctl compose |
|------|----------------|-----------------|
| **설치 난이도** | ⭐⭐ 쉬움 (Docker Desktop) | ⭐⭐⭐ 중간 (containerd + nerdctl) |
| **메모리 사용량** | 높음 (~2GB Docker Desktop) | 낮음 (~500MB containerd) |
| **시작 속도** | 보통 (~10초) | 빠름 (~5초) |
| **호환성** | 거의 완벽 | 98% 호환 (일부 기능 제한) |
| **권한** | 사용자 권한 | sudo 필요 (rootless 설정 가능) |
| **GUI** | Docker Desktop 제공 | 없음 (CLI만) |
| **문서** | 풍부함 | 보통 |
| **macOS/Windows** | ✅ 지원 | ❌ Linux만 |
| **Kubernetes 유사성** | 낮음 | 높음 (containerd 사용) |
| **권장 용도** | 일반 개발, macOS/Windows | Linux 서버, 경량 환경, CI |

---

## 빠른 참조

### Docker Compose 명령어

```bash
# 시작
docker compose -f docker-compose.dev.yml up -d

# 중지
docker compose -f docker-compose.dev.yml down

# 로그
docker compose -f docker-compose.dev.yml logs -f postgres

# 재시작
docker compose -f docker-compose.dev.yml restart

# 상태 확인
docker compose -f docker-compose.dev.yml ps

# 실행 중인 컨테이너 접속
docker exec -it helpernote-postgres-dev bash
```

### nerdctl compose 명령어

```bash
# 시작
sudo nerdctl compose -f nerd-compose.yaml up -d

# 중지
sudo nerdctl compose -f nerd-compose.yaml down

# 로그
sudo nerdctl compose -f nerd-compose.yaml logs -f postgres

# 재시작
sudo nerdctl compose -f nerd-compose.yaml restart

# 상태 확인
sudo nerdctl compose -f nerd-compose.yaml ps

# 실행 중인 컨테이너 접속
sudo nerdctl exec -it nerd-postgres-1 bash
```

### Makefile 명령어

```bash
make dev-up          # 의존성 시작
make dev-down        # 의존성 중지
make test            # 유닛 테스트
make test-e2e        # E2E 테스트
make test-all        # 모든 테스트
make test-coverage   # 커버리지
make clean           # 모든 데이터 삭제
```

---

## 추가 리소스

- [Docker Compose 문서](https://docs.docker.com/compose/)
- [nerdctl 문서](https://github.com/containerd/nerdctl)
- [containerd 문서](https://containerd.io/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [MinIO 문서](https://min.io/docs/)

---

## 도움이 필요한 경우

1. **이슈 확인**: GitHub Issues에서 유사한 문제 검색
2. **로그 수집**: `docker compose logs` 또는 `nerdctl compose logs` 실행
3. **환경 정보**: OS, Docker/nerdctl 버전, 에러 메시지
4. **재현 단계**: 문제를 재현할 수 있는 최소한의 단계

**Happy Testing! 🚀**
