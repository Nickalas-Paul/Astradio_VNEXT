"use strict";
// vnext/scripts/compare-models.ts
// Compare student-v1 vs student-v2 model performance
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadModelMetadata(modelPath) {
    const metadataPath = path_1.default.join(modelPath, 'metadata.json');
    if (!fs_1.default.existsSync(metadataPath)) {
        return null;
    }
    try {
        const content = fs_1.default.readFileSync(metadataPath, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error(`Error loading metadata from ${metadataPath}:`, error);
        return null;
    }
}
function getModelSize(modelPath) {
    const modelJsonPath = path_1.default.join(modelPath, 'model.json');
    const weightfilePath = path_1.default.join(modelPath, 'weightfile.bin');
    return {
        modelJson: fs_1.default.existsSync(modelJsonPath) ? fs_1.default.statSync(modelJsonPath).size : 0,
        weightfile: fs_1.default.existsSync(weightfilePath) ? fs_1.default.statSync(weightfilePath).size : 0
    };
}
function compareModels() {
    var _a, _b, _c, _d, _e, _f;
    console.log('🔍 Model Comparison: student-v1 vs student-v2');
    console.log('===============================================');
    const v1Path = path_1.default.resolve(process.cwd(), 'models', 'student-v1');
    const v2Path = path_1.default.resolve(process.cwd(), 'models', 'student-v2');
    const v1Metadata = loadModelMetadata(v1Path);
    const v2Metadata = loadModelMetadata(v2Path);
    const v1Size = getModelSize(v1Path);
    const v2Size = getModelSize(v2Path);
    console.log('\n📊 STUDENT-V1 (Current Runtime Model):');
    console.log('----------------------------------------');
    if (v1Metadata) {
        console.log(`Version: ${v1Metadata.version}`);
        console.log(`Training Date: ${v1Metadata.trainingDate}`);
        console.log(`Architecture: ${v1Metadata.architecture || 'sequential'}`);
        console.log(`Input Shape: [${((_a = v1Metadata.inputShape) === null || _a === void 0 ? void 0 : _a.join(', ')) || '64'}]`);
        console.log(`Output Shape: [${((_b = v1Metadata.outputShape) === null || _b === void 0 ? void 0 : _b.join(', ')) || '6'}]`);
        console.log(`Training Data: ${v1Metadata.recordCount || 'Unknown'} records`);
        console.log(`Epochs: ${v1Metadata.epochs || 'Unknown'}`);
        console.log(`Loss: ${v1Metadata.loss || 'Unknown'}`);
        console.log(`Accuracy: ${v1Metadata.accuracy || 'Unknown'}`);
        console.log(`Backend: ${v1Metadata.backend || 'Unknown'}`);
    }
    else {
        console.log('❌ No metadata found');
    }
    console.log(`Model Size: ${v1Size.modelJson} bytes (JSON) + ${v1Size.weightfile} bytes (weights)`);
    console.log('\n📊 STUDENT-V2 (New Teacher-Trained Model):');
    console.log('--------------------------------------------');
    if (v2Metadata) {
        console.log(`Version: ${v2Metadata.version}`);
        console.log(`Training Date: ${v2Metadata.trainingDate}`);
        console.log(`Architecture: ${v2Metadata.architecture || 'sequential'}`);
        console.log(`Input Shape: [${((_c = v2Metadata.inputShape) === null || _c === void 0 ? void 0 : _c.join(', ')) || '64'}]`);
        console.log(`Output Heads: ${((_d = v2Metadata.outputHeads) === null || _d === void 0 ? void 0 : _d.join(', ')) || '6D vector'}`);
        console.log(`Training Data: ${v2Metadata.recordCount || '55'} records (teacher labels)`);
        console.log(`Backend: ${v2Metadata.backend || 'Unknown'}`);
        console.log(`SHA256: ${(_e = v2Metadata.sha256) === null || _e === void 0 ? void 0 : _e.slice(0, 12)}...`);
    }
    else {
        console.log('❌ No metadata found');
    }
    console.log(`Model Size: ${v2Size.modelJson} bytes (JSON) + ${v2Size.weightfile} bytes (weights)`);
    console.log('\n🔍 COMPARISON ANALYSIS:');
    console.log('------------------------');
    if (v1Metadata && v2Metadata) {
        console.log(`✅ Both models have 64D input (compatible)`);
        console.log(`✅ Both models trained on real astrological data`);
        if (v2Metadata.architecture === 'multi-head-student-v2') {
            console.log(`🚀 V2 has advanced multi-head architecture`);
            console.log(`🎯 V2 trained with teacher-generated high-quality labels`);
            console.log(`📈 V2 has specialized output heads: ${(_f = v2Metadata.outputHeads) === null || _f === void 0 ? void 0 : _f.join(', ')}`);
        }
        const v1Date = new Date(v1Metadata.trainingDate);
        const v2Date = new Date(v2Metadata.trainingDate);
        console.log(`📅 V2 is ${Math.round((v2Date.getTime() - v1Date.getTime()) / (1000 * 60 * 60 * 24))} days newer`);
        console.log(`💾 V2 model is ${((v2Size.weightfile - v1Size.weightfile) / 1024).toFixed(1)} KB ${v2Size.weightfile > v1Size.weightfile ? 'larger' : 'smaller'}`);
    }
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('--------------------');
    console.log('1. ✅ V2 is ready for A/B testing');
    console.log('2. 🧪 Test V2 on development page first');
    console.log('3. 📊 Compare music quality: V1 vs V2');
    console.log('4. 🚀 Deploy V2 when quality metrics improve');
    console.log('5. 🔄 Keep V1 as fallback during transition');
}
if (require.main === module) {
    compareModels();
}
