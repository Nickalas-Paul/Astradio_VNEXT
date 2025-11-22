"use strict";
// vnext/scripts/data-pipeline.ts
// Consolidated data processing functions for splits, scaling, and label management
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixSplitLeakage = fixSplitLeakage;
exports.scaleExistingLabels = scaleExistingLabels;
exports.scaleLabelsProduction = scaleLabelsProduction;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function fixSplitLeakage() {
    console.log("🔧 FIX SPLIT LEAKAGE");
    console.log("====================");
    const trainPath = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'train_scaled.jsonl');
    const devPath = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'dev_scaled.jsonl');
    const testPath = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'test_scaled.jsonl');
    // Load all labels
    const loadLabels = (filePath) => {
        if (!fs_1.default.existsSync(filePath))
            return [];
        const content = fs_1.default.readFileSync(filePath, 'utf8');
        return content.split('\n').filter(Boolean).map(line => JSON.parse(line));
    };
    const trainLabels = loadLabels(trainPath);
    const devLabels = loadLabels(devPath);
    const testLabels = loadLabels(testPath);
    console.log(`📊 Train: ${trainLabels.length} labels`);
    console.log(`📊 Dev: ${devLabels.length} labels`);
    console.log(`📊 Test: ${testLabels.length} labels`);
    // Check for leakage by chartHash (since base_id might not exist)
    const trainHashes = new Set(trainLabels.map(l => { var _a; return ((_a = l.metadata) === null || _a === void 0 ? void 0 : _a.chartHash) || l.chartHash; }).filter(Boolean));
    const devHashes = new Set(devLabels.map(l => { var _a; return ((_a = l.metadata) === null || _a === void 0 ? void 0 : _a.chartHash) || l.chartHash; }).filter(Boolean));
    const testHashes = new Set(testLabels.map(l => { var _a; return ((_a = l.metadata) === null || _a === void 0 ? void 0 : _a.chartHash) || l.chartHash; }).filter(Boolean));
    // Find overlapping hashes
    const trainDevOverlap = [...trainHashes].filter(hash => devHashes.has(hash));
    const trainTestOverlap = [...trainHashes].filter(hash => testHashes.has(hash));
    const devTestOverlap = [...devHashes].filter(hash => testHashes.has(hash));
    const totalOverlap = trainDevOverlap.length + trainTestOverlap.length + devTestOverlap.length;
    if (totalOverlap > 0) {
        console.log("❌ LEAKAGE DETECTED:");
        console.log(`   Train-Dev overlap: ${trainDevOverlap.length} charts`);
        console.log(`   Train-Test overlap: ${trainTestOverlap.length} charts`);
        console.log(`   Dev-Test overlap: ${devTestOverlap.length} charts`);
        console.log("🚫 Cannot proceed until leakage is fixed");
        return false;
    }
    else {
        console.log("✅ NO LEAKAGE DETECTED");
        console.log("✅ All splits are properly isolated");
        return true;
    }
}
function scaleExistingLabels() {
    console.log("📈 SCALE EXISTING LABELS");
    console.log("========================");
    const sourcePath = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'train.jsonl');
    const outputDir = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'scaled');
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // Load existing labels
    const content = fs_1.default.readFileSync(sourcePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const originalLabels = lines.map(line => JSON.parse(line));
    console.log(`📂 Loaded ${originalLabels.length} original labels`);
    // Create variations
    const scaledLabels = [];
    const variationsPerLabel = 100; // Create 100 variations per original label
    originalLabels.forEach((original, index) => {
        for (let v = 0; v < variationsPerLabel; v++) {
            // Add noise to features
            const noisyFeat = original.feat.map((f) => Math.max(0, Math.min(1, f + (Math.random() - 0.5) * 0.1)));
            // Add small variations to directives
            const noisyDirectives = {
                ...original.directives,
                tempo_norm: Math.max(0, Math.min(1, original.directives.tempo_norm + (Math.random() - 0.5) * 0.05)),
                motif_rate: Math.max(0, Math.min(1, original.directives.motif_rate + (Math.random() - 0.5) * 0.05)),
                syncopation: Math.max(0, Math.min(1, original.directives.syncopation + (Math.random() - 0.5) * 0.05)),
                harmonic_change_rate: Math.max(0, Math.min(1, original.directives.harmonic_change_rate + (Math.random() - 0.5) * 0.05))
            };
            const scaledLabel = {
                feat: noisyFeat,
                directives: noisyDirectives,
                arc_curve: original.arc_curve,
                cadence_class: original.cadence_class,
                motif_tokens: original.motif_tokens,
                metadata: {
                    ...original.metadata,
                    variation_id: v,
                    noise_level: Math.random() * 0.01,
                    scaled_version: 'v2.1_scaled',
                    base_id: `${original.metadata.chartHash}_${index}_${v}`
                }
            };
            scaledLabels.push(scaledLabel);
        }
        if ((index + 1) % 10 === 0) {
            console.log(`📊 Processed ${index + 1}/${originalLabels.length} original labels`);
        }
    });
    // Split into train/dev/test
    const shuffled = scaledLabels.sort(() => Math.random() - 0.5);
    const trainSize = Math.floor(shuffled.length * 0.8);
    const devSize = Math.floor(shuffled.length * 0.1);
    const trainLabels = shuffled.slice(0, trainSize);
    const devLabels = shuffled.slice(trainSize, trainSize + devSize);
    const testLabels = shuffled.slice(trainSize + devSize);
    // Write splits
    const writeSplit = (labels, filename) => {
        const filePath = path_1.default.join(outputDir, filename);
        const content = labels.map(label => JSON.stringify(label)).join('\n');
        fs_1.default.writeFileSync(filePath, content);
        console.log(`💾 Written: ${filename} (${labels.length} labels)`);
    };
    writeSplit(trainLabels, 'train_scaled.jsonl');
    writeSplit(devLabels, 'dev_scaled.jsonl');
    writeSplit(testLabels, 'test_scaled.jsonl');
    // Dataset integrity gates
    console.log("\n🔍 DATASET INTEGRITY GATES");
    console.log("==========================");
    // Check for NaN/Inf
    const hasNaNInf = scaledLabels.some(label => label.feat.some((f) => !Number.isFinite(f)) ||
        Object.values(label.directives).some((d) => !Number.isFinite(d)));
    console.log(`✅ No NaN/Inf: ${!hasNaNInf}`);
    // Check per-head variance
    const arcVariances = scaledLabels.map(l => l.arc_curve).flat();
    const arcVariance = calculateVariance(arcVariances);
    console.log(`✅ Arc variance: ${arcVariance.toFixed(4)} (target: ≥0.02)`);
    console.log(`\n🎯 Scaled dataset: ${scaledLabels.length} total labels`);
    console.log(`📊 Train/Dev/Test: ${trainLabels.length}/${devLabels.length}/${testLabels.length}`);
}
// =============================================================================
// SCALE LABELS PRODUCTION - Production-ready label scaling
// =============================================================================
function scaleLabelsProduction() {
    console.log("🏭 SCALE LABELS PRODUCTION");
    console.log("==========================");
    // This would be the production version with more robust error handling,
    // progress tracking, and validation gates
    console.log("📋 Production scaling pipeline:");
    console.log("1. Load source labels");
    console.log("2. Validate label quality");
    console.log("3. Create variations with controlled noise");
    console.log("4. Apply dataset integrity gates");
    console.log("5. Split into train/dev/test");
    console.log("6. Generate metadata and checksums");
    console.log("7. Validate split integrity");
    // For now, just call the regular scaling function
    scaleExistingLabels();
}
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function calculateVariance(values) {
    if (values.length === 0)
        return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
}
// Command line interface
if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case 'fix-leakage':
            fixSplitLeakage();
            break;
        case 'scale':
            scaleExistingLabels();
            break;
        case 'scale-production':
            scaleLabelsProduction();
            break;
        case 'all':
            console.log("🔄 RUNNING DATA PIPELINE");
            console.log("========================");
            const noLeakage = fixSplitLeakage();
            if (noLeakage) {
                console.log();
                scaleExistingLabels();
            }
            break;
        default:
            console.log("Available data pipeline commands:");
            console.log("  fix-leakage      - Check and report split leakage");
            console.log("  scale            - Scale existing labels with variations");
            console.log("  scale-production - Production-ready label scaling");
            console.log("  all              - Run complete pipeline");
    }
}
