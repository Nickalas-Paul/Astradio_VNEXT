# Astradio VNEXT - Clean Baseline

This is a clean baseline of the Astradio codebase, created for production deployment.

## What's Included

- **Core Application**: Next.js app, Express server, vNext engine
- **CI/CD**: GitHub Actions workflows for testing and deployment
- **Documentation**: Complete docs and runbooks
- **Soak Testing**: 24h staging validation infrastructure
- **Configuration**: TypeScript, Next.js, Tailwind configs

## What's Excluded

- `node_modules/` - Dependencies (install with `npm install`)
- `dist/` - Build artifacts (generated with `npm run build`)
- `media/` - Audio samples and large assets
- `*.exe`, `*.dll`, `*.lib` - Binary files
- `*.wav`, `*.sf2` - Audio files
- Duplicate directories and working copies

## Quick Start

```bash
npm install
npm run vnext:build
npm start
```

## Health Checks

- `/health` - Basic health check
- `/readyz` - Bounded readiness check
- `/api/compose` - Main composition endpoint

## Soak Testing

```bash
# Set staging URL
export STAGING_BASE_URL=https://staging.astradio.io

# Run soak test
node scripts/soak-runner.js
```

## Architecture

- **Single Engine**: vNext compose API (UnifiedSpecV1.1)
- **Three Outputs**: Audio, Text, Visualization
- **Deterministic**: Hash-based control surfaces
- **Fail-Closed**: Quality gates with calibrated thresholds

## Evidence

- Determinism: ✅ Proven with identical hashes
- Health endpoints: ✅ Working
- Soak infrastructure: ✅ Ready with golden charts
- CI/CD: ✅ GitHub Actions configured
