# Helpernote | Secrets & Environment

## 1. GitHub Secrets (선택)
기본 배포 파이프라인은 `GITHUB_TOKEN`으로 GHCR 이미지를 푸시합니다. ArgoCD 자동 동기화 등 추가 기능이 필요할 때만 저장소 **Settings → Secrets and variables → Actions** 에 값을 추가하세요.

| 키 | 용도 |
| --- | --- |
| `ARGOCD_SERVER` | ArgoCD CLI가 접근할 서버 주소 (`https://argocd.example.com`) |
| `ARGOCD_TOKEN` | `argocd account generate-token` 으로 발급한 인증 토큰 |
| `GH_PAT` | `update-manifests` 단계에서 보호된 브랜치에 푸시해야 할 때 |

## 2. Kubernetes Sealed Secrets
`k8s/base`는 다음 Secret을 사용합니다.

### backend-secret
```bash
./scripts/seal-secrets.sh \
  --env-file .env.backend-secret \
  --name backend-secret \
  --namespace helpernote \
  --out k8s/sealed-secrets/backend-secret.sealedsecret.yaml
```
`.env.backend-secret` 예시:
```bash
DATABASE_URL=postgres://helpernote:CHANGE_ME@prod-postgres:5432/helpernote
JWT_SECRET=CHANGE_ME_RANDOM_64_CHARS
COOKIE_DOMAIN=.helpernote.my
```
> Tip: `COOKIE_DOMAIN`은 민감 정보가 아니므로 GitHub Actions에서 **Repository Variables** 로 관리해도 편리합니다.  
> (예: `Repository settings → Secrets and variables → Actions → Variables` 에 `COOKIE_DOMAIN=.helpernote.my` 등록)

### minio-secret
```bash
./scripts/seal-secrets.sh \
  --env-file .env.minio-secret \
  --name minio-secret \
  --namespace helpernote \
  --out k8s/sealed-secrets/minio-secret.sealedsecret.yaml
```
`.env.minio-secret` 예시:
```bash
MINIO_ACCESS_KEY=CHANGE_ME_MINIO_ACCESS_KEY
MINIO_SECRET_KEY=CHANGE_ME_MINIO_SECRET_KEY
```

### postgres-secret
```bash
./scripts/seal-secrets.sh \
  --env-file .env.postgres-secret \
  --name postgres-secret \
  --namespace helpernote \
  --out k8s/sealed-secrets/postgres-secret.sealedsecret.yaml
```
`.env.postgres-secret` 예시:
```bash
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
```

생성된 `k8s/sealed-secrets/*.sealedsecret.yaml` 을 커밋하면 ArgoCD가 자동으로 Secret을 생성합니다.

## 3. 기타 시크릿
- GHCR Pull Secret: `kubectl create secret docker-registry ghcr-secret ...`
- TLS Secret: `kubectl create secret tls helpernote-wildcard-tls ...` 또는 cert-manager Certificate 리소스 사용

## 4. 검증 체크리스트
1. `kubectl get pods -n kube-system | grep sealed` 로 컨트롤러 확인
2. `kubectl apply -k k8s/sealed-secrets`
3. `kubectl get secret -n helpernote backend-secret minio-secret postgres-secret`
4. GitHub Secrets 등록 여부 확인
