"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetry = exports.Telemetry = exports.LOG_DIR = void 0;
exports.ensureLogDir = ensureLogDir;
exports.logAudit = logAudit;
// vnext/logger.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DEFAULT_LOG_DIR = "/tmp/astradio-logs";
exports.LOG_DIR = process.env.LOG_DIR && process.env.LOG_DIR.trim().length > 0
    ? process.env.LOG_DIR
    : DEFAULT_LOG_DIR;
const LOG_FILE = path_1.default.join(exports.LOG_DIR, 'vnext-audit.jsonl');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 3;
// Ensure log directory exists on startup (non-fatal)
function ensureLogDir() {
    try {
        if (!fs_1.default.existsSync(exports.LOG_DIR)) {
            fs_1.default.mkdirSync(exports.LOG_DIR, { recursive: true });
        }
    }
    catch (err) {
        // Do not crash the app if logging cannot init
        console.warn("Logger disabled, cannot create log dir", exports.LOG_DIR, err);
    }
}
// Log rollover functionality (non-fatal)
function rolloverLogIfNeeded() {
    try {
        if (!fs_1.default.existsSync(LOG_FILE))
            return;
        const stats = fs_1.default.statSync(LOG_FILE);
        if (stats.size < MAX_LOG_SIZE)
            return;
        // Rotate existing logs
        for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
            const oldFile = `${LOG_FILE}.${i}`;
            const newFile = `${LOG_FILE}.${i + 1}`;
            if (fs_1.default.existsSync(oldFile)) {
                if (i === MAX_LOG_FILES - 1) {
                    fs_1.default.unlinkSync(oldFile); // Delete oldest
                }
                else {
                    fs_1.default.renameSync(oldFile, newFile);
                }
            }
        }
        // Move current log to .1
        fs_1.default.renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
    catch (err) {
        // Silently fail rollover, don't crash
        console.warn('Log rollover failed:', err);
    }
}
// Initialize log directory
ensureLogDir();
function logAudit(entry) {
    const timestamp = new Date().toISOString();
    const logLine = JSON.stringify({ ts: timestamp, ...entry }) + '\n';
    try {
        rolloverLogIfNeeded();
        fs_1.default.appendFileSync(LOG_FILE, logLine);
    }
    catch (error) {
        console.warn('Failed to write audit log:', error);
    }
}
// Enhanced telemetry system (preserved from audition/)
class Telemetry {
    constructor() {
        this.featureStats = null;
        this.modelOutputStats = null;
    }
    logFeatureDiversity(features, chartIndex) {
        if (!this.featureStats) {
            this.featureStats = { min: [...features], max: [...features], sum: [...features], count: 1 };
        }
        else {
            features.forEach((val, i) => {
                this.featureStats.min[i] = Math.min(this.featureStats.min[i], val);
                this.featureStats.max[i] = Math.max(this.featureStats.max[i], val);
                this.featureStats.sum[i] += val;
            });
            this.featureStats.count++;
        }
        // Log summary every 10 charts
        if (chartIndex % 10 === 0 && this.featureStats) {
            const mean = this.featureStats.sum.map(s => s / this.featureStats.count);
            const variance = features.map((val, i) => {
                const meanVal = mean[i];
                return Math.pow(val - meanVal, 2);
            });
            const highVarianceFeatures = variance.filter(v => v > 0.01).length;
            const totalFeatures = features.length;
            console.log(`[vNext] Feature diversity: ${highVarianceFeatures}/${totalFeatures} features with variance > 0.01 (${(highVarianceFeatures / totalFeatures * 100).toFixed(1)}%)`);
            if (highVarianceFeatures < totalFeatures * 0.7) {
                console.warn(`[vNext] LOW FEATURE DIVERSITY: Only ${highVarianceFeatures}/${totalFeatures} features vary significantly`);
            }
        }
    }
    logModelOutputDiversity(rawVector, chartIndex) {
        if (!this.modelOutputStats) {
            this.modelOutputStats = { min: [...rawVector], max: [...rawVector], sum: [...rawVector], count: 1 };
        }
        else {
            rawVector.forEach((val, i) => {
                this.modelOutputStats.min[i] = Math.min(this.modelOutputStats.min[i], val);
                this.modelOutputStats.max[i] = Math.max(this.modelOutputStats.max[i], val);
                this.modelOutputStats.sum[i] += val;
            });
            this.modelOutputStats.count++;
        }
        // Log summary every 10 charts
        if (chartIndex % 10 === 0 && this.modelOutputStats) {
            const mean = this.modelOutputStats.sum.map(s => s / this.modelOutputStats.count);
            const variance = rawVector.map((val, i) => {
                const meanVal = mean[i];
                return Math.pow(val - meanVal, 2);
            });
            const highVarianceDims = variance.filter(v => v > 0.05).length;
            const totalDims = rawVector.length;
            console.log(`[vNext] Model output diversity: ${highVarianceDims}/${totalDims} dimensions with variance > 0.05 (${(highVarianceDims / totalDims * 100).toFixed(1)}%)`);
            if (highVarianceDims < 4) {
                console.warn(`[vNext] LOW MODEL DIVERSITY: Only ${highVarianceDims}/${totalDims} dimensions vary significantly`);
            }
        }
    }
    logQualityResults(results) {
        const passedCount = results.filter(r => r.passed).length;
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        console.log(`[vNext] Quality results: ${passedCount}/${results.length} passed, avg score: ${avgScore.toFixed(2)}`);
    }
    calculateVariance(rawVectors) {
        if (rawVectors.length === 0)
            return {};
        const dims = ['tempo', 'brightness', 'density', 'arc', 'motif', 'cadence'];
        const variance = {};
        dims.forEach((dim, i) => {
            const values = rawVectors.map(v => v[i] || 0);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const varianceVal = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            variance[dim] = varianceVal;
        });
        return variance;
    }
}
exports.Telemetry = Telemetry;
// Global telemetry instance
exports.telemetry = new Telemetry();
