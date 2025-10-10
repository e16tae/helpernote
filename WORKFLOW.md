# Helpernote Development & Deployment Workflow

## 📋 Git Branch Strategy

```
develop (개발 브랜치) ──┐
                      │ PR & Merge
                      ▼
main (프로덕션 브랜치) ──► 자동 배포
```

---

## 🔄 일상 개발 워크플로우

### 1. 코드 변경 및 개발

```bash
# develop 브랜치에서 작업
git checkout develop

# 코드 수정 후
git add .
git commit -m "feat: 새로운 기능 추가"

# develop 브랜치로 푸시
git push origin develop
```

**✅ 결과**: GitHub Actions에서 **CI 워크플로우만** 실행됩니다
- 백엔드 테스트 (Rust tests, clippy, fmt)
- 프론트엔드 테스트 (TypeScript check, lint, build)
- Docker 이미지 빌드 테스트 (푸시 안함)

---

### 2. 프로덕션 배포 (main으로 머지)

```bash
# GitHub에서 Pull Request 생성
# develop → main

# PR 머지 후 자동으로 실행됨:
```

**🚀 자동 배포 프로세스**:

1. **GitHub Actions CD 워크플로우 실행** (`cd-production.yaml`):
   ```
   ✓ 백엔드 Docker 이미지 빌드
   ✓ 프론트엔드 Docker 이미지 빌드
   ✓ ghcr.io/e16tae/helpernote-backend:main-{SHA} 푸시
   ✓ ghcr.io/e16tae/helpernote-frontend:main-{SHA} 푸시
   ✓ k8s/overlays/production/kustomization.yaml 업데이트 (이미지 태그)
   ✓ Git 커밋 및 푸시
   ```

2. **ArgoCD 자동 동기화**:
   ```
   ✓ Git 변경사항 감지 (kustomization.yaml)
   ✓ 새로운 매니페스트 적용
   ✓ Kubernetes 클러스터에 배포
   ✓ Rolling Update 실행
   ```

3. **배포 완료**:
   - Frontend: https://www.helpernote.com
   - Backend API: https://api.helpernote.com

---

## 📊 브랜치별 동작

| 브랜치 | Push 시 동작 | 배포 여부 |
|--------|-------------|----------|
| `develop` | CI만 실행 (테스트, 빌드 체크) | ❌ 배포 안함 |
| `main` | CI + CD 실행 (이미지 빌드 & 배포) | ✅ 자동 배포 |

---

## 🔧 GitHub Actions 워크플로우

### CI 워크플로우 (develop)
**파일**: `.github/workflows/ci-develop.yaml`
**트리거**: `develop` 브랜치로 push 또는 PR

```yaml
on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]
```

**실행 내용**:
- Backend: `cargo test`, `cargo clippy`, `cargo fmt --check`
- Frontend: `npm run lint`, `tsc --noEmit`, `npm run build`
- Docker: 이미지 빌드 테스트 (푸시 안함)

---

### CD 워크플로우 (main)
**파일**: `.github/workflows/cd-production.yaml`
**트리거**: `main` 브랜치로 push (머지 포함)

```yaml
on:
  push:
    branches: [main]
```

**실행 내용**:
1. **build-and-push** job:
   - Docker 이미지 빌드
   - ghcr.io로 푸시 (태그: `main-{SHA}`, `latest`)

2. **update-manifests** job:
   - `k8s/overlays/production/kustomization.yaml` 업데이트
   - 이미지 태그를 `main-{SHA}`로 변경
   - Git 커밋 및 푸시

3. **trigger-argocd-sync** job:
   - ArgoCD가 자동으로 감지하여 배포

---

## 🎯 ArgoCD 자동 배포 설정

**파일**: `argocd/helpernote-production.yaml`

```yaml
spec:
  source:
    repoURL: https://github.com/e16tae/helpernote.git
    targetRevision: main  # main 브랜치 추적
    path: k8s/overlays/production

  syncPolicy:
    automated:
      prune: true      # 삭제된 리소스 자동 제거
      selfHeal: true   # 클러스터 변경 시 자동 복구
```

**동작 방식**:
- ArgoCD가 3분마다 Git 저장소를 폴링
- `k8s/overlays/production/kustomization.yaml` 변경 감지
- 새로운 이미지 태그로 자동 배포
- Rolling Update로 무중단 배포

---

## 📝 예제 시나리오

### 시나리오 1: 새 기능 개발

```bash
# 1. develop에서 작업
git checkout develop
# ... 코드 수정 ...
git add .
git commit -m "feat: 메모 검색 기능 추가"
git push origin develop

# ✓ CI 워크플로우 실행 (테스트만)
# ✓ 테스트 통과 확인
```

### 시나리오 2: 프로덕션 배포

```bash
# 2. GitHub에서 PR 생성
# develop → main

# 3. PR 리뷰 및 머지

# 4. 자동으로 진행됨:
# ✓ CD 워크플로우 실행 (약 5-10분)
# ✓ Docker 이미지 빌드 & ghcr.io 푸시
# ✓ kustomization.yaml 업데이트
# ✓ ArgoCD 감지 및 배포 (약 1-3분)
# ✓ 배포 완료!
```

### 시나리오 3: 긴급 핫픽스

```bash
# 1. main 브랜치에서 직접 수정
git checkout main
# ... 버그 수정 ...
git add .
git commit -m "fix: 로그인 버그 수정"
git push origin main

# ✓ CD 워크플로우 즉시 실행
# ✓ 자동 배포
```

---

## 🔍 배포 상태 확인

### GitHub Actions 확인
```bash
# GitHub 웹에서 확인:
https://github.com/e16tae/helpernote/actions
```

### ArgoCD 웹 UI 확인
```bash
# ArgoCD 포트포워드 (필요 시)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 접속: https://localhost:8080
# 앱: helpernote-production
```

### CLI로 배포 상태 확인
```bash
# Pods 상태
kubectl get pods -n helpernote

# ArgoCD 앱 상태
kubectl get application -n argocd

# 배포 로그
kubectl logs -f deployment/backend -n helpernote
kubectl logs -f deployment/frontend -n helpernote
```

---

## ⚠️ 주의사항

1. **develop 브랜치는 배포되지 않습니다**
   - 테스트 및 검증만 수행
   - 안전하게 실험 가능

2. **main 브랜치는 자동 배포됩니다**
   - main으로 머지 = 즉시 프로덕션 배포
   - 신중하게 머지할 것

3. **이미지 태그 전략**
   - `latest`: 항상 최신 main 브랜치
   - `main-{SHA}`: 특정 커밋의 이미지 (롤백 가능)

4. **롤백 방법**
   ```bash
   # kustomization.yaml에서 이전 SHA로 변경
   cd k8s/overlays/production
   # newTag를 이전 SHA로 수정
   git add kustomization.yaml
   git commit -m "chore: rollback to previous version"
   git push
   # ArgoCD가 자동으로 롤백 배포
   ```

---

## 🚀 첫 배포 체크리스트

사용자가 직접 수행해야 할 작업:

- [ ] GitHub 저장소 생성: `e16tae/helpernote`
- [ ] GitHub Actions 권한 설정:
  - Settings → Actions → General
  - Workflow permissions → **Read and write permissions**
- [ ] 코드 푸시:
  ```bash
  git remote add origin https://github.com/e16tae/helpernote.git
  git push -u origin main
  git push -u origin develop
  ```
- [ ] Kubernetes 시크릿 적용:
  ```bash
  kubectl apply -f k8s/base/secrets.yaml
  ```
- [ ] ArgoCD 애플리케이션 배포:
  ```bash
  kubectl apply -f argocd/helpernote-production.yaml
  ```
- [ ] 배포 확인:
  ```bash
  kubectl get pods -n helpernote
  curl https://api.helpernote.com/health
  ```

---

## 📚 관련 문서

- [DEPLOY.md](./DEPLOY.md) - 상세 배포 가이드
- [CLAUDE.md](./CLAUDE.md) - 프로젝트 구조 및 개발 가이드
- [README.md](./README.md) - 프로젝트 개요
