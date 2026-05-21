# Sealed Secrets Setup

## Installation

```bash
# Install kubeseal CLI
brew install kubeseal  # macOS
# or download from https://github.com/bitnami-labs/sealed-secrets/releases

# Install Sealed Secrets controller in your cluster
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

## Usage

```bash
# Seal the secret for production
cd k8s/base
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml

# Commit sealed-secret.yaml to git (it's safe!)
# Never commit secret.yaml
```

## Update Secret

```bash
# Edit secret.yaml, then re-seal
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml
```

## Verify

```bash
kubectl get sealedsecrets -n status-page
kubectl get secrets -n status-page
```
