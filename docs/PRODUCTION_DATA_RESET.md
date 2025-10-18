# 운영 환경 데이터 초기화 가이드

⚠️ **극도로 위험한 작업입니다. 모든 프로덕션 데이터가 영구적으로 삭제됩니다!**

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [백업 절차](#백업-절차)
3. [데이터 초기화 실행](#데이터-초기화-실행)
4. [사후 작업](#사후-작업)
5. [롤백 절차](#롤백-절차)
6. [트러블슈팅](#트러블슈팅)

---

## 사전 요구사항

### 필수 도구

```bash
# kubectl 설치 확인
kubectl version --client

# kubeconfig 설정 확인
kubectl cluster-info

# 네임스페이스 접근 권한 확인
kubectl auth can-i "*" "*" -n helpernote-prod
```

### 승인 절차

**이 작업을 실행하기 전에 다음 승인을 받아야 합니다:**

- [ ] 팀 리더 승인
- [ ] 운영 관리자 승인
- [ ] 백업 완료 확인
- [ ] 다운타임 공지 완료
- [ ] 롤백 계획 수립

---

## 백업 절차

### 1. PostgreSQL 백업

```bash
# 백업 디렉터리 생성
mkdir -p backups/$(date +%Y%m%d-%H%M%S)
cd backups/$(date +%Y%m%d-%H%M%S)

# PostgreSQL Pod 이름 확인
POSTGRES_POD=$(kubectl get pods -n helpernote-prod -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# 데이터베이스 덤프
kubectl exec -n helpernote-prod $POSTGRES_POD -- \
  pg_dump -U helpernote -F c helpernote > helpernote-$(date +%Y%m%d-%H%M%S).dump

# 덤프 파일 검증
pg_restore --list helpernote-*.dump | head -20

# 파일 크기 확인
ls -lh helpernote-*.dump
```

### 2. MinIO 백업

```bash
# MinIO Pod 이름 확인
MINIO_POD=$(kubectl get pods -n helpernote-prod -l app=minio -o jsonpath='{.items[0].metadata.name}')

# MinIO Client 설정
kubectl exec -n helpernote-prod $MINIO_POD -- \
  mc alias set local http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# 버킷 백업 (bucket mirror)
kubectl exec -n helpernote-prod $MINIO_POD -- \
  mc mirror local/helpernote /backup/helpernote-$(date +%Y%m%d-%H%M%S)

# 또는 로컬로 다운로드
kubectl port-forward -n helpernote-prod svc/minio 9000:9000 &
mc alias set prod http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
mc mirror prod/helpernote ./minio-backup-$(date +%Y%m%d-%H%M%S)
```

### 3. Kubernetes 리소스 백업

```bash
# 모든 K8s 리소스 백업
kubectl get all,pvc,secrets,configmaps,ingress -n helpernote-prod -o yaml \
  > k8s-resources-$(date +%Y%m%d-%H%M%S).yaml

# PVC 상세 정보 백업
kubectl get pvc -n helpernote-prod -o yaml \
  > pvc-backup-$(date +%Y%m%d-%H%M%S).yaml

# ConfigMaps 백업
kubectl get configmaps -n helpernote-prod -o yaml \
  > configmaps-backup-$(date +%Y%m%d-%H%M%S).yaml
```

### 4. 백업 검증

```bash
# 백업 파일 목록
ls -lh

# 필수 백업 파일 확인
# ✓ helpernote-*.dump (PostgreSQL)
# ✓ minio-backup-*/  (MinIO files)
# ✓ k8s-resources-*.yaml (K8s resources)
# ✓ pvc-backup-*.yaml (PVC manifests)

# 백업 파일 압축 및 보관
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz *.dump *.yaml minio-backup-*

# 백업 파일을 안전한 위치로 복사
# 예: S3, GCS, Azure Blob Storage
aws s3 cp backup-*.tar.gz s3://helpernote-backups/
```

---

## 데이터 초기화 실행

### 방법 1: 스크립트 사용 (권장)

```bash
# 스테이징 환경 초기화
./scripts/reset-production-data.sh helpernote-staging

# 프로덕션 환경 초기화 (극도로 주의!)
./scripts/reset-production-data.sh helpernote-prod
```

**스크립트 실행 중 나타나는 확인 단계:**

1. **네임스페이스 확인**: 올바른 네임스페이스인지 확인
2. **현재 리소스 표시**: 삭제될 리소스 목록 표시
3. **첫 번째 확인**: 네임스페이스 이름 입력
4. **백업 확인**: 백업 완료 여부 확인 (yes/no)
5. **두 번째 확인**: 정확한 문구 입력 필요
   ```
   I understand this will delete all data in <namespace>
   ```

### 방법 2: 수동 실행

```bash
NAMESPACE="helpernote-prod"

# 1. Deployment 스케일 다운
kubectl scale deployment --all -n $NAMESPACE --replicas=0

# 2. StatefulSet 스케일 다운
kubectl scale statefulset --all -n $NAMESPACE --replicas=0

# 3. Pod 종료 대기
kubectl wait --for=delete pod --all -n $NAMESPACE --timeout=120s

# 4. PVC 삭제
kubectl delete pvc --all -n $NAMESPACE

# 5. PVC 삭제 완료 대기
kubectl wait --for=delete pvc --all -n $NAMESPACE --timeout=300s

# 6. Deployment 스케일 업
kubectl scale deployment --all -n $NAMESPACE --replicas=1

# 7. Pod 준비 대기
kubectl wait --for=condition=ready pod --all -n $NAMESPACE --timeout=300s
```

---

## 사후 작업

### 1. 서비스 상태 확인

```bash
NAMESPACE="helpernote-prod"

# Pod 상태 확인
kubectl get pods -n $NAMESPACE

# PVC 상태 확인
kubectl get pvc -n $NAMESPACE

# 서비스 엔드포인트 확인
kubectl get svc -n $NAMESPACE

# Ingress 확인
kubectl get ingress -n $NAMESPACE
```

### 2. 데이터베이스 마이그레이션

```bash
# Backend Pod 이름 확인
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=backend -o jsonpath='{.items[0].metadata.name}')

# 마이그레이션 실행
kubectl exec -n $NAMESPACE $BACKEND_POD -- ./migrate

# 또는 수동 마이그레이션
kubectl exec -n $NAMESPACE $BACKEND_POD -- sqlx migrate run
```

### 3. MinIO 버킷 생성

```bash
# MinIO Pod 이름 확인
MINIO_POD=$(kubectl get pods -n $NAMESPACE -l app=minio -o jsonpath='{.items[0].metadata.name}')

# MinIO Client 설정
kubectl exec -n $NAMESPACE $MINIO_POD -- \
  mc alias set local http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# 버킷 생성
kubectl exec -n $NAMESPACE $MINIO_POD -- \
  mc mb local/helpernote

# 버킷 확인
kubectl exec -n $NAMESPACE $MINIO_POD -- \
  mc ls local/
```

### 4. 초기 관리자 계정 생성

```bash
# Backend Pod에 접속
kubectl exec -it -n $NAMESPACE $BACKEND_POD -- /bin/sh

# 관리자 계정 생성 (Backend CLI 또는 직접 SQL)
psql $DATABASE_URL -c "
INSERT INTO users (username, email, password_hash, role, created_at)
VALUES ('admin', 'admin@helpernote.com', '<bcrypt-hash>', 'admin', NOW());
"
```

### 5. 애플리케이션 동작 확인

```bash
# Health check
kubectl exec -n $NAMESPACE $BACKEND_POD -- curl http://localhost:8000/health

# 외부 접근 테스트
INGRESS_URL=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].spec.rules[0].host}')
curl https://$INGRESS_URL/health

# 로그 확인
kubectl logs -n $NAMESPACE -l app=backend --tail=100
kubectl logs -n $NAMESPACE -l app=frontend --tail=100
```

### 6. 모니터링 알림 업데이트

```bash
# Prometheus 알림 규칙 확인
kubectl get prometheusrules -n monitoring

# 알림 상태 확인
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# http://localhost:9090/alerts 접속
```

---

## 롤백 절차

데이터 초기화 후 문제가 발생한 경우:

### 1. PostgreSQL 복구

```bash
# 백업 파일을 Pod에 복사
kubectl cp helpernote-*.dump $NAMESPACE/$POSTGRES_POD:/tmp/

# 데이터베이스 복구
kubectl exec -n $NAMESPACE $POSTGRES_POD -- \
  pg_restore -U helpernote -d helpernote -c /tmp/helpernote-*.dump

# 복구 확인
kubectl exec -n $NAMESPACE $POSTGRES_POD -- \
  psql -U helpernote -d helpernote -c '\dt'
```

### 2. MinIO 복구

```bash
# 로컬 백업을 MinIO로 복사
kubectl port-forward -n $NAMESPACE svc/minio 9000:9000 &

mc alias set prod http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
mc mirror ./minio-backup-*/ prod/helpernote

# 복구 확인
mc ls prod/helpernote
```

### 3. K8s 리소스 복구

```bash
# PVC 복구
kubectl apply -f pvc-backup-*.yaml

# ConfigMaps 복구
kubectl apply -f configmaps-backup-*.yaml

# Pod 재시작
kubectl rollout restart deployment -n $NAMESPACE
```

---

## 트러블슈팅

### PVC 삭제가 Pending 상태에서 멈춤

```bash
# PVC finalizer 확인
kubectl get pvc -n $NAMESPACE -o yaml | grep finalizers

# Finalizer 제거 (주의!)
kubectl patch pvc <pvc-name> -n $NAMESPACE -p '{"metadata":{"finalizers":null}}'
```

### Pod가 CrashLoopBackOff 상태

```bash
# 로그 확인
kubectl logs -n $NAMESPACE <pod-name> --previous

# 이벤트 확인
kubectl describe pod -n $NAMESPACE <pod-name>

# ConfigMap/Secret 확인
kubectl get configmaps,secrets -n $NAMESPACE
```

### 데이터베이스 마이그레이션 실패

```bash
# 마이그레이션 상태 확인
kubectl exec -n $NAMESPACE $BACKEND_POD -- \
  sqlx migrate info

# 수동으로 마이그레이션 파일 확인
kubectl exec -n $NAMESPACE $BACKEND_POD -- ls -la migrations/

# 특정 마이그레이션 건너뛰기 (주의!)
kubectl exec -n $NAMESPACE $BACKEND_POD -- \
  sqlx migrate run --target-version <version>
```

---

## 체크리스트

### 실행 전

- [ ] 백업 완료 (PostgreSQL, MinIO, K8s)
- [ ] 백업 검증 완료
- [ ] 백업 파일 안전한 위치에 보관
- [ ] 팀 승인 획득
- [ ] 다운타임 공지 완료
- [ ] 롤백 계획 수립
- [ ] kubectl 권한 확인
- [ ] 네임스페이스 재확인

### 실행 중

- [ ] 네임스페이스 올바른지 확인
- [ ] 현재 리소스 목록 검토
- [ ] 모든 확인 단계 통과
- [ ] 에러 발생 시 즉시 중단

### 실행 후

- [ ] Pod 정상 실행 확인
- [ ] PVC 생성 확인
- [ ] 데이터베이스 마이그레이션 완료
- [ ] MinIO 버킷 생성 완료
- [ ] Health check 통과
- [ ] 관리자 계정 생성
- [ ] 외부 접근 테스트 완료
- [ ] 모니터링 알림 정상

---

## 지원 및 문의

문제가 발생한 경우:

1. **즉시 중단**: 더 이상 진행하지 말 것
2. **로그 수집**: kubectl logs, describe pod
3. **스크린샷**: 에러 메시지 캡처
4. **팀 연락**: DevOps/SRE 팀 긴급 연락
5. **롤백 고려**: 백업에서 복구

**긴급 연락처**:
- DevOps 팀: [연락처 입력]
- SRE 온콜: [연락처 입력]
- 팀 리더: [연락처 입력]

---

**마지막 업데이트**: 2025-10-17
**작성자**: DevOps Team
**검토자**: [검토자 이름]
