FROM node:20-slim AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.29.2 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy workspace package.json files for install
COPY apps/web/package.json apps/web/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/ui/package.json packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source for build
COPY packages/design-tokens/ packages/design-tokens/
COPY packages/shared-types/ packages/shared-types/
COPY packages/ui/ packages/ui/
COPY apps/web/ apps/web/
COPY tsconfig.base.json ./

# Accept build-time env vars so Vite can inline VITE_* into the client bundle
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST

# Build design tokens then web app
RUN pnpm --filter @homeschool/design-tokens build
RUN pnpm --filter @homeschool/web build

FROM node:20-slim
WORKDIR /app

# Copy standalone Nitro output
COPY --from=build /app/apps/web/.output .output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
