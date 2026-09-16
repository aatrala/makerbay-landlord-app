FROM node:22-alpine AS base
RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared/package.json shared/
COPY client/package.json client/

RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY shared/ shared/
COPY client/ client/

RUN pnpm --filter @rentlite/shared build
RUN pnpm --filter client build

EXPOSE 5173
CMD ["pnpm", "--filter", "client", "dev"]
