# Build context is the repo root (see docker-compose.yml).
# node:20-slim (glibc) so bcrypt uses prebuilt binaries; openssl is required by Prisma.
FROM node:20-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so this layer is cached until a package.json changes.
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/liff/package.json apps/liff/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build -w packages/shared && npm run build -w apps/api

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node apps/api/dist/main.js"]
