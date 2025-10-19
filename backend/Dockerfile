# =========================
# 1) Build stage (install only prod deps)
# =========================
FROM node:20-alpine AS base
WORKDIR /app

# install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Add entrypoint (migrate/seed then start)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Convert CRLF -> LF for Windows checkouts and make executable
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

# =========================
# 2) Runtime stage
# =========================
FROM node:20-alpine
WORKDIR /app

# Security: non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# bring built app
COPY --from=base /app /app

ENV NODE_ENV=production
EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
