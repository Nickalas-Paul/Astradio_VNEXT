"use strict";
// vnext/scripts/determinism-normalizer.ts
// Normalizes responses for deterministic comparison
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EXCLUSIONS = void 0;
exports.normalizeResponse = normalizeResponse;
exports.hashNormalizedResponse = hashNormalizedResponse;
exports.DEFAULT_EXCLUSIONS = {
    timestamp: true,
    latency: true,
    audioUrl: false // Audio URL is now seed-derived, so keep it
};
/**
 * Normalizes a response object for deterministic comparison
 * @param response The API response to normalize
 * @param exclusions Fields to exclude from comparison
 * @returns Normalized response object
 */
function normalizeResponse(response, exclusions = exports.DEFAULT_EXCLUSIONS) {
    var _a, _b, _c;
    const normalized = JSON.parse(JSON.stringify(response));
    if (exclusions.timestamp && ((_a = normalized.artifacts) === null || _a === void 0 ? void 0 : _a.timestamp)) {
        normalized.artifacts.timestamp = "";
    }
    if (exclusions.latency && ((_b = normalized.audio) === null || _b === void 0 ? void 0 : _b.latency_ms)) {
        normalized.audio.latency_ms = 0;
    }
    if (exclusions.audioUrl && ((_c = normalized.audio) === null || _c === void 0 ? void 0 : _c.url)) {
        normalized.audio.url = normalized.audio.url.split('?')[0];
    }
    return normalized;
}
/**
 * Computes hash of normalized response for deterministic comparison
 * @param response The API response
 * @param exclusions Fields to exclude
 * @returns Hash string
 */
function hashNormalizedResponse(response, exclusions = exports.DEFAULT_EXCLUSIONS) {
    const normalized = normalizeResponse(response, exclusions);
    const json = JSON.stringify(normalized, Object.keys(normalized).sort());
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
        const char = json.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
}
