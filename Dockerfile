FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Versions-Argument vom CI übergeben
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# APP_VERSION aus Builder-Stage übernehmen
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN mkdir -p ./public
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Docker-Socket-Zugriff für Update-Funktion
RUN apk add --no-cache docker-cli
USER nextjs
EXPOSE 3000
LABEL org.opencontainers.image.source="https://github.com/CoreXManagement/topograph"
LABEL org.opencontainers.image.description="Visuelle Systemdokumentation & Topologie-Editor"
LABEL org.opencontainers.image.licenses="MIT"
CMD ["node", "server.js"]
