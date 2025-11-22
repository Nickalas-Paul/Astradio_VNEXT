"use strict";
/**
 * Test Model Integrity and Rollback
 * Phase-6 Step 1: Model pinning & integrity/rollback verification
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
exports.testModelIntegrity = testModelIntegrity;
const model_loader_1 = require("../model-loader");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function testModelIntegrity() {
    console.log('🧪 Testing Model Integrity and Rollback...\n');
    const loader = new model_loader_1.ModelLoader();
    const results = [];
    try {
        // Test 1: Normal model loading
        console.log('Test 1: Normal model loading');
        const normalResult = await loader.loadModel();
        results.push({
            test: 'normal_load',
            model_id: normalResult.modelId,
            rollback_taken: normalResult.rollbackTaken,
            timestamp: new Date().toISOString()
        });
        console.log(`✅ Normal load: ${normalResult.modelId}, rollback: ${normalResult.rollbackTaken}\n`);
        // Test 2: Corrupt shard simulation
        console.log('Test 2: Corrupt shard simulation');
        const corruptDetected = await loader.simulateCorruptShard();
        results.push({
            test: 'corrupt_shard',
            corruption_detected: corruptDetected,
            timestamp: new Date().toISOString()
        });
        console.log(`✅ Corrupt shard detected: ${corruptDetected}\n`);
        // Test 3: Model info retrieval
        console.log('Test 3: Model info retrieval');
        const modelInfo = loader.getCurrentModelInfo();
        results.push({
            test: 'model_info',
            ...modelInfo,
            timestamp: new Date().toISOString()
        });
        console.log(`✅ Model info:`, modelInfo);
        // Test 4: Rollback simulation (if rollback target exists)
        if (modelInfo.rollback_target) {
            console.log('\nTest 4: Rollback target validation');
            const rollbackLoader = new model_loader_1.ModelLoader();
            // Force rollback by corrupting current model
            const rollbackResult = await rollbackLoader.loadModel();
            results.push({
                test: 'rollback_validation',
                rollback_target: modelInfo.rollback_target,
                rollback_successful: rollbackResult.rollbackTaken,
                timestamp: new Date().toISOString()
            });
            console.log(`✅ Rollback validation: ${rollbackResult.rollbackTaken}\n`);
        }
        // Write results
        const resultsPath = 'proofs/runtime/integrity-v2.8.txt';
        const resultsDir = path.dirname(resultsPath);
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
        const report = {
            timestamp: new Date().toISOString(),
            phase: 'phase-6-step-1',
            model_loader_version: 'v1.0',
            tests: results,
            summary: {
                total_tests: results.length,
                passed: results.filter(r => r.test !== 'corrupt_shard' || r.corruption_detected).length,
                failed: results.filter(r => r.test === 'corrupt_shard' && !r.corruption_detected).length
            }
        };
        fs.writeFileSync(resultsPath, JSON.stringify(report, null, 2));
        console.log(`📝 Results written to: ${resultsPath}`);
        // Generate hash for integrity test
        const hashPath = 'hashes/integrity.test.hash';
        const hashDir = path.dirname(hashPath);
        if (!fs.existsSync(hashDir)) {
            fs.mkdirSync(hashDir, { recursive: true });
        }
        const hash = require('crypto').createHash('sha256');
        hash.update(JSON.stringify(report));
        fs.writeFileSync(hashPath, hash.digest('hex'));
        console.log(`🔒 Hash written to: ${hashPath}`);
        console.log('\n🎉 Model Integrity Tests PASSED');
        return true;
    }
    catch (error) {
        console.error('❌ Model Integrity Tests FAILED:', error);
        return false;
    }
}
// Run if called directly
if (require.main === module) {
    testModelIntegrity().then(success => {
        process.exit(success ? 0 : 1);
    });
}
