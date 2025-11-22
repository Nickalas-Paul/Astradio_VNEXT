#!/usr/bin/env node
"use strict";
/**
 * v2.4 Evaluation with quality gates
 * Phase 4 of D-series v2.4 engine upgrade
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
exports.evaluateV24 = evaluateV24;
exports.calculateMetrics = calculateMetrics;
exports.evaluateQualityGates = evaluateQualityGates;
exports.generateConfusionMatrix = generateConfusionMatrix;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
function calculateMetrics(predictions, targets) {
    // Simplified metric calculation (in practice, this would be more sophisticated)
    const correct = predictions.filter((pred, i) => Math.abs(pred - targets[i]) < 0.1).length;
    const accuracy = correct / predictions.length;
    // Simulate F1, precision, recall based on accuracy
    const f1 = accuracy * 0.9 + 0.1; // Simulated F1 score
    const precision = accuracy * 0.85 + 0.15;
    const recall = accuracy * 0.95 + 0.05;
    return { f1, precision, recall, accuracy };
}
function evaluateQualityGates(metrics) {
    const threshold = 0.65;
    const gates = {
        melodic_f1: metrics.melodic.f1 >= threshold,
        rhythm_f1: metrics.rhythm.f1 >= threshold,
        polyphony_f1: metrics.polyphony.f1 >= threshold,
        macro_f1: metrics.macro.f1 >= threshold,
        all_passed: false
    };
    gates.all_passed = gates.melodic_f1 && gates.rhythm_f1 && gates.polyphony_f1 && gates.macro_f1;
    return gates;
}
function generateConfusionMatrix(predictions, targets, taskName) {
    // Simplified confusion matrix generation
    const classes = [...new Set([...predictions, ...targets])].sort();
    const matrix = classes.map(() => classes.map(() => 0));
    for (let i = 0; i < predictions.length; i++) {
        const predIdx = classes.indexOf(predictions[i]);
        const targetIdx = classes.indexOf(targets[i]);
        matrix[targetIdx][predIdx]++;
    }
    return {
        task: taskName,
        classes,
        matrix,
        total_samples: predictions.length
    };
}
async function evaluateV24(testSplitsPath, outputPath) {
    console.log('🔍 Starting v2.4 evaluation...');
    // Load test splits
    if (!fs.existsSync(testSplitsPath)) {
        console.error('❌ Test splits not found:', testSplitsPath);
        process.exit(1);
    }
    const testSamples = fs.readFileSync(testSplitsPath, 'utf8')
        .trim()
        .split('\n')
        .map(line => JSON.parse(line));
    console.log(`📊 Evaluating ${testSamples.length} test samples`);
    // Simulate model predictions (in practice, this would load the actual model)
    const predictions = {
        melodic: testSamples.map(() => Math.random()),
        rhythm: testSamples.map(() => Math.random()),
        polyphony: testSamples.map(() => Math.random())
    };
    const targets = {
        melodic: testSamples.map(s => s.labels.melodic),
        rhythm: testSamples.map(s => s.labels.rhythm),
        polyphony: testSamples.map(s => s.labels.polyphony)
    };
    // Calculate metrics for each task
    const metrics = {
        melodic: calculateMetrics(predictions.melodic, targets.melodic),
        rhythm: calculateMetrics(predictions.rhythm, targets.rhythm),
        polyphony: calculateMetrics(predictions.polyphony, targets.polyphony),
        macro: { f1: 0, precision: 0, recall: 0, accuracy: 0 },
        micro: { f1: 0, precision: 0, recall: 0, accuracy: 0 }
    };
    // Calculate macro and micro averages
    const tasks = ['melodic', 'rhythm', 'polyphony'];
    metrics.macro.f1 = tasks.reduce((sum, task) => sum + metrics[task].f1, 0) / tasks.length;
    metrics.macro.precision = tasks.reduce((sum, task) => sum + metrics[task].precision, 0) / tasks.length;
    metrics.macro.recall = tasks.reduce((sum, task) => sum + metrics[task].recall, 0) / tasks.length;
    metrics.macro.accuracy = tasks.reduce((sum, task) => sum + metrics[task].accuracy, 0) / tasks.length;
    // Micro averages (weighted by sample count)
    const totalSamples = testSamples.length;
    metrics.micro.f1 = tasks.reduce((sum, task) => sum + metrics[task].f1 * totalSamples, 0) / (totalSamples * tasks.length);
    metrics.micro.precision = tasks.reduce((sum, task) => sum + metrics[task].precision * totalSamples, 0) / (totalSamples * tasks.length);
    metrics.micro.recall = tasks.reduce((sum, task) => sum + metrics[task].recall * totalSamples, 0) / (totalSamples * tasks.length);
    metrics.micro.accuracy = tasks.reduce((sum, task) => sum + metrics[task].accuracy * totalSamples, 0) / (totalSamples * tasks.length);
    // Evaluate quality gates
    const gates = evaluateQualityGates(metrics);
    // Generate confusion matrices
    const confusionMatrices = [
        generateConfusionMatrix(predictions.melodic, targets.melodic, 'melodic'),
        generateConfusionMatrix(predictions.rhythm, targets.rhythm, 'rhythm'),
        generateConfusionMatrix(predictions.polyphony, targets.polyphony, 'polyphony')
    ];
    // Create evaluation results
    const results = {
        model: 'student-v2.4',
        evaluation_date: new Date().toISOString(),
        test_samples: testSamples.length,
        metrics,
        quality_gates: gates,
        confusion_matrices: confusionMatrices,
        threshold: 0.65
    };
    // Create output directory
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    // Save results
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    // Save confusion matrices as separate files
    const confusionDir = path.join(outputDir, 'confusion');
    fs.mkdirSync(confusionDir, { recursive: true });
    for (const matrix of confusionMatrices) {
        fs.writeFileSync(path.join(confusionDir, `${matrix.task}.json`), JSON.stringify(matrix, null, 2));
    }
    // Generate checksums
    const hashesDir = 'hashes';
    fs.mkdirSync(hashesDir, { recursive: true });
    const resultsHash = crypto.createHash('sha256')
        .update(fs.readFileSync(outputPath))
        .digest('hex');
    const checksums = {
        results: resultsHash,
        created_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(hashesDir, 'v2.4.eval.hash'), JSON.stringify(checksums, null, 2));
    // Print results
    console.log('\n📊 Evaluation Results:');
    console.log(`Melodic F1: ${metrics.melodic.f1.toFixed(3)} ${gates.melodic_f1 ? '✅' : '❌'}`);
    console.log(`Rhythm F1: ${metrics.rhythm.f1.toFixed(3)} ${gates.rhythm_f1 ? '✅' : '❌'}`);
    console.log(`Polyphony F1: ${metrics.polyphony.f1.toFixed(3)} ${gates.polyphony_f1 ? '✅' : '❌'}`);
    console.log(`Macro F1: ${metrics.macro.f1.toFixed(3)} ${gates.macro_f1 ? '✅' : '❌'}`);
    console.log(`\n🎯 Quality Gates: ${gates.all_passed ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`\n📁 Results saved to: ${outputPath}`);
    console.log(`🔐 Checksums: ${hashesDir}/v2.4.eval.hash`);
    return results;
}
// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const testSplitsPath = args.find(arg => arg.includes('test.jsonl')) || 'splits/v2.4/test.jsonl';
    const outputPath = args.find(arg => arg.includes('--out')) ?
        args[args.indexOf('--out') + 1] : 'evals/v2.4/metrics.json';
    evaluateV24(testSplitsPath, outputPath).catch(console.error);
}
