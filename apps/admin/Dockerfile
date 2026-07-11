# Build context is the repo root (see docker-compose.yml).
FROM node:20-slim

WORKDIR /app

# NEXT_PUBLIC_* is inlined into the client bundle at build time, so it must be
# a URL the *browser* can reach (not the compose-internal service name).
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/liff/package.json apps/liff/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin
RUN npm run build -w packages/shared && npm run build -w apps/admin

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/admin"]
