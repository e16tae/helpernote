# Helpernote Configuration Guide

이 문서는 Helpernote 애플리케이션의 환경변수 및 설정 관리 방법을 설명합니다.

---

## 📋 목차

1. [환경변수 관리 개요](#환경변수-관리-개요)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [Kubernetes 환경](#kubernetes-환경)
4. [GitHub Actions 환경](#github-actions-환경)
5. [설정 변경 방법](#설정-변경-방법)

---

## 환경변수 관리 개요

Helpernote는 다음과 같은 방식으로 설정을 관리합니다:

| 환경 | 민감 정보 | 일반 설정 |
|------|-----------|-----------|
| **로컬 개발** | `.env` 파일 | `.env` 파일 |
| **Kubernetes** | K8s Secret | K8s ConfigMap |
| **GitHub Actions** | GitHub Secrets | Workflow env |

### 설정 우선순위

```
1. Kubernetes Secret/ConfigMap (최우선)
2. 환경변수
3. 코드 내 기본값 (fallback)
```

---

## 로컬 개발 환경

### Backend (.env)

**위치**: `backend/.env`

```bash
# Database Configuration
DATABASE_URL=postgres://helpernote:helpernote@localhost:5432/helpernote

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=3600

# Server Configuration
PORT=8000
RUST_LOG=info

# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=helpernote
```

**설정 방법**:
```bash
# .env.example을 복사
cp backend/.env.example backend/.env

# 필요한 값 수정
vi backend/.env
```

### Frontend (.env)

**위치**: `frontend/.env`

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**설정 방법**:
```bash
# .env.example을 복사
cp frontend/.env.example frontend/.env

# 필요한 값 수정
vi frontend/.env
```

---

## Kubernetes 환경

### 1. ConfigMap (일반 설정)

**파일**: `k8s/base/configmap.yaml`

민감하지 않은 애플리케이션 설정을 관리합니다.

#### 주요 설정 항목

| 키 | 기본값 | 설명 |
|----|--------|------|
| `FRONTEND_DOMAIN` | www.helpernote.com | 프론트엔드 도메인 |
| `BACKEND_DOMAIN` | api.helpernote.com | 백엔드 API 도메인 |
| `API_URL` | https://api.helpernote.com | API 전체 URL |
| `BACKEND_PORT` | 8000 | 백엔드 포트 |
| `FRONTEND_PORT` | 3000 | 프론트엔드 포트 |
| `RUST_LOG` | info | 로그 레벨 (trace, debug, info, warn, error) |
| `JWT_EXPIRATION` | 3600 | JWT 만료 시간 (초) |
| `MINIO_BUCKET` | helpernote | MinIO 버킷 이름 |
| `MINIO_ENDPOINT` | http://minio:9000 | MinIO 엔드포인트 |

#### 도메인 변경 예시

도메인을 변경하려면 ConfigMap을 수정합니다:

```yaml
# k8s/base/configmap.yaml
data:
  FRONTEND_DOMAIN: "www.myapp.com"
  BACKEND_DOMAIN: "api.myapp.com"
  API_URL: "https://api.myapp.com"
```

그리고 Ingress도 함께 수정해야 합니다:

```yaml
# k8s/base/ingress.yaml
spec:
  rules:
    - host: www.myapp.com  # 변경
    - host: api.myapp.com  # 변경
  tls:
    - hosts:
        - www.myapp.com    # 변경
        - api.myapp.com    # 변경
```

### 2. Secret (민감 정보)

**파일**: `k8s/base/secrets.yaml`

민감한 정보는 K8s Secret으로 관리됩니다.

#### Secret 종류

**1) postgres-secret**
```yaml
data:
  database: <base64>  # 데이터베이스 이름
  username: <base64>  # PostgreSQL 사용자
  password: <base64>  # PostgreSQL 비밀번호
```

**2) minio-secret**
```yaml
data:
  access-key: <base64>  # MinIO 액세스 키
  secret-key: <base64>  # MinIO 시크릿 키
```

**3) backend-secret**
```yaml
data:
  database-url: <base64>  # 전체 DB 연결 문자열
  jwt-secret: <base64>    # JWT 서명 키
```

#### Secret 값 변경 방법

1. **평문을 Base64로 인코딩**:
```bash
echo -n "new-password" | base64
# bmV3LXBhc3N3b3Jk
```

2. **secrets.yaml 수정**:
```yaml
data:
  password: bmV3LXBhc3N3b3Jk
```

3. **클러스터에 적용**:
```bash
kubectl apply -f k8s/base/secrets.yaml
```

4. **Pod 재시작** (환경변수 갱신):
```bash
kubectl rollout restart deployment/backend -n helpernote
kubectl rollout restart deployment/frontend -n helpernote
```

#### 보안 모범 사례

⚠️ **주의**: `secrets.yaml` 파일은 프로덕션에서 Git에 커밋하면 안됩니다!

**권장 방법**:
1. **Sealed Secrets**: Secret을 암호화하여 Git에 저장
2. **External Secrets Operator**: 외부 시크릿 저장소 (AWS Secrets Manager, Vault 등) 사용
3. **수동 관리**: Secret은 Git에서 제외하고 수동으로 적용

```bash
# .gitignore에 추가 (프로덕션 환경에서)
k8s/base/secrets.yaml
k8s/overlays/*/secrets.yaml
```

---

## GitHub Actions 환경

### Workflow 환경변수

**파일**: `.github/workflows/cd-production.yaml`

```yaml
env:
  # Container Registry
  REGISTRY: ghcr.io
  IMAGE_OWNER: ${{ github.repository_owner }}

  # Application Configuration
  BACKEND_DOMAIN: api.helpernote.com
  FRONTEND_DOMAIN: www.helpernote.com
```

### 변경 방법

#### 1. 도메인 변경

```yaml
env:
  BACKEND_DOMAIN: api.myapp.com      # 변경
  FRONTEND_DOMAIN: www.myapp.com     # 변경
```

#### 2. Container Registry 변경

```yaml
env:
  REGISTRY: docker.io                    # ghcr.io → docker.io
  IMAGE_OWNER: mycompany                 # organization 이름
```

그리고 K8s 매니페스트도 업데이트:

```yaml
# k8s/base/backend-deployment.yaml
image: docker.io/mycompany/helpernote-backend:latest
```

### GitHub Secrets

민감한 정보는 GitHub Secrets로 관리됩니다.

**설정 경로**: Repository → Settings → Secrets and variables → Actions

| Secret 이름 | 설명 | 사용처 |
|-------------|------|--------|
| `GITHUB_TOKEN` | (자동 생성) | GitHub Container Registry 인증 |

**필요시 추가 가능한 Secrets**:
- `KUBE_CONFIG`: Kubernetes 설정 (자동 배포 시)
- `DOCKER_USERNAME`: Docker Hub 사용자명
- `DOCKER_PASSWORD`: Docker Hub 비밀번호

---

## 설정 변경 방법

### 시나리오 1: 도메인 변경

**변경할 파일**:

1. **ConfigMap** (`k8s/base/configmap.yaml`):
```yaml
data:
  FRONTEND_DOMAIN: "www.newdomain.com"
  BACKEND_DOMAIN: "api.newdomain.com"
  API_URL: "https://api.newdomain.com"
```

2. **Ingress** (`k8s/base/ingress.yaml`):
```yaml
spec:
  rules:
    - host: www.newdomain.com
    - host: api.newdomain.com
  tls:
    - hosts:
        - www.newdomain.com
        - api.newdomain.com
```

3. **GitHub Actions** (`.github/workflows/cd-production.yaml`):
```yaml
env:
  BACKEND_DOMAIN: api.newdomain.com
  FRONTEND_DOMAIN: www.newdomain.com
```

4. **ArgoCD** (`argocd/helpernote-production.yaml`):
```yaml
spec:
  source:
    repoURL: https://github.com/newowner/newrepo.git  # 필요시
```

**적용**:
```bash
# ConfigMap 적용
kubectl apply -f k8s/base/configmap.yaml

# Pod 재시작
kubectl rollout restart deployment/backend -n helpernote
kubectl rollout restart deployment/frontend -n helpernote

# DNS 레코드 업데이트 (외부)
# - www.newdomain.com → Cluster IP
# - api.newdomain.com → Cluster IP

# TLS 인증서 업데이트 (외부)
```

---

### 시나리오 2: JWT 만료 시간 변경

**변경할 파일**: `k8s/base/configmap.yaml`

```yaml
data:
  JWT_EXPIRATION: "7200"  # 2시간
```

**적용**:
```bash
kubectl apply -f k8s/base/configmap.yaml
kubectl rollout restart deployment/backend -n helpernote
```

---

### 시나리오 3: 로그 레벨 변경

**변경할 파일**: `k8s/base/configmap.yaml`

```yaml
data:
  RUST_LOG: "debug"  # info → debug
```

**적용**:
```bash
kubectl apply -f k8s/base/configmap.yaml
kubectl rollout restart deployment/backend -n helpernote
```

---

### 시나리오 4: MinIO 버킷 이름 변경

**변경할 파일**: `k8s/base/configmap.yaml`

```yaml
data:
  MINIO_BUCKET: "my-new-bucket"
```

**사전 작업**:
```bash
# MinIO에서 새 버킷 생성
kubectl exec -it deployment/minio -n helpernote -- mc mb local/my-new-bucket
```

**적용**:
```bash
kubectl apply -f k8s/base/configmap.yaml
kubectl rollout restart deployment/backend -n helpernote
```

---

### 시나리오 5: GitHub 계정/레포 변경

**변경할 파일**:

1. **ArgoCD** (`argocd/helpernote-production.yaml`):
```yaml
spec:
  source:
    repoURL: https://github.com/newowner/newrepo.git
```

2. **Kustomization** (`k8s/overlays/production/kustomization.yaml`):
```yaml
images:
  - name: ghcr.io/newowner/helpernote-backend
    newName: ghcr.io/newowner/helpernote-backend
```

3. **Deployments**:
```bash
# Backend
image: ghcr.io/newowner/helpernote-backend:latest

# Frontend
image: ghcr.io/newowner/helpernote-frontend:latest
```

**적용**:
```bash
# Git 리모트 변경
git remote set-url origin https://github.com/newowner/newrepo.git

# ArgoCD 재배포
kubectl apply -f argocd/helpernote-production.yaml
```

---

## 환경별 설정 요약

### 로컬 개발 (Local)

```bash
# Backend
backend/.env

# Frontend
frontend/.env

# Infrastructure (Docker Compose)
docker-compose.dev.yml
```

### Kubernetes 프로덕션

```bash
# 일반 설정
k8s/base/configmap.yaml

# 민감 정보
k8s/base/secrets.yaml

# 도메인/네트워크
k8s/base/ingress.yaml

# Production 오버라이드
k8s/overlays/production/
```

### CI/CD (GitHub Actions)

```bash
# Workflow 설정
.github/workflows/ci-develop.yaml
.github/workflows/cd-production.yaml

# GitHub Secrets (웹에서 관리)
Settings → Secrets and variables → Actions
```

---

## 설정 검증

### ConfigMap 확인

```bash
# ConfigMap 내용 확인
kubectl get configmap app-config -n helpernote -o yaml

# Pod에서 환경변수 확인
kubectl exec -it deployment/backend -n helpernote -- env | grep API
```

### Secret 확인

```bash
# Secret 목록
kubectl get secrets -n helpernote

# Secret 내용 (base64 디코딩)
kubectl get secret backend-secret -n helpernote -o jsonpath='{.data.jwt-secret}' | base64 -d
```

### 설정 적용 확인

```bash
# Pod 재시작 상태
kubectl rollout status deployment/backend -n helpernote

# Pod 로그에서 설정 확인
kubectl logs deployment/backend -n helpernote | grep -i "config"
```

---

## 트러블슈팅

### ConfigMap 변경이 반영 안됨

**원인**: Pod는 시작 시점의 환경변수를 사용합니다.

**해결**:
```bash
kubectl rollout restart deployment/backend -n helpernote
kubectl rollout restart deployment/frontend -n helpernote
```

### Secret 값이 잘못됨

**확인**:
```bash
# Base64 디코딩하여 확인
kubectl get secret backend-secret -n helpernote -o yaml
echo "encoded-value" | base64 -d
```

**수정**:
```bash
# 새 값 생성
echo -n "new-value" | base64

# Secret 업데이트
kubectl edit secret backend-secret -n helpernote

# 또는 파일 수정 후
kubectl apply -f k8s/base/secrets.yaml
```

### 도메인 변경 후 접속 안됨

**체크리스트**:
- [ ] DNS 레코드 업데이트 완료
- [ ] TLS 인증서 업데이트 완료
- [ ] ConfigMap에서 도메인 변경
- [ ] Ingress에서 도메인 변경
- [ ] Pod 재시작 완료
- [ ] Kong Gateway 캐시 클리어 (필요시)

---

## 참고 문서

- [DEPLOY.md](./DEPLOY.md) - 배포 가이드
- [WORKFLOW.md](./WORKFLOW.md) - Git 워크플로우
- [CLAUDE.md](./CLAUDE.md) - 프로젝트 구조
- [Kubernetes ConfigMap 문서](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Kubernetes Secrets 문서](https://kubernetes.io/docs/concepts/configuration/secret/)
