"use strict";
// vnext/plan-generator.ts
// ML-only cascade generator (no rules fallback)
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlanMLOnly = generatePlanMLOnly;
const ml_1 = require("./ml");
const narrative_1 = require("./planner/narrative");
const guidance_1 = require("./astro/guidance");
const audition_gate_1 = require("./audition-gate");
const quality_1 = require("./config/quality");
const K = Number(process.env.VNEXT_K || 8);
const MIN_Q = quality_1.MIN_RULE_QUALITY;
const JITTER = Number(process.env.VNEXT_JITTER || 0.10); // 0..1
// Deterministic PRNG (xorshift32) seeded from controls.hash to ensure repeatability
function createSeededRNG(seedStr) {
    // Derive a 32-bit seed from the hash string deterministically
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seed ^ seedStr.charCodeAt(i)) >>> 0;
        // Mix
        seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0;
        seed = Math.imul(seed ^ (seed >>> 13), 3266489909) >>> 0;
    }
    if (seed === 0)
        seed = 0x9E3779B9; // non-zero default
    let state = seed >>> 0;
    return () => {
        // xorshift32
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state >>>= 0;
        state ^= state << 5;
        state >>>= 0;
        // Map to [0,1)
        return (state >>> 0) / 0xFFFFFFFF;
    };
}
function jitter(v, sigma, rand) {
    if (sigma <= 0)
        return v.slice();
    return v.map(x => {
        const noise = (rand() - 0.5) * 2 * sigma; // [-sigma, +sigma]
        const y = x + noise;
        return Math.max(0, Math.min(1, y));
    });
}
async function generatePlanMLOnly(feat, chartContext) {
    var _a, _b;
    const { vector: base, modelVersion } = await (0, ml_1.studentVector)(feat); // [6] in [0,1]
    // Compute astrological guidance if chartContext provided
    let guidance = undefined;
    // Create deterministic RNG from controls.hash when available
    const seedStr = (chartContext && (chartContext.hash || ((_a = chartContext.controls) === null || _a === void 0 ? void 0 : _a.hash))) || "seed";
    const rng = createSeededRNG(String(seedStr));
    if (chartContext) {
        try {
            // Convert chartContext to EphemerisSnapshot format
            const snapshot = {
                ts: chartContext.ts || chartContext.date || new Date().toISOString(),
                tz: chartContext.tz || chartContext.timezone || "UTC",
                lat: chartContext.lat || chartContext.latitude || 0,
                lon: chartContext.lon || chartContext.longitude || 0,
                houseSystem: chartContext.houseSystem || "placidus",
                planets: ((_b = chartContext.planets) === null || _b === void 0 ? void 0 : _b.map((p) => ({
                    name: p.name,
                    lon: p.lon || p.longitude || 0
                }))) || [],
                houses: chartContext.houses || Array.from({ length: 12 }, (_, i) => i * 30),
                aspects: chartContext.aspects || [],
                moonPhase: chartContext.moonPhase || 0.5,
                dominantElements: chartContext.dominantElements || {
                    fire: 0.25, earth: 0.25, air: 0.25, water: 0.25
                }
            };
            guidance = (0, guidance_1.guidanceFromFeatures)(feat, snapshot);
            console.log(`🔮 Astro guidance: tempo=${guidance.tempoBias.toFixed(2)}, arc=${guidance.arcBias.toFixed(2)}, density=${guidance.densityBias.toFixed(2)}`);
        }
        catch (e) {
            console.warn(`⚠️ Failed to compute astro guidance: ${e}`);
        }
    }
    const candidates = [base, ...Array.from({ length: K - 1 }, () => jitter(base, JITTER, rng))];
    const scored = candidates.map(v6 => {
        const plan = (0, narrative_1.planFromVector)(v6, guidance);
        const q = (0, audition_gate_1.ruleQualityPass)(plan);
        return { plan, q, v6 };
    }).sort((a, b) => b.q.score - a.q.score);
    const best = scored[0];
    if (best.q.score < MIN_Q) {
        const diag = scored.map(s => ({ score: +s.q.score.toFixed(3), v6: s.v6 }));
        const err = new Error(`All candidates below threshold ${MIN_Q}`);
        err.statusCode = 422;
        err.diag = diag;
        throw err;
    }
    return {
        plan: best.plan,
        source: `student-${modelVersion}+rerank`,
        diag: {
            scores: scored.map(s => s.q.score),
            modelVersion,
            modelSource: modelVersion,
            canaryInfo: modelVersion === 'v2' ? 'canary-active' : 'baseline'
        }
    };
}
