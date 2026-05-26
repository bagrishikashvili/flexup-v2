FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/flexup-backend/package.json apps/flexup-backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY . .
RUN npm run build -w @flexup/shared
RUN npx prisma generate --schema apps/flexup-backend/prisma/schema.prisma
RUN npm run build -w apps/flexup-backend

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/flexup-backend/package.json /app/apps/flexup-backend/package.json
COPY --from=builder /app/packages/shared/package.json /app/packages/shared/package.json
RUN npm ci --omit=dev --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY --from=builder /app/apps/flexup-backend/dist /app/apps/flexup-backend/dist
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/packages/shared/dist /app/packages/shared/dist

WORKDIR /app/apps/flexup-backend
EXPOSE 3000 7001
CMD ["node", "dist/main.js"]
