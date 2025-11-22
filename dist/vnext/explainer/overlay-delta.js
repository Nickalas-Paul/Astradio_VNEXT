"use strict";
// vnext/explainer/overlay-delta.ts
// Overlay Δ threshold enforcement for Unified Spec v1.1
Object.defineProperty(exports, "__esModule", { value: true });
exports.OVERLAY_THRESHOLDS = void 0;
exports.shouldContrast = shouldContrast;
exports.hasSignificantDeltas = hasSignificantDeltas;
exports.OVERLAY_THRESHOLDS = {
    step_bias: 0.10,
    syncopation_bias: 0.15,
    density_level: 0.20
};
/**
 * Determines if contrast text should be emitted based on delta thresholds
 * @param kind The type of control being compared
 * @param deltaAbs The absolute difference between natal and current values
 * @returns true if contrast should be shown, false otherwise
 */
function shouldContrast(kind, deltaAbs) {
    const threshold = exports.OVERLAY_THRESHOLDS[kind];
    return deltaAbs >= threshold;
}
/**
 * Check if any overlay deltas exceed thresholds
 * @param deltas Object containing delta values for each control
 * @returns true if any delta exceeds its threshold
 */
function hasSignificantDeltas(deltas) {
    return Object.entries(deltas).some(([kind, delta]) => {
        if (delta === undefined)
            return false;
        return shouldContrast(kind, Math.abs(delta));
    });
}
