#!/usr/bin/env node

/**
 * Interactive installer for Ghost Security MCP Server
 * Prompts for API key and optional repository ID, then configures Claude Code
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════════╗', colors.cyan);
  log('║    Ghost Security MCP Server - Interactive Installer     ║', colors.cyan);
  log('╚═══════════════════════════════════════════════════════════╝', colors.cyan);
  console.log();

  // Check if build exists
  const distPath = join(process.cwd(), 'dist', 'index.js');
  if (!existsSync(distPath)) {
    log('⚠ Building project first...', colors.yellow);
    try {
      execSync('npm run build', { stdio: 'inherit' });
      log('✓ Build completed', colors.green);
      console.log();
    } catch (error) {
      log('✗ Build failed. Please run npm run build manually.', colors.red);
      process.exit(1);
    }
  }

  // Prompt for API key
  log('Enter your Ghost Security API key:', colors.bright);
  log('(Get your API key from https://app.ghostsecurity.ai/integrations/keys)', colors.blue);
  const apiKey = await question('API Key: ');

  if (!apiKey || !apiKey.trim()) {
    log('✗ API key is required', colors.red);
    process.exit(1);
  }

  console.log();

  // Prompt for optional repository ID
  log('Enter a repository ID to scope to a specific repository (optional):', colors.bright);
  log('(Leave empty to access all repositories)', colors.blue);
  const repoId = await question('Repository ID (optional): ');

  console.log();
  log('Configuring Ghost Security MCP Server for Claude Code...', colors.cyan);
  console.log();

  try {
    // Add to Claude Code
    log('1. Adding MCP server to Claude Code...', colors.blue);
    const serverPath = resolve(distPath);
    execSync(`claude mcp add --transport stdio --scope user ghost-security -- node "${serverPath}"`, {
      stdio: 'pipe'
    });
    log('   ✓ Server added', colors.green);

    // Update configuration with environment variables
    log('2. Configuring environment variables...', colors.blue);
    const configPath = join(homedir(), '.claude.json');

    if (!existsSync(configPath)) {
      log('   ✗ Claude Code config file not found', colors.red);
      log('   Please make sure Claude Code is installed', colors.yellow);
      process.exit(1);
    }

    const config = JSON.parse(readFileSync(configPath, 'utf8'));

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    if (!config.mcpServers['ghost-security']) {
      config.mcpServers['ghost-security'] = {};
    }

    // Set environment variables
    config.mcpServers['ghost-security'].env = {
      GHOST_SECURITY_API_KEY: apiKey.trim(),
      GHOST_SECURITY_BASE_URL: 'https://api.ghostsecurity.ai/v2'
    };

    if (repoId && repoId.trim()) {
      config.mcpServers['ghost-security'].env.GHOST_SECURITY_REPO_ID = repoId.trim();
    }

    // Write config back
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    log('   ✓ Environment variables configured', colors.green);

    console.log();
    log('╔═══════════════════════════════════════════════════════════╗', colors.green);
    log('║              Installation completed successfully!         ║', colors.green);
    log('╚═══════════════════════════════════════════════════════════╝', colors.green);
    console.log();

    log('Configuration saved to:', colors.bright);
    log(`  ${configPath}`, colors.cyan);
    console.log();

    log('Server path:', colors.bright);
    log(`  ${serverPath}`, colors.cyan);
    console.log();

    log('Verify installation with:', colors.bright);
    log('  claude mcp list', colors.yellow);
    console.log();

    log('The server will be available in your next Claude Code session.', colors.blue);
    console.log();

  } catch (error) {
    console.log();
    log('✗ Installation failed:', colors.red);
    log(error.message, colors.red);
    console.log();
    log('Please try manual installation:', colors.yellow);
    log('  ./setup-claude-code.sh YOUR_API_KEY', colors.yellow);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(error => {
  log('✗ Unexpected error:', colors.red);
  console.error(error);
  process.exit(1);
});
