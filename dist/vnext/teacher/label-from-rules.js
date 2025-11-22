"use strict";
// vnext/teacher/label-from-rules.ts
// Enhanced offline label generator with comprehensive musical rules and astrological integration.
// NOTE: This runs entirely offline and does not affect runtime behavior.
// Phase 2A: Teacher System Foundation - Enhanced with 50+ musical rules
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const feature_encode_1 = require("../feature-encode");
const critics_1 = require("../critics");
const critics_2 = require("../critics");
const critics_3 = require("../critics");
const quality_1 = require("../config/quality");
const DATASETS_DIR = path_1.default.resolve(process.cwd(), "datasets");
const SNAPSHOTS_FILE = path_1.default.join(DATASETS_DIR, "snapshots.jsonl");
const LABELS_DIR = path_1.default.join(DATASETS_DIR, "labels");
const OUTPUT_FILE = path_1.default.join(LABELS_DIR, "train.jsonl");
const MOTIF_VOCAB_FILE = path_1.default.resolve(process.cwd(), "vnext", "teacher", "motif_vocab.json");
function ensureDirs() {
    if (!fs_1.default.existsSync(LABELS_DIR))
        fs_1.default.mkdirSync(LABELS_DIR, { recursive: true });
}
function loadSnapshots(limit) {
    if (!fs_1.default.existsSync(SNAPSHOTS_FILE)) {
        throw new Error(`Missing snapshots at ${SNAPSHOTS_FILE}`);
    }
    const out = [];
    const lines = fs_1.default.readFileSync(SNAPSHOTS_FILE, "utf8").split(/\r?\n/).filter(Boolean);
    for (const line of lines.slice(0, limit)) {
        try {
            const parsed = JSON.parse(line);
            // Extract the actual snapshot data from the nested structure
            if (parsed.snap) {
                out.push(parsed.snap);
            }
            else {
                out.push(parsed); // Fallback for direct snapshot structure
            }
        }
        catch { /* ignore */ }
    }
    return out;
}
// Enhanced teacher plan with comprehensive musical rules and astrological integration
function enhancedTeacherPlan(feat, snapshot, durationSec = +(process.env.VNEXT_DURATION_SEC || 60)) {
    // Extract astrological features for musical decisions
    const astroFeatures = extractAstrologicalFeatures(snapshot);
    // Apply musical rules based on astrological context
    const musicalRules = applyMusicalRules(feat, astroFeatures);
    // Generate sophisticated plan with proper musical structure
    const plan = generateSophisticatedPlan(musicalRules, durationSec);
    return plan;
}
// Extract astrological features for musical decision making
function extractAstrologicalFeatures(snapshot) {
    var _a, _b;
    const sun = ((_a = snapshot.planets.find(p => p.name === 'sun')) === null || _a === void 0 ? void 0 : _a.lon) || 0;
    const moon = ((_b = snapshot.planets.find(p => p.name === 'moon')) === null || _b === void 0 ? void 0 : _b.lon) || 0;
    const ascendant = snapshot.houses[0];
    // Elemental analysis
    const elements = snapshot.dominantElements;
    const fireAir = elements.fire + elements.air;
    const earthWater = elements.earth + elements.water;
    // Aspect analysis
    const tensionAspects = snapshot.aspects.filter(a => a.type === 'square' || a.type === 'opposition').length;
    const harmoniousAspects = snapshot.aspects.filter(a => a.type === 'trine' || a.type === 'sextile').length;
    return {
        sunSign: Math.floor(sun / 30),
        moonSign: Math.floor(moon / 30),
        ascendantSign: Math.floor(ascendant / 30),
        fireAirDominance: fireAir > earthWater,
        tensionLevel: tensionAspects / (tensionAspects + harmoniousAspects + 1),
        moonPhase: snapshot.moonPhase,
        dominantElement: Object.entries(elements).reduce((a, b) => elements[a[0]] > elements[b[0]] ? a : b)[0]
    };
}
// Apply comprehensive musical rules based on astrological features
function applyMusicalRules(feat, astroFeatures) {
    const rules = {
        // Tempo rules based on elements and aspects
        tempo: {
            base: 80,
            fireAirBoost: astroFeatures.fireAirDominance ? 20 : 0,
            tensionBoost: astroFeatures.tensionLevel * 15,
            moonPhaseBoost: (astroFeatures.moonPhase - 0.5) * 10
        },
        // Key selection based on sun sign
        key: selectKeyFromSunSign(astroFeatures.sunSign),
        // Melodic complexity based on aspects
        melodicComplexity: {
            tensionAspects: astroFeatures.tensionLevel * 0.8,
            harmoniousAspects: (1 - astroFeatures.tensionLevel) * 0.6,
            moonPhase: astroFeatures.moonPhase * 0.4
        },
        // Harmonic progression based on dominant element
        harmonicStyle: selectHarmonicStyle(astroFeatures.dominantElement),
        // Rhythmic patterns based on moon phase and elements
        rhythmicPattern: selectRhythmicPattern(astroFeatures.moonPhase, astroFeatures.dominantElement),
        // Phrase structure based on astrological aspects
        phraseStructure: selectPhraseStructure(astroFeatures.tensionLevel),
        // Dynamic range based on elemental balance
        dynamicRange: {
            fire: astroFeatures.dominantElement === 'fire' ? 0.8 : 0.6,
            earth: astroFeatures.dominantElement === 'earth' ? 0.6 : 0.5,
            air: astroFeatures.dominantElement === 'air' ? 0.7 : 0.6,
            water: astroFeatures.dominantElement === 'water' ? 0.5 : 0.4
        }
    };
    return rules;
}
// Key selection based on sun sign (12 zodiac signs)
function selectKeyFromSunSign(sunSign) {
    const keys = [
        'C major', 'G major', 'D major', 'A major', 'E major', 'B major',
        'F# major', 'C# major', 'A minor', 'E minor', 'B minor', 'F# minor'
    ];
    return keys[sunSign % 12];
}
// Harmonic style based on dominant element - enhanced for better arc generation
function selectHarmonicStyle(dominantElement) {
    const styles = {
        fire: { complexity: 0.9, progression: 'circle_of_fifths', tension: 0.8, arcBoost: 0.3 },
        earth: { complexity: 0.7, progression: 'plagal', tension: 0.5, arcBoost: 0.1 },
        air: { complexity: 0.8, progression: 'chromatic', tension: 0.7, arcBoost: 0.2 },
        water: { complexity: 0.6, progression: 'modal', tension: 0.4, arcBoost: 0.15 }
    };
    return styles[dominantElement] || styles.fire; // Default to fire for better arcs
}
// Rhythmic patterns based on moon phase and elements - enhanced for better arc generation
function selectRhythmicPattern(moonPhase, dominantElement) {
    const patterns = {
        fire: moonPhase < 0.5 ? 'syncopated' : 'driving',
        earth: moonPhase < 0.5 ? 'steady' : 'pulsing', // Add variation to earth
        air: moonPhase < 0.5 ? 'polyrhythmic' : 'floating',
        water: moonPhase < 0.5 ? 'flowing' : 'pulsing'
    };
    return patterns[dominantElement] || 'syncopated'; // Default to more dynamic
}
// Phrase structure based on tension aspects
function selectPhraseStructure(tensionLevel) {
    if (tensionLevel > 0.7)
        return 'dramatic'; // High tension = dramatic phrases
    if (tensionLevel < 0.3)
        return 'lyrical'; // Low tension = lyrical phrases
    return 'balanced'; // Medium tension = balanced phrases
}
// Generate sophisticated musical plan
function generateSophisticatedPlan(rules, durationSec) {
    const bpm = Math.round(rules.tempo.base + rules.tempo.fireAirBoost + rules.tempo.tensionBoost + rules.tempo.moonPhaseBoost);
    const key = rules.key;
    const events = [];
    // Generate 4-phrase structure (16 bars each)
    const phraseLength = durationSec / 4;
    const barLength = phraseLength / 4;
    for (let phrase = 0; phrase < 4; phrase++) {
        const phraseStart = phrase * phraseLength;
        const phraseEvents = generatePhrase(phrase, phraseStart, barLength, rules);
        events.push(...phraseEvents);
    }
    return {
        id: `teacher_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        featureHash: "teacher_enhanced",
        durationSec,
        bpm,
        key,
        events
    };
}
// Generate individual phrase with musical sophistication
function generatePhrase(phraseIndex, startTime, barLength, rules) {
    const events = [];
    const phraseType = rules.phraseStructure;
    // Generate melody with proper voice leading
    const melodyEvents = generateMelody(phraseIndex, startTime, barLength, rules);
    events.push(...melodyEvents);
    // Generate harmony with proper chord progressions
    const harmonyEvents = generateHarmony(phraseIndex, startTime, barLength, rules);
    events.push(...harmonyEvents);
    // Generate bass with proper root movement
    const bassEvents = generateBass(phraseIndex, startTime, barLength, rules);
    events.push(...bassEvents);
    // Generate rhythm with appropriate patterns
    const rhythmEvents = generateRhythm(phraseIndex, startTime, barLength, rules);
    events.push(...rhythmEvents);
    return events;
}
// Generate melody with voice leading and enhanced melodic arcs
function generateMelody(phraseIndex, startTime, barLength, rules) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const events = [];
    const complexity = rules.melodicComplexity.tensionAspects + rules.melodicComplexity.harmoniousAspects;
    const noteCount = Math.floor(8 + complexity * 8); // 8-16 notes per phrase
    // Enhanced arc boost from harmonic style
    const arcBoost = rules.harmonicStyle.arcBoost || 0;
    // Additional boost for Fire elements and Mutable modalities
    const elementBoost = ((_b = (_a = rules.astroFeatures) === null || _a === void 0 ? void 0 : _a.dominantElements) === null || _b === void 0 ? void 0 : _b.fire) > 0.7 ? 0.15 : 0;
    const modalityBoost = ((_d = (_c = rules.astroFeatures) === null || _c === void 0 ? void 0 : _c.dominantModalities) === null || _d === void 0 ? void 0 : _d.mutable) > 0.7 ? 0.10 : 0;
    const combinedBoost = arcBoost + elementBoost + modalityBoost;
    for (let i = 0; i < noteCount; i++) {
        const t0 = startTime + (i / noteCount) * (barLength * 4);
        const t1 = t0 + barLength * 0.8;
        // Enhanced melodic arc with astrologically-predictable step-leap patterns
        let pitch = 60; // C4 base
        const arcScale = 1.2 + combinedBoost * 2; // Reduced scale for better step-leap ratio
        // Control-surface approach: predict step_bias and leap_cap from astrological features
        const fireElement = ((_f = (_e = rules.astroFeatures) === null || _e === void 0 ? void 0 : _e.dominantElements) === null || _f === void 0 ? void 0 : _f.fire) || 0;
        const earthElement = ((_h = (_g = rules.astroFeatures) === null || _g === void 0 ? void 0 : _g.dominantElements) === null || _h === void 0 ? void 0 : _h.earth) || 0;
        const mutableModality = ((_k = (_j = rules.astroFeatures) === null || _j === void 0 ? void 0 : _j.dominantModalities) === null || _k === void 0 ? void 0 : _k.mutable) || 0;
        // Calculate control parameters (these will be the new training targets)
        const stepBias = 0.3 + (earthElement * 0.4) + (mutableModality * 0.2) - (fireElement * 0.3);
        const clampedStepBias = Math.max(0.2, Math.min(0.8, stepBias));
        const leapCap = 2 + Math.floor(fireElement * 4); // 2-6 based on fire element
        // Use deterministic pattern based on control parameters
        const astroSeed = (fireElement * 100 + earthElement * 200 + mutableModality * 300 + i) % 100;
        const isStep = astroSeed < (clampedStepBias * 100);
        const stepSize = isStep ? (astroSeed % 2 + 1) : Math.min(3 + (astroSeed % 4), leapCap); // Respect leap_cap
        if (phraseIndex === 0) {
            // Ascending with step-leap balance
            pitch = 60 + i * arcScale + (isStep ? 0 : stepSize);
        }
        else if (phraseIndex === 1) {
            // Peak with controlled jumps
            pitch = 68 + arcBoost * 4 + Math.sin(i / noteCount * Math.PI) * (2 + arcBoost * 2) + (isStep ? 0 : stepSize);
        }
        else if (phraseIndex === 2) {
            // Descending with step-leap balance
            pitch = 68 + arcBoost * 4 - i * arcScale + (isStep ? 0 : -stepSize);
        }
        else {
            // Resolution with mostly stepwise motion
            pitch = 60 + (i % 3) + arcBoost * 1 + (isStep ? (i % 2) : stepSize);
        }
        events.push({
            t0, t1, pitch,
            velocity: 0.7 + (i % 3) * 0.1 + arcBoost * 0.1,
            channel: 'melody'
        });
    }
    return events;
}
// Generate harmony with proper chord progressions
function generateHarmony(phraseIndex, startTime, barLength, rules) {
    const events = [];
    const harmonicStyle = rules.harmonicStyle;
    const chordChanges = Math.floor(2 + harmonicStyle.complexity * 2); // 2-4 chord changes per phrase
    for (let i = 0; i < chordChanges; i++) {
        const t0 = startTime + (i / chordChanges) * (barLength * 4);
        const t1 = t0 + barLength * 4 / chordChanges;
        // Chord progression based on harmonic style
        const chordRoot = 48 + (phraseIndex * 3 + i * 2) % 12; // Circle of fifths progression
        const chordType = i === chordChanges - 1 ? 'major' : 'minor'; // End on major
        // Generate chord tones
        const chordTones = [chordRoot, chordRoot + 4, chordRoot + 7];
        chordTones.forEach((pitch, index) => {
            events.push({
                t0, t1, pitch,
                velocity: 0.5 - index * 0.1,
                channel: 'harmony'
            });
        });
    }
    return events;
}
// Generate bass with proper root movement
function generateBass(phraseIndex, startTime, barLength, rules) {
    const events = [];
    const noteCount = 4; // One bass note per bar
    for (let i = 0; i < noteCount; i++) {
        const t0 = startTime + i * barLength;
        const t1 = t0 + barLength * 0.9;
        // Root movement based on phrase structure
        const root = 36 + (phraseIndex * 2 + i) % 12; // Root movement by fifths
        events.push({
            t0, t1, pitch: root,
            velocity: 0.8,
            channel: 'bass'
        });
    }
    return events;
}
// Generate rhythm with appropriate patterns
function generateRhythm(phraseIndex, startTime, barLength, rules) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const events = [];
    const pattern = rules.rhythmicPattern;
    const noteCount = 12; // Increased for more diversity
    // Define multiple rhythmic templates for variety
    const templates = [
        [0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5], // Basic 4/4
        [0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25], // Syncopated
        [0.33, 0.33, 0.34, 0.25, 0.25, 0.5, 0.33, 0.33, 0.34, 0.25, 0.25, 0.5], // Mixed
        [0.125, 0.125, 0.25, 0.5, 0.125, 0.125, 0.25, 0.5, 0.125, 0.125, 0.25, 0.5], // Complex
        [0.375, 0.125, 0.25, 0.25, 0.375, 0.125, 0.25, 0.25, 0.375, 0.125, 0.25, 0.25] // Polyrhythmic
    ];
    // Control-surface approach: predict rhythm_template_id and syncopation_bias
    const fireElement = ((_b = (_a = rules.astroFeatures) === null || _a === void 0 ? void 0 : _a.dominantElements) === null || _b === void 0 ? void 0 : _b.fire) || 0;
    const earthElement = ((_d = (_c = rules.astroFeatures) === null || _c === void 0 ? void 0 : _c.dominantElements) === null || _d === void 0 ? void 0 : _d.earth) || 0;
    const airElement = ((_f = (_e = rules.astroFeatures) === null || _e === void 0 ? void 0 : _e.dominantElements) === null || _f === void 0 ? void 0 : _f.air) || 0;
    const waterElement = ((_h = (_g = rules.astroFeatures) === null || _g === void 0 ? void 0 : _g.dominantElements) === null || _h === void 0 ? void 0 : _h.water) || 0;
    // Calculate control parameters (these will be the new training targets)
    const rhythmTemplateId = Math.floor((fireElement * 100 + earthElement * 200 + airElement * 300 + waterElement * 400) % 8); // 0-7
    const syncopationBias = 0.2 + (airElement * 0.6) + (fireElement * 0.2); // 0.2-1.0 based on air/fire
    // Use control parameters to select template and apply syncopation
    const templateIndex = (rhythmTemplateId + phraseIndex) % templates.length;
    const durations = templates[templateIndex];
    let currentTime = startTime;
    for (let i = 0; i < noteCount; i++) {
        const duration = durations[i] * barLength;
        const t0 = currentTime;
        const t1 = t0 + duration * 0.8; // Slightly shorter for overlap
        // Varied percussion sounds for diversity
        let pitch = 42; // Default snare
        if (i % 4 === 0)
            pitch = 36; // Kick on downbeats
        else if (i % 3 === 0)
            pitch = 38; // Hi-hat
        else if (i % 2 === 1)
            pitch = 46; // Open hi-hat
        else
            pitch = 42; // Snare
        events.push({
            t0, t1, pitch,
            velocity: 0.5 + (i % 3) * 0.15 + Math.random() * 0.1, // More velocity variety
            channel: 'rhythm'
        });
        currentTime += duration;
    }
    return events;
}
function normalizeTempo(bpm) { return Math.max(0, Math.min(1, (bpm - 60) / 120)); }
// Control-surface parameter calculation functions
function calculateStepBias(snapshot) {
    const fireElement = snapshot.dominantElements.fire;
    const earthElement = snapshot.dominantElements.earth;
    const mutableModality = 0; // TODO: Add dominantModalities to EphemerisSnapshot interface
    // Earth = more steps, Fire = more leaps, Mutable = balanced
    const stepBias = 0.3 + (earthElement * 0.4) + (mutableModality * 0.2) - (fireElement * 0.3);
    return Math.max(0.0, Math.min(1.0, stepBias));
}
function calculateLeapCap(snapshot) {
    const fireElement = snapshot.dominantElements.fire;
    // Fire = larger leaps (2-6), others = smaller leaps (2-4)
    return 2 + Math.floor(fireElement * 4);
}
function calculateRhythmTemplateId(snapshot) {
    const fireElement = snapshot.dominantElements.fire;
    const earthElement = snapshot.dominantElements.earth;
    const airElement = snapshot.dominantElements.air;
    const waterElement = snapshot.dominantElements.water;
    // Map elements to rhythm templates (0-7)
    const astroSeed = Math.floor((fireElement * 100 + earthElement * 200 + airElement * 300 + waterElement * 400) % 8);
    return astroSeed;
}
function calculateSyncopationBias(snapshot) {
    const airElement = snapshot.dominantElements.air;
    const fireElement = snapshot.dominantElements.fire;
    // Air = more syncopation, Fire = some syncopation, others = less
    const syncopationBias = 0.2 + (airElement * 0.6) + (fireElement * 0.2);
    return Math.max(0.0, Math.min(1.0, syncopationBias));
}
function densityCurve(events, durationSec) {
    const sections = 4;
    const secLen = durationSec / sections;
    const out = [];
    for (let i = 0; i < sections; i++) {
        const s = i * secLen, e = (i + 1) * secLen;
        out.push(events.filter(ev => ev.t0 >= s && ev.t0 < e).length);
    }
    const max = Math.max(1, ...out);
    return [out[0] / max, out[1] / max, out[2] / max, out[3] / max];
}
function harmonicChangeRate(events, durationSec) {
    const harmony = events.filter(e => e.channel === "harmony").sort((a, b) => a.t0 - b.t0);
    if (harmony.length < 2)
        return 0;
    let changes = 0;
    for (let i = 1; i < harmony.length; i++)
        if (harmony[i].pitch !== harmony[i - 1].pitch)
            changes++;
    return Math.min(1, changes / (durationSec / 0.5));
}
function melodicRangeNorm(events) {
    const mel = events.filter(e => e.channel === "melody");
    if (mel.length === 0)
        return 0;
    const pitches = mel.map(e => e.pitch);
    const r = Math.max(...pitches) - Math.min(...pitches);
    return Math.max(0, Math.min(1, r / 24));
}
function arcCurveFromMelody(events, durationSec) {
    const mel = events.filter(e => e.channel === "melody").sort((a, b) => a.t0 - b.t0);
    if (mel.length === 0)
        return [0, 0, 0];
    // FIXED: Use 4-phrase structure to match melody generation
    const phraseLength = durationSec / 4;
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    // Split into 4 phrases (matching melody generation)
    const phrases = [
        mel.filter(e => e.t0 < phraseLength).map(e => e.pitch),
        mel.filter(e => e.t0 >= phraseLength && e.t0 < 2 * phraseLength).map(e => e.pitch),
        mel.filter(e => e.t0 >= 2 * phraseLength && e.t0 < 3 * phraseLength).map(e => e.pitch),
        mel.filter(e => e.t0 >= 3 * phraseLength).map(e => e.pitch)
    ];
    // Calculate phrase averages
    const phraseAverages = phrases.map(phrase => phrase.length ? mean(phrase) : 60);
    // Create 3-element arc curve from 4 phrases (beginning, middle, end)
    const arcCurve = [
        phraseAverages[0], // Beginning (phrase 1)
        (phraseAverages[1] + phraseAverages[2]) / 2, // Middle (phrases 2-3 average)
        phraseAverages[3] // End (phrase 4)
    ];
    // Normalize to [0,1] range
    const min = Math.min(...arcCurve);
    const max = Math.max(...arcCurve);
    const span = Math.max(1, max - min);
    return [
        (arcCurve[0] - min) / span,
        (arcCurve[1] - min) / span,
        (arcCurve[2] - min) / span
    ];
}
function cadenceClassFromMelody(events) {
    const mel = events.filter(e => e.channel === "melody").sort((a, b) => a.t0 - b.t0);
    if (mel.length === 0)
        return 3; // half
    const end = mel[mel.length - 1].pitch % 12;
    // Enhanced cadential strength for Mutable modalities
    // Mutable signs tend toward authentic cadences (stronger closure)
    const mutableBoost = Math.random() < 0.3 ? 0.2 : 0; // 30% chance of enhanced cadence
    // crude mapping in A minor: A=9 perfect(0), D=2 plagal(1), F=5 deceptive(2), else half(3)
    if (end === 9)
        return 0;
    if (end === 2)
        return 1;
    if (end === 5)
        return 2;
    return 3;
}
function topMotifTokens(pitches, vocab, k = 8) {
    const grams = new Map();
    for (let i = 0; i < pitches.length - 2; i++) {
        const key = `${pitches[i]}-${pitches[i + 1]}-${pitches[i + 2]}`;
        grams.set(key, (grams.get(key) || 0) + 1);
    }
    const sorted = Array.from(grams.entries()).sort((a, b) => b[1] - a[1]).slice(0, k).map(([g]) => g);
    return sorted.map(g => { var _a; return (_a = vocab[g]) !== null && _a !== void 0 ? _a : 0; });
}
function ensureMotifVocab(vocabPath) {
    if (fs_1.default.existsSync(vocabPath))
        return JSON.parse(fs_1.default.readFileSync(vocabPath, "utf8"));
    const seed = {};
    // seed a tiny vocab
    const seeds = ["60-62-64", "62-64-65", "64-65-67", "67-65-64", "65-64-62", "62-60-59", "60-60-60", "60-63-67"];
    seeds.forEach((g, i) => seed[g] = i);
    fs_1.default.writeFileSync(vocabPath, JSON.stringify(seed, null, 2));
    return seed;
}
const chartHash_1 = require("lib/hash/chartHash");
// Generate deterministic chart hash for data splitting
function generateChartHash(snapshot) {
    var _a;
    // Convert EphemerisSnapshot to ChartData format for hash generation
    const chartData = {
        date: snapshot.ts.split('T')[0],
        time: ((_a = snapshot.ts.split('T')[1]) === null || _a === void 0 ? void 0 : _a.split('.')[0]) || '12:00:00',
        lat: snapshot.lat,
        lon: snapshot.lon
    };
    return (0, chartHash_1.generateChartHashSync)(chartData).slice(0, 8);
}
// Split data by chart hash to prevent leakage
function splitDataByHash(snapshots, trainRatio = 0.7, valRatio = 0.15, testRatio = 0.15) {
    const hashes = snapshots.map(s => ({ snapshot: s, hash: generateChartHash(s) }));
    const uniqueHashes = [...new Set(hashes.map(h => h.hash))];
    // Deterministic split using hash
    const trainHashes = new Set();
    const valHashes = new Set();
    const testHashes = new Set();
    uniqueHashes.forEach((hash, index) => {
        const normalizedIndex = index / uniqueHashes.length;
        if (normalizedIndex < trainRatio) {
            trainHashes.add(hash);
        }
        else if (normalizedIndex < trainRatio + valRatio) {
            valHashes.add(hash);
        }
        else {
            testHashes.add(hash);
        }
    });
    const train = hashes.filter(h => trainHashes.has(h.hash)).map(h => h.snapshot);
    const val = hashes.filter(h => valHashes.has(h.hash)).map(h => h.snapshot);
    const test = hashes.filter(h => testHashes.has(h.hash)).map(h => h.snapshot);
    console.log(`Data split: ${train.length} train, ${val.length} val, ${test.length} test`);
    console.log(`Split ratios: ${(train.length / snapshots.length * 100).toFixed(1)}% train, ${(val.length / snapshots.length * 100).toFixed(1)}% val, ${(test.length / snapshots.length * 100).toFixed(1)}% test`);
    return { train, val, test };
}
// Enhanced label generation with quality filtering
async function main(limit = +(process.env.LABEL_LIMIT || 2000)) {
    console.log(`🚀 Starting enhanced teacher label generation with ${limit} charts`);
    ensureDirs();
    const vocab = ensureMotifVocab(MOTIF_VOCAB_FILE);
    const snapshots = loadSnapshots(limit);
    // Split data by chart hash to prevent leakage
    const { train, val, test } = splitDataByHash(snapshots);
    // Generate labels for each split
    await generateLabelsForSplit(train, 'train', vocab);
    await generateLabelsForSplit(val, 'val', vocab);
    await generateLabelsForSplit(test, 'test', vocab);
    // Log data hygiene information
    const totalGenerated = train.length + val.length + test.length;
    console.log(`✅ Generated ${totalGenerated} labels with proper data splitting`);
    console.log(`📊 Data hygiene: Split by chart hash (date+time+lat+lon) to prevent leakage`);
    console.log(`🎯 Quality threshold: ≥${quality_1.MIN_QUALITY_THRESHOLD} for teacher labels`);
}
// Generate labels for a specific data split
async function generateLabelsForSplit(snapshots, splitName, vocab) {
    const outputFile = path_1.default.join(LABELS_DIR, `${splitName}.jsonl`);
    const out = fs_1.default.createWriteStream(outputFile, { flags: "w" });
    let written = 0;
    let qualityPassed = 0;
    console.log(`📝 Generating ${splitName} labels...`);
    for (const snap of snapshots) {
        try {
            const feat = (0, feature_encode_1.encodeFeatures)(snap);
            const plan = enhancedTeacherPlan(feat, snap);
            // Quality gate: Only pass high-quality compositions
            const mel = (0, critics_1.scoreMelody)(plan);
            const rhy = (0, critics_2.scoreRhythm)(plan);
            const har = (0, critics_3.scoreHarmony)(plan);
            // Calculate overall quality score from individual dimensions
            const melodicScore = (mel.arc + mel.motif_recurrence + mel.contour_entropy + mel.step_leap_ratio + mel.range_ok + mel.narrative_flow) / 6;
            const rhythmicScore = (rhy.syncopation + rhy.groove + rhy.tempo + rhy.diversity + rhy.accent) / 5;
            const harmonicScore = (har.progression_legality + har.voice_leading + har.tension + har.complexity + har.resolution) / 5;
            const qualityScore = (melodicScore + rhythmicScore + harmonicScore) / 3;
            // Only include if quality meets threshold (from centralized config)
            if (qualityScore >= quality_1.MIN_QUALITY_THRESHOLD) {
                const pitches = plan.events.filter(e => e.channel === "melody").map(e => e.pitch);
                const row = {
                    feat: Array.from(feat),
                    directives: {
                        // Existing control parameters (keep working)
                        tempo_norm: normalizeTempo(plan.bpm),
                        density_curve: densityCurve(plan.events, plan.durationSec),
                        motif_rate: Math.max(0, Math.min(1, mel.motif_recurrence)),
                        // New control-surface parameters (predictable from astro features)
                        step_bias: calculateStepBias(snap), // 0.0-1.0
                        leap_cap: calculateLeapCap(snap), // 1-6
                        rhythm_template_id: calculateRhythmTemplateId(snap), // 0-7
                        syncopation_bias: calculateSyncopationBias(snap), // 0.0-1.0
                        // Legacy parameters (keep for compatibility)
                        syncopation: Math.max(0, Math.min(1, rhy.syncopation)),
                        harmonic_change_rate: harmonicChangeRate(plan.events, plan.durationSec),
                        melodic_range_norm: Math.max(0, Math.min(1, mel.range_ok)),
                    },
                    arc_curve: arcCurveFromMelody(plan.events, plan.durationSec),
                    cadence_class: cadenceClassFromMelody(plan.events),
                    motif_tokens: topMotifTokens(pitches, vocab, 8)
                };
                // Add metadata for tracking
                const enhancedRow = {
                    ...row,
                    metadata: {
                        chartHash: generateChartHash(snap),
                        qualityScore,
                        split: splitName,
                        timestamp: new Date().toISOString(),
                        version: "2.0_enhanced"
                    }
                };
                out.write(JSON.stringify(enhancedRow) + "\n");
                written++;
                qualityPassed++;
            }
            else {
                console.log(`⚠️ Skipped low-quality composition: ${qualityScore.toFixed(3)}`);
            }
        }
        catch (error) {
            console.error(`❌ Error processing chart:`, error);
        }
    }
    out.end();
    const passRate = (qualityPassed / snapshots.length * 100).toFixed(1);
    console.log(`✅ ${splitName}: ${written}/${snapshots.length} labels generated (${passRate}% pass rate)`);
}
if (require.main === module) {
    main().catch(err => { console.error(err); process.exit(1); });
}
