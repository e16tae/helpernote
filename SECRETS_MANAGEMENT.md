# Secrets 관리 가이드

Kubernetes Secrets와 GitHub Secrets 설정 및 관리를 위한 완전한 가이드입니다.

## 📋 목차

1. [개요](#개요)
2. [Kubernetes Secrets](#kubernetes-secrets)
3. [GitHub Secrets](#github-secrets)
4. [보안 체크리스트](#보안-체크리스트)
5. [문제 해결](#문제-해결)

---

## 🎯 개요

### Secrets 구조

```
Production Secrets
├── Kubernetes Cluster (Runtime)
│   ├── postgres-secret        # DB 인증 정보
│   ├── minio-secret           # Object Storage 접근 키
│   └── backend-secret         # Backend 애플리케이션 시크릿
│
└── GitHub Repository (CI/CD)
    ├── GITHUB_TOKEN           # Container Registry 접근 (자동 제공)
    ├── GH_PAT                 # Manifest 업데이트용 PAT
    ├── ARGOCD_SERVER          # ArgoCD 서버 주소
    ├── ARGOCD_TOKEN           # ArgoCD 인증 토큰
    └── SLACK_WEBHOOK_URL      # 배포 알림 (선택)
```

---

## ☸️ Kubernetes Secrets

### 1. PostgreSQL Secret

**용도**: Backend가 데이터베이스에 연결하기 위한 인증 정보

#### 생성 방법

```bash
# 강력한 비밀번호 생성
DB_PASSWORD=$(openssl rand -base64 32)

# Secret 생성
kubectl create secret generic postgres-secret \
  --from-literal=database='helpernote' \
  --from-literal=username='helpernote' \
  --from-literal=password="$DB_PASSWORD" \
  --namespace=helpernote
```

#### YAML 예제 (base64 인코딩 필요)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: helpernote
type: Opaque
data:
  # Base64로 인코딩된 값
  database: aGVscGVybm90ZQ==          # echo -n "helpernote" | base64
  username: aGVscGVybm90ZQ==          # echo -n "helpernote" | base64
  password: <BASE64_ENCODED_PASSWORD> # echo -n "$DB_PASSWORD" | base64
```

#### 사용되는 곳

- `k8s/base/postgres-statefulset.yaml`: PostgreSQL 컨테이너의 POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- `k8s/base/backend-deployment.yaml`: DATABASE_URL 구성

---

### 2. MinIO Secret

**용도**: Object Storage(파일 저장소) 접근 키

#### 생성 방법

```bash
# 접근 키 생성 (20자)
MINIO_ACCESS_KEY=$(openssl rand -base64 15 | tr -d '/+=' | head -c 20)

# 비밀 키 생성 (40자)
MINIO_SECRET_KEY=$(openssl rand -base64 30 | tr -d '/+=' | head -c 40)

# Secret 생성
kubectl create secret generic minio-secret \
  --from-literal=access-key="$MINIO_ACCESS_KEY" \
  --from-literal=secret-key="$MINIO_SECRET_KEY" \
  --namespace=helpernote
```

#### YAML 예제

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: minio-secret
  namespace: helpernote
type: Opaque
data:
  access-key: <BASE64_ENCODED_ACCESS_KEY>
  secret-key: <BASE64_ENCODED_SECRET_KEY>
```

#### 사용되는 곳

- `k8s/base/minio-deployment.yaml`: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD
- `k8s/base/backend-deployment.yaml`: MINIO_ACCESS_KEY, MINIO_SECRET_KEY

---

### 3. Backend Secret

**용도**: Backend 애플리케이션의 민감한 설정

#### 생성 방법

```bash
# JWT 시크릿 생성 (64자)
JWT_SECRET=$(openssl rand -base64 48)

# PostgreSQL URL 구성 (postgres-secret의 값 사용)
DB_PASSWORD="<postgres-secret의 password>"
DATABASE_URL="postgresql://helpernote:${DB_PASSWORD}@prod-postgres:5432/helpernote"

# Secret 생성
kubectl create secret generic backend-secret \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --namespace=helpernote
```

#### YAML 예제

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: helpernote
type: Opaque
data:
  database-url: <BASE64_ENCODED_DATABASE_URL>
  jwt-secret: <BASE64_ENCODED_JWT_SECRET>
```

#### 사용되는 곳

- `k8s/base/backend-deployment.yaml`: DATABASE_URL, JWT_SECRET 환경 변수

---

### Kubernetes Secrets 일괄 생성 스크립트

모든 Secrets를 한 번에 생성하는 스크립트:

```bash
#!/bin/bash
set -euo pipefail

NAMESPACE="helpernote"
CONTEXT="production-cluster"  # 실제 클러스터 컨텍스트로 변경

echo "🔐 Generating secure credentials..."

# 1. PostgreSQL
DB_PASSWORD=$(openssl rand -base64 32)
echo "✓ PostgreSQL password generated"

# 2. MinIO
MINIO_ACCESS_KEY=$(openssl rand -base64 15 | tr -d '/+=' | head -c 20)
MINIO_SECRET_KEY=$(openssl rand -base64 30 | tr -d '/+=' | head -c 40)
echo "✓ MinIO credentials generated"

# 3. Backend
JWT_SECRET=$(openssl rand -base64 48)
DATABASE_URL="postgresql://helpernote:${DB_PASSWORD}@prod-postgres:5432/helpernote"
echo "✓ Backend secrets generated"

echo ""
echo "📦 Creating Kubernetes secrets..."

# Namespace 생성
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Secrets 생성
kubectl create secret generic postgres-secret \
  --from-literal=database='helpernote' \
  --from-literal=username='helpernote' \
  --from-literal=password="$DB_PASSWORD" \
  --namespace="$NAMESPACE" \
  --context="$CONTEXT" \
  --dry-run=client -o yaml | kubectl apply -f -
echo "✓ postgres-secret created"

kubectl create secret generic minio-secret \
  --from-literal=access-key="$MINIO_ACCESS_KEY" \
  --from-literal=secret-key="$MINIO_SECRET_KEY" \
  --namespace="$NAMESPACE" \
  --context="$CONTEXT" \
  --dry-run=client -o yaml | kubectl apply -f -
echo "✓ minio-secret created"

kubectl create secret generic backend-secret \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --namespace="$NAMESPACE" \
  --context="$CONTEXT" \
  --dry-run=client -o yaml | kubectl apply -f -
echo "✓ backend-secret created"

echo ""
echo "✅ All secrets created successfully!"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PostgreSQL Password: $DB_PASSWORD"
echo "MinIO Access Key:    $MINIO_ACCESS_KEY"
echo "MinIO Secret Key:    $MINIO_SECRET_KEY"
echo "JWT Secret:          $JWT_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💾 Store these in your password manager and delete this output!"
```

**사용법**:

```bash
# 스크립트 저장
chmod +x create-k8s-secrets.sh

# 실행 (출력을 임시 파일로 저장)
./create-k8s-secrets.sh | tee /tmp/secrets-backup.txt

# 비밀번호 매니저에 저장 후 삭제
shred -u /tmp/secrets-backup.txt
```

---

### Kubernetes Secrets 확인

```bash
# Secrets 목록 확인
kubectl get secrets -n helpernote

# Secret 상세 정보 (값은 base64 인코딩되어 표시)
kubectl describe secret postgres-secret -n helpernote

# Secret 값 디코딩 (주의: 터미널 히스토리에 남음)
kubectl get secret postgres-secret -n helpernote -o jsonpath='{.data.password}' | base64 -d

# Secret 전체 내용 확인
kubectl get secret backend-secret -n helpernote -o yaml
```

---

## 🔐 GitHub Secrets

### 필수 Secrets

#### 1. GITHUB_TOKEN (자동 제공)

**용도**: GitHub Container Registry(ghcr.io)에 Docker 이미지 푸시

- **설정 불필요**: GitHub Actions가 자동으로 제공
- **권한**: `packages: write` (workflow 파일에서 설정)
- **사용 위치**: `.github/workflows/cd-production.yaml`의 Docker login

---

#### 2. GH_PAT (Personal Access Token)

**용도**: Kustomization 파일 업데이트를 위한 git push

**생성 방법**:

1. GitHub 계정 → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token (classic)** 클릭
3. 토큰 설정:
   - **Note**: `Helpernote Deployment Bot`
   - **Expiration**: `90 days` (정기적으로 갱신 필요)
   - **Scopes**:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
4. **Generate token** 클릭 후 토큰 복사

**등록 방법**:

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. Name: `GH_PAT`
4. Secret: (생성한 토큰 붙여넣기)
5. **Add secret** 클릭

**사용 위치**: `.github/workflows/cd-production.yaml` → `update-manifests` job

**주의사항**:
- 90일마다 토큰 갱신 필요 (GitHub가 만료 7일 전 이메일 발송)
- 토큰 유출 시 즉시 삭제하고 새로 생성

---

#### 3. ARGOCD_SERVER

**용도**: ArgoCD 서버 주소 (GitOps 자동 배포)

**값 예시**:
```
argocd.example.com
```

**등록 방법**:

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. Name: `ARGOCD_SERVER`
4. Secret: (ArgoCD 서버 주소, `https://` 제외)
5. **Add secret** 클릭

**사용 위치**: `.github/workflows/cd-production.yaml` → `trigger-argocd-sync` job

---

#### 4. ARGOCD_TOKEN

**용도**: ArgoCD API 인증 토큰

**생성 방법**:

```bash
# ArgoCD CLI 설치 (macOS)
brew install argocd

# ArgoCD 로그인
argocd login argocd.example.com --username admin

# 토큰 생성 (만료 없음)
argocd account generate-token --account github-actions

# 또는 만료 기간 설정 (권장: 1년)
argocd account generate-token --account github-actions --expires-in 365d
```

**등록 방법**:

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. Name: `ARGOCD_TOKEN`
4. Secret: (생성한 토큰 붙여넣기)
5. **Add secret** 클릭

**사용 위치**: `.github/workflows/cd-production.yaml` → `trigger-argocd-sync` job

**주의사항**:
- 토큰 만료 전에 새 토큰으로 교체
- 토큰 유출 시 ArgoCD에서 즉시 revoke

---

### 선택 Secrets

#### 5. SLACK_WEBHOOK_URL (선택사항)

**용도**: 배포 완료/실패 시 Slack 알림

**생성 방법**:

1. Slack workspace → **Apps** 검색
2. **Incoming Webhooks** 앱 추가
3. 알림 받을 채널 선택 (예: `#deployments`)
4. Webhook URL 복사 (형식: `https://hooks.slack.com/services/...`)

**등록 방법**:

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. Name: `SLACK_WEBHOOK_URL`
4. Secret: (Webhook URL 붙여넣기)
5. **Add secret** 클릭

**사용 위치**: `.github/workflows/cd-production.yaml` → `notify` job

**비활성화**: 이 Secret을 설정하지 않으면 Slack 알림이 자동으로 스킵됩니다.

---

### GitHub Secrets 설정 확인

#### 확인 방법

Repository → **Settings** → **Secrets and variables** → **Actions**에서 다음 Secrets가 있는지 확인:

- ✅ `GH_PAT` (필수)
- ✅ `ARGOCD_SERVER` (필수)
- ✅ `ARGOCD_TOKEN` (필수)
- ⭕ `SLACK_WEBHOOK_URL` (선택)

#### 테스트 방법

```bash
# main 브랜치에 푸시하여 CD 파이프라인 트리거
git checkout main
git pull origin main
git commit --allow-empty -m "test: trigger CD pipeline"
git push origin main

# GitHub Actions 탭에서 워크플로우 상태 확인
# https://github.com/YOUR_USERNAME/helpernote/actions
```

**체크포인트**:
1. ✅ Build and Push: Docker 이미지가 ghcr.io에 푸시되는지
2. ✅ Update Manifests: Kustomization 파일이 업데이트되는지 (GH_PAT 검증)
3. ✅ ArgoCD Sync: ArgoCD가 자동으로 배포하는지 (ARGOCD_TOKEN 검증)
4. ✅ Health Verification: 배포된 서비스가 정상 동작하는지
5. ⭕ Slack Notification: Slack 알림이 발송되는지 (설정한 경우)

---

## 📊 Secrets 요약 테이블

### Kubernetes Secrets

| Secret 이름 | Key | 용도 | 생성 명령 | 사용처 |
|------------|-----|------|----------|--------|
| `postgres-secret` | `database` | DB 이름 | (고정값) `helpernote` | PostgreSQL Pod |
| | `username` | DB 사용자명 | (고정값) `helpernote` | PostgreSQL Pod, Backend |
| | `password` | DB 비밀번호 | `openssl rand -base64 32` | PostgreSQL Pod, Backend |
| `minio-secret` | `access-key` | MinIO 접근 키 | `openssl rand -base64 15 \| head -c 20` | MinIO Pod, Backend |
| | `secret-key` | MinIO 비밀 키 | `openssl rand -base64 30 \| head -c 40` | MinIO Pod, Backend |
| `backend-secret` | `database-url` | PostgreSQL 연결 URL | (조합) `postgresql://...` | Backend Pod |
| | `jwt-secret` | JWT 서명 키 | `openssl rand -base64 48` | Backend Pod |

### GitHub Secrets

| Secret 이름 | 필수 여부 | 용도 | 값 예시 | 만료 |
|------------|----------|------|---------|------|
| `GITHUB_TOKEN` | ✅ 자동 | GHCR 이미지 푸시 | (자동 제공) | - |
| `GH_PAT` | ✅ 필수 | Git manifest 업데이트 | `ghp_xxx...` | 90일 |
| `ARGOCD_SERVER` | ✅ 필수 | ArgoCD 서버 주소 | `argocd.example.com` | - |
| `ARGOCD_TOKEN` | ✅ 필수 | ArgoCD API 인증 | `eyJhbG...` | 365일 |
| `SLACK_WEBHOOK_URL` | ⭕ 선택 | 배포 알림 | `https://hooks.slack.com/...` | - |

---

## 🔒 보안 체크리스트

### Kubernetes Secrets

- [ ] **절대 Git에 커밋하지 않기**
  - `k8s/base/secrets.yaml`은 예제용 (프로덕션 값 아님)
  - 실제 프로덕션 Secrets는 `kubectl create secret` 또는 Sealed Secrets 사용

- [ ] **강력한 비밀번호 생성**
  - 최소 32자 이상 랜덤 문자열
  - `openssl rand -base64 N` 사용

- [ ] **Secrets 접근 제어**
  ```bash
  # RBAC 설정: ServiceAccount만 Secrets 읽기 가능
  kubectl create role secret-reader \
    --verb=get,list \
    --resource=secrets \
    --namespace=helpernote
  ```

- [ ] **Secrets 로테이션**
  - JWT_SECRET: 6개월마다
  - DB Password: 90일마다
  - MinIO Keys: 90일마다

- [ ] **Sealed Secrets 또는 External Secrets Operator 사용** (권장)
  - 암호화된 Secrets를 Git에 안전하게 저장
  - 런타임에 복호화

### GitHub Secrets

- [ ] **PAT 만료 관리**
  - `GH_PAT`: 90일마다 갱신
  - `ARGOCD_TOKEN`: 365일마다 갱신
  - GitHub 만료 알림 이메일 확인

- [ ] **최소 권한 원칙**
  - `GH_PAT`: `repo`, `workflow` 권한만
  - ArgoCD Token: 필요한 앱에만 접근

- [ ] **토큰 유출 시 대응**
  1. GitHub/ArgoCD에서 즉시 토큰 revoke
  2. 새 토큰 생성 후 GitHub Secrets 업데이트
  3. 로그 분석 (악용 여부 확인)

- [ ] **Secrets 감사 로그**
  - GitHub Audit Log: Settings → Security → Audit log
  - ArgoCD Audit: `argocd account list`

---

## 🆘 문제 해결

### Kubernetes Secrets 관련

#### 문제: Secret이 없어서 Pod가 시작되지 않음

**증상**:
```
Error: secret "backend-secret" not found
```

**해결**:
```bash
# Secret 존재 확인
kubectl get secrets -n helpernote

# Secret이 없으면 생성
kubectl create secret generic backend-secret \
  --from-literal=database-url='postgresql://...' \
  --from-literal=jwt-secret='...' \
  --namespace=helpernote

# Pod 재시작
kubectl rollout restart deployment/backend -n helpernote
```

---

#### 문제: Secret 값이 잘못되어 연결 실패

**증상**:
```
Failed to connect to database: authentication failed
```

**해결**:
```bash
# Secret 값 확인
kubectl get secret postgres-secret -n helpernote -o jsonpath='{.data.password}' | base64 -d

# 값이 틀렸으면 업데이트
kubectl create secret generic postgres-secret \
  --from-literal=password='CORRECT_PASSWORD' \
  --namespace=helpernote \
  --dry-run=client -o yaml | kubectl apply -f -

# Pod 재시작 (새 값 로드)
kubectl rollout restart statefulset/prod-postgres -n helpernote
kubectl rollout restart deployment/backend -n helpernote
```

---

### GitHub Secrets 관련

#### 문제: GH_PAT이 만료되어 git push 실패

**증상**:
```
remote: Invalid username or password.
fatal: Authentication failed
```

**해결**:
1. GitHub에서 새 PAT 생성 (위의 [GH_PAT](#2-gh_pat-personal-access-token) 섹션 참고)
2. Repository Settings → Actions Secrets → `GH_PAT` 업데이트
3. 워크플로우 재실행

---

#### 문제: ArgoCD 연결 실패

**증상**:
```
FATA[0000] rpc error: code = Unauthenticated desc = invalid session
```

**해결**:
```bash
# 새 토큰 생성
argocd login argocd.example.com --username admin
argocd account generate-token --account github-actions --expires-in 365d

# GitHub Secrets 업데이트
# Repository → Settings → Secrets → ARGOCD_TOKEN

# 워크플로우 재실행
```

---

#### 문제: Slack 알림이 오지 않음

**증상**: 배포는 성공하지만 Slack 메시지 없음

**해결**:
```bash
# Webhook URL 테스트
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from Helpernote"}' \
  YOUR_WEBHOOK_URL

# 200 OK가 아니면 Webhook 재생성 필요
# Slack App → Incoming Webhooks → Add New Webhook to Workspace

# GitHub Secrets 업데이트
```

---

## 🔄 정기 유지보수

### 월간 체크리스트

- [ ] GitHub Actions 워크플로우 정상 동작 확인
- [ ] ArgoCD 배포 상태 확인
- [ ] Secrets 만료 일정 확인 (30일 이내 만료 예정)
- [ ] 배포 알림 정상 수신 확인

### 분기별 체크리스트

- [ ] `GH_PAT` 갱신 (90일 만료)
- [ ] `ARGOCD_TOKEN` 확인 (365일 만료)
- [ ] Kubernetes Secrets 로테이션 (DB password, MinIO keys)
- [ ] 보안 감사 로그 리뷰
- [ ] Secrets 접근 권한 검토

### 연간 체크리스트

- [ ] `JWT_SECRET` 로테이션 (6개월마다)
- [ ] 전체 Secrets 인벤토리 업데이트
- [ ] 보안 정책 리뷰
- [ ] 백업 및 복구 절차 테스트

---

## 📚 참고 자료

- [Kubernetes Secrets 공식 문서](https://kubernetes.io/docs/concepts/configuration/secret/)
- [GitHub Actions Secrets 문서](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [ArgoCD Authentication 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/user-management/)
- [Sealed Secrets (GitOps용 암호화)](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 💡 추가 개선 사항 (선택)

### 1. Sealed Secrets 도입

Git에 암호화된 Secrets 저장:

```bash
# Sealed Secrets Controller 설치
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# kubeseal CLI 설치
brew install kubeseal

# Secret을 SealedSecret으로 변환
kubectl create secret generic backend-secret \
  --from-literal=jwt-secret='xxx' \
  --dry-run=client -o yaml | \
kubeseal -o yaml > sealed-backend-secret.yaml

# Git에 커밋 가능 (암호화됨)
git add sealed-backend-secret.yaml
git commit -m "Add sealed secret"
```

### 2. External Secrets Operator

HashiCorp Vault, AWS Secrets Manager 연동:

```bash
# ESO 설치
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets

# AWS Secrets Manager에서 Secret 가져오기
# k8s/base/external-secret.yaml
```

### 3. ArgoCD Application 생성

자동 동기화 설정:

```bash
argocd app create helpernote-production \
  --repo https://github.com/YOUR_USERNAME/helpernote.git \
  --path k8s/overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace helpernote \
  --sync-policy automated \
  --self-heal \
  --auto-prune
```
