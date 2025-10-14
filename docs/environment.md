# Helpernote | Environment & Configuration

Helpernote는 Rust 백엔드, Next.js 프런트엔드, PostgreSQL, MinIO를 사용하는 모노레포입니다. 이 문서는 로컬 개발과 프로덕션 배포를 위해 필요한 환경 변수와 시크릿 구성을 설명합니다.

## 구성 파일

| 위치 | 설명 |
| ---- | ---- |
| `.env.example` | 공통 도메인/인프라 구성 템플릿 |
| `.env` | Docker Compose 및 CI에서 사용하는 값 (git-ignored) |
| `backend/.env.example` | 백엔드 로컬 개발 템플릿 |
| `frontend/.env.example` | 프런트엔드 로컬 개발 템플릿 |
| `k8s/base/secret.example.yaml` | Kubernetes Secret 예시 (git-ignored) |

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 루트 환경 변수 (`.env`)

### 도메인 & URL
```bash
APEX_DOMAIN=example.com
FRONTEND_DOMAIN=www.example.com
BACKEND_DOMAIN=api.example.com
MINIO_PUBLIC_DOMAIN=files.example.com

FRONTEND_URL=https://www.example.com
API_URL=https://api.example.com
```
- `MINIO_PUBLIC_DOMAIN`은 브라우저에서 직접 파일을 내려받을 때 사용합니다.
- CORS 허용 도메인은 COMMA로 구분하여 `CORS_ALLOWED_ORIGINS`에 설정합니다.

### 데이터베이스
```bash
POSTGRES_DB=helpernote
POSTGRES_USER=helpernote
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_HOST=prod-postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```
- 로컬 개발 시 `docker-compose`가 기본 DB를 제공합니다.
- 프로덕션에서는 32바이트 이상 랜덤 패스워드를 사용하고, K8s Secret으로 관리합니다.

### JWT & 인증
```bash
JWT_SECRET=CHANGE_ME_RANDOM_BASE64_64
JWT_EXPIRATION=86400
```
- `openssl rand -base64 64` 명령을 사용해 생성합니다.

### MinIO
```bash
MINIO_ENDPOINT=http://prod-minio:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=CHANGE_ME_ROOT_PASSWORD
MINIO_BUCKET=helpernote
MINIO_REGION=ap-northeast-2
```
- 프로덕션에서는 `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`를 별도 계정으로 분리하는 것을 권장합니다.

### GitHub Container Registry
```bash
CONTAINER_REGISTRY=ghcr.io
GITHUB_ORG=your-account
GITHUB_REPO=helpernote
BACKEND_IMAGE=${CONTAINER_REGISTRY}/${GITHUB_ORG}/helpernote-backend
FRONTEND_IMAGE=${CONTAINER_REGISTRY}/${GITHUB_ORG}/helpernote-frontend
```

### Kubernetes & ArgoCD
```bash
K8S_NAMESPACE=helpernote
RESOURCE_NAME_PREFIX=prod-
TLS_SECRET_NAME=helpernote-wildcard-tls
INGRESS_NAME=helpernote-ingress
ARGOCD_APP_NAME=helpernote-production
ARGOCD_REPO_URL=https://github.com/${GITHUB_ORG}/${GITHUB_REPO}.git
ARGOCD_SERVER=argocd.example.com
```

## 백엔드 환경 (`backend/.env`)

```bash
DATABASE_URL=postgres://helpernote:password@localhost:5432/helpernote
SERVER_PORT=8000
RUST_LOG=info
JWT_SECRET=change-me-in-production
JWT_EXPIRATION=3600
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=CHANGE_ME
MINIO_SECRET_KEY=CHANGE_ME
MINIO_BUCKET=helpernote
```
- 로컬 개발에서 기본 값은 Docker Compose와 호환됩니다.
- 프로덕션에서는 Kubernetes Secret을 통해 주입하며, 루트 계정 대신 제한된 IAM 사용자 키를 사용합니다.

## 프런트엔드 환경 (`frontend/.env`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
# 배포 환경 예시: NEXT_PUBLIC_API_URL=https://api.example.com
```
- Next.js 빌드 시 이 값이 정적으로 주입됩니다.

## Kubernetes Secrets

### Sealed Secrets 사용하는 방법
1. `k8s/base/secrets.example.yaml`을 복사해 실제 값을 채웁니다 (또는 `.env` 파일 준비).
2. `./scripts/seal-secrets.sh` 실행
   ```bash
   ./scripts/seal-secrets.sh \\
     --manifest k8s/base/secrets.example.yaml \\
     --out k8s/sealed-secrets/platform-secrets.sealedsecret.yaml

   ./scripts/seal-secrets.sh \\
     --env-file backend/.env.production \\
     --name backend-secret \\
     --namespace helpernote \\
     --out k8s/sealed-secrets/backend-secret.sealedsecret.yaml
   ```
3. 결과 파일을 커밋 → ArgoCD가 자동으로 Secret을 생성

### 기타 Secret
- GHCR Pull Secret: `kubectl create secret docker-registry ghcr-secret ...`
- TLS Secret: `kubectl create secret tls helpernote-wildcard-tls ...` 또는 cert-manager 사용
- MinIO 루트 계정은 가능하면 별도 사용자 키를 생성해 SealedSecret으로 관리합니다.

## GitHub Actions Secrets

| 이름 | 설명 |
| ---- | ---- |
| `GH_PAT` | GHCR push 및 매니페스트 업데이트용 PAT (`repo`, `write:packages`) |
| `ARGOCD_SERVER` | ArgoCD API 엔드포인트 |
| `ARGOCD_TOKEN` | `argocd account generate-token` 으로 발급한 토큰 |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` (선택) | 백업 또는 파일 업로드 자동화가 필요한 경우 |

## 검증 체크리스트

1. `.env`, `backend/.env`, `frontend/.env` 파일이 git 히스토리에 포함되지 않았는지 확인합니다.
2. Docker Compose로 로컬 환경을 기동하고, API, 프런트엔드, MinIO 접속을 검증합니다.
3. `make test`로 백엔드/프런트엔드 테스트가 통과하는지 확인합니다.
4. Kubernetes Secret과 ConfigMap이 생성되었는지 `kubectl get secret,configmap -n helpernote`로 점검합니다.
5. ArgoCD 애플리케이션이 `Healthy/Synced` 상태인지 확인하고, Ingress가 올바른 도메인을 반환하는지 검증합니다.

## 문제 해결

- **CORS 오류**: `CORS_ALLOWED_ORIGINS` 목록에 실제 도메인이 추가되었는지 확인합니다.
- **MinIO 업로드 실패**: 버킷 권한과 Access Key/Secret Key 설정을 확인합니다.
- **프런트 빌드 시 API URL 누락**: `NEXT_PUBLIC_API_URL` 환경 변수 설정을 검토합니다.
- **데이터베이스 연결 오류**: `DATABASE_URL` 문자열과 네임스페이스/서비스 이름이 일치하는지 확인합니다.
