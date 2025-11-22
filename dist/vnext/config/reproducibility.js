"use strict";
// vnext/config/reproducibility.ts
// Reproducibility configuration and seed management
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPRODUCIBILITY_CONFIG = void 0;
exports.validateReproducibility = validateReproducibility;
exports.logReproducibilityInfo = logReproducibilityInfo;
exports.REPRODUCIBILITY_CONFIG = {
    // Fixed seeds for deterministic behavior
    SEEDS: {
        TRAINING: 42,
        VALIDATION_SPLIT: 123,
        MODEL_INITIALIZATION: 456,
        SAMPLING: 789
    },
    // Dataset checksums for validation
    DATASET_CHECKSUMS: {
        SNAPSHOTS: process.env.SNAPSHOTS_SHA256 || 'unknown',
        TRAIN_LABELS: process.env.TRAIN_LABELS_SHA256 || 'unknown',
        VAL_LABELS: process.env.VAL_LABELS_SHA256 || 'unknown',
        TEST_LABELS: process.env.TEST_LABELS_SHA256 || 'unknown'
    },
    // Model checksums for validation
    MODEL_CHECKSUMS: {
        STUDENT_V1: process.env.STUDENT_V1_SHA256 || 'unknown',
        STUDENT_V2: process.env.STUDENT_V2_SHA256 || 'unknown'
    },
    // Environment validation
    ENVIRONMENT: {
        NODE_VERSION: process.version,
        TENSORFLOW_BACKEND: process.env.TF_BACKEND || 'unknown',
        BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP || new Date().toISOString()
    }
};
function validateReproducibility() {
    const issues = [];
    // Check seeds are set
    if (!exports.REPRODUCIBILITY_CONFIG.SEEDS.TRAINING) {
        issues.push('Training seed not set');
    }
    // Check dataset checksums
    Object.entries(exports.REPRODUCIBILITY_CONFIG.DATASET_CHECKSUMS).forEach(([key, checksum]) => {
        if (checksum === 'unknown') {
            issues.push(`Dataset checksum for ${key} not recorded`);
        }
    });
    // Check model checksums
    Object.entries(exports.REPRODUCIBILITY_CONFIG.MODEL_CHECKSUMS).forEach(([key, checksum]) => {
        if (checksum === 'unknown') {
            issues.push(`Model checksum for ${key} not recorded`);
        }
    });
    return {
        valid: issues.length === 0,
        issues
    };
}
function logReproducibilityInfo() {
    console.log('[Reproducibility] Configuration:');
    console.log(`  Seeds: training=${exports.REPRODUCIBILITY_CONFIG.SEEDS.TRAINING}, split=${exports.REPRODUCIBILITY_CONFIG.SEEDS.VALIDATION_SPLIT}`);
    console.log(`  Environment: Node ${exports.REPRODUCIBILITY_CONFIG.ENVIRONMENT.NODE_VERSION}, TF=${exports.REPRODUCIBILITY_CONFIG.ENVIRONMENT.TENSORFLOW_BACKEND}`);
    console.log(`  Build: ${exports.REPRODUCIBILITY_CONFIG.ENVIRONMENT.BUILD_TIMESTAMP}`);
    const validation = validateReproducibility();
    if (!validation.valid) {
        console.warn('[Reproducibility] Issues found:');
        validation.issues.forEach(issue => console.warn(`  - ${issue}`));
    }
    else {
        console.log('[Reproducibility] ✅ All checks passed');
    }
}
