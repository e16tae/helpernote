# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the Helpernote project.

## Workflows Overview

### CI (Continuous Integration)

#### `ci-develop.yaml`
- **Triggers**: Push/PR to `develop` branch
- **Purpose**: Test and validate changes before merging to main
- **Jobs**:
  - Backend tests (Rust, Clippy, Tests)
  - Frontend tests (ESLint, TypeScript, Build)
  - Docker build test (conditional - PRs only)
- **Duration**: ~8 minutes (without Docker), ~15 minutes (with Docker)

#### `ci-main.yaml`
- **Triggers**: PR to `main` branch
- **Purpose**: Final validation before production deployment
- **Jobs**: Same as ci-develop but with production configs
- **Duration**: ~15 minutes (always includes Docker build)

### CD (Continuous Deployment)

#### `cd-production.yaml`
- **Triggers**: Push to `main` branch
- **Purpose**: Automated production deployment
- **Environment**: `production` (requires manual approval)
- **Jobs**:
  1. **Build & Push** - Build and push Docker images to GHCR
  2. **Security Scan** - Trivy vulnerability scanning
  3. **Update Manifests** - Update Kubernetes manifests with new image tags
  4. **Trigger ArgoCD** - Sync application via ArgoCD
  5. **Verify Deployment** - Health checks and smoke tests
  6. **Notify** - Slack/Console notifications
- **Duration**: ~25-30 minutes
- **Rollback**: Via ArgoCD or git revert

## Configuration Requirements

### Required Secrets

Create these secrets in Repository Settings → Secrets and variables → Actions:

1. **GH_PAT** (Critical)
   - Personal Access Token for pushing to protected branches
   - Permissions: `contents:write`, `workflows:write`
   - Create at: Settings → Developer settings → Personal access tokens

2. **ARGOCD_SERVER** (Optional but recommended)
   - ArgoCD server URL (e.g., `argocd.example.com`)
   - Without this, deployment syncs manually

3. **ARGOCD_TOKEN** (Optional but recommended)
   - ArgoCD authentication token
   - Generate: `argocd account generate-token`

4. **SLACK_WEBHOOK_URL** (Optional)
   - Slack incoming webhook URL for deployment notifications
   - Create at: Slack App → Incoming Webhooks

### Required Environments

Create `production` environment in Repository Settings → Environments:

1. Click "New environment" → Name: `production`
2. Configure protection rules:
   - ✅ Required reviewers (select reviewers)
   - ✅ Wait timer: 5 minutes (optional)
   - ✅ Deployment branches: `main` only

## Features

### 🔒 Security

- ✅ Environment-based protection with manual approval
- ✅ Trivy security scanning for Docker images
- ✅ SARIF results uploaded to GitHub Security
- ✅ Unique test DB passwords per CI run
- ✅ No hardcoded credentials

### ⚡ Performance

- ✅ Built-in Rust caching (faster than manual cache)
- ✅ Docker layer caching via GitHub Actions cache
- ✅ Conditional Docker builds (PRs only on develop)
- ✅ Concurrent workflow execution with auto-cancellation

### 🔄 CI/CD Best Practices

- ✅ [skip ci] to prevent infinite loops
- ✅ Concurrency control to prevent resource waste
- ✅ Semantic versioning for image tags
- ✅ Health checks before marking deployment successful
- ✅ Smoke tests for critical endpoints
- ✅ Comprehensive notifications

### 📦 Dependency Management

- ✅ Dependabot for automated dependency updates
- ✅ Weekly updates (Mondays 9 AM KST)
- ✅ Grouped updates for related packages
- ✅ Auto-labeled and auto-assigned PRs

## Usage Examples

### Trigger Docker Build on Develop

```bash
git commit -m "feat: add new feature [docker]"
git push origin develop
```

### Deploy to Production

```bash
# 1. Merge to main
git checkout main
git merge develop
git push origin main

# 2. Approve deployment in GitHub Actions UI
# 3. ArgoCD syncs automatically
# 4. Health checks verify deployment
# 5. Receive Slack notification (if configured)
```

### Skip CI on Documentation Changes

```bash
git commit -m "docs: update README [skip ci]"
```

### Create Semantic Version Release

```bash
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
# Docker images tagged as: v1.2.3, v1.2, production
```

## Troubleshooting

### CD Workflow Fails at "Update Manifests"

**Error**: `failed to push some refs to 'main'`

**Solution**: Configure `GH_PAT` secret with appropriate permissions.

```bash
# 1. Create PAT at GitHub → Settings → Developer settings
# 2. Permissions: Contents (write), Workflows (write)
# 3. Add as repository secret: GH_PAT
```

### ArgoCD Sync Skipped

**Message**: `ArgoCD credentials not configured`

**Solution**: This is optional. ArgoCD will auto-sync on manifest changes.

To enable manual trigger:
```bash
# 1. Get ArgoCD token
argocd account generate-token

# 2. Add secrets:
# - ARGOCD_SERVER: argocd.example.com
# - ARGOCD_TOKEN: <token from step 1>
```

### Health Check Fails

**Error**: `Backend health check failed after 10 attempts`

**Solutions**:
1. Check ArgoCD for pod status: `kubectl get pods -n helpernote`
2. View backend logs: `kubectl logs -n helpernote -l app=backend`
3. Verify ingress: `kubectl get ingress -n helpernote`
4. Rollback if needed: `argocd app rollback helpernote-production`

### Dependabot PRs Not Created

**Check**:
1. Repository Settings → Code security → Dependabot alerts (enabled?)
2. `.github/dependabot.yml` file exists
3. Reviewer username matches GitHub username

## Monitoring

### GitHub Actions Dashboard

View all workflow runs:
```
https://github.com/YOUR_GITHUB_USERNAME/helpernote/actions
```

### ArgoCD Dashboard

Port forward and access:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Visit https://localhost:8080
```

### Production Health

Quick health check:
```bash
curl https://api.YOUR_DOMAIN.com/health
curl https://www.YOUR_DOMAIN.com
```

## Workflow Diagram

```
Develop Branch:
  Push/PR → ci-develop.yaml
    ├─ Backend Tests (rustfmt, clippy, tests)
    ├─ Frontend Tests (lint, typecheck, build)
    └─ Docker Build (PRs only)

Main Branch:
  PR → ci-main.yaml (final validation)
  Push → cd-production.yaml
    ├─ Build & Push Images
    ├─ Security Scan (Trivy)
    ├─ Update Manifests [skip ci]
    ├─ ArgoCD Sync
    ├─ Health Verification
    └─ Slack Notification
```

## Maintenance

### Update Actions Versions

Dependabot automatically creates PRs for GitHub Actions updates.

Review and merge weekly.

### Adjust Deployment Timeout

Edit `cd-production.yaml`:
```yaml
# ArgoCD sync timeout (default: 300s = 5 min)
--timeout 300

# Health check wait (default: 600s = 10 min)
--timeout 600
```

### Modify Required Approvers

Repository Settings → Environments → production → Required reviewers

## Support

For issues or questions:
- Create an issue: https://github.com/YOUR_GITHUB_USERNAME/helpernote/issues
- Review Actions logs: https://github.com/YOUR_GITHUB_USERNAME/helpernote/actions
- Check ArgoCD: https://argocd.example.com

---

Last Updated: 2025-10-11
