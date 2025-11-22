"use strict";
// vnext/scripts/e2e-determinism.ts
// E2E determinism testing with proper normalization
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDeterminismTest = runDeterminismTest;
exports.testFailClosed = testFailClosed;
exports.testOverlayThresholds = testOverlayThresholds;
const determinism_normalizer_1 = require("./determinism-normalizer");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Run determinism test with N identical requests
 */
async function runDeterminismTest(composeEndpoint, payload, iterations = 5, artifactDir) {
    const responses = [];
    const hashes = [];
    // Make N identical requests
    for (let i = 0; i < iterations; i++) {
        try {
            const response = await fetch(composeEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            responses.push(data);
            // Normalize and hash
            const hash = (0, determinism_normalizer_1.hashNormalizedResponse)(data, determinism_normalizer_1.DEFAULT_EXCLUSIONS);
            hashes.push(hash);
        }
        catch (error) {
            throw new Error(`Determinism test failed on iteration ${i + 1}: ${error}`);
        }
    }
    // Check if all hashes are identical
    const uniqueHashes = [...new Set(hashes)];
    const success = uniqueHashes.length === 1;
    // Generate artifacts if requested
    let artifacts;
    if (artifactDir) {
        const artifactsPath = path_1.default.join(artifactDir, 'determinism');
        fs_1.default.mkdirSync(artifactsPath, { recursive: true });
        // Save responses
        fs_1.default.writeFileSync(path_1.default.join(artifactsPath, 'responses.json'), JSON.stringify(responses, null, 2));
        // Save hashes
        fs_1.default.writeFileSync(path_1.default.join(artifactsPath, 'hashes.txt'), hashes.join('\n'));
        // Save exclusions
        const exclusionsFile = path_1.default.join(artifactsPath, 'exclusions.txt');
        fs_1.default.writeFileSync(exclusionsFile, [
            'Determinism test exclusions:',
            `- artifacts.timestamp: ${determinism_normalizer_1.DEFAULT_EXCLUSIONS.timestamp}`,
            `- audio.latency_ms: ${determinism_normalizer_1.DEFAULT_EXCLUSIONS.latency}`,
            `- audio.url query params: ${determinism_normalizer_1.DEFAULT_EXCLUSIONS.audioUrl}`,
            '',
            `Test: ${iterations} identical requests`,
            `Result: ${success ? 'PASS' : 'FAIL'} (${uniqueHashes.length} unique hashes)`,
            `Hashes: ${uniqueHashes.join(', ')}`
        ].join('\n'));
        artifacts = {
            responses,
            hashes,
            exclusionsFile
        };
    }
    return {
        success,
        hashCount: hashes.length,
        uniqueHashes,
        exclusions: [
            'artifacts.timestamp',
            'audio.latency_ms',
            'audio.url query params'
        ],
        artifacts
    };
}
/**
 * Test fail-closed behavior with forced gate failure
 */
async function testFailClosed(composeEndpoint, payload, forceFail = 'step_leap') {
    var _a;
    // Add test override to force gate failure
    const testPayload = {
        ...payload,
        testOverride: {
            forceFail,
            calibrated: false
        }
    };
    const response = await fetch(composeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    // Check if text contains only knob hints (no musical adjectives)
    const text = ((_a = data.text) === null || _a === void 0 ? void 0 : _a.short) || '';
    const hasMusicalAdjectives = /\b(social|equilibrated|connected|expansive|cosmic|delicate|harmonious|introspective)\b/i.test(text);
    const hasKnobHints = /\b(step_bias|leap_cap|rhythm_template|syncopation)\b/i.test(text);
    const failClosed = !hasMusicalAdjectives && hasKnobHints;
    return {
        success: failClosed,
        text,
        failClosed
    };
}
/**
 * Test overlay Δ thresholds
 */
async function testOverlayThresholds(composeEndpoint, basePayload) {
    var _a, _b;
    // Test above threshold (should show contrast)
    const abovePayload = {
        ...basePayload,
        mode: 'overlay',
        overlayParams: {
            natalLatitude: 34.05,
            natalLongitude: -118.25,
            natalDatetime: '1990-01-01T12:00:00Z',
            currentLatitude: 34.05,
            currentLongitude: -118.25,
            currentDatetime: '2024-08-08T12:00:00Z' // Large time delta
        }
    };
    const aboveResponse = await fetch(composeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(abovePayload)
    });
    const aboveData = await aboveResponse.json();
    const aboveText = ((_a = aboveData.text) === null || _a === void 0 ? void 0 : _a.short) || '';
    const aboveThreshold = aboveText.includes('Compared to your natal chart');
    // Test below threshold (should not show contrast)
    const belowPayload = {
        ...basePayload,
        mode: 'overlay',
        overlayParams: {
            natalLatitude: 34.05,
            natalLongitude: -118.25,
            natalDatetime: '1990-01-01T12:00:00Z',
            currentLatitude: 34.05,
            currentLongitude: -118.25,
            currentDatetime: '1990-01-01T12:05:00Z' // Small time delta
        }
    };
    const belowResponse = await fetch(composeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(belowPayload)
    });
    const belowData = await belowResponse.json();
    const belowText = ((_b = belowData.text) === null || _b === void 0 ? void 0 : _b.short) || '';
    const belowThreshold = !belowText.includes('Compared to your natal chart');
    return { aboveThreshold, belowThreshold };
}
