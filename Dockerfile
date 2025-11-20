# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

# Install deps first
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm cache clean --force

# Show versions for debugging
RUN node -v && npm -v && ls -lah

# Copy source with ownership for the node user
COPY --chown=node:node . .

# Build only the runtime subset
RUN npm run vnext:build:runtime

# Prepare writable dir for exports before switching user
RUN mkdir -p /tmp/exports && chown -R node:node /tmp/exports

# Run as non-root
USER node

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
