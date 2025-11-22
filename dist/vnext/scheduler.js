"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planToToneEvents = planToToneEvents;
exports.validatePlanForAudio = validatePlanForAudio;
exports.generateRenderMetadata = generateRenderMetadata;
/**
 * Convert vNext Plan events to Tone.js-compatible format
 */
function planToToneEvents(plan) {
    const events = [];
    for (const event of plan.events) {
        // Convert MIDI pitch to note name (simplified)
        const note = midiToNote(event.pitch);
        // Convert time to Tone.js format (seconds)
        const time = event.t0;
        const duration = (event.t1 - event.t0).toFixed(3);
        // Convert velocity (0-1 to 0-127)
        const velocity = Math.round(event.velocity * 127);
        events.push({
            time,
            note,
            duration,
            velocity,
            channel: event.channel
        });
    }
    return events.sort((a, b) => a.time - b.time);
}
/**
 * Convert MIDI pitch number to note name
 */
function midiToNote(pitch) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const noteIndex = pitch % 12;
    return `${notes[noteIndex]}${octave}`;
}
/**
 * Validate plan for audio rendering
 */
function validatePlanForAudio(plan) {
    const issues = [];
    if (!plan.events || plan.events.length === 0) {
        issues.push('No events in plan');
    }
    if (plan.durationSec <= 0) {
        issues.push('Invalid duration');
    }
    // Check for required channels
    const channels = new Set(plan.events.map(e => e.channel));
    const requiredChannels = ['melody', 'harmony'];
    for (const req of requiredChannels) {
        if (!channels.has(req)) {
            issues.push(`Missing required channel: ${req}`);
        }
    }
    // Check for finite values
    for (let i = 0; i < plan.events.length; i++) {
        const event = plan.events[i];
        if (!Number.isFinite(event.t0) || !Number.isFinite(event.t1) ||
            !Number.isFinite(event.pitch) || !Number.isFinite(event.velocity)) {
            issues.push(`Non-finite values in event ${i}`);
            break;
        }
    }
    return {
        valid: issues.length === 0,
        issues
    };
}
/**
 * Generate audio metadata for logging
 */
function generateRenderMetadata(plan, audioEvents) {
    const channels = new Set(plan.events.map(e => e.channel));
    const pitchRange = {
        min: Math.min(...plan.events.map(e => e.pitch)),
        max: Math.max(...plan.events.map(e => e.pitch))
    };
    return {
        planId: plan.id,
        source: 'vnext',
        duration: plan.durationSec,
        eventCount: plan.events.length,
        toneEventCount: audioEvents.length,
        channels: Array.from(channels),
        pitchRange,
        bpm: plan.bpm,
        key: plan.key
    };
}
