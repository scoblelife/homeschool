{
  description = "Homeschool Signaling Server";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    crane.url = "github:ipetkov/crane";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, crane, flake-utils, rust-overlay, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        # Use stable Rust
        rustToolchain = pkgs.rust-bin.stable.latest.default;

        # Configure crane to use our toolchain
        craneLib = (crane.mkLib pkgs).overrideToolchain rustToolchain;

        # Common arguments for building
        commonArgs = {
          src = craneLib.cleanCargoSource ./.;
          strictDeps = true;

          buildInputs = [
            # Add additional build inputs here
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            pkgs.libiconv
          ];
        };

        # Build dependencies only (for caching)
        cargoArtifacts = craneLib.buildDepsOnly commonArgs;

        # Build the actual binary
        homeschool-signaling = craneLib.buildPackage (commonArgs // {
          inherit cargoArtifacts;
        });

        # Docker image using dockerTools
        dockerImage = pkgs.dockerTools.buildLayeredImage {
          name = "homeschool-signaling";
          tag = "latest";

          contents = [
            homeschool-signaling
            pkgs.cacert  # CA certificates for HTTPS
          ];

          config = {
            Cmd = [ "${homeschool-signaling}/bin/homeschool-signaling" ];
            ExposedPorts = {
              "8080/tcp" = {};
            };
            Env = [
              "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
            ];
          };
        };

        # Minimal image using streamLayeredImage (even smaller)
        dockerImageStream = pkgs.dockerTools.streamLayeredImage {
          name = "homeschool-signaling";
          tag = "latest";

          contents = [
            homeschool-signaling
            pkgs.cacert
          ];

          config = {
            Cmd = [ "${homeschool-signaling}/bin/homeschool-signaling" ];
            ExposedPorts = {
              "8080/tcp" = {};
            };
            Env = [
              "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
            ];
          };
        };

      in {
        checks = {
          # Build the package as a check
          inherit homeschool-signaling;
        };

        packages = {
          default = homeschool-signaling;
          inherit homeschool-signaling dockerImage dockerImageStream;
        };

        apps.default = flake-utils.lib.mkApp {
          drv = homeschool-signaling;
        };

        devShells.default = craneLib.devShell {
          checks = self.checks.${system};

          packages = [
            pkgs.rust-analyzer
          ];
        };
      }
    );
}
