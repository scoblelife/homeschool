# Multi-stage build for minimal image size

# Build stage
FROM rust:1.83-alpine AS builder

# Install build dependencies
RUN apk add --no-cache musl-dev protobuf-dev

WORKDIR /app

# Copy manifests
COPY api/Cargo.toml api/Cargo.lock* ./

# Create dummy main.rs to cache dependencies
RUN mkdir -p src && echo "fn main() {}" > src/main.rs

# Copy proto files and build script for dependency compilation
COPY proto/ /proto/
COPY api/build.rs ./build.rs

# Build dependencies (cached layer)
RUN cargo build --release && rm -rf src

# Copy actual source code
COPY api/src ./src
COPY api/migrations ./migrations

# Build the application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM alpine:3.19

# Install CA certificates for HTTPS
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/homeschool-api .

# Copy migrations
COPY api/migrations ./migrations

# Expose port
EXPOSE 8080

# Run the server
CMD ["./homeschool-api"]
