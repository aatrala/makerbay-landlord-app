FROM node:22-alpine AS base
RUN corepack enable pnpm

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared/package.json shared/
COPY server/package.json server/

RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY shared/ shared/
COPY server/ server/

RUN pnpm --filter @rentlite/shared build
RUN pnpm --filter server build

EXPOSE 3000
CMD ["node", "server/dist/index.js"]
