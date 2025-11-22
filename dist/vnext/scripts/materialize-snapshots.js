"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// vnext/scripts/materialize-snapshots.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const feature_encode_1 = require("../feature-encode");
async function materializeSnapshots() {
    try {
        console.log('🔄 Loading input snapshots...');
        // Read input snapshots
        const inputPath = path_1.default.join(__dirname, '../../../datasets/input-snapshots.json');
        const inputData = JSON.parse(fs_1.default.readFileSync(inputPath, 'utf8'));
        const snapshots = Array.isArray(inputData) ? inputData : [inputData];
        console.log(`📊 Processing ${snapshots.length} snapshots...`);
        const records = [];
        for (let i = 0; i < snapshots.length; i++) {
            const snap = snapshots[i];
            // Generate unique ID
            const id = `snap_${snap.ts}_${snap.lat}_${snap.lon}`;
            // Encode features using real encoder
            const feat = Array.from((0, feature_encode_1.encodeFeatures)(snap));
            records.push({ id, snap, feat });
            console.log(`✅ Processed ${i + 1}/${snapshots.length}: ${id}`);
        }
        // Write to JSONL
        const outputPath = path_1.default.join(__dirname, '../../../datasets/snapshots.jsonl');
        const outputLines = records.map(r => JSON.stringify(r));
        fs_1.default.writeFileSync(outputPath, outputLines.join('\n'));
        console.log(`🎯 Materialization complete! Wrote ${records.length} records to datasets/snapshots.jsonl`);
    }
    catch (error) {
        console.error('❌ Materialization failed:', error);
        process.exit(1);
    }
}
materializeSnapshots();
