# syntax=docker/dockerfile:1

# ---- deps: install once, reused by build stage ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# ---- build: generate Prisma client + compile TS ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# nest-cli.json copies the Prisma query-engine binary alongside the
# compiled generated/prisma/*.js so dist/ is self-contained.
RUN npm run build

# ---- runtime: prod deps + compiled output only ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Local-disk photo storage default — keep uploads on a volume in production.
RUN mkdir -p uploads/products

EXPOSE 4000
CMD ["node", "dist/main.js"]
