"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchVNextPlan = fetchVNextPlan;
exports.renderVNextPlan = renderVNextPlan;
exports.integrateVNextWithTone = integrateVNextWithTone;
const scheduler_1 = require("./scheduler");
/**
 * Client-side helper to fetch vNext plan and convert to Tone.js events
 */
async function fetchVNextPlan(chartContext, config = {}) {
    var _a, _b;
    const baseUrl = config.baseUrl || '';
    try {
        // Fetch plan from vNext compose endpoint
        const response = await fetch(`${baseUrl}/api/vnext/compose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chartContext })
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.error || 'Unknown error from vNext compose');
        }
        const plan = result.plan;
        // Validate plan for audio
        const validation = (0, scheduler_1.validatePlanForAudio)(plan);
        if (!validation.valid) {
            (_a = config.onError) === null || _a === void 0 ? void 0 : _a.call(config, `Plan validation failed: ${validation.issues.join(', ')}`);
            return { plan, audioEvents: [], valid: false };
        }
        // Convert to Tone.js events
        const audioEvents = (0, scheduler_1.planToToneEvents)(plan);
        return { plan, audioEvents, valid: true };
    }
    catch (error) {
        (_b = config.onError) === null || _b === void 0 ? void 0 : _b.call(config, error.message);
        throw error;
    }
}
/**
 * Client-side helper to render vNext plan to audio
 */
async function renderVNextPlan(plan, config = {}) {
    const baseUrl = config.baseUrl || '';
    try {
        const response = await fetch(`${baseUrl}/api/vnext/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    catch (error) {
        return { ok: false, error: error.message };
    }
}
/**
 * Integration with existing Tone.js setup
 * This function can be called from the frontend to seamlessly integrate vNext
 */
async function integrateVNextWithTone(chartContext, toneSetup, config = {}) {
    var _a;
    try {
        const { plan, audioEvents, valid } = await fetchVNextPlan(chartContext, config);
        if (!valid) {
            return false;
        }
        // Call the existing Tone.js setup function
        toneSetup(audioEvents);
        return true;
    }
    catch (error) {
        (_a = config.onError) === null || _a === void 0 ? void 0 : _a.call(config, error.message);
        return false;
    }
}
