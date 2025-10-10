# Helpernote Deployment Guide

This guide covers deploying Helpernote to a self-hosted Kubernetes cluster with GitOps workflow using ArgoCD and Kong Gateway.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Deployment Workflow](#deployment-workflow)
5. [Configuration](#configuration)
6. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

---

## Architecture Overview

### GitOps Workflow

```
Developer → GitHub (develop) → CI Pipeline → Build & Test
                ↓
         Pull Request
                ↓
GitHub (main) → CD Pipeline → Build Images → Push to Registry
                                    ↓
                              Update Manifests → Commit
                                    ↓
                              ArgoCD Detects Change
                                    ↓
                              K8s Cluster Deployment
```

### Components

- **Kubernetes (kubeadm)**: Self-hosted K8s cluster
- **Kong Gateway**: Ingress controller for API management
- **ArgoCD**: GitOps continuous delivery tool
- **GitHub Actions**: CI/CD pipelines
- **GitHub Container Registry**: Docker image storage
- **PostgreSQL**: Database (StatefulSet)
- **MinIO**: Object storage (Deployment)
- **Backend**: Rust/Axum API server (Deployment)
- **Frontend**: Next.js web application (Deployment)

---

## Prerequisites

### Cluster Requirements

- Kubernetes cluster (v1.25+) with kubeadm
- Kong Gateway installed and configured
- ArgoCD installed and configured
- kubectl configured with cluster access
- Storage provisioner (for PersistentVolumes)

### Development Requirements

- Git
- Docker
- kubectl
- (Optional) argocd CLI
- GitHub account with repository access

---

## Initial Setup

### 1. Configure Secrets

Update the secrets in `k8s/base/secrets.yaml`:

```bash
# Generate base64 encoded values
echo -n "your-secret-value" | base64

# Example for PostgreSQL password
echo -n "your-strong-password" | base64
```

**Required secrets:**

- `postgres-secret`: Database credentials
- `minio-secret`: Object storage credentials
- `backend-secret`: Application secrets (JWT, database URL)

**⚠️ IMPORTANT**: Never commit actual secrets to Git! Use:
- Sealed Secrets
- External Secrets Operator
- Manual kubectl apply after reviewing

### 2. Update Configuration

#### Domain Configuration

Edit `k8s/base/ingress.yaml`:

```yaml
spec:
  rules:
    - host: helpernote.yourdomain.com  # Change this
```

Edit `k8s/overlays/production/ingress-patch.yaml`:

```yaml
spec:
  rules:
    - host: helpernote.yourdomain.com  # Change this
```

#### ArgoCD Applications

Edit `argocd/helpernote-production.yaml`:

```yaml
spec:
  source:
    repoURL: https://github.com/YOUR-ORG/helpernote.git  # Change this
```

Edit `argocd/helpernote-dev.yaml`:

```yaml
spec:
  source:
    repoURL: https://github.com/YOUR-ORG/helpernote.git  # Change this
```

#### GitHub Actions

Edit `.github/workflows/cd-production.yaml`:

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_OWNER: your-github-org  # Change this if needed
```

### 3. Configure GitHub Container Registry

Enable GitHub Packages for your repository:

1. Go to repository Settings → Packages
2. Enable "Improved container support"
3. Ensure GitHub Actions has write permissions

### 4. TLS Certificate

Create TLS secret for HTTPS:

```bash
kubectl create secret tls helpernote-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n helpernote
```

Or use cert-manager for automatic certificate management.

### 5. Deploy ArgoCD Applications

```bash
# Apply ArgoCD application manifests
kubectl apply -f argocd/helpernote-production.yaml

# Optional: Development environment
kubectl apply -f argocd/helpernote-dev.yaml
```

---

## Deployment Workflow

### Development Workflow (develop branch)

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature develop
   ```

2. **Develop and test locally**
   ```bash
   make dev-up        # Start PostgreSQL and MinIO
   make backend-dev   # Run backend
   make frontend-dev  # Run frontend
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

4. **Create Pull Request to develop**
   - GitHub Actions CI will run automatically
   - Tests, linting, and Docker builds will be validated
   - Wait for all checks to pass

5. **Merge to develop**
   - CI pipeline runs on develop branch
   - Docker images are built and tested
   - No deployment occurs (develop is for integration testing)

### Production Deployment Workflow (main branch)

1. **Create Pull Request from develop to main**
   - Review all changes carefully
   - Ensure all tests pass on develop
   - Get code review approval

2. **Merge to main**
   - CD pipeline starts automatically
   - Docker images are built
   - Images are pushed to GitHub Container Registry
   - K8s manifests are updated with new image tags
   - Changes are committed back to repository

3. **ArgoCD Automatic Sync**
   - ArgoCD detects manifest changes
   - Validates desired state vs. current state
   - Applies changes to K8s cluster
   - Monitors deployment health

4. **Verify Deployment**
   ```bash
   # Check ArgoCD application status
   kubectl get application -n argocd

   # Check pod status
   kubectl get pods -n helpernote

   # Check deployment rollout
   kubectl rollout status deployment/backend -n helpernote
   kubectl rollout status deployment/frontend -n helpernote
   ```

---

## Configuration

### Environment-Specific Settings

#### Development (`k8s/overlays/dev/`)

- 1 replica for backend and frontend
- Lower resource limits
- Separate namespace: `helpernote-dev`
- Dev domain: `dev.helpernote.example.com`

#### Production (`k8s/overlays/production/`)

- 3 replicas for backend and frontend
- Higher resource limits
- Namespace: `helpernote`
- Production domain: `helpernote.example.com`
- HTTPS enforced

### Scaling

Manual scaling:

```bash
kubectl scale deployment backend --replicas=5 -n helpernote
```

Or update `k8s/overlays/production/kustomization.yaml`:

```yaml
replicas:
  - name: backend
    count: 5
```

### Resource Limits

Edit `k8s/overlays/production/resources-patch.yaml`:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

---

## Monitoring and Troubleshooting

### Check Application Status

```bash
# ArgoCD application status
kubectl get application -n argocd

# Pod status
kubectl get pods -n helpernote

# Service status
kubectl get svc -n helpernote

# Ingress status
kubectl get ingress -n helpernote
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n helpernote

# Frontend logs
kubectl logs -f deployment/frontend -n helpernote

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n helpernote

# MinIO logs
kubectl logs -f deployment/minio -n helpernote
```

### ArgoCD UI

Access ArgoCD UI to view deployment status:

```bash
# Port forward ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at https://localhost:8080
# Default username: admin
# Get password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### Manual Sync

If auto-sync is disabled or you need to force sync:

```bash
# Using kubectl
kubectl apply -f argocd/helpernote-production.yaml

# Using ArgoCD CLI
argocd app sync helpernote-production

# Using ArgoCD UI
# Navigate to application → Click "Sync" button
```

### Rollback

Rollback to previous version:

```bash
# Using kubectl
kubectl rollout undo deployment/backend -n helpernote
kubectl rollout undo deployment/frontend -n helpernote

# Using ArgoCD
argocd app rollback helpernote-production

# Or revert the Git commit and ArgoCD will auto-sync
git revert <commit-hash>
git push
```

### Common Issues

#### Pods not starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n helpernote

# Common causes:
# - Image pull errors (check registry credentials)
# - Resource limits (check cluster resources)
# - Health check failures (check application logs)
```

#### Database connection errors

```bash
# Check PostgreSQL is running
kubectl get statefulset postgres -n helpernote

# Test database connection
kubectl exec -it postgres-0 -n helpernote -- psql -U helpernote -d helpernote

# Check secret configuration
kubectl get secret postgres-secret -n helpernote -o yaml
```

#### Ingress not working

```bash
# Check Kong Gateway status
kubectl get pods -n kong

# Check ingress resource
kubectl describe ingress helpernote-ingress -n helpernote

# Test internal service access
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n helpernote -- curl http://backend:8000/health
```

### Health Checks

All services expose health check endpoints:

- Backend: `http://backend:8000/health`
- Frontend: `http://frontend:3000/api/health`
- PostgreSQL: Liveness/readiness probes configured
- MinIO: `/minio/health/live` and `/minio/health/ready`

### Performance Monitoring

Monitor resource usage:

```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n helpernote

# Describe pod for detailed resource info
kubectl describe pod <pod-name> -n helpernote
```

---

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kong Gateway Documentation](https://docs.konghq.com/)
- [Kustomize Documentation](https://kustomize.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to Git
   - Use Sealed Secrets or External Secrets Operator
   - Rotate secrets regularly

2. **RBAC**
   - Limit ArgoCD access to specific namespaces
   - Use service accounts with minimal permissions
   - Enable audit logging

3. **Network Policies**
   - Implement network policies to restrict pod-to-pod communication
   - Use Kong Gateway for rate limiting and authentication

4. **Image Security**
   - Scan images for vulnerabilities
   - Use signed images
   - Keep base images updated

5. **TLS/HTTPS**
   - Always use HTTPS in production
   - Use cert-manager for automatic certificate renewal
   - Enforce HTTPS redirects in Kong

---

## Support

For issues or questions:
1. Check application logs
2. Review ArgoCD application status
3. Consult this deployment guide
4. Contact the development team
