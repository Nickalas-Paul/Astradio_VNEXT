"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCleanSplits = createCleanSplits;
// vnext/scripts/create-clean-splits.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function createCleanSplits() {
    console.log("🧹 CREATING CLEAN SPLITS (NO DATA LEAKAGE)");
    console.log("===========================================");
    const sourcePath = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'train_scaled.jsonl');
    const outputDir = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'clean');
    // Ensure output directory exists
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    console.log(`📂 Loading labels from: ${sourcePath}`);
    const content = fs_1.default.readFileSync(sourcePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    console.log(`📊 Total labels: ${lines.length}`);
    // Group by chartHash, keeping only the first variation (variation_id = 0)
    const chartMap = new Map();
    lines.forEach(line => {
        const record = JSON.parse(line);
        const chartHash = record.metadata.chartHash;
        // Only keep the first variation (variation_id = 0)
        if (record.metadata.variation_id === 0) {
            if (!chartMap.has(chartHash)) {
                chartMap.set(chartHash, record);
            }
        }
    });
    console.log(`🔑 Unique charts found: ${chartMap.size}`);
    // Convert to array and shuffle
    const uniqueCharts = Array.from(chartMap.values());
    const shuffled = uniqueCharts.sort(() => Math.random() - 0.5);
    // Split: 60% train, 20% dev, 20% test
    const trainSize = Math.floor(shuffled.length * 0.6);
    const devSize = Math.floor(shuffled.length * 0.2);
    const trainCharts = shuffled.slice(0, trainSize);
    const devCharts = shuffled.slice(trainSize, trainSize + devSize);
    const testCharts = shuffled.slice(trainSize + devSize);
    console.log(`📊 Train: ${trainCharts.length} charts`);
    console.log(`📊 Dev: ${devCharts.length} charts`);
    console.log(`📊 Test: ${testCharts.length} charts`);
    // Add base_id field to prevent future leakage
    const addBaseId = (charts, split) => {
        return charts.map((chart, index) => ({
            ...chart,
            base_id: `${split}_${chart.metadata.chartHash}_${index}`
        }));
    };
    const trainWithBaseId = addBaseId(trainCharts, 'train');
    const devWithBaseId = addBaseId(devCharts, 'dev');
    const testWithBaseId = addBaseId(testCharts, 'test');
    // Write clean splits
    const writeSplit = (charts, filename) => {
        const filePath = path_1.default.join(outputDir, filename);
        const content = charts.map(chart => JSON.stringify(chart)).join('\n');
        fs_1.default.writeFileSync(filePath, content);
        console.log(`💾 Written: ${filename} (${charts.length} charts)`);
    };
    writeSplit(trainWithBaseId, 'train_clean.jsonl');
    writeSplit(devWithBaseId, 'dev_clean.jsonl');
    writeSplit(testWithBaseId, 'test_clean.jsonl');
    // Verify no leakage
    const trainBaseIds = new Set(trainWithBaseId.map(c => c.base_id));
    const devBaseIds = new Set(devWithBaseId.map(c => c.base_id));
    const testBaseIds = new Set(testWithBaseId.map(c => c.base_id));
    let hasLeakage = false;
    for (const id of trainBaseIds) {
        if (devBaseIds.has(id) || testBaseIds.has(id)) {
            hasLeakage = true;
            break;
        }
    }
    if (!hasLeakage) {
        for (const id of devBaseIds) {
            if (testBaseIds.has(id)) {
                hasLeakage = true;
                break;
            }
        }
    }
    console.log("\n✅ CLEAN SPLITS CREATED");
    console.log("========================");
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🔍 Data leakage: ${hasLeakage ? '❌ DETECTED' : '✅ NONE'}`);
    console.log(`🎯 Total unique charts: ${chartMap.size}`);
    console.log(`📊 Train/Dev/Test: ${trainCharts.length}/${devCharts.length}/${testCharts.length}`);
    if (hasLeakage) {
        console.log("🚫 CRITICAL: Still has data leakage - cannot proceed");
        return false;
    }
    else {
        console.log("✅ Ready for Phase-2C with clean data");
        return true;
    }
}
if (require.main === module) {
    const success = createCleanSplits();
    process.exit(success ? 0 : 1);
}
