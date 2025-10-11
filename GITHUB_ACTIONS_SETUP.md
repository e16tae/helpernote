# GitHub Actions 설정 가이드

## 🔐 필수: GitHub Secrets 설정

### 1. GH_PAT (Critical - 반드시 설정)

**목적**: Protected 브랜치(main)에 자동으로 푸시하기 위한 권한

**생성 방법**:
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. "Generate new token" 클릭
3. 다음 설정 입력:
   - **Token name**: `Helpernote CD Workflow`
   - **Expiration**: `90 days` (또는 원하는 기간)
   - **Repository access**: `Only select repositories` → `helpernote` 선택
   - **Permissions**:
     - Repository permissions → Contents: `Read and write`
     - Repository permissions → Workflows: `Read and write`
4. "Generate token" 클릭 후 토큰 복사
5. 저장소 Settings → Secrets and variables → Actions → New repository secret
   - Name: `GH_PAT`
   - Secret: 복사한 토큰 붙여넣기

**검증**:
```bash
# main 브랜치에 푸시 후 Actions 탭에서 확인
# "Update K8s Manifests" 단계가 성공하면 OK
```

---

### 2. ARGOCD_SERVER (선택 - ArgoCD 자동 sync 원할 경우)

**목적**: ArgoCD 애플리케이션 자동 sync

**값**: `argocd.helpernote.my` (ArgoCD 서버 도메인)

**설정 방법**:
1. 저장소 Settings → Secrets and variables → Actions → New repository secret
   - Name: `ARGOCD_SERVER`
   - Secret: ArgoCD 서버 URL (https:// 제외)

---

### 3. ARGOCD_TOKEN (선택 - ArgoCD 자동 sync 원할 경우)

**목적**: ArgoCD API 인증

**생성 방법**:
```bash
# 1. ArgoCD에 로그인
argocd login argocd.helpernote.my

# 2. 토큰 생성
argocd account generate-token --account github-actions

# 3. 출력된 토큰 복사
```

**설정 방법**:
1. 저장소 Settings → Secrets and variables → Actions → New repository secret
   - Name: `ARGOCD_TOKEN`
   - Secret: 복사한 토큰 붙여넣기

**참고**: ArgoCD 설정 없이도 배포는 작동합니다 (ArgoCD가 자동으로 Git 변경사항 감지)

---

### 4. SLACK_WEBHOOK_URL (선택 - Slack 알림 원할 경우)

**목적**: 배포 상태를 Slack으로 알림

**생성 방법**:
1. Slack App 생성: https://api.slack.com/apps
2. "Create New App" → "From scratch"
3. App name: `Helpernote Deployments`, Workspace 선택
4. "Incoming Webhooks" 활성화
5. "Add New Webhook to Workspace" → 채널 선택
6. Webhook URL 복사

**설정 방법**:
1. 저장소 Settings → Secrets and variables → Actions → New repository secret
   - Name: `SLACK_WEBHOOK_URL`
   - Secret: 복사한 Webhook URL

---

## 🔒 필수: Environment 설정

### Production Environment 생성

**목적**: 프로덕션 배포 전 수동 승인 요구

**설정 방법**:
1. 저장소 Settings → Environments → "New environment"
2. Name: `production` (정확히 이 이름으로 입력)
3. "Configure environment" 클릭
4. 다음 설정 활성화:

   **Protection rules**:
   - ✅ **Required reviewers**:
     - 승인자 추가 (본인 또는 팀원)
     - 1명 이상 권장

   - ⏱️ **Wait timer** (선택):
     - 5 minutes (배포 전 5분 대기)
     - 급한 롤백 방지용

   **Deployment branches**:
   - ✅ Selected branches
   - `main` 브랜치만 선택

5. "Save protection rules" 클릭

**효과**:
```
Push to main → Manual approval required ⏸️
                ↓ (승인 후)
              CD 워크플로우 계속 진행 ✅
```

---

## 📝 선택: Dependabot Reviewers 설정

Dependabot이 생성한 PR의 리뷰어를 자동으로 지정하려면:

1. `.github/dependabot.yml` 파일에서 `reviewers` 부분 수정:
```yaml
reviewers:
  - "your-github-username"  # 실제 GitHub username으로 변경
```

2. 커밋하고 푸시

---

## ✅ 설정 완료 확인

### 1. Secrets 확인
```bash
# 저장소 Settings → Secrets and variables → Actions
# 다음 항목이 보여야 함:
- GH_PAT (required)
- ARGOCD_SERVER (optional)
- ARGOCD_TOKEN (optional)
- SLACK_WEBHOOK_URL (optional)
```

### 2. Environment 확인
```bash
# 저장소 Settings → Environments
# 'production' environment가 다음 설정으로 존재해야 함:
- Required reviewers: ✅
- Deployment branches: main only
```

### 3. 테스트 배포
```bash
# 테스트 커밋 생성
git checkout main
git commit --allow-empty -m "test: trigger CD workflow"
git push origin main

# Actions 탭에서 확인:
1. "CD - Production Deployment" 워크플로우 시작
2. "Build and Push Docker Images" 단계에서 대기
3. "Review deployments" 버튼 표시 → 승인 필요
4. 승인 후 나머지 단계 진행
```

---

## 🔧 트러블슈팅

### "Update K8s Manifests" 단계 실패

**오류**: `failed to push some refs to 'main'`

**원인**: `GH_PAT` secret이 설정되지 않았거나 권한 부족

**해결**:
1. GH_PAT 설정 확인 (위의 "1. GH_PAT" 섹션 참고)
2. 토큰 권한 확인:
   - Contents: Read and write ✅
   - Workflows: Read and write ✅

---

### "Trigger ArgoCD Sync" 단계 건너뜀

**메시지**: `ArgoCD credentials not configured. Skipping automatic sync.`

**원인**: `ARGOCD_SERVER` 또는 `ARGOCD_TOKEN` secret 미설정

**해결**:
- **자동 sync 필요**: 위의 "2-3. ArgoCD" 섹션 참고하여 설정
- **수동 sync 선호**: 문제 없음, ArgoCD가 Git 변경사항 자동 감지

---

### Health Check 실패

**오류**: `Backend health check failed after 10 attempts`

**원인**:
1. 도메인이 실제 서비스와 다름
2. Kubernetes pod이 정상 작동하지 않음
3. Ingress 설정 오류

**해결**:
1. 도메인 확인:
   ```bash
   # cd-production.yaml 파일의 env 섹션 확인
   BACKEND_DOMAIN: api.helpernote.my
   FRONTEND_DOMAIN: www.helpernote.my
   ```

2. Pod 상태 확인:
   ```bash
   kubectl get pods -n helpernote
   kubectl logs -n helpernote -l app=backend
   ```

3. 임시 해결 (긴급):
   - `cd-production.yaml`에서 `verify-deployment` job 주석 처리
   - 나중에 도메인 설정 후 복구

---

### Slack 알림 미수신

**확인사항**:
1. `SLACK_WEBHOOK_URL` secret 설정 확인
2. Slack App의 Incoming Webhooks 활성화 확인
3. Webhook URL이 유효한지 테스트:
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test notification"}'
   ```

---

## 📚 추가 리소스

- **워크플로우 문서**: `.github/workflows/README.md`
- **Dependabot 설정**: `.github/dependabot.yml`
- **GitHub Actions 가이드**: https://docs.github.com/en/actions
- **ArgoCD 문서**: https://argo-cd.readthedocs.io/

---

## 🆘 지원

문제 발생 시:
1. Actions 탭에서 실패한 단계의 로그 확인
2. 이 문서의 트러블슈팅 섹션 참고
3. GitHub Issues에 문의: https://github.com/e16tae/helpernote/issues

---

**마지막 업데이트**: 2025-10-11
**작성자**: Claude Code
