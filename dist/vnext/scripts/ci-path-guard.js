"use strict";
// vnext/scripts/ci-path-guard.ts
// CI path guard to prevent revival of deleted legacy files and maintain clean architecture
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPathGuard = runPathGuard;
exports.addToTombstone = addToTombstone;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
// Legacy tombstone - files and patterns that must never be revived
const LEGACY_TOMBSTONE = {
    // Deleted legacy files that should never return
    deletedFiles: [
        'public/legacy-wheel.js',
        'public/old-audio-engine.js',
        'public/deprecated-planner.js',
        'routes/legacy-api.js',
        'scripts/old-generator.js',
        'lib/legacy-auth.js',
        'lib/old-database.js'
    ],
    // Dangerous patterns that indicate legacy code creep
    dangerousPatterns: [
        {
            pattern: /legacy[_-]?/i,
            description: 'Legacy prefixed files/variables',
            allowedExceptions: ['archive/', 'docs/', 'LEGACY.md', 'legacy-tombstone']
        },
        {
            pattern: /deprecated[_-]?/i,
            description: 'Deprecated prefixed files/variables',
            allowedExceptions: ['archive/', 'docs/', 'DEPRECATED.md']
        },
        {
            pattern: /old[_-]?/i,
            description: 'Old prefixed files/variables',
            allowedExceptions: ['oldValue', 'threshold', 'manifold', 'household']
        },
        {
            pattern: /backup[_-]?/i,
            description: 'Backup files',
            allowedExceptions: ['docs/', '.gitignore']
        },
        {
            pattern: /temp[_-]?/i,
            description: 'Temporary files',
            allowedExceptions: ['template', 'tempo', 'temporary', 'attempt']
        }
    ],
    // Import patterns that indicate legacy dependencies
    forbiddenImports: [
        {
            pattern: /from\s+['"]\.\.\/legacy\//,
            description: 'Imports from legacy directory'
        },
        {
            pattern: /require\(['"]\.\.\/legacy\//,
            description: 'Requires from legacy directory'
        },
        {
            pattern: /from\s+['"]legacy-/,
            description: 'Imports from legacy modules'
        },
        {
            pattern: /require\(['"]legacy-/,
            description: 'Requires from legacy modules'
        }
    ],
    // Architecture violations
    architectureViolations: [
        {
            pattern: /public\/.*\.ts$/,
            description: 'TypeScript files in public directory (should be JS)',
            allowedExceptions: []
        },
        {
            pattern: /vnext\/.*\/legacy/,
            description: 'Legacy directories in vNext',
            allowedExceptions: []
        },
        {
            pattern: /routes\/.*\.ts$/,
            description: 'TypeScript files in routes (should be JS or moved to vnext)',
            allowedExceptions: []
        }
    ]
};
// Get list of changed files from git
function getChangedFiles() {
    try {
        // Get files changed in this commit/PR
        const gitCommand = process.env.CI_COMMIT_SHA
            ? `git diff --name-only ${process.env.CI_COMMIT_SHA}^ ${process.env.CI_COMMIT_SHA}`
            : 'git diff --name-only HEAD^ HEAD';
        const output = (0, child_process_1.execSync)(gitCommand, { encoding: 'utf8', cwd: process.cwd() });
        return output.trim().split('\n').filter(Boolean);
    }
    catch (error) {
        console.warn('Could not get changed files from git, checking all files:', error.message);
        return getAllFiles();
    }
}
// Get all files in the repository
function getAllFiles(dir = process.cwd(), files = []) {
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        const relativePath = path_1.default.relative(process.cwd(), fullPath);
        // Skip node_modules, .git, and other ignored directories
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
        }
        if (entry.isDirectory()) {
            getAllFiles(fullPath, files);
        }
        else {
            files.push(relativePath);
        }
    }
    return files;
}
// Check for deleted file revival
function checkDeletedFiles(files) {
    const violations = [];
    for (const deletedFile of LEGACY_TOMBSTONE.deletedFiles) {
        if (files.includes(deletedFile) && fs_1.default.existsSync(deletedFile)) {
            violations.push({
                type: 'deleted_file',
                file: deletedFile,
                description: `Deleted legacy file has been revived: ${deletedFile}`,
                severity: 'error'
            });
        }
    }
    return violations;
}
// Check for dangerous patterns in file names
function checkDangerousPatterns(files) {
    const violations = [];
    for (const file of files) {
        for (const { pattern, description, allowedExceptions } of LEGACY_TOMBSTONE.dangerousPatterns) {
            if (pattern.test(file)) {
                // Check if this is an allowed exception
                const isException = allowedExceptions.some(exception => file.includes(exception) || file.startsWith(exception));
                if (!isException) {
                    violations.push({
                        type: 'dangerous_pattern',
                        file,
                        description: `${description}: ${file}`,
                        severity: 'warning'
                    });
                }
            }
        }
    }
    return violations;
}
// Check for forbidden imports in file contents
function checkForbiddenImports(files) {
    const violations = [];
    for (const file of files) {
        if (!fs_1.default.existsSync(file))
            continue;
        // Only check source files
        const ext = path_1.default.extname(file);
        if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext))
            continue;
        try {
            const content = fs_1.default.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                for (const { pattern, description } of LEGACY_TOMBSTONE.forbiddenImports) {
                    if (pattern.test(line)) {
                        violations.push({
                            type: 'forbidden_import',
                            file,
                            line: i + 1,
                            description: `${description}: ${line.trim()}`,
                            content: line.trim(),
                            severity: 'error'
                        });
                    }
                }
            }
        }
        catch (error) {
            console.warn(`Could not read file ${file}:`, error.message);
        }
    }
    return violations;
}
// Check for architecture violations
function checkArchitectureViolations(files) {
    const violations = [];
    for (const file of files) {
        for (const { pattern, description, allowedExceptions } of LEGACY_TOMBSTONE.architectureViolations) {
            if (pattern.test(file)) {
                // Check if this is an allowed exception
                const isException = allowedExceptions.some(exception => file.includes(exception) || file.startsWith(exception));
                if (!isException) {
                    violations.push({
                        type: 'architecture_violation',
                        file,
                        description: `${description}: ${file}`,
                        severity: 'error'
                    });
                }
            }
        }
    }
    return violations;
}
// Main path guard function
function runPathGuard() {
    console.log('🛡️  Running CI Path Guard');
    console.log('='.repeat(50));
    const files = getChangedFiles();
    console.log(`📁 Checking ${files.length} changed files...`);
    const violations = [];
    // Run all checks
    violations.push(...checkDeletedFiles(files));
    violations.push(...checkDangerousPatterns(files));
    violations.push(...checkForbiddenImports(files));
    violations.push(...checkArchitectureViolations(files));
    // Categorize violations
    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');
    // Report violations
    if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach(violation => {
            console.log(`   ${violation.file}${violation.line ? `:${violation.line}` : ''}`);
            console.log(`   ${violation.description}`);
            if (violation.content) {
                console.log(`   Content: ${violation.content}`);
            }
            console.log('');
        });
    }
    if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        warnings.forEach(violation => {
            console.log(`   ${violation.file}${violation.line ? `:${violation.line}` : ''}`);
            console.log(`   ${violation.description}`);
            console.log('');
        });
    }
    const passed = errors.length === 0;
    console.log('='.repeat(50));
    console.log(`🎯 Path Guard Results: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Files Checked: ${files.length}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    if (!passed) {
        console.log('\n💡 To fix:');
        console.log('   1. Remove or rename files with legacy/deprecated patterns');
        console.log('   2. Update imports to use vNext modules');
        console.log('   3. Follow the single-engine architecture');
        console.log('   4. Add exceptions to ci-path-guard.ts if needed');
    }
    return {
        passed,
        violations,
        summary: {
            errors: errors.length,
            warnings: warnings.length,
            filesChecked: files.length
        }
    };
}
// Update legacy tombstone (for maintenance)
function addToTombstone(filePath, reason) {
    console.log(`⚰️  Adding ${filePath} to legacy tombstone: ${reason}`);
    // This would update the tombstone file in a real implementation
    // For now, just log the addition
    console.log(`   Add to LEGACY_TOMBSTONE.deletedFiles: '${filePath}'`);
    console.log(`   Reason: ${reason}`);
}
// CLI interface
if (require.main === module) {
    const command = process.argv[2];
    if (command === 'check' || !command) {
        const results = runPathGuard();
        process.exit(results.passed ? 0 : 1);
    }
    else if (command === 'tombstone') {
        const filePath = process.argv[3];
        const reason = process.argv[4] || 'Legacy file removal';
        if (!filePath) {
            console.error('Usage: npm run ci-path-guard tombstone <file-path> [reason]');
            process.exit(1);
        }
        addToTombstone(filePath, reason);
    }
    else {
        console.log('Usage:');
        console.log('  npm run ci-path-guard [check]              - Run path guard checks');
        console.log('  npm run ci-path-guard tombstone <file>     - Add file to tombstone');
    }
}
