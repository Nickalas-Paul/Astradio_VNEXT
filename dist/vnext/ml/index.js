"use strict";
// vnext/ml/index.ts
// Consolidated ML components: model loading, student training, and retrieval
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_HTTP_URL = exports.MODEL_METADATA_FILE = exports.MODEL_JSON_FILE = exports.MODEL_DIR = exports.ModelRetrieval = exports.StudentV2Adapter = exports.ModelLoader = void 0;
exports.studentVector = studentVector;
exports.refineModelOutput = refineModelOutput;
const tf = __importStar(require("@tensorflow/tfjs"));
require("@tensorflow/tfjs-backend-wasm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ModelLoader {
    constructor() {
        this.models = new Map();
        this.metadata = new Map();
    }
    async loadModel(modelPath) {
        if (this.models.has(modelPath)) {
            return this.models.get(modelPath);
        }
        console.log(`Loading model from: ${modelPath}`);
        const model = await tf.loadLayersModel(modelPath);
        this.models.set(modelPath, model);
        // Load metadata if available
        const metadataPath = modelPath.replace('model.json', 'metadata.json');
        if (fs_1.default.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf8'));
            this.metadata.set(modelPath, metadata);
        }
        return model;
    }
    getMetadata(modelPath) {
        return this.metadata.get(modelPath) || null;
    }
    dispose() {
        this.models.forEach(model => model.dispose());
        this.models.clear();
        this.metadata.clear();
    }
}
exports.ModelLoader = ModelLoader;
class StudentV2Adapter {
    constructor() {
        this.name = 'student-v2';
        this.version = '2.2';
    }
    adapt(input) {
        // Adapt input for student-v2 model
        return input;
    }
    getOutputShape() {
        return [6]; // 6-element control vector
    }
}
exports.StudentV2Adapter = StudentV2Adapter;
const MODEL_DIR = path_1.default.resolve(process.cwd(), "models", "student-v2.2");
exports.MODEL_DIR = MODEL_DIR;
const MODEL_JSON_FILE = path_1.default.join(MODEL_DIR, "model.json");
exports.MODEL_JSON_FILE = MODEL_JSON_FILE;
const MODEL_METADATA_FILE = path_1.default.join(MODEL_DIR, "metadata.json");
exports.MODEL_METADATA_FILE = MODEL_METADATA_FILE;
const MODEL_HTTP_URL = "http://localhost:3000/models/student-v2.2/model.json";
exports.MODEL_HTTP_URL = MODEL_HTTP_URL;
const modelLoader = new ModelLoader();
const adapter = new StudentV2Adapter();
async function studentVector(feat) {
    try {
        // Determine backend and model path
        const useHTTP = process.env.STRICT_ML === 'false';
        const modelPath = useHTTP ? MODEL_HTTP_URL : `file://${MODEL_JSON_FILE}`;
        // Load model
        const model = await modelLoader.loadModel(modelPath);
        // Prepare input tensor
        const inputTensor = tf.tensor2d([Array.from(feat)], [1, 64]);
        // Run inference
        const output = model.predict(inputTensor);
        const outputData = await output.data();
        // Adapt output
        const adaptedOutput = adapter.adapt(output);
        const adaptedData = await adaptedOutput.data();
        // Clean up tensors
        inputTensor.dispose();
        output.dispose();
        adaptedOutput.dispose();
        return {
            vector: Array.from(adaptedData),
            confidence: calculateConfidence(adaptedData),
            modelVersion: adapter.version,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Student model inference failed:', error);
        // Return fallback vector
        return {
            vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
            confidence: 0,
            modelVersion: 'fallback',
            timestamp: new Date().toISOString()
        };
    }
}
function refineModelOutput(vector, options = { smoothing: true, calibration: false, constraints: {} }) {
    let refined = [...vector];
    // Apply smoothing
    if (options.smoothing) {
        refined = applySmoothing(refined);
    }
    // Apply calibration
    if (options.calibration) {
        refined = applyCalibration(refined);
    }
    // Apply constraints
    Object.entries(options.constraints).forEach(([key, value]) => {
        const index = getConstraintIndex(key);
        if (index >= 0 && index < refined.length) {
            refined[index] = Math.max(0, Math.min(1, value));
        }
    });
    return refined;
}
class ModelRetrieval {
    constructor() {
        this.index = new Map();
    }
    async buildIndex() {
        // Build search index for model retrieval
        console.log('Building model retrieval index...');
        // Implementation would scan models and build similarity index
    }
    async search(query, options = { maxResults: 10, similarityThreshold: 0.7, includeMetadata: true }) {
        // Search for similar models or patterns
        const results = [];
        // Simplified search implementation
        for (const [key, value] of this.index) {
            const similarity = calculateSimilarity(query, key);
            if (similarity >= options.similarityThreshold) {
                results.push({
                    key,
                    value,
                    similarity,
                    metadata: options.includeMetadata ? this.getMetadata(key) : null
                });
            }
        }
        return results.sort((a, b) => b.similarity - a.similarity).slice(0, options.maxResults);
    }
    getMetadata(key) {
        // Return metadata for the given key
        return null;
    }
}
exports.ModelRetrieval = ModelRetrieval;
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function calculateConfidence(outputData) {
    // Calculate confidence based on output variance and magnitude
    const values = Array.from(outputData);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    // Higher variance and reasonable magnitude = higher confidence
    const magnitude = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
    const confidence = Math.min(1, variance * magnitude);
    return confidence;
}
function applySmoothing(vector) {
    // Apply simple moving average smoothing
    const smoothed = [...vector];
    const window = 2;
    for (let i = window; i < vector.length - window; i++) {
        const windowValues = vector.slice(i - window, i + window + 1);
        smoothed[i] = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
    }
    return smoothed;
}
function applyCalibration(vector) {
    // Apply calibration mapping
    return vector.map(val => {
        // Simple sigmoid-like calibration
        return 1 / (1 + Math.exp(-5 * (val - 0.5)));
    });
}
function getConstraintIndex(key) {
    var _a;
    // Map constraint keys to vector indices
    const mapping = {
        'tempo': 0,
        'brightness': 1,
        'density': 2,
        'arc': 3,
        'motif': 4,
        'cadence': 5
    };
    return (_a = mapping[key]) !== null && _a !== void 0 ? _a : -1;
}
function calculateSimilarity(query, key) {
    // Simple string similarity calculation
    const queryLower = query.toLowerCase();
    const keyLower = key.toLowerCase();
    if (queryLower === keyLower)
        return 1;
    if (keyLower.includes(queryLower))
        return 0.8;
    if (queryLower.includes(keyLower))
        return 0.6;
    // Simple character overlap
    const queryChars = new Set(queryLower);
    const keyChars = new Set(keyLower);
    const intersection = new Set([...queryChars].filter(x => keyChars.has(x)));
    const union = new Set([...queryChars, ...keyChars]);
    return intersection.size / union.size;
}
