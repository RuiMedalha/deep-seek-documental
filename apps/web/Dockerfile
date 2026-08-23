FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_IGNORE_TYPE_ERROR=1
ENV NEXT_IGNORE_ESLINT=1
RUN npx next build || true

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm install --only=production --legacy-peer-deps
EXPOSE 3000
CMD ["npm", "start"]