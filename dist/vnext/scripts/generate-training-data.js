"use strict";
// vnext/scripts/generate-training-data.ts
// Training data pipeline for Phase 2A: Teacher System Foundation
// Generates high-quality training data using enhanced teacher labels
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTrainingData = generateTrainingData;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const label_from_rules_1 = require("../teacher/label-from-rules");
const quality_1 = require("../config/quality");
const DATASETS_DIR = path_1.default.resolve(process.cwd(), "datasets");
const LABELS_DIR = path_1.default.join(DATASETS_DIR, "labels");
const TRAINING_DIR = path_1.default.join(DATASETS_DIR, "training");
const DEFAULT_CONFIG = {
    limit: 2000,
    qualityThreshold: quality_1.MIN_QUALITY_THRESHOLD, // Use centralized config
    trainRatio: 0.7,
    valRatio: 0.15,
    testRatio: 0.15,
    seed: 42
};
// Ensure directories exist
function ensureDirs() {
    [DATASETS_DIR, LABELS_DIR, TRAINING_DIR].forEach(dir => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    });
}
// Generate checksum for data integrity
function generateChecksum(filePath) {
    const crypto = require('crypto');
    const content = fs_1.default.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
}
// Validate training data quality
function validateTrainingData() {
    var _a;
    const issues = [];
    // Check if label files exist
    const requiredFiles = ['train.jsonl', 'val.jsonl', 'test.jsonl'];
    for (const file of requiredFiles) {
        const filePath = path_1.default.join(LABELS_DIR, file);
        if (!fs_1.default.existsSync(filePath)) {
            issues.push(`Missing required file: ${file}`);
        }
    }
    if (issues.length > 0) {
        return { valid: false, issues };
    }
    // Check data quality
    for (const file of requiredFiles) {
        const filePath = path_1.default.join(LABELS_DIR, file);
        const lines = fs_1.default.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
        if (lines.length === 0) {
            issues.push(`${file} is empty`);
            continue;
        }
        // Check quality scores
        let qualityScores = [];
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if ((_a = data.metadata) === null || _a === void 0 ? void 0 : _a.qualityScore) {
                    qualityScores.push(data.metadata.qualityScore);
                }
            }
            catch (error) {
                issues.push(`Invalid JSON in ${file}: ${error}`);
            }
        }
        if (qualityScores.length > 0) {
            const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
            if (avgQuality < quality_1.MIN_QUALITY_THRESHOLD) {
                issues.push(`${file} average quality ${avgQuality.toFixed(3)} below threshold ${quality_1.MIN_QUALITY_THRESHOLD}`);
            }
        }
    }
    return { valid: issues.length === 0, issues };
}
// Generate metadata for tracking
function generateMetadata(config) {
    const metadata = {
        version: "2.0_enhanced",
        timestamp: new Date().toISOString(),
        config,
        dataHygiene: {
            splitMethod: "chart_hash",
            splitSeed: config.seed,
            qualityThreshold: config.qualityThreshold
        },
        checksums: {},
        statistics: {}
    };
    // Generate checksums for all files
    const files = ['train.jsonl', 'val.jsonl', 'test.jsonl'];
    for (const file of files) {
        const filePath = path_1.default.join(LABELS_DIR, file);
        if (fs_1.default.existsSync(filePath)) {
            metadata.checksums[file] = generateChecksum(filePath);
            // Calculate statistics
            const lines = fs_1.default.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
            const qualityScores = lines.map(line => {
                var _a;
                try {
                    return ((_a = JSON.parse(line).metadata) === null || _a === void 0 ? void 0 : _a.qualityScore) || 0;
                }
                catch {
                    return 0;
                }
            }).filter(score => score > 0);
            metadata.statistics[file] = {
                count: lines.length,
                avgQuality: qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0,
                minQuality: qualityScores.length > 0 ? Math.min(...qualityScores) : 0,
                maxQuality: qualityScores.length > 0 ? Math.max(...qualityScores) : 0
            };
        }
    }
    return metadata;
}
// Main training data generation function
async function generateTrainingData(config = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    console.log('🚀 Starting training data generation pipeline');
    console.log(`📊 Config: ${finalConfig.limit} charts, quality ≥ ${finalConfig.qualityThreshold}`);
    console.log(`📈 Split: ${(finalConfig.trainRatio * 100).toFixed(0)}% train, ${(finalConfig.valRatio * 100).toFixed(0)}% val, ${(finalConfig.testRatio * 100).toFixed(0)}% test`);
    ensureDirs();
    // Set environment variables for label generation
    process.env.LABEL_LIMIT = finalConfig.limit.toString();
    process.env.QUALITY_THRESHOLD = finalConfig.qualityThreshold.toString();
    try {
        // Check if labels already exist
        const labelsExist = fs_1.default.existsSync(path_1.default.join(LABELS_DIR, 'train.jsonl')) &&
            fs_1.default.existsSync(path_1.default.join(LABELS_DIR, 'val.jsonl')) &&
            fs_1.default.existsSync(path_1.default.join(LABELS_DIR, 'test.jsonl'));
        if (!labelsExist) {
            // Generate teacher labels
            console.log('📝 Generating teacher labels...');
            await (0, label_from_rules_1.main)();
        }
        else {
            console.log('📝 Using existing teacher labels...');
        }
        // Validate training data
        console.log('🔍 Validating training data...');
        const validation = validateTrainingData();
        if (!validation.valid) {
            console.error('❌ Training data validation failed:');
            validation.issues.forEach(issue => console.error(`  - ${issue}`));
            throw new Error('Training data validation failed');
        }
        console.log('✅ Training data validation passed');
        // Generate metadata
        console.log('📋 Generating metadata...');
        const metadata = generateMetadata(finalConfig);
        // Save metadata
        const metadataPath = path_1.default.join(TRAINING_DIR, 'metadata.json');
        fs_1.default.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        // Copy label files to training directory
        const files = ['train.jsonl', 'val.jsonl', 'test.jsonl'];
        for (const file of files) {
            const sourcePath = path_1.default.join(LABELS_DIR, file);
            const destPath = path_1.default.join(TRAINING_DIR, file);
            if (fs_1.default.existsSync(sourcePath)) {
                fs_1.default.copyFileSync(sourcePath, destPath);
            }
        }
        console.log('🎯 Training data generation complete!');
        console.log(`📁 Output directory: ${TRAINING_DIR}`);
        console.log(`📊 Total samples: ${Object.values(metadata.statistics).reduce((sum, stats) => sum + stats.count, 0)}`);
        console.log(`🎵 Average quality: ${Object.values(metadata.statistics).reduce((sum, stats) => sum + stats.avgQuality, 0) / Object.keys(metadata.statistics).length}`);
        return {
            success: true,
            metadata,
            outputDir: TRAINING_DIR
        };
    }
    catch (error) {
        console.error('❌ Training data generation failed:', error);
        throw error;
    }
}
// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const config = {};
    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
        const key = (_a = args[i]) === null || _a === void 0 ? void 0 : _a.replace('--', '');
        const value = args[i + 1];
        if (key && value) {
            switch (key) {
                case 'limit':
                    config.limit = parseInt(value);
                    break;
                case 'quality':
                    config.qualityThreshold = parseFloat(value);
                    break;
                case 'train-ratio':
                    config.trainRatio = parseFloat(value);
                    break;
                case 'val-ratio':
                    config.valRatio = parseFloat(value);
                    break;
                case 'test-ratio':
                    config.testRatio = parseFloat(value);
                    break;
                case 'seed':
                    config.seed = parseInt(value);
                    break;
            }
        }
    }
    generateTrainingData(config)
        .then(result => {
        console.log('✅ Training data generation successful');
        process.exit(0);
    })
        .catch(error => {
        console.error('❌ Training data generation failed:', error);
        process.exit(1);
    });
}
