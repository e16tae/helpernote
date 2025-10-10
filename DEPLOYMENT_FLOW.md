# 배포 흐름 상세 가이드

main 브랜치 머지 후 **자동으로** 어떤 일이 일어나는지 설명합니다.

---

## 🚀 전체 배포 흐름

```
개발자 작업                GitHub Actions              ArgoCD                  Kubernetes
──────────────────────    ──────────────────────    ──────────────────    ──────────────────

1. develop 브랜치 작업
   git commit
   git push origin develop
        │
        ▼
   GitHub에 푸시됨
        │
        ▼
   CI 워크플로우 실행
   (테스트만, 배포 안함)


2. GitHub에서 PR 생성
   develop → main


3. PR 리뷰 및 머지
   (GitHub 웹에서)
        │
        ▼
   main 브랜치에 머지됨 ──────► CD 워크플로우 시작
        │                         │
        │                         ▼
        │                    Docker 이미지 빌드
        │                    - backend 빌드
        │                    - frontend 빌드
        │                         │
        │                         ▼
        │                    ghcr.io에 푸시
        │                    - ghcr.io/e16tae/helpernote-backend:main-abc123
        │                    - ghcr.io/e16tae/helpernote-frontend:main-abc123
        │                         │
        │                         ▼
        │                    kustomization.yaml 업데이트
        │                    (새 이미지 태그로 변경)
        │                         │
        │                         ▼
        │                    Git 커밋 & 푸시
        │                    "chore: update image to main-abc123"
        │                         │
        │                         ▼
        │                    GitHub에 자동 커밋됨
        │                                            │
        │                                            ▼
        │                                       ArgoCD가 감지
        │                                       (3분마다 폴링)
        │                                            │
        │                                            ▼
        │                                       Git 저장소와 비교
        │                                       "새 커밋 발견!"
        │                                            │
        │                                            ▼
        │                                       매니페스트 다운로드
        │                                       (자동으로 pull)
        │                                            │
        │                                            ▼
        │                                       Kubernetes 적용        ───► 새 이미지로 배포
        │                                       kubectl apply 자동 실행      - backend Pod 재시작
        │                                                                   - frontend Pod 재시작
        │                                                                   - Rolling Update
        │                                                                        │
        │                                                                        ▼
        │                                                                   배포 완료!
        │                                                                   https://www.helpernote.com
        │                                                                   https://api.helpernote.com
```

---

## ❓ 자주 묻는 질문

### Q1: main에 머지한 후 내가 해야 할 일이 있나요?

**A: 아무것도 없습니다!** ✨

```bash
# ❌ 이런 거 할 필요 없음!
git pull origin main
cd k8s
kubectl apply -f overlays/production/

# ✅ 그냥 기다리면 됨
# GitHub Actions → ArgoCD가 자동으로 처리
```

---

### Q2: 그럼 언제 수동으로 kubectl을 사용하나요?

**A: 다음 경우에만 수동 작업이 필요합니다:**

#### 1. 처음 배포 시 (최초 1회)

```bash
# Secret 적용 (Git에 없음)
kubectl apply -f k8s/base/secrets.yaml

# ArgoCD Application 등록
kubectl apply -f argocd/helpernote-production.yaml
```

#### 2. ConfigMap 긴급 변경 시

```bash
# 로그 레벨을 급하게 변경해야 할 때
kubectl edit configmap app-config -n helpernote
kubectl rollout restart deployment/backend -n helpernote
```

#### 3. Secret 긴급 변경 시

```bash
# 비밀번호가 노출되어 급하게 변경해야 할 때
kubectl edit secret backend-secret -n helpernote
kubectl rollout restart deployment/backend -n helpernote
```

#### 4. ArgoCD가 고장났을 때

```bash
# ArgoCD가 동작하지 않는 경우에만
kubectl apply -k k8s/overlays/production/
```

**일반적인 코드 변경 및 배포에는 kubectl 사용 안함!**

---

### Q3: ArgoCD는 어떻게 변경사항을 감지하나요?

**A: Git 저장소를 주기적으로 폴링합니다.**

```yaml
# argocd/helpernote-production.yaml
spec:
  source:
    repoURL: https://github.com/e16tae/helpernote.git
    targetRevision: main  # ← main 브랜치 추적
    path: k8s/overlays/production  # ← 이 경로 모니터링
```

**동작 방식**:
```
ArgoCD가 3분마다:
  1. Git 저장소에서 최신 커밋 확인
  2. 현재 클러스터 상태와 비교
  3. 차이가 있으면 → 자동으로 동기화
  4. 차이가 없으면 → 아무것도 안함
```

---

### Q4: 배포 상태는 어떻게 확인하나요?

**A: 여러 방법이 있습니다.**

#### 방법 1: GitHub Actions 확인

```
https://github.com/e16tae/helpernote/actions

✅ CD - Production Deployment
   - Build and Push Docker Images (5분)
   - Update K8s Manifests (1분)
   - Trigger ArgoCD Sync (즉시)
```

#### 방법 2: ArgoCD 웹 UI 확인

```bash
# ArgoCD 접속 (포트포워드 필요 시)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 브라우저에서
https://localhost:8080

# 로그인 정보
Username: admin
Password: kubectl -n argocd get secret argocd-initial-admin-secret \
          -o jsonpath="{.data.password}" | base64 -d
```

**확인 사항**:
- App Health: Healthy
- Sync Status: Synced
- Last Sync: 방금 시간

#### 방법 3: kubectl 명령어

```bash
# ArgoCD Application 상태
kubectl get application -n argocd

# Pod 상태
kubectl get pods -n helpernote

# 배포 이력
kubectl rollout history deployment/backend -n helpernote
kubectl rollout history deployment/frontend -n helpernote

# 실시간 로그
kubectl logs -f deployment/backend -n helpernote
```

---

### Q5: 배포가 실패하면 어떻게 되나요?

**A: ArgoCD가 자동으로 재시도합니다.**

```yaml
# argocd/helpernote-production.yaml
spec:
  syncPolicy:
    retry:
      limit: 5           # 최대 5번 재시도
      backoff:
        duration: 5s     # 처음 5초 대기
        factor: 2        # 2배씩 증가
        maxDuration: 3m  # 최대 3분 대기
```

**재시도 스케줄**:
```
1차 시도 실패 → 5초 후 재시도
2차 시도 실패 → 10초 후 재시도
3차 시도 실패 → 20초 후 재시도
4차 시도 실패 → 40초 후 재시도
5차 시도 실패 → 3분 후 재시도 (maxDuration)
```

**여전히 실패하면**:
- ArgoCD UI에서 오류 확인
- 수동으로 문제 해결 후
- ArgoCD에서 "Sync" 버튼 클릭

---

### Q6: 로컬에서 k8s 매니페스트를 업데이트해야 하나요?

**A: 개발 작업을 계속하려면 pull 받는 것이 좋습니다.**

```bash
# GitHub Actions가 kustomization.yaml을 자동으로 수정함
# → 로컬과 원격이 달라짐

# 로컬에서 작업 계속하려면
git pull origin main

# 이제 최신 상태로 작업 가능
```

**그러나 배포 자체는 로컬 작업과 무관합니다!**

```
배포 = ArgoCD가 Git 저장소에서 직접 가져옴
로컬 = 개발자의 작업 공간 (배포와 무관)
```

---

## 🎯 핵심 정리

### 자동으로 되는 것 (손댈 필요 없음) ✅

```
1. main 브랜치로 머지
   ↓
2. GitHub Actions 실행
   - Docker 이미지 빌드
   - ghcr.io에 푸시
   - kustomization.yaml 업데이트
   ↓
3. ArgoCD 자동 감지
   - Git에서 매니페스트 다운로드 (자동 pull)
   - kubectl apply 자동 실행
   ↓
4. Kubernetes 배포
   - Rolling Update
   - 무중단 배포
   ↓
5. 배포 완료!
```

### 수동으로 해야 하는 것 ❗

```
✅ develop 브랜치에서 개발 및 커밋
✅ GitHub에서 PR 생성 및 머지
✅ (선택) ArgoCD UI에서 배포 상태 확인
✅ (선택) 로컬 Git pull (개발 계속하려면)

❌ Git clone/pull to k8s cluster (필요 없음!)
❌ kubectl apply (ArgoCD가 자동으로 함!)
❌ Docker push (GitHub Actions가 자동으로 함!)
```

---

## 📊 타임라인 예시

### 시나리오: 로그인 버그 수정

```
10:00 - develop 브랜치에서 버그 수정
        git commit -m "fix: login bug"
        git push origin develop

10:02 - CI 통과 확인 (GitHub Actions)

10:05 - GitHub에서 PR 생성 (develop → main)

10:10 - PR 리뷰 및 승인

10:15 - PR 머지 완료
        ↓
        ✨ 여기서부터 자동! ✨

10:16 - GitHub Actions CD 시작
10:18 - Backend 이미지 빌드 완료
10:20 - Frontend 이미지 빌드 완료
10:21 - ghcr.io에 이미지 푸시 완료
10:22 - kustomization.yaml 업데이트 & 커밋

10:25 - ArgoCD가 변경사항 감지
        (3분마다 폴링, 운이 좋으면 바로)

10:26 - ArgoCD가 Git에서 매니페스트 다운로드
10:27 - kubectl apply 자동 실행
        - backend Pod 재시작 시작

10:28 - 새 backend Pod 준비 완료 (readinessProbe)
10:29 - 기존 backend Pod 종료
        - frontend Pod 재시작 시작

10:30 - 새 frontend Pod 준비 완료
10:31 - 기존 frontend Pod 종료

10:32 - 배포 완료! ✅
        https://www.helpernote.com 접속 확인
        버그 수정 반영됨!
```

**총 소요 시간**: 약 15-20분 (PR 머지 후 자동)

---

## 🔧 트러블슈팅

### ArgoCD가 자동 동기화를 안해요!

**확인사항**:

```bash
# 1. ArgoCD Application 상태 확인
kubectl get application helpernote-production -n argocd

# 2. Sync Policy 확인
kubectl get application helpernote-production -n argocd -o yaml | grep -A 5 syncPolicy

# 기대값:
# syncPolicy:
#   automated:
#     prune: true
#     selfHeal: true
```

**해결방법**:

```bash
# 수동으로 동기화
kubectl patch application helpernote-production -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# 또는 ArgoCD UI에서 "Sync" 버튼 클릭
```

---

### GitHub Actions는 성공했는데 ArgoCD가 배포를 안해요!

**원인**: ArgoCD가 Git 변경사항을 아직 감지 못함 (최대 3분 대기)

**확인**:

```bash
# ArgoCD Application 세부 정보
kubectl describe application helpernote-production -n argocd

# 마지막 Sync 시간 확인
```

**해결**:

```bash
# 수동으로 동기화
argocd app sync helpernote-production

# 또는 kubectl
kubectl patch application helpernote-production -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'
```

---

### 배포는 됐는데 옛날 버전이 떠요!

**원인**: Image Pull Policy 문제 또는 태그 문제

**확인**:

```bash
# 현재 실행 중인 이미지 확인
kubectl get pods -n helpernote -o jsonpath='{.items[*].spec.containers[*].image}'

# kustomization.yaml의 이미지 태그 확인
cat k8s/overlays/production/kustomization.yaml
```

**해결**:

```bash
# Pod 강제 재시작
kubectl rollout restart deployment/backend -n helpernote
kubectl rollout restart deployment/frontend -n helpernote

# 이미지 강제 pull
kubectl delete pod -l app=backend -n helpernote
kubectl delete pod -l app=frontend -n helpernote
```

---

## 📚 관련 문서

- [WORKFLOW.md](./WORKFLOW.md) - Git 워크플로우 (develop → main)
- [ENV_TIMING.md](./ENV_TIMING.md) - 환경변수 적용 시점
- [DEPLOY.md](./DEPLOY.md) - 초기 배포 가이드
- [CONFIGURATION.md](./CONFIGURATION.md) - 설정 관리 가이드
