# 환경변수 적용 시점 가이드

환경변수가 **언제** 적용되고, 변경하려면 **무엇을** 해야 하는지 정리한 문서입니다.

---

## 📋 목차

1. [환경변수 적용 시점 개요](#환경변수-적용-시점-개요)
2. [빌드 타임 환경변수](#빌드-타임-환경변수)
3. [시작 타임 환경변수](#시작-타임-환경변수)
4. [런타임 환경변수](#런타임-환경변수)
5. [환경별 적용 절차](#환경별-적용-절차)

---

## 환경변수 적용 시점 개요

```
┌─────────────────┐
│  1. Build Time  │ ← Docker 이미지 빌드 시
│  (빌드 타임)     │    NEXT_PUBLIC_* 환경변수
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Startup Time │ ← 컨테이너/앱 시작 시
│  (시작 타임)     │    대부분의 환경변수
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Runtime     │ ← 실행 중 (재시작 필요)
│  (런타임)        │    ConfigMap/Secret 변경
└─────────────────┘
```

---

## 빌드 타임 환경변수

### 정의
**Docker 이미지를 빌드할 때** 코드에 포함되는 환경변수입니다.

### 적용 대상

#### Frontend (Next.js)
```bash
NEXT_PUBLIC_API_URL=https://api.helpernote.com
```

**특징**:
- `NEXT_PUBLIC_*` 접두사가 붙은 모든 환경변수
- 클라이언트 JavaScript 번들에 포함됨
- 브라우저에서 접근 가능
- **빌드 시점에 값이 고정됨**

### 적용 시점

```
코드 변경 → Git Push → GitHub Actions 트리거
    ↓
Docker 빌드 시 build-args 전달
    ↓
Next.js 빌드 (.next/ 생성)
    ↓
NEXT_PUBLIC_API_URL이 번들에 포함
    ↓
Docker 이미지 생성 (값이 고정됨)
```

### 변경 방법

#### 로컬 개발 환경
```bash
# 1. frontend/.env 수정
NEXT_PUBLIC_API_URL=http://localhost:8000

# 2. 개발 서버 재시작
cd frontend
npm run dev  # 자동으로 새 값 적용
```

#### Kubernetes 프로덕션 환경
```bash
# 1. GitHub Actions 워크플로우 수정
# .github/workflows/cd-production.yaml
env:
  BACKEND_DOMAIN: api.helpernote.com  # 변경

# 2. Git 커밋 및 푸시
git add .github/workflows/cd-production.yaml
git commit -m "chore: update backend domain"
git push origin main

# 3. GitHub Actions가 자동으로:
#    - 새로운 이미지 빌드 (새 API URL 포함)
#    - ghcr.io에 푸시
#    - K8s 매니페스트 업데이트

# 4. ArgoCD가 자동으로:
#    - 새 이미지로 배포
#    - Pod 재시작 (새 이미지 사용)
```

⚠️ **중요**: ConfigMap을 변경해도 빌드 타임 환경변수는 변경되지 않습니다!

**잘못된 방법**:
```bash
# ❌ 이렇게 해도 NEXT_PUBLIC_API_URL은 변경 안됨!
kubectl edit configmap app-config -n helpernote
kubectl rollout restart deployment/frontend -n helpernote
```

**올바른 방법**:
```bash
# ✅ 새 이미지를 빌드해야 함
# main 브랜치에 푸시 → GitHub Actions → 새 이미지 빌드
```

---

## 시작 타임 환경변수

### 정의
**애플리케이션이 시작할 때** 읽어오는 환경변수입니다.

### 적용 대상

#### Backend (Rust/Axum)
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=xxx
JWT_EXPIRATION=3600
PORT=8000
RUST_LOG=info
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_BUCKET=helpernote
```

#### Frontend (Next.js 서버 사이드)
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**특징**:
- 애플리케이션 시작 시 한 번만 읽음
- 코드에서 `std::env::var()`, `process.env`로 접근
- **런타임에 변경 불가** (재시작 필요)

### 적용 시점

```
Pod 시작 (또는 재시작)
    ↓
Kubernetes가 환경변수 주입
    ↓
컨테이너 시작
    ↓
애플리케이션이 환경변수 읽음
    ↓
설정 초기화 (Config struct 생성)
    ↓
애플리케이션 실행
```

### 변경 방법

#### 로컬 개발 환경
```bash
# 1. backend/.env 수정
JWT_EXPIRATION=7200  # 3600 → 7200

# 2. 백엔드 재시작
cd backend
cargo run  # 재시작하면 새 값 적용
```

#### Kubernetes 프로덕션 환경

**Case 1: ConfigMap 값 변경**
```bash
# 1. ConfigMap 수정
kubectl edit configmap app-config -n helpernote
# 또는
vi k8s/base/configmap.yaml
kubectl apply -f k8s/base/configmap.yaml

# 2. Pod 재시작 (필수!)
kubectl rollout restart deployment/backend -n helpernote
kubectl rollout restart deployment/frontend -n helpernote

# 3. 재시작 확인
kubectl rollout status deployment/backend -n helpernote
```

**Case 2: Secret 값 변경**
```bash
# 1. Secret 수정
kubectl edit secret backend-secret -n helpernote
# 또는
vi k8s/base/secrets.yaml
kubectl apply -f k8s/base/secrets.yaml

# 2. Pod 재시작 (필수!)
kubectl rollout restart deployment/backend -n helpernote

# 3. 재시작 확인
kubectl rollout status deployment/backend -n helpernote
```

⚠️ **중요**: ConfigMap/Secret을 변경해도 **기존 Pod에는 반영되지 않습니다!**

```bash
# ❌ 이렇게만 하면 기존 Pod는 여전히 옛날 값 사용
kubectl apply -f k8s/base/configmap.yaml

# ✅ 반드시 Pod 재시작 필요
kubectl rollout restart deployment/backend -n helpernote
```

---

## 런타임 환경변수

### 정의
**애플리케이션 실행 중**에도 변경을 감지할 수 있는 설정입니다.

### Helpernote에서의 현황

**현재**: 런타임 환경변수 미지원

대부분의 환경변수는 **시작 타임**에 읽어오므로, 변경하려면 **재시작이 필수**입니다.

### 런타임 변경을 지원하려면

향후 구현 시 다음과 같은 방법을 사용할 수 있습니다:

```rust
// 예시: 설정 파일 모니터링
use notify::Watcher;

// ConfigMap이 파일로 마운트됨
// /etc/config/app.yaml
//
// 파일 변경 감지 → 설정 다시 로드
```

또는:

```rust
// 예시: 환경변수 주기적 체크
loop {
    let new_log_level = env::var("RUST_LOG").unwrap_or("info");
    if new_log_level != current_log_level {
        // 로그 레벨 동적 변경
        tracing_subscriber::reload(new_log_level);
    }
    sleep(Duration::from_secs(60));
}
```

**현재는 미구현**이므로 설정 변경 시 **반드시 재시작**해야 합니다.

---

## 환경별 적용 절차

### 로컬 개발 환경

| 환경변수 타입 | 변경 파일 | 적용 방법 |
|--------------|----------|----------|
| **빌드 타임** (NEXT_PUBLIC_*) | `frontend/.env` | `npm run dev` 재시작 |
| **시작 타임** (Backend) | `backend/.env` | `cargo run` 재시작 |
| **시작 타임** (Frontend 서버) | `frontend/.env` | `npm run dev` 재시작 |

**타임라인**:
```
.env 파일 수정
    ↓
개발 서버 재시작
    ↓
즉시 적용 (1초 이내)
```

---

### Kubernetes 프로덕션 환경

#### 1. 빌드 타임 환경변수 (NEXT_PUBLIC_*)

```
변경 파일: .github/workflows/cd-production.yaml
    ↓
Git commit & push to main
    ↓
GitHub Actions 실행 (5-10분)
    - Docker 이미지 빌드
    - ghcr.io 푸시
    - kustomization.yaml 업데이트
    ↓
ArgoCD 감지 (1-3분)
    - 새 매니페스트 적용
    - Rolling Update
    ↓
새 Pod 시작 (새 이미지 사용)
    ↓
적용 완료 (총 10-15분)
```

#### 2. 시작 타임 환경변수 (대부분)

**ConfigMap 변경**:
```
변경 파일: k8s/base/configmap.yaml
    ↓
kubectl apply -f k8s/base/configmap.yaml (즉시)
    ↓
kubectl rollout restart deployment/backend -n helpernote (1-2분)
    - 기존 Pod 종료
    - 새 Pod 시작 (새 ConfigMap 값 읽음)
    ↓
적용 완료 (총 2-3분)
```

**Secret 변경**:
```
변경 파일: k8s/base/secrets.yaml
    ↓
kubectl apply -f k8s/base/secrets.yaml (즉시)
    ↓
kubectl rollout restart deployment/backend -n helpernote (1-2분)
    ↓
적용 완료 (총 2-3분)
```

---

## 빠른 참조표

| 환경변수 | 타입 | 로컬 변경 | K8s 변경 | 재시작 필요? |
|---------|------|-----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | 빌드 타임 | `.env` 수정 → 서버 재시작 | GitHub Actions → 새 이미지 빌드 | ✅ (새 이미지) |
| `DATABASE_URL` | 시작 타임 | `.env` 수정 → 서버 재시작 | Secret 수정 → Pod 재시작 | ✅ |
| `JWT_SECRET` | 시작 타임 | `.env` 수정 → 서버 재시작 | Secret 수정 → Pod 재시작 | ✅ |
| `JWT_EXPIRATION` | 시작 타임 | `.env` 수정 → 서버 재시작 | ConfigMap 수정 → Pod 재시작 | ✅ |
| `PORT` | 시작 타임 | `.env` 수정 → 서버 재시작 | ConfigMap 수정 → Pod 재시작 | ✅ |
| `RUST_LOG` | 시작 타임 | `.env` 수정 → 서버 재시작 | ConfigMap 수정 → Pod 재시작 | ✅ |
| `MINIO_ENDPOINT` | 시작 타임 | `.env` 수정 → 서버 재시작 | ConfigMap 수정 → Pod 재시작 | ✅ |
| `MINIO_BUCKET` | 시작 타임 | `.env` 수정 → 서버 재시작 | ConfigMap 수정 → Pod 재시작 | ✅ |
| `NODE_ENV` | 시작 타임 | `.env` 수정 → 서버 재시작 | ConfigMap 수정 → Pod 재시작 | ✅ |

---

## 주요 포인트 요약

### ✅ 기억해야 할 핵심

1. **NEXT_PUBLIC_* 는 빌드 타임**
   - 이미지를 다시 빌드해야 변경됨
   - ConfigMap 수정으로는 변경 불가

2. **나머지는 시작 타임**
   - ConfigMap/Secret 수정 가능
   - **반드시 Pod 재시작 필요**

3. **ConfigMap/Secret 변경만으로는 부족**
   ```bash
   # ❌ 틀린 방법
   kubectl apply -f k8s/base/configmap.yaml
   # → 기존 Pod는 여전히 옛날 값 사용!

   # ✅ 올바른 방법
   kubectl apply -f k8s/base/configmap.yaml
   kubectl rollout restart deployment/backend -n helpernote
   # → 새 Pod가 시작하면서 새 값 읽어옴
   ```

4. **로컬 개발은 간단**
   - `.env` 파일 수정
   - 개발 서버 재시작
   - 끝!

5. **프로덕션 변경 시간**
   - ConfigMap/Secret 변경: 2-3분
   - 이미지 재빌드: 10-15분

---

## 트러블슈팅

### Q: ConfigMap을 수정했는데 변경이 안돼요!

**A**: Pod를 재시작하지 않았기 때문입니다.

```bash
kubectl rollout restart deployment/backend -n helpernote
kubectl rollout restart deployment/frontend -n helpernote
```

---

### Q: NEXT_PUBLIC_API_URL을 ConfigMap에서 변경했는데 안돼요!

**A**: `NEXT_PUBLIC_*`는 빌드 타임 환경변수입니다.

**해결**:
1. `.github/workflows/cd-production.yaml` 수정
2. main 브랜치에 푸시
3. GitHub Actions가 새 이미지 빌드
4. ArgoCD가 자동 배포

---

### Q: 환경변수가 제대로 주입되었는지 확인하려면?

**A**: Pod에서 직접 확인할 수 있습니다.

```bash
# 모든 환경변수 확인
kubectl exec -it deployment/backend -n helpernote -- env

# 특정 환경변수만 확인
kubectl exec -it deployment/backend -n helpernote -- env | grep JWT

# ConfigMap 확인
kubectl get configmap app-config -n helpernote -o yaml

# Secret 확인 (base64 디코딩)
kubectl get secret backend-secret -n helpernote -o jsonpath='{.data.jwt-secret}' | base64 -d
```

---

### Q: 재시작 없이 설정을 변경할 수 있나요?

**A**: 현재는 불가능합니다.

모든 환경변수는 **시작 타임**에 읽어오므로 변경하려면 **반드시 재시작**이 필요합니다.

향후 런타임 설정 리로드 기능을 추가할 수 있지만, 현재는 미구현 상태입니다.

---

### Q: Rolling Update 중에 서비스가 중단되나요?

**A**: 아니요, 무중단 배포됩니다.

```
기존 Pod 2개 실행 중
    ↓
새 Pod 1개 시작 (총 3개)
    ↓
새 Pod 준비 완료 (readinessProbe 통과)
    ↓
기존 Pod 1개 종료 (총 2개)
    ↓
새 Pod 1개 더 시작 (총 3개)
    ↓
새 Pod 준비 완료
    ↓
기존 Pod 1개 더 종료 (총 2개)
    ↓
배포 완료 (새 Pod 2개)
```

Rolling Update 동안 최소 2개의 Pod가 항상 실행되므로 서비스 중단 없습니다.

---

## 참고 문서

- [CONFIGURATION.md](./CONFIGURATION.md) - 상세 설정 가이드
- [ENV_SUMMARY.md](./ENV_SUMMARY.md) - 환경변수 빠른 참조
- [WORKFLOW.md](./WORKFLOW.md) - Git 워크플로우
