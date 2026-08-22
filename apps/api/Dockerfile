# ===== Build =====
FROM node:20-alpine AS builder
WORKDIR /app
# Dependências para módulos nativos (bcrypt) caso não haja binário pré-compilado
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ===== Runtime =====
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm ci --omit=dev --ignore-scripts \
  && npm rebuild bcrypt \
  && apk del .build-deps
# Prisma: client gerado + CLI para "migrate deploy"
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
RUN mkdir -p /app/uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
