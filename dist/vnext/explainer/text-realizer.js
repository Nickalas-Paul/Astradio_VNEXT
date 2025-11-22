"use strict";
/**
 * Text Realizer v1.1
 * Converts explainer atoms into formatted text using templated approaches (Unified Spec v1.1)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextRealizer = void 0;
const overlay_delta_1 = require("./overlay-delta");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TextRealizer {
    constructor(mappingTablePath) {
        this.seed = "";
        const builtPath = path.resolve(__dirname, 'mapping-tables-v1.json');
        const sourcePath = path.resolve(__dirname, '../../../vnext/explainer/mapping-tables-v1.json');
        const chosenPath = mappingTablePath || (fs.existsSync(builtPath) ? builtPath : sourcePath);
        this.mappingTable = JSON.parse(fs.readFileSync(chosenPath, 'utf8'));
    }
    /**
     * Generate complete text explainer from atoms (Section C)
     */
    generateText(atoms, gateReport, seed) {
        var _a;
        this.seed = seed;
        const gatePassed = ((_a = gateReport.calibrated) === null || _a === void 0 ? void 0 : _a.overall) || false;
        const templateId = gatePassed ? this.generateTemplateId() : "v1.fail.00";
        // Apply synonym variations to all atoms
        const variedAtoms = this.applySynonymVariations(atoms);
        return {
            short: this.generateShort(variedAtoms, gatePassed, gateReport),
            long: this.generateLong(variedAtoms, gatePassed, gateReport),
            bullets: this.generateBullets(variedAtoms, gatePassed, gateReport),
            template_id: templateId
        };
    }
    /**
     * Generate short form text (Section C)
     */
    generateShort(atoms, gatePassed, gateReport) {
        if (!gatePassed) {
            return ""; // Empty string for fail-closed short text
        }
        // Pattern: [astro_color] [movement] [arc_desc]
        let short = `${atoms.astro_color} ${atoms.movement} ${atoms.arc_desc}`;
        // Optional: add rhythm_feel if space (max 120 chars)
        if (short.length < 80) {
            short += ` ${atoms.rhythm_feel}`;
        }
        // Ensure length constraint
        const maxLength = this.mappingTable.template_structures.short.max_length;
        if (short.length > maxLength) {
            short = this.truncateText(short, maxLength);
        }
        return short;
    }
    /**
     * Generate long form text (Section C)
     */
    generateLong(atoms, gatePassed, gateReport) {
        if (!gatePassed) {
            return this.generateFailHint(gateReport);
        }
        const sentences = [];
        // S1: [astro_color]
        sentences.push(atoms.astro_color);
        // S2: [movement]
        sentences.push(atoms.movement);
        // S3: [rhythm_feel] + tempo fragment
        const tempoFragment = this.generateTempoFragment();
        sentences.push(`${atoms.rhythm_feel} ${tempoFragment}`);
        // S4: [density_desc]
        sentences.push(atoms.density_desc);
        // S5: [motif_desc]
        sentences.push(atoms.motif_desc);
        let long = sentences.join(' ');
        // Ensure length constraint
        const maxLength = this.mappingTable.template_structures.long.max_length;
        if (long.length > maxLength) {
            long = this.truncateText(long, maxLength);
        }
        return long;
    }
    /**
     * Generate bullet points (Section C)
     */
    generateBullets(atoms, gatePassed, gateReport) {
        if (!gatePassed) {
            return [this.generateFailHint(gateReport)];
        }
        const bullets = [];
        // Core musical elements
        bullets.push(`• ${atoms.movement}`);
        bullets.push(`• ${atoms.arc_desc}`);
        bullets.push(`• ${atoms.rhythm_feel}`);
        bullets.push(`• ${atoms.density_desc}`);
        bullets.push(`• ${atoms.motif_desc}`);
        // Gate hints when applicable (would be added by calling code)
        return bullets.slice(0, 6); // Max 6 items
    }
    /**
     * Generate overlay text with delta descriptions (Section D)
     */
    generateOverlayText(atoms, deltaControls, seed, gatePassed = true) {
        const baseText = this.generateText(atoms, {}, seed);
        if (!gatePassed) {
            return baseText;
        }
        // Build delta descriptions
        const deltaDescriptions = this.buildDeltaDescriptions(deltaControls);
        if (deltaDescriptions.length === 0) {
            return baseText;
        }
        const deltaText = deltaDescriptions.join(', ');
        const overlayPrefix = `Compared to your natal chart, today's transits add ${deltaText}.`;
        return {
            short: `${overlayPrefix} ${baseText.short}`,
            long: `${overlayPrefix} ${baseText.long}`,
            bullets: [
                `• ${deltaText} compared to natal`,
                ...baseText.bullets
            ],
            template_id: baseText.template_id
        };
    }
    /**
     * Generate sandbox text with actionable hints (Section D)
     */
    generateSandboxText(atoms, failedGates, seed, gatePassed = true) {
        const baseText = this.generateText(atoms, {}, seed);
        if (gatePassed) {
            return baseText;
        }
        // Add sandbox-specific suggestions
        const suggestions = this.generateSandboxSuggestions(failedGates);
        return {
            short: baseText.short,
            long: baseText.long,
            bullets: [
                ...baseText.bullets,
                "• Sandbox suggestions:",
                ...suggestions.map(s => `  - ${s}`)
            ],
            template_id: baseText.template_id
        };
    }
    /**
     * Generate tempo fragment for long text
     */
    generateTempoFragment() {
        // This would be determined from controls.tempo_norm
        // For now, return a generic tempo description
        const tempoDescriptions = this.mappingTable.tempo_descriptions || { brisk: { description: 'at a brisk pace.' }, measured: { description: 'at a measured pace.' }, slow: { description: 'at a slow pace.' } };
        // Mock tempo value - would come from actual controls
        const tempoNorm = 0.6; // Example value
        if (tempoNorm > 0.7) {
            return tempoDescriptions.brisk.description;
        }
        else if (tempoNorm >= 0.4 && tempoNorm <= 0.7) {
            return tempoDescriptions.measured.description;
        }
        else {
            return tempoDescriptions.slow.description;
        }
    }
    /**
     * Build delta descriptions for overlay mode (Unified Spec v1.1)
     */
    buildDeltaDescriptions(deltaControls) {
        const descriptions = [];
        // Only add descriptions when Δ exceeds spec thresholds using centralized guard
        if (deltaControls.step_bias && this.shouldContrast('step_bias', Math.abs(deltaControls.step_bias))) {
            if (deltaControls.step_bias > 0) {
                descriptions.push('more stepwise than natal');
            }
            else {
                descriptions.push('more leaping than natal');
            }
        }
        if (deltaControls.leap_cap && Math.abs(deltaControls.leap_cap) >= 1) {
            if (deltaControls.leap_cap > 0) {
                descriptions.push('wider leaps than natal');
            }
            else {
                descriptions.push('narrower leaps than natal');
            }
        }
        if (deltaControls.syncopation_bias && this.shouldContrast('syncopation_bias', Math.abs(deltaControls.syncopation_bias))) {
            if (deltaControls.syncopation_bias > 0) {
                descriptions.push('more syncopated feel than natal');
            }
            else {
                descriptions.push('less syncopated feel than natal');
            }
        }
        if (deltaControls.density_level && this.shouldContrast('density_level', Math.abs(deltaControls.density_level))) {
            if (deltaControls.density_level > 0) {
                descriptions.push('richer texture than natal');
            }
            else {
                descriptions.push('sparser texture than natal');
            }
        }
        return descriptions;
    }
    /**
     * Centralized threshold check for overlay contrast (Unified Spec v1.1)
     */
    shouldContrast(kind, deltaAbs) {
        return (0, overlay_delta_1.shouldContrast)(kind, deltaAbs);
    }
    /**
     * Generate sandbox suggestions for failed gates
     */
    generateSandboxSuggestions(failedGates) {
        var _a;
        const suggestions = [];
        for (const gate of failedGates) {
            const hint = (_a = this.mappingTable.sandbox_hints) === null || _a === void 0 ? void 0 : _a[gate];
            if (hint) {
                suggestions.push(hint.hint);
            }
        }
        return suggestions;
    }
    /**
     * Generate fail hint when gates don't pass (Unified Spec v1.1)
     */
    generateFailHint(gateReport) {
        const failedGates = [];
        if (gateReport.strict && !gateReport.strict.melody_arc) {
            failedGates.push("arc");
        }
        if (gateReport.strict && !gateReport.strict.melody_step_leap) {
            failedGates.push("step_bias +0.1 or leap_cap → 3");
        }
        if (gateReport.strict && !gateReport.strict.melody_narrative) {
            failedGates.push("narrative");
        }
        if (gateReport.strict && !gateReport.strict.rhythm_diversity) {
            failedGates.push("rhythm_template_id or syncopation");
        }
        if (failedGates.length === 0) {
            return "Adjust control parameters to meet calibrated gate thresholds.";
        }
        // Only actionable knob hints, no adjectives
        return `Adjust: ${failedGates.join(', ')}.`;
    }
    /**
     * Generate template ID for variation
     */
    generateTemplateId() {
        const templateCount = 4;
        const templateIndex = this.hashString(this.seed + 'template') % templateCount;
        return `v1.short.${templateIndex.toString().padStart(2, '0')}`;
    }
    /**
     * Apply synonym variations based on seed
     */
    applySynonymVariations(atoms) {
        const synonymSets = this.mappingTable.synonym_variations.seed_based.sets;
        const setIndex = this.hashString(this.seed) % synonymSets.length;
        const synonymSet = synonymSets[setIndex];
        const applyVariations = (text) => {
            let variedText = text;
            Object.entries(synonymSet).forEach(([original, synonym]) => {
                const regex = new RegExp(original, 'gi');
                variedText = variedText.replace(regex, synonym);
            });
            return variedText;
        };
        return {
            arc_desc: applyVariations(atoms.arc_desc),
            movement: applyVariations(atoms.movement),
            rhythm_feel: applyVariations(atoms.rhythm_feel),
            density_desc: applyVariations(atoms.density_desc),
            motif_desc: applyVariations(atoms.motif_desc),
            astro_color: applyVariations(atoms.astro_color)
        };
    }
    /**
     * Truncate text to fit length constraint
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        // Find last complete sentence before maxLength
        const truncated = text.substring(0, maxLength);
        const lastSentenceEnd = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));
        if (lastSentenceEnd > maxLength * 0.7) {
            return truncated.substring(0, lastSentenceEnd + 1);
        }
        // Fallback: truncate at word boundary
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.8) {
            return truncated.substring(0, lastSpace) + '...';
        }
        return truncated + '...';
    }
    /**
     * Simple hash function for deterministic selection
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
exports.TextRealizer = TextRealizer;
