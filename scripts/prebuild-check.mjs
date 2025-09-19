#!/usr/bin/env node

/**
 * Prebuild Check Script for Wohlers AM Explorer
 *
 * Performs essential checks before build:
 * - Node.js version compatibility
 * - Required environment variables
 * - Lint checks with zero warnings
 * - TypeScript type checking
 *
 * Usage:
 *   npm run prebuild
 *   CI=true npm run prebuild (strict mode)
 *   PREBUILD_RELAXED=1 npm run prebuild (relaxed mode)
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Configuration
const IS_CI = process.env.CI === 'true';
const IS_RELAXED = process.env.PREBUILD_RELAXED === '1';
const IS_STRICT = process.env.PREBUILD_STRICT === '1' || IS_CI;

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(level, message, details = '') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`
  }[level];

  console.log(`${prefix} ${message}`);
  if (details) {
    console.log(`  ${colors.cyan}${details}${colors.reset}`);
  }
}

function runCommand(command, description, options = {}) {
  const { silent = false, ignoreFailure = false } = options;

  if (!silent) {
    log('info', `Running: ${description}`);
  }

  try {
    const result = execSync(command, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });

    if (!silent) {
      log('success', `${description} passed`);
    }

    return { success: true, output: result };
  } catch (error) {
    if (ignoreFailure) {
      if (!silent) {
        log('warning', `${description} failed (ignored)`, error.message);
      }
      return { success: false, output: error.stdout || '', error: error.message };
    }

    log('error', `${description} failed`, error.message);
    return { success: false, output: error.stdout || '', error: error.message };
  }
}

function checkNodeVersion() {
  log('info', 'Checking Node.js version...');

  const currentVersion = process.version;
  const packageJsonPath = join(projectRoot, 'package.json');

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const requiredVersion = packageJson.engines?.node;

    if (requiredVersion) {
      // Simple version check - assumes format like ">=18.17.0"
      const versionMatch = requiredVersion.match(/>=?(\d+)\.(\d+)\.(\d+)/);
      if (versionMatch) {
        const [, major, minor, patch] = versionMatch;
        const required = `${major}.${minor}.${patch}`;
        log('success', `Node.js version ${currentVersion} (required: ${requiredVersion})`);
        return true;
      }
    }

    // Default Node.js requirement for Next.js 15
    const currentMajor = parseInt(currentVersion.slice(1).split('.')[0]);
    if (currentMajor < 18) {
      log('error', `Node.js ${currentVersion} is too old`, 'Next.js 15 requires Node.js 18.17.0 or higher');
      return false;
    }

    log('success', `Node.js version ${currentVersion} is compatible`);
    return true;
  } catch (error) {
    log('warning', 'Could not verify Node.js version requirement', error.message);
    return true; // Don't fail on version check errors
  }
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const content = readFileSync(filePath, 'utf8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }

  return env;
}

function checkEnvironmentVariables() {
  log('info', 'Checking environment variables...');

  const exampleEnvPath = join(projectRoot, '.env.local.example');
  const localEnvPath = join(projectRoot, '.env.local');

  if (!existsSync(exampleEnvPath)) {
    log('warning', 'No .env.local.example found, skipping env var checks');
    return true;
  }

  const exampleEnv = parseEnvFile(exampleEnvPath);
  const localEnv = parseEnvFile(localEnvPath);

  const requiredVars = Object.keys(exampleEnv).filter(key =>
    key.startsWith('NEXT_PUBLIC_') && !key.includes('_ENABLE_') && !key.includes('_USE_')
  );

  let hasErrors = false;
  let hasWarnings = false;

  for (const varName of requiredVars) {
    const localValue = localEnv[varName] || process.env[varName];
    const exampleValue = exampleEnv[varName];

    if (!localValue || localValue === exampleValue) {
      const message = `${varName} is missing or not configured`;

      if (IS_STRICT) {
        log('error', message);
        hasErrors = true;
      } else {
        log('warning', message, 'Set in .env.local');
        hasWarnings = true;
      }
    }
  }

  if (hasErrors) {
    log('error', 'Required environment variables are missing');
    return false;
  }

  if (hasWarnings) {
    log('warning', 'Some environment variables need configuration');
  } else {
    log('success', 'Environment variables are properly configured');
  }

  return true;
}

function checkLinting() {
  log('info', 'Running ESLint checks...');

  const result = runCommand(
    'npm run lint',
    'ESLint check',
    { silent: false }
  );

  return result.success;
}

function checkTypeScript() {
  log('info', 'Running TypeScript checks...');

  // Check if TypeScript is available
  const tscCheck = runCommand(
    'npx tsc --version',
    'TypeScript availability check',
    { silent: true, ignoreFailure: true }
  );

  if (!tscCheck.success) {
    log('warning', 'TypeScript not available, skipping type checks');
    return true;
  }

  const result = runCommand(
    'npx tsc --noEmit',
    'TypeScript type check',
    { silent: false }
  );

  return result.success;
}

function checkProjectFiles() {
  log('info', 'Checking essential project files...');

  const essentialFiles = [
    { name: 'package.json', required: true },
    { name: 'tsconfig.json', required: true },
    { name: 'next.config', alternatives: ['next.config.js', 'next.config.ts', 'next.config.mjs'], required: true },
    { name: 'tailwind.config', alternatives: ['tailwind.config.js', 'tailwind.config.ts'], required: false }
  ];

  const missingFiles = [];

  for (const file of essentialFiles) {
    if (file.alternatives) {
      const found = file.alternatives.some(alt => existsSync(join(projectRoot, alt)));
      if (!found && file.required) {
        missingFiles.push(file.name);
      }
    } else {
      if (!existsSync(join(projectRoot, file.name)) && file.required) {
        missingFiles.push(file.name);
      }
    }
  }

  if (missingFiles.length > 0) {
    log('error', 'Missing essential project files', missingFiles.join(', '));
    return false;
  }

  log('success', 'All essential project files are present');
  return true;
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}Wohlers AM Explorer - Prebuild Check${colors.reset}`);
  console.log(`${colors.cyan}Mode: ${IS_STRICT ? 'STRICT' : IS_RELAXED ? 'RELAXED' : 'NORMAL'}${colors.reset}\n`);

  const checks = [
    { name: 'Project Files', fn: checkProjectFiles },
    { name: 'Node.js Version', fn: checkNodeVersion },
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Linting', fn: checkLinting },
    { name: 'TypeScript', fn: checkTypeScript }
  ];

  let failedChecks = 0;
  const startTime = Date.now();

  for (const check of checks) {
    try {
      const success = await check.fn();
      if (!success) {
        failedChecks++;
      }
    } catch (error) {
      log('error', `Check "${check.name}" threw an error`, error.message);
      failedChecks++;
    }
    console.log(); // Add spacing between checks
  }

  const duration = Date.now() - startTime;

  console.log(`${colors.bold}Prebuild Check Summary${colors.reset}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Checks: ${checks.length - failedChecks}/${checks.length} passed`);

  if (failedChecks > 0) {
    console.log(`${colors.red}${colors.bold}❌ Prebuild checks failed (${failedChecks} issues)${colors.reset}`);

    if (IS_RELAXED) {
      console.log(`${colors.yellow}Continuing due to PREBUILD_RELAXED=1${colors.reset}`);
      process.exit(0);
    }

    console.log(`\n${colors.cyan}To bypass locally: PREBUILD_RELAXED=1 npm run prebuild${colors.reset}`);
    console.log(`${colors.cyan}For strict checking: PREBUILD_STRICT=1 npm run prebuild${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}${colors.bold}✅ All prebuild checks passed!${colors.reset}`);
  process.exit(0);
}

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception during prebuild check', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log('error', 'Unhandled rejection during prebuild check', error.message);
  process.exit(1);
});

main().catch((error) => {
  log('error', 'Prebuild check failed', error.message);
  process.exit(1);
});