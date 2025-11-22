"use strict";
/**
 * Explainer Atoms Generator v1.1
 * Deterministic generation of semantic facts from control-surface payload (Unified Spec v1.1)
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
exports.AtomsGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AtomsGenerator {
    constructor(mappingTablePath) {
        this.seed = "";
        const builtPath = path.resolve(__dirname, 'mapping-tables-v1.json');
        const sourcePath = path.resolve(__dirname, '../../../vnext/explainer/mapping-tables-v1.json');
        const chosenPath = mappingTablePath || (fs.existsSync(builtPath) ? builtPath : sourcePath);
        this.mappingTable = JSON.parse(fs.readFileSync(chosenPath, 'utf8'));
    }
    /**
     * Generate explainer atoms from control-surface payload and astro summary
     */
    generateAtoms(payload, astro) {
        this.seed = payload.hash;
        // Create default astro summary if not provided
        const astroSummary = astro || {
            elements: {
                fire: payload.element_dominance === 'fire' ? 0.6 : 0.1,
                earth: payload.element_dominance === 'earth' ? 0.6 : 0.1,
                air: payload.element_dominance === 'air' ? 0.6 : 0.1,
                water: payload.element_dominance === 'water' ? 0.6 : 0.1
            },
            dominant_planets: [],
            modality: {
                cardinal: payload.modality === 'cardinal' ? 0.6 : 0.1,
                fixed: payload.modality === 'fixed' ? 0.6 : 0.1,
                mutable: payload.modality === 'mutable' ? 0.6 : 0.1
            },
            ts: new Date().toISOString()
        };
        return {
            arc_desc: this.generateArcDescription(payload.arc_shape, astroSummary.elements),
            movement: this.generateMovementDescription(payload.step_bias, payload.leap_cap, astroSummary.dominant_planets),
            rhythm_feel: this.generateRhythmFeeling(payload.rhythm_template_id, payload.syncopation_bias, astroSummary.dominant_planets),
            density_desc: this.generateDensityDescription(payload.density_level, astroSummary.dominant_planets),
            motif_desc: this.generateMotifDescription(payload.motif_rate),
            astro_color: this.generateAstroColor(astroSummary.elements, astroSummary.dominant_planets)
        };
    }
    /**
     * Generate arc description from arc_shape + element tint (Section B1)
     */
    generateArcDescription(arcShape, elements) {
        // Shape detection based on arc_shape value (Unified Spec v1.1)
        let shapeType;
        if (arcShape >= 0.6) {
            shapeType = 'rise_peak_release';
        }
        else if (arcShape >= 0.4 && arcShape < 0.6) {
            shapeType = 'gentle_wave';
        }
        else if (arcShape >= 0.2 && arcShape < 0.4) {
            shapeType = 'plateau_hold';
        }
        else {
            shapeType = 'mixed_rise_release';
        }
        // Element tint (add phrase)
        let elementTint = this.getElementTint(elements);
        // Select template by seed
        const templates = this.mappingTable.arc_descriptions[shapeType].templates || this.mappingTable.arc_descriptions[shapeType].phrases;
        const template = this.selectBySeed(templates, 'arc');
        return template.replace('{tint}', elementTint);
    }
    /**
     * Generate movement description from step_bias, leap_cap, planet tint (Section B2)
     */
    generateMovementDescription(stepBias, leapCap, dominantPlanets) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // Primary bucket by step_bias (exact cutoffs per Unified Spec v1.1)
        let primary = this.mappingTable.movement_descriptions.balanced.primary || ((_a = this.mappingTable.movement_descriptions.balanced.phrases) === null || _a === void 0 ? void 0 : _a[0]) || "balanced movement.";
        if (stepBias >= 0.70) {
            primary = this.mappingTable.movement_descriptions.stepwise_heavy.primary || ((_b = this.mappingTable.movement_descriptions.stepwise_heavy.phrases) === null || _b === void 0 ? void 0 : _b[0]) || primary;
        }
        else if (stepBias >= 0.40 && stepBias <= 0.69) {
            primary = this.mappingTable.movement_descriptions.balanced.primary || ((_c = this.mappingTable.movement_descriptions.balanced.phrases) === null || _c === void 0 ? void 0 : _c[0]) || primary;
        }
        else {
            primary = this.mappingTable.movement_descriptions.leaping_lead.primary || ((_d = this.mappingTable.movement_descriptions.leaping_lead.phrases) === null || _d === void 0 ? void 0 : _d[0]) || primary;
        }
        // Modifier by leap_cap (exact cutoffs)
        let modifier = '';
        if (leapCap >= 5) {
            modifier = ((_f = (_e = this.mappingTable.leap_modifiers) === null || _e === void 0 ? void 0 : _e.wide_reaches) === null || _f === void 0 ? void 0 : _f.modifier) || '';
        }
        else if (leapCap <= 2) {
            modifier = ((_h = (_g = this.mappingTable.leap_modifiers) === null || _g === void 0 ? void 0 : _g.close_careful) === null || _h === void 0 ? void 0 : _h.modifier) || '';
        }
        // Planet tint (if present in dominant_planets)
        let planetTint = '';
        for (const planet of dominantPlanets) {
            const planetPhrase = (_j = this.mappingTable.planet_tints) === null || _j === void 0 ? void 0 : _j[planet];
            if (planetPhrase) {
                planetTint = ` — ${planetPhrase}`;
                break; // Use first matching planet
            }
        }
        return `${primary}${modifier}${planetTint}.`;
    }
    /**
     * Generate rhythm feeling from rhythm_template_id, syncopation_bias, planet tint (Section B3)
     */
    generateRhythmFeeling(templateId, syncopationBias, dominantPlanets) {
        // Template class
        let rhythmClass;
        if (templateId >= 0 && templateId <= 2) {
            rhythmClass = this.mappingTable.rhythm_classes.simple_even.class;
        }
        else if (templateId >= 3 && templateId <= 4) {
            rhythmClass = this.mappingTable.rhythm_classes.lightly_shifting.class;
        }
        else if (templateId >= 5 && templateId <= 6) {
            rhythmClass = this.mappingTable.rhythm_classes.strong_accented.class;
        }
        else {
            rhythmClass = this.mappingTable.rhythm_classes.fluid_open.class;
        }
        // Syncopation (exact cutoffs per Unified Spec v1.1)
        let syncopation;
        if (syncopationBias >= 0.60) {
            syncopation = this.mappingTable.syncopation_descriptions.pronounced.description;
        }
        else if (syncopationBias >= 0.30 && syncopationBias <= 0.59) {
            syncopation = this.mappingTable.syncopation_descriptions.subtle.description;
        }
        else {
            syncopation = this.mappingTable.syncopation_descriptions.straight.description;
        }
        return `${rhythmClass}, ${syncopation}.`;
    }
    /**
     * Generate density description from density_level, stellium check (Section B4)
     */
    generateDensityDescription(densityLevel, dominantPlanets) {
        var _a;
        let baseDescription = this.mappingTable.density_descriptions.balanced.description || 'balanced texture.';
        if (densityLevel >= 0.0 && densityLevel <= 0.3) {
            baseDescription = this.mappingTable.density_descriptions.sparse.description || baseDescription;
        }
        else if (densityLevel >= 0.4 && densityLevel <= 0.6) {
            baseDescription = this.mappingTable.density_descriptions.balanced.description || baseDescription;
        }
        else {
            baseDescription = this.mappingTable.density_descriptions.dense.description || baseDescription;
        }
        // Stellium check (≥3 planets clustered)
        const stelliumSuffix = dominantPlanets.length >= 3 ?
            (((_a = this.mappingTable.density_descriptions.stellium_suffix) === null || _a === void 0 ? void 0 : _a.suffix) || '') : '';
        return baseDescription + stelliumSuffix;
    }
    /**
     * Generate motif description from motif_rate (Section B6)
     */
    generateMotifDescription(motifRate) {
        if (motifRate > 0.7) {
            return this.mappingTable.motif_descriptions.frequent.description || 'frequent motifs.';
        }
        else if (motifRate >= 0.4 && motifRate <= 0.7) {
            return this.mappingTable.motif_descriptions.moderate.description || 'moderate motifs.';
        }
        else {
            return this.mappingTable.motif_descriptions.sparse.description || 'sparse motifs.';
        }
    }
    /**
     * Generate astro color from elements and dominant planets (Section B7)
     */
    generateAstroColor(elements, dominantPlanets) {
        // Find top element
        let topElement = '';
        let maxElementValue = 0;
        for (const [element, value] of Object.entries(elements)) {
            if (value > maxElementValue) {
                maxElementValue = value;
                topElement = element;
            }
        }
        const elementAdj = this.mappingTable.astro_colors.element_adjectives[topElement] || 'balanced';
        // Find first matching planet adjective
        let planetAdj = '';
        for (const planet of dominantPlanets) {
            const adj = this.mappingTable.astro_colors.planet_adjectives[planet];
            if (adj) {
                planetAdj = adj;
                break;
            }
        }
        if (!planetAdj) {
            planetAdj = 'balanced';
        }
        return `Tone: ${elementAdj}, ${planetAdj}.`;
    }
    /**
     * Get element tint phrase
     */
    getElementTint(elements) {
        for (const [element, value] of Object.entries(elements)) {
            if (value > 0.4) {
                return this.mappingTable.element_tints[element].phrase;
            }
        }
        return this.mappingTable.element_tints.none.phrase;
    }
    /**
     * Select by seed for deterministic variation
     */
    selectBySeed(options, context) {
        if (options.length === 0)
            return `default ${context}`;
        if (options.length === 1)
            return options[0];
        const hashValue = this.hashString(this.seed + context);
        const index = hashValue % options.length;
        return options[index];
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
exports.AtomsGenerator = AtomsGenerator;
