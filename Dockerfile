# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

# Install system dependencies required for native module compilation (swisseph needs Python, make, g++)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install deps first
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm cache clean --force

# Show versions for debugging
RUN node -v && npm -v && ls -lah

# Copy source with ownership for the node user
COPY --chown=node:node . .

# Build only the runtime subset
RUN npm run vnext:build:runtime

# Fix build output path: compose.js is built to dist/vnext/vnext/api/compose.js
# but server expects dist/vnext/api/compose.js - copy it to expected location
RUN mkdir -p dist/vnext/api && \
    if [ -f dist/vnext/vnext/api/compose.js ]; then \
      cp dist/vnext/vnext/api/compose.js dist/vnext/api/compose.js; \
    fi

# Prepare writable dir for exports before switching user
RUN mkdir -p /tmp/exports && chown -R node:node /tmp/exports

# Run as non-root
USER node

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
