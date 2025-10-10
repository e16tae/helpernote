# 환경변수 관리 요약

## 📌 빠른 참조

### 변경 가능한 주요 설정

| 설정 항목 | 파일 위치 | 변경 방법 |
|-----------|----------|----------|
| **도메인** | `k8s/base/configmap.yaml`, `k8s/base/ingress.yaml`, `.github/workflows/cd-production.yaml` | ConfigMap 수정 → Pod 재시작 |
| **GitHub 계정/레포** | `argocd/helpernote-production.yaml`, `k8s/overlays/production/kustomization.yaml`, 각 deployment | ArgoCD 설정 수정 |
| **JWT 만료시간** | `k8s/base/configmap.yaml` | ConfigMap 수정 → Pod 재시작 |
| **로그 레벨** | `k8s/base/configmap.yaml` | ConfigMap 수정 → Pod 재시작 |
| **MinIO 버킷** | `k8s/base/configmap.yaml` | ConfigMap 수정 → Pod 재시작 |
| **비밀번호/키** | `k8s/base/secrets.yaml` | Secret 수정 → Pod 재시작 |

---

## 🔧 현재 하드코딩된 값들

### 1. 도메인 관련
- **Frontend**: `www.helpernote.com`
- **Backend API**: `api.helpernote.com`

**위치**:
- `k8s/base/configmap.yaml` (ConfigMap)
- `k8s/base/ingress.yaml` (Ingress rules)
- `.github/workflows/cd-production.yaml` (GitHub Actions)

**변경 시 영향**:
- DNS 레코드 변경 필요
- TLS 인증서 변경 필요
- Pod 재시작 필요

---

### 2. GitHub/Container Registry 관련
- **GitHub 계정**: `e16tae`
- **레포지토리**: `helpernote`
- **Container Registry**: `ghcr.io`

**위치**:
- `argocd/helpernote-production.yaml` (Git repo URL)
- `k8s/base/backend-deployment.yaml` (image)
- `k8s/base/frontend-deployment.yaml` (image)
- `k8s/overlays/production/kustomization.yaml` (image names)

**변경 시 영향**:
- Git remote 변경 필요
- Container image push 위치 변경
- ArgoCD 재설정 필요

---

### 3. 애플리케이션 설정 (ConfigMap으로 관리)

이제 **ConfigMap**을 통해 중앙에서 관리됩니다:

```yaml
# k8s/base/configmap.yaml
data:
  # 도메인
  FRONTEND_DOMAIN: "www.helpernote.com"
  BACKEND_DOMAIN: "api.helpernote.com"
  API_URL: "https://api.helpernote.com"

  # 포트
  BACKEND_PORT: "8000"
  FRONTEND_PORT: "3000"

  # 백엔드 설정
  RUST_LOG: "info"
  JWT_EXPIRATION: "3600"

  # MinIO 설정
  MINIO_ENDPOINT: "http://minio:9000"
  MINIO_BUCKET: "helpernote"

  # 데이터베이스
  DB_HOST: "postgres"
  DB_PORT: "5432"
  DB_NAME: "helpernote"
  DB_USER: "helpernote"
```

**장점**:
- 한 곳에서 관리
- 코드 재빌드 없이 변경 가능
- Pod 재시작만으로 적용

---

## 🎯 주요 개선 사항

### Before (기존)
```yaml
# 각 deployment에 하드코딩
env:
  - name: PORT
    value: "8000"  # ❌ 하드코딩
  - name: RUST_LOG
    value: "info"  # ❌ 하드코딩
```

### After (개선)
```yaml
# ConfigMap에서 참조
env:
  - name: PORT
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: BACKEND_PORT  # ✅ ConfigMap 참조
  - name: RUST_LOG
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: RUST_LOG  # ✅ ConfigMap 참조
```

---

## 📝 설정 변경 체크리스트

### 도메인 변경 시

- [ ] `k8s/base/configmap.yaml` - FRONTEND_DOMAIN, BACKEND_DOMAIN, API_URL
- [ ] `k8s/base/ingress.yaml` - rules.host, tls.hosts
- [ ] `.github/workflows/cd-production.yaml` - BACKEND_DOMAIN, FRONTEND_DOMAIN
- [ ] DNS 레코드 업데이트
- [ ] TLS 인증서 업데이트
- [ ] `kubectl apply -f k8s/base/configmap.yaml`
- [ ] `kubectl rollout restart deployment/backend deployment/frontend -n helpernote`

### GitHub 계정/레포 변경 시

- [ ] `argocd/helpernote-production.yaml` - repoURL
- [ ] `k8s/base/backend-deployment.yaml` - image
- [ ] `k8s/base/frontend-deployment.yaml` - image
- [ ] `k8s/overlays/production/kustomization.yaml` - images
- [ ] `git remote set-url origin <new-url>`
- [ ] `kubectl apply -f argocd/helpernote-production.yaml`

### 일반 설정 변경 시

- [ ] `k8s/base/configmap.yaml` 수정
- [ ] `kubectl apply -f k8s/base/configmap.yaml`
- [ ] `kubectl rollout restart deployment/<name> -n helpernote`

---

## 🔐 Secret 관리

### 민감 정보 (K8s Secret으로 관리)

```yaml
# k8s/base/secrets.yaml
- postgres-secret: PostgreSQL 비밀번호
- minio-secret: MinIO access/secret keys
- backend-secret: DATABASE_URL, JWT_SECRET
```

**⚠️ 주의**: 프로덕션에서는 Git에 커밋하지 말 것!

**권장 방법**:
1. Sealed Secrets
2. External Secrets Operator
3. 수동 kubectl apply

---

## 🚀 빠른 명령어

### ConfigMap 확인
```bash
kubectl get configmap app-config -n helpernote -o yaml
```

### Secret 확인
```bash
kubectl get secrets -n helpernote
```

### 설정 적용 후 재시작
```bash
kubectl rollout restart deployment/backend -n helpernote
kubectl rollout restart deployment/frontend -n helpernote
```

### 환경변수 확인
```bash
kubectl exec -it deployment/backend -n helpernote -- env
```

---

## 📚 상세 문서

전체 설정 가이드는 [CONFIGURATION.md](./CONFIGURATION.md)를 참조하세요.
