{
  description = "Homeschool Sync Infrastructure and Worker Deployment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    terranix.url = "github:terranix/terranix";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, terranix, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        tofu = pkgs.opentofu;

        # Worker configuration - use relative path from infra dir
        workerName = "homeschool-sync";
        stagingUrl = "https://homeschool-sync-staging.scott4717.workers.dev";
        productionUrl = "https://homeschool-sync.scott4717.workers.dev";

        # Common script preamble
        preamble = ''
          set -euo pipefail

          # Check required env vars
          check_env() {
            if [ -z "''${CLOUDFLARE_API_TOKEN:-}" ]; then
              echo "Error: CLOUDFLARE_API_TOKEN is not set"
              exit 1
            fi
          }
        '';

        # Health check function
        healthCheck = url: ''
          health_check() {
            local url="$1"
            local max_attempts=5
            local attempt=1

            echo "Checking health at: $url/health"

            while [ $attempt -le $max_attempts ]; do
              sleep 2
              STATUS=$(${pkgs.curl}/bin/curl -s -o /dev/null -w "%{http_code}" "$url/health" || echo "000")
              if [ "$STATUS" = "200" ]; then
                echo "Health check passed!"
                return 0
              fi
              echo "Attempt $attempt/$max_attempts: Status $STATUS"
              attempt=$((attempt + 1))
            done

            echo "Health check failed after $max_attempts attempts"
            exit 1
          }
        '';

        # Generate terraform JSON from terranix config
        terraformConfig = terranix.lib.terranixConfiguration {
          inherit system;
          modules = [ ./config.nix ];
        };

      in
      {
        # Default package generates the terraform config
        packages.default = terraformConfig;

        # Development shell with all tools
        devShells.default = pkgs.mkShell {
          buildInputs = [
            tofu
            terranix.packages.${system}.terranix
            pkgs.jq
            pkgs.nodejs_22
            pkgs.curl
          ];

          shellHook = ''
            echo "Homeschool Infrastructure Shell"
            echo ""
            echo "Infrastructure commands:"
            echo "  nix run .#infra-apply    # Create KV namespaces"
            echo "  nix run .#infra-destroy  # Destroy infrastructure"
            echo ""
            echo "Worker commands:"
            echo "  nix run .#worker-test           # Type check worker"
            echo "  nix run .#worker-deploy-staging # Deploy to staging"
            echo "  nix run .#worker-deploy-prod    # Deploy to production"
            echo "  nix run .#worker-promote        # Promote staging to production"
            echo ""
            echo "Required: CLOUDFLARE_API_TOKEN"
            echo ""
          '';
        };

        # ============= Apps =============
        apps = {
          # ---------- Infrastructure ----------

          infra-apply = {
            type = "app";
            program = toString (pkgs.writeShellScript "infra-apply" ''
              ${preamble}

              if [ -z "''${TF_VAR_cloudflare_account_id:-}" ]; then
                echo "Error: TF_VAR_cloudflare_account_id is not set"
                exit 1
              fi

              cd "$(dirname "$0")/../infra" 2>/dev/null || cd "${./.}"

              echo "Generating Terraform config..."
              ${terranix.packages.${system}.terranix}/bin/terranix > config.tf.json

              echo "Initializing OpenTofu..."
              ${tofu}/bin/tofu init

              echo "Applying infrastructure..."
              ${tofu}/bin/tofu apply -auto-approve

              echo ""
              echo "Infrastructure applied successfully!"
              ${tofu}/bin/tofu output -json | ${pkgs.jq}/bin/jq .
            '');
          };

          infra-destroy = {
            type = "app";
            program = toString (pkgs.writeShellScript "infra-destroy" ''
              ${preamble}

              cd "$(dirname "$0")/../infra" 2>/dev/null || cd "${./.}"

              echo "Destroying infrastructure..."
              ${tofu}/bin/tofu destroy -auto-approve
            '');
          };

          infra-outputs = {
            type = "app";
            program = toString (pkgs.writeShellScript "infra-outputs" ''
              cd "$(dirname "$0")/../infra" 2>/dev/null || cd "${./.}"
              ${tofu}/bin/tofu output -json | ${pkgs.jq}/bin/jq .
            '');
          };

          # ---------- Worker ----------

          worker-test = {
            type = "app";
            program = toString (pkgs.writeShellScript "worker-test" ''
              ${preamble}

              # Find worker directory relative to git root
              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/worker"

              echo "Installing dependencies..."
              ${pkgs.nodejs_22}/bin/npm ci

              echo "Running type check..."
              ${pkgs.nodejs_22}/bin/npx tsc --noEmit

              echo "Worker tests passed!"
            '');
          };

          worker-deploy-staging = {
            type = "app";
            program = toString (pkgs.writeShellScript "worker-deploy-staging" ''
              ${preamble}
              ${healthCheck stagingUrl}

              check_env

              # Find worker directory relative to git root
              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/worker"

              echo "Installing dependencies..."
              ${pkgs.nodejs_22}/bin/npm ci

              echo "Deploying to staging..."
              ${pkgs.nodejs_22}/bin/npx wrangler deploy --env staging

              health_check "${stagingUrl}"

              echo ""
              echo "Staging deployment complete!"
              echo "URL: ${stagingUrl}"
            '');
          };

          worker-deploy-prod = {
            type = "app";
            program = toString (pkgs.writeShellScript "worker-deploy-prod" ''
              ${preamble}
              ${healthCheck productionUrl}

              check_env

              # Find worker directory relative to git root
              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/worker"

              echo "Installing dependencies..."
              ${pkgs.nodejs_22}/bin/npm ci

              echo "Deploying to production..."
              ${pkgs.nodejs_22}/bin/npx wrangler deploy

              health_check "${productionUrl}"

              echo ""
              echo "Production deployment complete!"
              echo "URL: ${productionUrl}"
            '');
          };

          worker-promote = {
            type = "app";
            program = toString (pkgs.writeShellScript "worker-promote" ''
              ${preamble}
              ${healthCheck stagingUrl}
              ${healthCheck productionUrl}

              check_env

              echo "Validating staging health before promotion..."
              health_check "${stagingUrl}"

              # Find worker directory relative to git root
              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/worker"

              echo "Installing dependencies..."
              ${pkgs.nodejs_22}/bin/npm ci

              echo "Promoting staging to production..."
              ${pkgs.nodejs_22}/bin/npx wrangler deploy

              health_check "${productionUrl}"

              echo ""
              echo "Promotion complete!"
              echo "Production URL: ${productionUrl}"
            '');
          };

          # Combined CI workflow
          ci-deploy-staging = {
            type = "app";
            program = toString (pkgs.writeShellScript "ci-deploy-staging" ''
              ${preamble}
              ${healthCheck stagingUrl}

              check_env

              # Find worker directory relative to git root
              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/worker"

              echo "=== Worker CI: Deploy to Staging ==="

              echo "Step 1/3: Installing dependencies..."
              ${pkgs.nodejs_22}/bin/npm ci

              echo "Step 2/3: Type checking..."
              ${pkgs.nodejs_22}/bin/npx tsc --noEmit

              echo "Step 3/3: Deploying to staging..."
              ${pkgs.nodejs_22}/bin/npx wrangler deploy --env staging

              health_check "${stagingUrl}"

              echo ""
              echo "=== CI Deploy to Staging Complete ==="
              echo "URL: ${stagingUrl}"
            '');
          };

          ci-deploy-prod = {
            type = "app";
            program = toString (pkgs.writeShellScript "ci-deploy-prod" ''
              ${preamble}
              ${healthCheck productionUrl}

              check_env

              # Find worker directory relative to git root
              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/worker"

              echo "=== Worker CI: Deploy to Production ==="

              echo "Step 1/3: Installing dependencies..."
              ${pkgs.nodejs_22}/bin/npm ci

              echo "Step 2/3: Type checking..."
              ${pkgs.nodejs_22}/bin/npx tsc --noEmit

              echo "Step 3/3: Deploying to production..."
              ${pkgs.nodejs_22}/bin/npx wrangler deploy

              health_check "${productionUrl}"

              echo ""
              echo "=== CI Deploy to Production Complete ==="
              echo "URL: ${productionUrl}"
            '');
          };
        };
      }
    );
}
