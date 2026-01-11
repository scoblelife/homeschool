# Homeschool Sync Infrastructure

Terranix configuration for Cloudflare Worker infrastructure using OpenTofu.

## Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **API Token** with these permissions:
   - Account > Workers KV Storage > Edit
   - Account > Workers Scripts > Edit
3. **Nix** with flakes enabled

## Setup

1. Set environment variables:

```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
export TF_VAR_cloudflare_account_id="your-account-id"
```

2. Enter the development shell:

```bash
cd infra
nix develop
```

3. Generate and apply the infrastructure:

```bash
# Generate config from Terranix
terranix > config.tf.json

# Initialize OpenTofu
tofu init

# Preview changes
tofu plan

# Apply changes
tofu apply
```

Or use the convenience commands:

```bash
# Apply everything in one command
nix run .#apply

# Show outputs (KV namespace IDs)
nix run .#outputs
```

## Outputs

After applying, you'll get:

| Output | Description |
|--------|-------------|
| `kv_namespace_staging_id` | KV namespace ID for staging |
| `kv_namespace_production_id` | KV namespace ID for production |
| `github_secrets` | Values to set as GitHub Actions secrets |

## Setting GitHub Secrets

After `tofu apply`, get the KV IDs:

```bash
tofu output -json github_secrets | jq -r 'to_entries[] | "\(.key)=\(.value)"'
```

Then add these as secrets in GitHub:
- Settings → Secrets and variables → Actions → New repository secret

## Resources Created

- `cloudflare_workers_kv_namespace.homeschool-sync-staging` - Staging KV namespace
- `cloudflare_workers_kv_namespace.homeschool-sync-production` - Production KV namespace

## Destroying Infrastructure

```bash
tofu destroy
# or
nix run .#destroy
```

## Updating

To add more infrastructure (e.g., Workers, routes), edit `config.nix` and re-apply:

```bash
terranix > config.tf.json
tofu apply
```
