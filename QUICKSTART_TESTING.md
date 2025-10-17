# 🚀 Helpernote 로컬 테스트 빠른 시작

## 1분 시작 가이드

### Docker Compose 사용 (권장 - macOS/Windows)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd helpernote

# 2. 환경 변수 복사
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. 테스트 환경 시작 (한 번에 실행!)
make test-docker

# 또는 스크립트 직접 실행
./scripts/docker-compose-test.sh

# 4. 테스트 실행
make test-all
```

### nerdctl compose 사용 (Linux 서버)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd helpernote

# 2. 환경 변수 복사
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. 테스트 환경 시작
make test-nerdctl

# 또는 스크립트 직접 실행
./scripts/nerd-compose-test.sh

# 4. 테스트 실행
make test-all
```

---

## 개별 테스트 실행

```bash
# Backend 테스트만
cd backend && cargo test

# Frontend 유닛 테스트만
cd frontend && npm test

# E2E 테스트만
cd frontend && npm run test:e2e:ui

# 커버리지 리포트
make test-coverage
```

---

## 정리

```bash
# Docker Compose
docker compose -f docker-compose.dev.yml down
# 또는
make dev-down

# nerdctl compose
nerdctl compose -f nerd-compose.yaml down
# 또는
./scripts/nerd-compose-down.sh
```

---

## 문제 해결

**포트 충돌** (5432, 9000, 9001 이미 사용 중):
```bash
# 기존 PostgreSQL 중지
sudo systemctl stop postgresql

# 기존 컨테이너 확인
docker ps -a
```

**권한 에러**:
```bash
# Docker 그룹에 추가
sudo usermod -aG docker $USER
newgrp docker
```

**더 많은 정보**: [`docs/LOCAL_TESTING.md`](docs/LOCAL_TESTING.md) 참조

---

## 서비스 URL

| 서비스 | URL | 계정 |
|--------|-----|------|
| Frontend | http://localhost:3000 | - |
| Backend | http://localhost:8000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | helpernote / helpernote |

---

**Happy Testing! 🎉**
