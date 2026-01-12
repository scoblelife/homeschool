{
  description = "Homeschool Infrastructure and Signaling Server Deployment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Signaling server configuration
        signalingUrl = "https://homeschool-signaling.fly.dev";

        # Health check function
        healthCheck = ''
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
                RESPONSE=$(${pkgs.curl}/bin/curl -s "$url/health")
                echo "$RESPONSE" | ${pkgs.jq}/bin/jq .
                return 0
              fi
              echo "Attempt $attempt/$max_attempts: Status $STATUS"
              attempt=$((attempt + 1))
            done

            echo "Health check failed after $max_attempts attempts"
            exit 1
          }
        '';

      in
      {
        # Development shell with deployment tools
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.flyctl
            pkgs.jq
            pkgs.curl
          ];

          shellHook = ''
            echo "Homeschool Infrastructure Shell"
            echo ""
            echo "Signaling Server commands:"
            echo "  nix run .#signaling-deploy  # Deploy to Fly.io"
            echo "  nix run .#signaling-status  # Check deployment status"
            echo "  nix run .#signaling-logs    # View logs"
            echo "  nix run .#signaling-health  # Health check"
            echo ""
            echo "Or from signaling/ directory:"
            echo "  fly deploy                  # Deploy using Dockerfile"
            echo "  fly status                  # Check status"
            echo "  fly logs                    # View logs"
            echo ""
            echo "URL: ${signalingUrl}"
            echo ""
          '';
        };

        # ============= Apps =============
        apps = {
          # Deploy signaling server to Fly.io
          signaling-deploy = {
            type = "app";
            program = toString (pkgs.writeShellScript "signaling-deploy" ''
              set -euo pipefail
              ${healthCheck}

              # Find signaling directory relative to git root
              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/signaling"

              echo "Deploying signaling server to Fly.io..."
              ${pkgs.flyctl}/bin/fly deploy

              echo ""
              echo "Deployment complete! Running health check..."
              health_check "${signalingUrl}"
            '');
          };

          # Check deployment status
          signaling-status = {
            type = "app";
            program = toString (pkgs.writeShellScript "signaling-status" ''
              set -euo pipefail

              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/signaling"

              ${pkgs.flyctl}/bin/fly status
            '');
          };

          # View logs
          signaling-logs = {
            type = "app";
            program = toString (pkgs.writeShellScript "signaling-logs" ''
              set -euo pipefail

              REPO_ROOT=$(${pkgs.git}/bin/git rev-parse --show-toplevel)
              cd "$REPO_ROOT/signaling"

              ${pkgs.flyctl}/bin/fly logs
            '');
          };

          # Health check
          signaling-health = {
            type = "app";
            program = toString (pkgs.writeShellScript "signaling-health" ''
              set -euo pipefail
              ${healthCheck}

              health_check "${signalingUrl}"
            '');
          };
        };
      }
    );
}
