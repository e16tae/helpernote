# Sealed Secrets

`helpernote` 프로덕션 환경에서는 PostgreSQL, MinIO, 백엔드 JWT 등 민감한 값을 `kubeseal`로 암호화해 GitOps 파이프라인에 포함합니다.

## 생성 절차
1. Sealed Secrets Controller 설치 및 `kubeseal` CLI 준비
2. `k8s/base/secrets.example.yaml`을 복사하여 실제 값을 채운 임시 파일 작성
3. 또는 `.env` 파일을 사용하여 Secret을 생성할 수 있습니다.
4. 스크립트 실행
   ```bash
   # 예시) Secret별 Manifest 파일로 분리해 암호화
   ./scripts/seal-secrets.sh \
     --manifest ./tmp/postgres-secret.yaml \
     --namespace helpernote \
     --controller-namespace kube-system \
     --controller-name sealed-secrets \
     --out k8s/sealed-secrets/postgres-secret.sealedsecret.yaml

   ./scripts/seal-secrets.sh \
     --manifest ./tmp/backend-secret.yaml \
     --namespace helpernote \
     --controller-namespace kube-system \
     --controller-name sealed-secrets \
     --out k8s/sealed-secrets/backend-secret.sealedsecret.yaml

   ./scripts/seal-secrets.sh \
     --manifest ./tmp/minio-secret.yaml \
     --namespace helpernote \
     --controller-namespace kube-system \
     --controller-name sealed-secrets \
     --out k8s/sealed-secrets/minio-secret.sealedsecret.yaml

   # 또는 env 파일 기반
   ./scripts/seal-secrets.sh \
     --env-file backend/.env.production \
     --name backend-secret \
     --namespace helpernote \
     --controller-namespace kube-system \
     --controller-name sealed-secrets \
     --out k8s/sealed-secrets/backend-secret.sealedsecret.yaml
   ```
   > 다중 문서(`---`) 템플릿을 사용할 경우에는 Secret별로 파일을 분리한 후 위 명령을 실행하세요.
5. 생성된 `*.sealedsecret.yaml` 파일을 커밋하여 ArgoCD가 적용하도록 합니다.

`*.sealedsecret.yaml.example` 파일은 구조를 참고하기 위한 템플릿입니다. 실제 배포 전에는 `encryptedData` 값을 `kubeseal`이 생성한 값으로 교체해야 합니다.
