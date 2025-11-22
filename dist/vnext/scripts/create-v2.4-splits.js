#!/usr/bin/env node
"use strict";
/**
 * Create v2.4 data splits with hash-by-chart to prevent leakage
 * Phase 1 of D-series v2.4 engine upgrade
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
exports.createV24Splits = createV24Splits;
exports.createHashBasedSplits = createHashBasedSplits;
exports.generateClassHistogram = generateClassHistogram;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const chartHash_1 = require("../../lib/hash/chartHash");
function generateChartHash(chartData) {
    return (0, chartHash_1.generateChartHashSync)(chartData);
}
function createHashBasedSplits(samples) {
    // Group by chart hash to prevent leakage
    const hashGroups = new Map();
    for (const sample of samples) {
        const hash = sample.chart_hash;
        if (!hashGroups.has(hash)) {
            hashGroups.set(hash, []);
        }
        hashGroups.get(hash).push(sample);
    }
    // Sort hashes deterministically
    const sortedHashes = Array.from(hashGroups.keys()).sort();
    // Split by hash (70/15/15)
    const totalHashes = sortedHashes.length;
    const trainEnd = Math.floor(totalHashes * 0.7);
    const valEnd = Math.floor(totalHashes * 0.85);
    const trainHashes = sortedHashes.slice(0, trainEnd);
    const valHashes = sortedHashes.slice(trainEnd, valEnd);
    const testHashes = sortedHashes.slice(valEnd);
    // Flatten samples back
    const train = [];
    const val = [];
    const test = [];
    for (const hash of trainHashes) {
        train.push(...hashGroups.get(hash));
    }
    for (const hash of valHashes) {
        val.push(...hashGroups.get(hash));
    }
    for (const hash of testHashes) {
        test.push(...hashGroups.get(hash));
    }
    return { train, val, test };
}
function generateClassHistogram(samples) {
    const histogram = {
        melodic: {},
        rhythm: {},
        polyphony: {}
    };
    for (const sample of samples) {
        const mel = sample.labels.melodic.toString();
        const rhy = sample.labels.rhythm.toString();
        const poly = sample.labels.polyphony.toString();
        histogram.melodic[mel] = (histogram.melodic[mel] || 0) + 1;
        histogram.rhythm[rhy] = (histogram.rhythm[rhy] || 0) + 1;
        histogram.polyphony[poly] = (histogram.polyphony[poly] || 0) + 1;
    }
    return histogram;
}
async function createV24Splits() {
    console.log('🚀 Creating v2.4 data splits...');
    // Load teacher labels (assuming they exist from previous training)
    const teacherLabelsPath = 'datasets/labels/train.jsonl';
    if (!fs.existsSync(teacherLabelsPath)) {
        console.error('❌ Teacher labels not found at:', teacherLabelsPath);
        process.exit(1);
    }
    // Read and parse labeled samples
    const samples = [];
    const content = fs.readFileSync(teacherLabelsPath, 'utf8');
    const lines = content.trim().split('\n');
    for (const line of lines) {
        if (line.trim()) {
            const sample = JSON.parse(line);
            // Ensure chart_hash exists
            if (!sample.chart_hash) {
                sample.chart_hash = generateChartHash(sample.chart_data);
            }
            samples.push(sample);
        }
    }
    console.log(`📊 Loaded ${samples.length} labeled samples`);
    // Create hash-based splits
    const { train, val, test } = createHashBasedSplits(samples);
    console.log(`📈 Split sizes: train=${train.length}, val=${val.length}, test=${test.length}`);
    // Create output directories
    const splitsDir = 'splits/v2.4';
    fs.mkdirSync(splitsDir, { recursive: true });
    // Write split files
    fs.writeFileSync(path.join(splitsDir, 'train.jsonl'), train.map(s => JSON.stringify(s)).join('\n'));
    fs.writeFileSync(path.join(splitsDir, 'val.jsonl'), val.map(s => JSON.stringify(s)).join('\n'));
    fs.writeFileSync(path.join(splitsDir, 'test.jsonl'), test.map(s => JSON.stringify(s)).join('\n'));
    // Generate metadata
    const metadata = {
        counts: {
            train: train.length,
            val: val.length,
            test: test.length,
            total: samples.length
        },
        class_histogram: {
            melodic: generateClassHistogram(samples).melodic,
            rhythm: generateClassHistogram(samples).rhythm,
            polyphony: generateClassHistogram(samples).polyphony
        },
        hash_salt: crypto.randomBytes(16).toString('hex'),
        created_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(splitsDir, 'meta.json'), JSON.stringify(metadata, null, 2));
    // Generate checksums
    const hashesDir = 'hashes';
    fs.mkdirSync(hashesDir, { recursive: true });
    const trainHash = crypto.createHash('sha256')
        .update(fs.readFileSync(path.join(splitsDir, 'train.jsonl')))
        .digest('hex');
    const valHash = crypto.createHash('sha256')
        .update(fs.readFileSync(path.join(splitsDir, 'val.jsonl')))
        .digest('hex');
    const testHash = crypto.createHash('sha256')
        .update(fs.readFileSync(path.join(splitsDir, 'test.jsonl')))
        .digest('hex');
    const metaHash = crypto.createHash('sha256')
        .update(fs.readFileSync(path.join(splitsDir, 'meta.json')))
        .digest('hex');
    const checksums = {
        train: trainHash,
        val: valHash,
        test: testHash,
        meta: metaHash,
        created_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(hashesDir, 'splits.meta.hash'), JSON.stringify(checksums, null, 2));
    console.log('✅ v2.4 splits created successfully');
    console.log(`📁 Output: ${splitsDir}/`);
    console.log(`🔐 Checksums: ${hashesDir}/splits.meta.hash`);
}
// Run if called directly
if (require.main === module) {
    createV24Splits().catch(console.error);
}
