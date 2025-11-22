"use strict";
/**
 * Model Loader with Integrity Validation and Automatic Rollback
 * Phase-6 Integration: v2.8 with v2.7 fallback
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
exports.modelLoader = exports.ModelLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class ModelLoader {
    constructor() {
        this.registry = this.loadRegistry();
        this.currentModel = process.env.RUNTIME_MODEL || this.registry.registry_metadata.active_model;
        this.rollbackTarget = this.getRollbackTarget(this.currentModel);
    }
    /**
     * Load and validate model with integrity checks
     */
    async loadModel() {
        console.log(`🎯 Loading model: ${this.currentModel}`);
        try {
            // Validate model integrity
            const isValid = await this.validateModelIntegrity(this.currentModel);
            if (!isValid) {
                console.warn(`⚠️  Model ${this.currentModel} failed integrity check, rolling back to ${this.rollbackTarget}`);
                return await this.performRollback();
            }
            console.log(`✅ Model ${this.currentModel} integrity validated`);
            return { modelId: this.currentModel, rollbackTaken: false };
        }
        catch (error) {
            console.error(`❌ Error loading model ${this.currentModel}:`, error);
            return await this.performRollback();
        }
    }
    /**
     * Validate model integrity using checksums
     */
    async validateModelIntegrity(modelId) {
        const modelInfo = this.registry.models.find(m => m.id === modelId);
        if (!modelInfo) {
            throw new Error(`Model ${modelId} not found in registry`);
        }
        const tfjsPath = modelInfo.artifacts.tfjs_path;
        const integrityPath = path.join(tfjsPath, 'integrity.json');
        if (!fs.existsSync(integrityPath)) {
            console.warn(`Integrity map not found for ${modelId}`);
            return false;
        }
        const integrity = JSON.parse(fs.readFileSync(integrityPath, 'utf8'));
        // Validate each file
        for (const [filename, expected] of Object.entries(integrity.files)) {
            const filePath = path.join(tfjsPath, filename);
            if (!fs.existsSync(filePath)) {
                console.warn(`File ${filename} missing for ${modelId}`);
                return false;
            }
            const actualHash = await this.calculateFileHash(filePath);
            if (actualHash !== expected.sha256) {
                console.warn(`Hash mismatch for ${filename}: expected ${expected.sha256}, got ${actualHash}`);
                return false;
            }
        }
        return true;
    }
    /**
     * Perform automatic rollback to fallback model
     */
    async performRollback() {
        if (!this.rollbackTarget) {
            throw new Error('No rollback target available');
        }
        console.log(`🔄 Rolling back to ${this.rollbackTarget}`);
        // Validate rollback target
        const isValid = await this.validateModelIntegrity(this.rollbackTarget);
        if (!isValid) {
            throw new Error(`Rollback target ${this.rollbackTarget} also failed integrity check`);
        }
        this.currentModel = this.rollbackTarget;
        this.rollbackTarget = this.getRollbackTarget(this.rollbackTarget);
        console.log(`✅ Rollback successful to ${this.currentModel}`);
        return { modelId: this.currentModel, rollbackTaken: true };
    }
    /**
     * Calculate SHA256 hash of a file
     */
    async calculateFileHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        return `sha256:${hash.digest('hex')}`;
    }
    /**
     * Load model registry
     */
    loadRegistry() {
        const registryPath = path.join(process.cwd(), 'models', 'registry.json');
        return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    }
    /**
     * Get rollback target for a model
     */
    getRollbackTarget(modelId) {
        const modelInfo = this.registry.models.find(m => m.id === modelId);
        return (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.rollback_target) || null;
    }
    /**
     * Simulate corrupt shard for testing
     */
    async simulateCorruptShard() {
        console.log('🧪 Simulating corrupt shard test...');
        // Temporarily corrupt a shard file
        const modelInfo = this.registry.models.find(m => m.id === this.currentModel);
        if (!modelInfo)
            return false;
        const shardPath = path.join(modelInfo.artifacts.tfjs_path, 'group1-shard1of1.bin');
        if (!fs.existsSync(shardPath))
            return false;
        // Backup original
        const backupPath = shardPath + '.backup';
        fs.copyFileSync(shardPath, backupPath);
        // Corrupt the file
        fs.writeFileSync(shardPath, 'corrupted data');
        try {
            // Test integrity validation
            const isValid = await this.validateModelIntegrity(this.currentModel);
            // Restore original
            fs.copyFileSync(backupPath, shardPath);
            fs.unlinkSync(backupPath);
            return !isValid; // Should return false (invalid) for corrupt shard
        }
        catch (error) {
            // Restore original on error
            if (fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, shardPath);
                fs.unlinkSync(backupPath);
            }
            return true; // Error means corruption was detected
        }
    }
    /**
     * Get current model info
     */
    getCurrentModelInfo() {
        return {
            model_id: this.currentModel,
            rollback_target: this.rollbackTarget,
            registry_hash: this.registry.registry_metadata.active_model
        };
    }
}
exports.ModelLoader = ModelLoader;
// Export singleton instance
exports.modelLoader = new ModelLoader();
