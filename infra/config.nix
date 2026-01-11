# Terranix configuration for Cloudflare Worker infrastructure
#
# Usage:
#   cd infra
#   nix run .#infra-apply
#
# Required environment variables:
#   CLOUDFLARE_API_TOKEN - API token with Workers KV permissions
#   TF_VAR_cloudflare_account_id - Your Cloudflare account ID
#
{ config, lib, ... }:

let
  # Worker configuration
  workerName = "homeschool-sync";

  # Environment names
  environments = [ "staging" "production" ];
in
{
  # Terraform configuration
  terraform = {
    required_providers = {
      cloudflare = {
        source = "cloudflare/cloudflare";
        version = "~> 4.0";
      };
    };
  };

  # Cloudflare provider - uses CLOUDFLARE_API_TOKEN env var
  provider.cloudflare = {};

  # Variables
  variable = {
    cloudflare_account_id = {
      type = "string";
      description = "Cloudflare Account ID";
    };
  };

  # KV Namespaces - one per environment
  resource.cloudflare_workers_kv_namespace = lib.listToAttrs (map (env: {
    name = "${workerName}-${env}";
    value = {
      account_id = "\${var.cloudflare_account_id}";
      title = "${workerName}-${env}-kv";
    };
  }) environments);

  # Outputs for use in CI/CD
  output = {
    kv_namespace_staging_id = {
      value = "\${cloudflare_workers_kv_namespace.${workerName}-staging.id}";
      description = "KV Namespace ID for staging environment";
    };

    kv_namespace_production_id = {
      value = "\${cloudflare_workers_kv_namespace.${workerName}-production.id}";
      description = "KV Namespace ID for production environment";
    };

    # Output for GitHub Actions secrets
    github_secrets = {
      value = {
        CLOUDFLARE_KV_STAGING_ID = "\${cloudflare_workers_kv_namespace.${workerName}-staging.id}";
        CLOUDFLARE_KV_PRODUCTION_ID = "\${cloudflare_workers_kv_namespace.${workerName}-production.id}";
      };
      description = "Values to set as GitHub Actions secrets";
      sensitive = true;
    };
  };
}
