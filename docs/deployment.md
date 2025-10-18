# Helpernote | Deployment Guide

Helpernote는 Docker Compose 기반의 로컬 개발 환경과 Kubernetes + ArgoCD 기반의 프로덕션 배포 흐름을 모두 제공합니다. 이 문서는 인프라 준비부터 모니터링, 비상 대응까지의 전체 프로세스를 정리합니다.

## 아키텍처 개요

```
develop → GitHub Actions CI (fmt, lint, test, build)
   ↓
main → GitHub Actions CD (Docker build & push, kustomize patch)
   ↓
ArgoCD → Kubernetes (PostgreSQL, MinIO, Backend, Frontend)
   ↓
Kong Gateway → https://www.example.com
```

구성 요소:
- **Backend**: Rust + Axum, JWT 인증, PostgreSQL, MinIO 연동
- **Frontend**: Next.js 15, Tailwind CSS, shadcn/ui
- **PostgreSQL**: StatefulSet + PersistentVolume
- **MinIO**: Object Storage (StatefulSet)
- **Ingress**: Kong Gateway (TLS, Rate Limit, Redirect)
- **GitOps**: ArgoCD 애플리케이션 (`argocd/helpernote-production.yaml`)

## 사전 준비

1. **도메인**: `www.example.com`, `api.example.com`, `files.example.com`
2. **레지스트리**: GitHub Container Registry (PAT 권한: `repo`, `write:packages`)
3. **Kubernetes**: 1.25+, StorageClass, cert-manager(선택), Kong Ingress
4. **ArgoCD**: CLI와 관리자/CI 계정 토큰 발급
5. **Secrets**: [환경 구성 문서](./environment.md)에 따라 `./scripts/seal-secrets.sh`로 SealedSecret을 생성해 `k8s/sealed-secrets/`에 커밋하고, GHCR/TLS/GitHub Secrets도 준비

## 로컬 개발 (Docker Compose)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

make dev-up          # PostgreSQL + MinIO 기동
make backend-dev     # 백엔드 실행 (cargo watch/optional)
make frontend-dev    # 프런트엔드 실행
```

- 웹앱: http://localhost:3000  
- API: http://localhost:8000  
- MinIO 콘솔: http://localhost:9001 (기본 계정 `minioadmin/minioadmin`)

### nerdctl compose 환경

Docker 대신 containerd 기반 개발 환경을 사용한다면 [`nerdctl`](https://github.com/containerd/nerdctl) 의 compose 플러그인으로 동일한 서비스를 기동할 수 있습니다.

```bash
# nerdctl 설치 이후, 필요한 데이터 디렉터리 생성 및 서비스 시작
./scripts/nerd-compose-up.sh

# 선택적으로 빌드 옵션이나 서비스 필터를 전달할 수 있습니다.
./scripts/nerd-compose-up.sh --build postgres
```

스크립트는 `nerd-compose.yaml` 을 사용하며, PostgreSQL(5432)과 MinIO(9000/9001)를 containerd 위에서 실행합니다. 기존 Docker Compose와 동일한 환경 변수를 사용하므로 `backend/.env`, `frontend/.env` 설정만 맞춰주면 됩니다.

### 로컬 테스트 시나리오

**Docker Compose**
- `docker compose -f docker-compose.dev.yml up -d`로 PostgreSQL/MinIO 의존성을 기동합니다.
- 애플리케이션 루트에서 `make test`(또는 개별 `cargo test`, `npm test`)를 실행해 백엔드/프런트엔드 테스트를 검증합니다.
- 필요한 경우 `docker compose -f docker-compose.dev.yml logs -f postgres`(혹은 `minio`)로 로그를 확인합니다.
- 테스트가 끝나면 `docker compose -f docker-compose.dev.yml down -v`로 리소스를 정리합니다.

**nerdctl compose**
- `./scripts/nerd-compose-up.sh`로 동일한 PostgreSQL/MinIO 스택을 containerd 환경에서 기동합니다.
- 별도 쉘에서 `make test` 또는 필요한 테스트 명령을 실행합니다.
- 로그가 필요할 땐 `nerdctl compose -f nerd-compose.yaml logs -f postgres`처럼 서비스명을 지정합니다.
- 종료 시 `nerdctl compose -f nerd-compose.yaml down -v`로 볼륨까지 제거합니다.

## GitHub Actions 파이프라인

워크플로: `.github/workflows/cd-production.yaml`

| 단계 | 설명 |
| ---- | ---- |
| `lint-and-test` | `cargo fmt`, `cargo clippy`, `cargo test`, `npm run lint`, `npm run test`, `npm run build` |
| `build-and-push` | 백엔드/프런트엔드 Docker 이미지 빌드 후 GHCR에 업로드 |
| `update-manifests` | `k8s/overlays/production/kustomization.yaml` 이미지 태그 패치 |
| `trigger-argocd` | `ARGOCD_*` 시크릿이 설정된 경우 ArgoCD 동기화 실행 |

실패 시 GitHub Actions 로그와 ArgoCD 이벤트를 함께 확인합니다.

## ArgoCD 설정

`argocd/helpernote-production.yaml` 예시:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: helpernote-production
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/YOUR_ORG/helpernote.git
    targetRevision: main
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: helpernote
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

```bash
kubectl apply -f argocd/helpernote-production.yaml
argocd app sync helpernote-production
```

## Kubernetes 배포 절차

1. **시크릿 적용**  
   ```bash
   kubectl apply -k k8s/sealed-secrets
   kubectl create secret docker-registry ghcr-secret ... -n helpernote
   ```
2. **TLS 인증서**
   - cert-manager 사용:
     ```bash
     kubectl apply -f k8s/cert-manager/cluster-issuer.yaml
     kubectl get certificate -n helpernote -w
     ```
   - 수동 Secret:
     ```bash
     kubectl create secret tls helpernote-wildcard-tls \
       --cert=/path/to/fullchain.pem \
       --key=/path/to/privkey.pem \
       --namespace=helpernote
     ```
3. **Overlays 배포**
   ```bash
   kubectl apply -k k8s/overlays/production
   ```
4. **상태 확인**
   ```bash
   kubectl get pods,svc,ingress -n helpernote
   ```

## 검증 체크리스트

1. `kubectl get pods -n helpernote` → 모든 파드가 `Ready`
2. `https://www.example.com` 접속 → 로그인/매칭/정산 기능 테스트
3. MinIO 업로드/다운로드 검증 (`scripts/test_minio_upload.sh`가 있는 경우 실행)
4. `kubectl logs deployment/prod-backend -n helpernote` 로 에러 로그 확인
5. ArgoCD UI에서 애플리케이션 상태가 `Healthy/Synced`

## 유지보수 명령어

```bash
# 이미지 강제 롤아웃
kubectl rollout restart deployment/prod-backend -n helpernote

# 특정 버전 롤백
kubectl rollout undo deployment/prod-frontend -n helpernote

# 데이터베이스 스냅샷 (예시)
kubectl exec -it statefulset/prod-postgres -n helpernote -- pg_dump helpernote > backup.sql
```

## 모니터링 & 트러블슈팅

| 증상 | 원인 | 조치 |
| ---- | ---- | ---- |
| 웹앱 502 | Backend Pod 미기동, Ingress 라우팅 오류 | `kubectl get pods`, Ingress/Kong 로그 확인 |
| 파일 업로드 실패 | MinIO 자격 증명 불일치 | MinIO Secret 재확인, 버킷 정책 확인 |
| JWT 인증 에러 | Secret 미적용 또는 exp 설정 불일치 | `JWT_SECRET`, `JWT_EXPIRATION` 재설정 |
| CI 이미지 빌드 실패 | Dockerfile 변경, 의존성 오류 | GitHub Actions 로그 확인 후 수정 |

## 리소스 정리

```bash
argocd app delete helpernote-production --cascade
kubectl delete namespace helpernote
make down  # 로컬 Docker Compose 정리
```
