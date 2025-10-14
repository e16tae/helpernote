# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying Helpernote using Kustomize and ArgoCD.

## Directory Structure

```
k8s/
├── base/                          # Base manifests (shared across environments)
│   ├── namespace.yaml             # Namespace definition
│   ├── secrets.yaml               # Secrets template (⚠️  update before deploying!)
│   ├── postgres-statefulset.yaml # PostgreSQL database
│   ├── minio-deployment.yaml     # MinIO object storage
│   ├── backend-deployment.yaml   # Backend API server
│   ├── frontend-deployment.yaml  # Frontend web application
│   ├── ingress.yaml               # Kong Ingress configuration
│   └── kustomization.yaml         # Kustomize base configuration
│
├── overlays/
│   ├── dev/                       # Development environment
│   │   ├── kustomization.yaml    # Dev-specific configuration
│   │   └── ingress-patch.yaml    # Dev domain configuration
│   │
│   └── production/                # Production environment
│       ├── kustomization.yaml    # Production configuration
│       ├── resources-patch.yaml  # Higher resource limits
│       └── ingress-patch.yaml    # Production domain + HTTPS
```

## Quick Start

### 1. Update Secrets

⚠️ **IMPORTANT**: Update `base/secrets.yaml` with your actual credentials:

```bash
# Generate base64 encoded values
echo -n "your-password" | base64
```

### 2. Update Domain

Edit ingress configuration with your domain:
- `base/ingress.yaml`
- `overlays/dev/ingress-patch.yaml`
- `overlays/production/ingress-patch.yaml`

### 3. Deploy with Kustomize

**Development:**
```bash
kubectl apply -k overlays/dev
```

**Production:**
```bash
kubectl apply -k overlays/production
```

### 4. Deploy with ArgoCD (Recommended)

```bash
kubectl apply -f ../argocd/helpernote-production.yaml
```

## Configuration

### Replicas

Edit `overlays/{env}/kustomization.yaml`:

```yaml
replicas:
  - name: backend
    count: 3
  - name: frontend
    count: 3
```

### Resources

Edit `overlays/production/resources-patch.yaml`:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Images

Images are managed by GitHub Actions and updated automatically:

```yaml
images:
  - name: helpernote-backend
    newTag: main-abc1234
  - name: helpernote-frontend
    newTag: main-abc1234
```

## Verification

```bash
# Check all resources
kubectl get all -n helpernote

# Check pods
kubectl get pods -n helpernote

# Check services
kubectl get svc -n helpernote

# Check ingress
kubectl get ingress -n helpernote

# View logs
kubectl logs -f deployment/backend -n helpernote
kubectl logs -f deployment/frontend -n helpernote
```

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name> -n helpernote
kubectl logs <pod-name> -n helpernote
```

### Database connection issues

```bash
# Check PostgreSQL
kubectl get statefulset postgres -n helpernote
kubectl logs postgres-0 -n helpernote

# Test connection
kubectl exec -it postgres-0 -n helpernote -- psql -U helpernote
```

### Ingress not working

```bash
# Check Kong Gateway
kubectl get pods -n kong

# Describe ingress
kubectl describe ingress helpernote-ingress -n helpernote
```

## Cleanup

```bash
# Delete development environment
kubectl delete -k overlays/dev

# Delete production environment
kubectl delete -k overlays/production

# Or delete namespace (will delete all resources)
kubectl delete namespace helpernote
```

---

For more details, see [docs/deployment.md](../docs/deployment.md)
