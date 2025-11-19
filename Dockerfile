FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (include dev deps for vnext:build)
RUN npm ci && npm cache clean --force

# Build vNext system
COPY . .
RUN npm run vnext:build

# Switch to non-root user
RUN useradd -m -u 1000 nodeuser && chown -R nodeuser:nodeuser /app
USER nodeuser

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["npm", "start"]

