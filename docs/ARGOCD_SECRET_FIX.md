# ArgoCD Secret Issue - Root Cause & Fix

## Problem Summary

ArgoCD deployment is failing with: `Error: secret "backend-secret" not found`

## Root Cause Analysis

### Issue 1: Naming Mismatch

**Current State:**
```yaml
# k8s/base/backend-deployment.yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: backend-secret  # ← Looking for this
        key: database-url
```

**What Happens:**
1. Kustomize applies `namePrefix: prod-` to all resources
2. SealedSecret `backend-secret` becomes `prod-backend-secret`
3. SealedSecret template creates Secret named `prod-backend-secret`
4. But Deployment still references `backend-secret` (NOT updated by Kustomize)
5. **Result**: Secret not found

### Issue 2: SealedSecret Decryption Failure

**Current State:**
```bash
$ kubectl get sealedsecrets -n helpernote
NAME                        STATUS                                                       SYNCED
prod-prod-backend-secret    no key could decrypt secret (database-url, jwt-secret)       False
prod-prod-minio-secret      no key could decrypt secret (access-key, secret-key)         False
prod-prod-postgres-secret   no key could decrypt secret (database, password, username)   False
```

**Root Cause:**
- SealedSecrets were encrypted with a different public key
- Current sealed-secrets controller (key: `sealed-secrets-keyk67fw`) can't decrypt them
- No regular Secrets are created because decryption fails

## Solution

### Step 1: Fix Naming Mismatch

Create patch to update deployment secret references:

**File: `k8s/overlays/production/backend-secret-refs-patch.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
        - name: backend
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: prod-backend-secret  # ← Add prod- prefix
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: prod-backend-secret  # ← Add prod- prefix
                  key: jwt-secret
            - name: MINIO_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: prod-minio-secret  # ← Add prod- prefix
                  key: access-key
            - name: MINIO_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: prod-minio-secret  # ← Add prod- prefix
                  key: secret-key
```

**Update: `k8s/overlays/production/kustomization.yaml`**
```yaml
patches:
  # ... existing patches ...
  - path: backend-secret-refs-patch.yaml
    target:
      kind: Deployment
      name: backend
    options:
      allowNameChange: true
  - path: postgres-secret-refs-patch.yaml  # Also needed for postgres
    target:
      kind: StatefulSet
      name: postgres
    options:
      allowNameChange: true
```

### Step 2: Re-encrypt SealedSecrets

**Get Current Public Key:**
```bash
kubectl -n kube-system get secret sealed-secrets-keyk67fw \
  -o jsonpath='{.data.tls\.crt}' | base64 -d > /tmp/sealed-secrets-pubkey.pem
```

**Re-encrypt Secrets:**

You need the plaintext secret values. If you have them:

```bash
# Example for backend-secret
kubectl create secret generic backend-secret \
  --from-literal=database-url='postgresql://...' \
  --from-literal=jwt-secret='...' \
  --dry-run=client -o yaml | \
kubeseal --format=yaml --cert=/tmp/sealed-secrets-pubkey.pem \
  > k8s/sealed-secrets/backend-secret.sealedsecret.yaml

# Repeat for minio-secret and postgres-secret
```

## Quick Temporary Fix

If you need the application running immediately while working on the proper fix:

```bash
# Copy secret from deuseda namespace (if values are the same)
kubectl get secret backend-secret -n deuseda -o yaml | \
  sed 's/namespace: deuseda/namespace: helpernote/' | \
  sed 's/name: backend-secret/name: prod-backend-secret/' | \
  kubectl apply -f -

# Or create manually
kubectl create secret generic prod-backend-secret -n helpernote \
  --from-literal=database-url='postgresql://helpernote:PASSWORD@prod-postgres.helpernote.svc.cluster.local:5432/helpernote' \
  --from-literal=jwt-secret='YOUR_JWT_SECRET_HERE'

kubectl create secret generic prod-minio-secret -n helpernote \
  --from-literal=access-key='minioadmin' \
  --from-literal=secret-key='minioadmin'

kubectl create secret generic prod-postgres-secret -n helpernote \
  --from-literal=username='helpernote' \
  --from-literal=password='PASSWORD_HERE' \
  --from-literal=database='helpernote'
```

## Verification

```bash
# Check secrets exist
kubectl get secrets -n helpernote | grep -E "backend|minio|postgres"

# Check backend pod status
kubectl get pods -n helpernote -l app=backend

# Check pod logs
kubectl logs -n helpernote -l app=backend --tail=50

# Check ArgoCD sync status
kubectl get applications -n argocd helpernote-production
```

## Why This Happened

1. **Kustomize Limitation**: `namePrefix` doesn't automatically update references within resource specs
2. **Missing Patch**: No patch was created to update secret references in deployments
3. **Key Rotation**: Sealed-secrets controller was reinstalled or keys rotated, invalidating old encrypted secrets

## Prevention

- Always create patches for secret references when using `namePrefix`
- Document sealed-secrets public key location
- Back up sealed-secrets controller keys before rotation
- Test Kustomize output before applying: `kubectl kustomize k8s/overlays/production`
