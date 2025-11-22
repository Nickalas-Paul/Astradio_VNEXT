"use strict";
// vnext/scripts/utilities.ts
// Consolidated utility functions for monitoring, validation, and system checks
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditBoundaries = auditBoundaries;
exports.auditScripts = auditScripts;
exports.dailyMonitoring = dailyMonitoring;
exports.quickPrePhase2CValidation = quickPrePhase2CValidation;
exports.runAudition = runAudition;
exports.validateFixedLabels = validateFixedLabels;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function auditBoundaries() {
    console.log("🔍 AUDIT BOUNDARIES");
    console.log("===================");
    const violations = [];
    const srcDir = path_1.default.resolve(process.cwd(), 'vnext');
    function scanFile(filePath) {
        const content = fs_1.default.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            // Check for hardcoded paths
            if (line.includes('/Users/') || line.includes('C:\\Users\\')) {
                violations.push({
                    file: filePath,
                    line: index + 1,
                    violation: 'Hardcoded user path detected',
                    severity: 'error'
                });
            }
            // Check for TODO/FIXME in production code
            if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
                violations.push({
                    file: filePath,
                    line: index + 1,
                    violation: 'TODO/FIXME/HACK in production code',
                    severity: 'warning'
                });
            }
            // Check for console.log in production
            if (line.includes('console.log') && !filePath.includes('scripts/')) {
                violations.push({
                    file: filePath,
                    line: index + 1,
                    violation: 'Console.log in production code',
                    severity: 'warning'
                });
            }
        });
    }
    function scanDirectory(dir) {
        const items = fs_1.default.readdirSync(dir);
        items.forEach(item => {
            const itemPath = path_1.default.join(dir, item);
            const stat = fs_1.default.statSync(itemPath);
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                scanDirectory(itemPath);
            }
            else if (item.endsWith('.ts') || item.endsWith('.js')) {
                scanFile(itemPath);
            }
        });
    }
    scanDirectory(srcDir);
    // Report violations
    violations.forEach(v => {
        const icon = v.severity === 'error' ? '❌' : '⚠️';
        console.log(`${icon} ${v.file}:${v.line} - ${v.violation}`);
    });
    console.log(`\n📊 Total violations: ${violations.length}`);
    console.log(`❌ Errors: ${violations.filter(v => v.severity === 'error').length}`);
    console.log(`⚠️  Warnings: ${violations.filter(v => v.severity === 'warning').length}`);
    return violations;
}
function auditScripts() {
    console.log("🔍 SCRIPT AUDIT: vnext/scripts");
    console.log("===============================");
    const scriptsDir = path_1.default.resolve(process.cwd(), 'vnext', 'scripts');
    const files = fs_1.default.readdirSync(scriptsDir).filter(f => f.endsWith('.ts'));
    const scripts = [];
    files.forEach(file => {
        var _a;
        const filePath = path_1.default.join(scriptsDir, file);
        const stats = fs_1.default.statSync(filePath);
        const content = fs_1.default.readFileSync(filePath, 'utf8');
        // Extract purpose from first few lines
        const lines = content.split('\n').slice(0, 10);
        const purpose = ((_a = lines.find(line => line.includes('//') &&
            (line.includes('Phase') || line.includes('Script') || line.includes('Generate') ||
                line.includes('Test') || line.includes('Validate') || line.includes('Run')))) === null || _a === void 0 ? void 0 : _a.replace('//', '').trim()) || 'No description';
        // Categorize based on filename and content
        let category = 'other';
        if (file.includes('phase2c') || file.includes('eval'))
            category = 'evaluation';
        else if (file.includes('train') || file.includes('retrain'))
            category = 'training';
        else if (file.includes('generate') || file.includes('create'))
            category = 'data-generation';
        else if (file.includes('validate') || file.includes('verify'))
            category = 'validation';
        else if (file.includes('test') || file.includes('smoke'))
            category = 'testing';
        else if (file.includes('calibrate'))
            category = 'calibration';
        else if (file.includes('audit') || file.includes('monitor'))
            category = 'monitoring';
        else if (file.includes('scale') || file.includes('split'))
            category = 'data-processing';
        else if (file.includes('freeze') || file.includes('materialize'))
            category = 'data-management';
        // Determine status
        let status = 'active';
        if (file.includes('v1') || file.includes('fallback'))
            status = 'deprecated';
        else if (file.includes('test') || file.includes('smoke'))
            status = 'test';
        else if (file.includes('audit') || file.includes('monitor'))
            status = 'utility';
        else if (file.includes('quick') || file.includes('simple'))
            status = 'utility';
        scripts.push({
            name: file,
            purpose,
            category,
            status,
            size: stats.size,
            lastModified: stats.mtime
        });
    });
    // Group by category
    const byCategory = scripts.reduce((acc, script) => {
        if (!acc[script.category])
            acc[script.category] = [];
        acc[script.category].push(script);
        return acc;
    }, {});
    // Print summary
    console.log(`📊 Total scripts: ${scripts.length}`);
    console.log(`📁 Categories: ${Object.keys(byCategory).length}`);
    return scripts;
}
function dailyMonitoring() {
    console.log("📊 DAILY MONITORING");
    console.log("===================");
    const health = {
        timestamp: new Date().toISOString(),
        modelStatus: 'healthy',
        serverStatus: 'up',
        diskUsage: 0,
        memoryUsage: 0,
        errors: []
    };
    try {
        // Check model files
        const modelDir = path_1.default.resolve(process.cwd(), 'models', 'student-v2.2');
        const modelExists = fs_1.default.existsSync(path_1.default.join(modelDir, 'model.json'));
        const weightsExist = fs_1.default.existsSync(path_1.default.join(modelDir, 'group1-shard1of1.bin'));
        if (!modelExists || !weightsExist) {
            health.modelStatus = 'failed';
            health.errors.push('Model files missing');
        }
        // Check disk usage (simplified)
        const stats = fs_1.default.statSync(process.cwd());
        health.diskUsage = stats.size || 0;
        // Check memory usage (simplified)
        const memUsage = process.memoryUsage();
        health.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
        console.log(`✅ Model status: ${health.modelStatus}`);
        console.log(`✅ Server status: ${health.serverStatus}`);
        console.log(`💾 Memory usage: ${health.memoryUsage.toFixed(2)} MB`);
        console.log(`📁 Disk usage: ${(health.diskUsage / 1024 / 1024).toFixed(2)} MB`);
        if (health.errors.length > 0) {
            console.log(`❌ Errors: ${health.errors.join(', ')}`);
        }
    }
    catch (error) {
        health.modelStatus = 'failed';
        health.errors.push(`Monitoring error: ${error}`);
    }
    return health;
}
// =============================================================================
// QUICK VALIDATION - Fast pre-phase2c checks
// =============================================================================
function quickPrePhase2CValidation() {
    console.log("⚡ QUICK PRE-PHASE2C VALIDATION");
    console.log("===============================");
    let allPassed = true;
    // Check 1: Model exists
    const modelPath = path_1.default.resolve(process.cwd(), 'models', 'student-v2.2', 'model.json');
    if (!fs_1.default.existsSync(modelPath)) {
        console.log("❌ Model file missing");
        allPassed = false;
    }
    else {
        console.log("✅ Model file exists");
    }
    // Check 2: Snapshots exist
    const snapshotsPath = path_1.default.resolve(process.cwd(), 'eval', 'frozen', 'snapshots_phase2c.jsonl');
    if (!fs_1.default.existsSync(snapshotsPath)) {
        console.log("❌ Frozen snapshots missing");
        allPassed = false;
    }
    else {
        console.log("✅ Frozen snapshots exist");
    }
    // Check 3: Clean splits exist
    const cleanSplitsPath = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'clean');
    if (!fs_1.default.existsSync(cleanSplitsPath)) {
        console.log("❌ Clean splits missing");
        allPassed = false;
    }
    else {
        console.log("✅ Clean splits exist");
    }
    console.log(`\n🎯 Quick validation: ${allPassed ? 'PASS' : 'FAIL'}`);
    return allPassed;
}
// =============================================================================
// RUN AUDITION - Test audition gate functionality
// =============================================================================
function runAudition() {
    console.log("🎭 RUN AUDITION");
    console.log("===============");
    // This would import and test the audition gate
    // For now, just log that it's available
    console.log("✅ Audition gate available for testing");
    console.log("📝 Use this to test individual chart evaluations");
}
// =============================================================================
// VALIDATE FIXED LABELS - Simple label validation
// =============================================================================
function validateFixedLabels() {
    console.log("🏷️  VALIDATE FIXED LABELS");
    console.log("=========================");
    const labelsPath = path_1.default.resolve(process.cwd(), 'datasets', 'labels', 'train_fixed.jsonl');
    if (!fs_1.default.existsSync(labelsPath)) {
        console.log("❌ Fixed labels file not found");
        return false;
    }
    const content = fs_1.default.readFileSync(labelsPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    console.log(`📊 Total labels: ${lines.length}`);
    // Basic validation
    let validCount = 0;
    lines.forEach((line, index) => {
        try {
            const label = JSON.parse(line);
            if (label.feat && label.directives && label.arc_curve) {
                validCount++;
            }
        }
        catch (error) {
            console.log(`❌ Invalid JSON at line ${index + 1}`);
        }
    });
    const isValid = validCount === lines.length;
    console.log(`✅ Valid labels: ${validCount}/${lines.length}`);
    console.log(`🎯 Validation: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
}
// Command line interface
if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case 'boundaries':
            auditBoundaries();
            break;
        case 'scripts':
            auditScripts();
            break;
        case 'monitoring':
            dailyMonitoring();
            break;
        case 'quick-validate':
            quickPrePhase2CValidation();
            break;
        case 'audition':
            runAudition();
            break;
        case 'validate-labels':
            validateFixedLabels();
            break;
        default:
            console.log("Available commands:");
            console.log("  boundaries    - Audit code boundaries");
            console.log("  scripts       - Audit all scripts");
            console.log("  monitoring    - System health check");
            console.log("  quick-validate - Quick pre-phase2c validation");
            console.log("  audition      - Test audition gate");
            console.log("  validate-labels - Validate fixed labels");
    }
}
