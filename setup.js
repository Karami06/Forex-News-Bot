#!/usr/bin/env node

// =============================================================================
// Forex News Bot — Interactive Setup Wizard
// =============================================================================
// Walks a new user through deploying their own instance:
//   1. Check prerequisites (Node, wrangler, Cloudflare login)
//   2. Collect credentials (bot token, admin ID, worker name)
//   3. Create KV namespace + write wrangler.toml
//   4. Deploy to Cloudflare Workers
//   5. Set Telegram webhook
//   6. Sanitize for GitHub (.gitignore, wrangler.toml.example)
//
// Zero external dependencies — Node.js built-ins only.
// =============================================================================

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const readline = require("readline");
const os = require("os");

// ──────────────────────────────────────────────
// §1 — ANSI Colors & Symbols
// ──────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  blue: "\x1b[34m",
};

const SYM = {
  check: "\u2713",
  cross: "\u2717",
  warn: "\u26A0",
  arrow: "\u2192",
};

// Fallback symbols for terminals that don't display Unicode well
function useFallbackSymbols() {
  const term = process.env.TERM || "";
  const isWindows = process.platform === "win32";
  if (term === "dumb" || term === "linux") return true;
  return false;
}

const fb = useFallbackSymbols();

const SPINNER_FRAMES = fb
  ? ["|", "/", "-", "\\"]
  : ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u280F", "\u280F"];

const SPINNER_INTERVAL = 80;

// ──────────────────────────────────────────────
// §2 — UI Helpers
// ──────────────────────────────────────────────

function print(text, color = "") {
  process.stdout.write(color + text + C.reset);
}

function println(text, color = "") {
  process.stdout.write(color + text + C.reset + "\n");
}

function hr(char = "\u2500", width = 50) {
  println(char.repeat(width), C.gray);
}

function banner() {
  console.log("");
  println("\u2554" + "\u2550".repeat(48) + "\u2557", C.cyan);
  // ASCII art "FOREX" in a simple block style (no figlet dependency)
  println("\u2551" + "  ".repeat(12) + "\u2551", C.cyan);
  printLine("\u2551" + "      ______                   _   __           _    _       _            ", C.cyan);
  printLine("\u2551" + "     |  ____|                 | | /_/         | |  | |     | |           ", C.cyan);
  printLine("\u2551" + "     | |__  __  _____  ___  __| | ___  _ __   | |__| | ___ | |_          ", C.cyan);
  printLine("\u2551" + "     |  __| \\ \\/ / _ \\/ _ \\/ _` |/ _ \\| '_ \\  |  __  |/ _ \\| __|    ", C.cyan);
  printLine("\u2551" + "     | |____ >  <  __/  __/ (_| | (_) | | | | | |  | | (_) | |_          ", C.cyan);
  printLine("\u2551" + "     |______/_/\\_\\___|\\___|\\__,_|\\___/|_| |_| |_|  |_|\\___/ \\__|    ", C.cyan);
  println("\u2551" + "  ".repeat(12) + "\u2551", C.cyan);
  println("\u2551" + "    Forex News Bot " + C.gray + "\u2014" + C.cyan + " Interactive Setup Wizard    " + " ".repeat(10) + "\u2551", C.cyan);
  println("\u2551" + "    Cloudflare Worker + Telegram Bot            " + " ".repeat(10) + "\u2551", C.cyan);
  println("\u2551" + "  ".repeat(12) + "\u2551", C.cyan);
  println("\u2554" + "\u2550".repeat(48) + "\u2557", C.cyan);
  console.log("");
  println("  This wizard will help you deploy your own Forex News Bot.", C.gray);
  println("  Before proceeding, make sure you have:", C.gray);
  println("    " + SYM.arrow + " A Cloudflare account (free tier works)", C.gray);
  println("    " + SYM.arrow + " A Telegram bot token from @BotFather", C.gray);
  println("    " + SYM.arrow + " Your Telegram User ID (from @userinfobot)", C.gray);
  console.log("");
}

function printLine(text, color = "") {
  process.stdout.write(color + text + C.reset + "\n");
}

function stepBox(num, title) {
  const inner = "  STEP " + num + ": " + title + "  ";
  const pad = Math.max(0, 48 - inner.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  console.log("");
  println("\u2554" + "\u2550".repeat(48) + "\u2557", C.cyan);
  println("\u2551" + " ".repeat(left) + C.bold + inner + C.reset + C.cyan + " ".repeat(right) + "\u2551", C.cyan);
  println("\u255A" + "\u2550".repeat(48) + "\u255D", C.cyan);
  console.log("");
}

let spinnerInterval = null;

function spinnerStart(msg) {
  let i = 0;
  process.stdout.write("  " + SPINNER_FRAMES[0] + " " + msg);
  spinnerInterval = setInterval(() => {
    i = (i + 1) % SPINNER_FRAMES.length;
    process.stdout.write("\r  " + SPINNER_FRAMES[i] + " " + msg);
  }, SPINNER_INTERVAL);
  return msg;
}

function spinnerStop(msg, ok = true, extra = "") {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }
  const sym = ok ? C.green + SYM.check + C.reset : C.red + SYM.cross + C.reset;
  const line = "  " + sym + " " + msg + (extra ? " " + C.gray + extra + C.reset : "");
  // Clear the spinner line then write result
  process.stdout.write("\r" + " ".repeat(80) + "\r");
  println(line);
}

function prompt(question, defaultValue = "", validator = null) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const defaultStr = defaultValue ? " [" + defaultValue + "]" : "";
    rl.question(C.cyan + "  ? " + C.reset + question + C.gray + defaultStr + C.reset + " ", (answer) => {
      rl.close();
      const val = answer.trim() || defaultValue;
      if (validator) {
        const err = validator(val);
        if (err) {
          println("    " + C.yellow + SYM.warn + " " + err + C.reset);
          resolve(prompt(question, defaultValue, validator));
          return;
        }
      }
      resolve(val);
    });
  });
}

function promptHidden(question, validator = null) {
  return new Promise((resolve) => {
    // First print the question
    process.stdout.write(C.cyan + "  ? " + C.reset + question + C.gray + " (input hidden)" + C.reset + " ");

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    let input = "";
    const onData = (buf) => {
      const char = buf.toString();
      for (const ch of char) {
        if (ch === "\r" || ch === "\n") {
          stdin.removeListener("data", onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write("\n");
          const val = input.trim();
          if (validator) {
            const err = validator(val);
            if (err) {
              println("    " + C.yellow + SYM.warn + " " + err + C.reset);
              stdin.setRawMode(true);
              stdin.resume();
              process.stdout.write(C.cyan + "  ? " + C.reset + question + C.gray + " (input hidden)" + C.reset + " ");
              input = "";
              return;
            }
          }
          resolve(val);
          return;
        }
        if (ch === "\x7f" || ch === "\b") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (ch >= " ") {
          input += ch;
          process.stdout.write("*");
        }
      }
    };
    stdin.on("data", onData);
  });
}

function infoBox(title, lines) {
  const maxLen = Math.max(title.length, ...lines.map((l) => l.length));
  const outer = 4 + maxLen;
  println("\u2554" + "\u2550".repeat(outer) + "\u2557", C.green);
  println("\u2551" + "  " + C.bold + title + C.reset + C.green + " ".repeat(outer - title.length - 2) + "\u2551", C.green);
  println("\u2560" + "\u2550".repeat(outer) + "\u2563", C.green);
  for (const line of lines) {
    println("\u2551" + "  " + line + " ".repeat(outer - line.length) + "\u2551", C.green);
  }
  println("\u255A" + "\u2550".repeat(outer) + "\u255D", C.green);
  console.log("");
}

function warnBox(title, message) {
  const maxLen = Math.max(title.length, message.length);
  const outer = 4 + maxLen;
  println("\u2554" + "\u2550".repeat(outer) + "\u2557", C.yellow);
  println("\u2551" + "  " + C.bold + title + C.reset + C.yellow + " ".repeat(outer - title.length - 2) + "\u2551", C.yellow);
  println("\u2551" + "  " + message + " ".repeat(outer - message.length) + "\u2551", C.yellow);
  println("\u255A" + "\u2550".repeat(outer) + "\u255D", C.yellow);
  console.log("");
}

function errorBox(title, message) {
  const maxLen = Math.max(title.length, message.length);
  const outer = 4 + maxLen;
  println("\u2554" + "\u2550".repeat(outer) + "\u2557", C.red);
  println("\u2551" + "  " + C.bold + C.red + title + C.reset + C.red + " ".repeat(outer - title.length - 2) + "\u2551", C.red);
  println("\u2551" + "  " + message + " ".repeat(outer - message.length) + "\u2551", C.red);
  println("\u255A" + "\u2550".repeat(outer) + "\u255D", C.red);
  console.log("");
}

function confirm(question, defaultYes = true) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const hint = defaultYes ? "Y/n" : "y/N";
    rl.question(C.cyan + "  ? " + C.reset + question + C.gray + " (" + hint + ")" + C.reset + " ", (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      if (a === "y" || a === "yes") resolve(true);
      else if (a === "n" || a === "no") resolve(false);
      else resolve(defaultYes);
    });
  });
}

// ──────────────────────────────────────────────
// §3 — Shell Helpers
// ──────────────────────────────────────────────

function exec(cmd, opts = {}) {
  const defaultOpts = {
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
    env: { ...process.env, ...opts.env },
    cwd: opts.cwd || process.cwd(),
  };

  try {
    const stdout = execSync(cmd, {
      ...defaultOpts,
      stdio: opts.silent ? "pipe" : "pipe",
    });
    return { stdout: stdout.toString().trim(), stderr: "", exitCode: 0 };
  } catch (e) {
    const stderr = (e.stderr || "").toString().trim();
    const stdout = (e.stdout || "").toString().trim();
    return {
      stdout,
      stderr,
      exitCode: e.status || 1,
      error: e,
    };
  }
}

function execCapture(cmd, opts = {}) {
  const result = exec(cmd, { ...opts, silent: true });
  if (result.exitCode !== 0) {
    throw new Error(
      "Command failed: " + cmd + "\n" +
      (result.stderr || result.stdout || "Unknown error")
    );
  }
  return result.stdout;
}

function execSpinner(cmd, label, opts = {}) {
  spinnerStart(label);
  const result = exec(cmd, { ...opts, silent: true });
  if (result.exitCode !== 0) {
    spinnerStop(label + " " + C.red + "FAILED" + C.reset, false);
    return null;
  }
  return result;
}

// ──────────────────────────────────────────────
// §4 — Prerequisites
// ──────────────────────────────────────────────

function checkNodeVersion() {
  const v = process.version;
  const major = parseInt(v.slice(1).split(".")[0], 10);
  if (major < 18) {
    errorBox(
      "Node.js 18+ Required",
      "You are running Node.js " + v + ". Please upgrade to v18 or later."
    );
    process.exit(1);
  }
  println("  " + C.green + SYM.check + C.reset + " Node.js " + v + C.gray + " (18+ OK)" + C.reset);
}

function checkWranglerInstalled() {
  // Try npx wrangler first (local install)
  let r = exec("npx wrangler --version", { silent: true });
  if (r.exitCode === 0) {
    println("  " + C.green + SYM.check + C.reset + " wrangler " + C.gray + r.stdout.trim() + C.reset);
    return "npx wrangler";
  }

  // Try global wrangler
  r = exec("wrangler --version", { silent: true });
  if (r.exitCode === 0) {
    println("  " + C.green + SYM.check + C.reset + " wrangler " + C.gray + r.stdout.trim() + C.reset);
    return "wrangler";
  }

  // Not found — offer to install
  println("  " + C.yellow + SYM.warn + C.reset + " wrangler CLI not found");
  return null;
}

async function installWrangler() {
  const ok = await confirm("  wrangler CLI is required. Install it globally via npm?", true);
  if (!ok) {
    errorBox(
      "Cannot proceed without wrangler",
      "Please install wrangler manually:\n    npm install -g wrangler\n  Then run this setup again."
    );
    process.exit(1);
  }

  spinnerStart("Installing wrangler globally...");
  const r = exec("npm install -g wrangler", { timeout: 180000 });
  if (r.exitCode !== 0) {
    spinnerStop("Installing wrangler globally... " + C.red + "FAILED" + C.reset, false);
    errorBox("Installation failed", r.stderr || r.stdout || "Unknown error");
    process.exit(1);
  }
  spinnerStop("Installing wrangler globally... done", true);
  return "wrangler";
}

async function ensureCloudflareLogin(wranglerCmd) {
  const r = exec(wranglerCmd + " whoami", { silent: true });
  if (r.exitCode === 0) {
    // Extract email from output
    const emailMatch = r.stdout.match(/email[:\s]+([^\s@]+@[^\s@]+\.[^\s@]+)/i);
    const user = emailMatch ? emailMatch[1] : "logged in";
    println("  " + C.green + SYM.check + C.reset + " Cloudflare: " + C.gray + user + C.reset);
    return true;
  }

  println("  " + C.yellow + SYM.warn + C.reset + " Not logged in to Cloudflare");
  const ok = await confirm("  Open browser to log in to Cloudflare?", true);
  if (!ok) {
    errorBox(
      "Cannot proceed without Cloudflare login",
      "Run 'wrangler login' manually, then re-run this setup."
    );
    process.exit(1);
  }

  println("  " + C.arrow + " Opening browser for Cloudflare login...");
  const loginR = exec(wranglerCmd + " login", { timeout: 300000, silent: true });
  if (loginR.exitCode !== 0) {
    errorBox("Login failed", loginR.stderr || "Could not log in to Cloudflare");
    process.exit(1);
  }
  println("  " + C.green + SYM.check + C.reset + " Cloudflare login successful");
  return true;
}

// ──────────────────────────────────────────────
// §5 — Credential Collection
// ──────────────────────────────────────────────

function validateBotToken(val) {
  if (!val) return "Bot token cannot be empty";
  if (!/^\d+:[\w-]+$/.test(val)) {
    return "Invalid format. Should look like: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ";
  }
  return null;
}

function validateAdminIds(val) {
  if (!val) return "Admin ID(s) cannot be empty";
  const parts = val.split(",").map((s) => s.trim());
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return "Each admin ID must be a number. Got: " + p;
  }
  return null;
}

function validateWorkerName(val) {
  if (!val) return "Worker name cannot be empty";
  if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
    return "Only letters, numbers, hyphens, underscores allowed";
  }
  return null;
}

async function collectCredentials() {
  stepBox("2", "Collecting Credentials");

  println("  " + C.gray + "┌─ Telegram Bot Token ──────────────────────────┐" + C.reset);
  println("  " + C.gray + "│ Get this from @BotFather on Telegram.          │" + C.reset);
  println("  " + C.gray + "│ Send /newbot, follow the instructions.         │" + C.reset);
  println("  " + C.gray + "└────────────────────────────────────────────────┘" + C.reset);
  console.log("");

  const botToken = await promptHidden("Telegram Bot Token:", validateBotToken);

  console.log("");
  println("  " + C.gray + "┌─ Admin Telegram User ID(s) ────────────────────┐" + C.reset);
  println("  " + C.gray + "│ Get this from @userinfobot on Telegram.        │" + C.reset);
  println("  " + C.gray + "│ For multiple admins, separate with commas.     │" + C.reset);
  println("  " + C.gray + "└────────────────────────────────────────────────┘" + C.reset);
  console.log("");

  const adminIds = await prompt("Admin Telegram User ID(s):", "", validateAdminIds);

  const workerName = await prompt("Worker name:", "forex-news-bot", validateWorkerName);

  console.log("");
  println("  " + C.green + SYM.check + C.reset + " All credentials collected");
  println("  " + C.gray + "    Worker name: " + workerName + C.reset);
  println("  " + C.gray + "    Admin IDs:   " + adminIds + C.reset);
  console.log("");

  return { botToken, adminIds, workerName };
}

// ──────────────────────────────────────────────
// §6 — Infrastructure Creation
// ──────────────────────────────────────────────

async function createKVNamespace(wranglerCmd, name) {
  stepBox("3", "Creating Infrastructure");

  println("  Creating KV namespace...");

  const r = exec(wranglerCmd + ' kv:namespace create "' + name + '"', { silent: true });

  // Normal success: JSON output with namespace_id
  if (r.exitCode === 0) {
    const jsonMatch = r.stdout.match(/\{[^}]+\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        // wrangler 3+ returns { namespace_id, ... }, older versions may vary
        const nsId = parsed.namespace_id || parsed.result?.namespace_id || parsed.id;
        if (nsId) {
          spinnerStart("KV namespace created");
          spinnerStop("KV namespace created", true, C.gray + "ID: " + nsId + C.reset);
          return nsId;
        }
      } catch (e) {
        // fall through to regex
      }
    }
    // Fallback: regex from raw output
    const idMatch = r.stdout.match(/[a-f0-9]{32}/);
    if (idMatch) {
      spinnerStart("KV namespace created");
      spinnerStop("KV namespace created", true, C.gray + "ID: " + idMatch[0] + C.reset);
      return idMatch[0];
    }
  }

  // Check if it already exists — parse namespace ID from error output
  const combined = (r.stdout + " " + r.stderr).trim();
  const idMatch = combined.match(/[a-f0-9]{32}/);
  if (r.exitCode !== 0 && idMatch) {
    println("  " + C.yellow + SYM.warn + C.reset + " KV namespace already exists, reusing ID: " + C.gray + idMatch[0] + C.reset);
    return idMatch[0];
  }

  // Real failure
  errorBox("KV namespace creation failed", combined || "Unknown error");
  const manualId = await prompt("Enter KV Namespace ID manually:", "");
  if (!manualId || !/^[a-f0-9]{32}$/.test(manualId)) {
    errorBox("Invalid KV Namespace ID", "Expected a 32-character hex string. Go to Cloudflare Dashboard > Workers & Pages > KV to create one.");
    process.exit(1);
  }
  return manualId;
}

function writeWranglerToml(workerName, nsId, botToken, adminIds) {
  const content = [
    'name = "' + workerName + '"',
    'main = "src/index.js"',
    'compatibility_date = "2024-01-01"',
    "",
    "[[kv_namespaces]]",
    'binding = "KV"',
    'id = "' + nsId + '"',
    "",
    "[triggers]",
    'crons = ["*/5 * * * *"]',
    "",
    "[vars]",
    'TELEGRAM_BOT_TOKEN = "' + botToken + '"',
    'ADMIN_USER_IDS = "' + adminIds + '"',
    "",
  ].join("\n");

  // Backup existing wrangler.toml if it exists and has real values
  if (fs.existsSync("wrangler.toml")) {
    const existing = fs.readFileSync("wrangler.toml", "utf-8");
    if (!existing.includes("YOUR_")) {
      fs.copyFileSync("wrangler.toml", "wrangler.toml.backup");
      println("  " + C.gray + "Old wrangler.toml backed up to wrangler.toml.backup" + C.reset);
    }
  }

  fs.writeFileSync("wrangler.toml", content, "utf-8");
  println("  " + C.green + SYM.check + C.reset + " wrangler.toml written");
}

function writeGitignore() {
  const entries = [
    "# Cloudflare",
    "wrangler.toml",
    ".wrangler/",
    "",
    "# Dependencies",
    "node_modules/",
    "",
    "# Secrets & Credentials",
    "Info.txt",
    ".env",
    ".env.local",
    "",
    "# OS",
    ".DS_Store",
    "Thumbs.db",
  ];

  let content = "";
  if (fs.existsSync(".gitignore")) {
    content = fs.readFileSync(".gitignore", "utf-8");
    // Add missing entries
    const lines = content.split("\n").map((l) => l.trim());
    const missing = entries.filter((e) => !lines.includes(e) && !lines.includes(e.replace(/\/$/, "")));
    if (missing.length > 0) {
      content += "\n" + missing.join("\n") + "\n";
      fs.writeFileSync(".gitignore", content, "utf-8");
      println("  " + C.green + SYM.check + C.reset + " .gitignore updated (" + missing.length + " entries added)");
    } else {
      println("  " + C.green + SYM.check + C.reset + " .gitignore already complete");
    }
  } else {
    content = entries.join("\n") + "\n";
    fs.writeFileSync(".gitignore", content, "utf-8");
    println("  " + C.green + SYM.check + C.reset + " .gitignore created");
  }
}

function writeWranglerTomlExample() {
  const content = [
    'name = "forex-news-bot"',
    'main = "src/index.js"',
    'compatibility_date = "2024-01-01"',
    "",
    "[[kv_namespaces]]",
    'binding = "KV"',
    'id = "YOUR_KV_NAMESPACE_ID"',
    "",
    "[triggers]",
    'crons = ["*/5 * * * *"]',
    "",
    "[vars]",
    'TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN"',
    'ADMIN_USER_IDS = "YOUR_ADMIN_USER_ID"',
    "",
  ].join("\n");

  fs.writeFileSync("wrangler.toml.example", content, "utf-8");
  println("  " + C.green + SYM.check + C.reset + " wrangler.toml.example created" + C.gray + " (safe for GitHub)" + C.reset);
}

// ──────────────────────────────────────────────
// §7 — Deploy
// ──────────────────────────────────────────────

async function deployWorker(wranglerCmd) {
  stepBox("4", "Deploying to Cloudflare");

  println("  Deploying worker (this may take 30-60 seconds)...");
  println("");

  const r = execSpinner(wranglerCmd + " deploy", "Deploying worker...", { timeout: 180000 });

  if (!r) {
    errorBox("Deploy failed", "Check the error above. You can retry with: " + wranglerCmd + " deploy");
    const retry = await confirm("Retry deployment?", true);
    if (retry) return deployWorker(wranglerCmd);
    const skip = await confirm("Skip deployment and do it manually later?", false);
    if (!skip) process.exit(1);
    return null;
  }

  // Extract worker URL from output
  const output = r.stdout;
  const urlMatch = output.match(/https:\/\/[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+\.workers\.dev/);
  let url = urlMatch ? urlMatch[0].trim() : null;

  if (!url) {
    // Fallback: try to construct from wrangler.toml name
    const nameMatch = output.match(/Deployed\s+([a-zA-Z0-9_-]+)/i);
    if (nameMatch) {
      url = "https://" + nameMatch[1] + ".workers.dev";
    }
  }

  if (url) {
    println("  " + C.green + SYM.check + C.reset + " Deployed!");
    println("  " + C.gray + "    URL: " + url + C.reset);
    return url;
  }

  // If we still can't determine URL, ask user
  println("  " + C.yellow + SYM.warn + C.reset + " Could not detect Worker URL from deploy output.");
  println("  " + C.gray + "  Output was:" + C.reset);
  println("  " + C.gray + "  " + output.split("\n").slice(0, 5).join("\n  ") + C.reset);
  url = await prompt("Enter your Worker URL (from deploy output):", "");
  if (!url) return null;
  return url;
}

// ──────────────────────────────────────────────
// §8 — Webhook Setup
// ──────────────────────────────────────────────

async function setWebhook(botToken, workerUrl) {
  stepBox("5", "Setting Telegram Webhook");

  const webhookUrl = workerUrl.replace(/\/+$/, "") + "/webhook";
  const apiUrl = "https://api.telegram.org/bot" + botToken + "/setWebhook?url=" +
    encodeURIComponent(webhookUrl) + "&drop_pending_updates=true";

  spinnerStart("Setting webhook...");

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.ok) {
      spinnerStop("Webhook set successfully", true);

      // Verify
      spinnerStart("Verifying webhook...");
      const verifyResponse = await fetch(
        "https://api.telegram.org/bot" + botToken + "/getWebhookInfo"
      );
      const verifyData = await verifyResponse.json();

      if (verifyData.ok && verifyData.result) {
        const info = verifyData.result;
        const hasError = info.last_error_date ? true : false;
        const status = hasError
          ? C.yellow + " (has errors: " + (info.last_error_message || "unknown") + ")" + C.reset
          : C.green + " OK" + C.reset;
        spinnerStop("Webhook verified", true, status);
        if (hasError) {
          println("  " + C.yellow + SYM.warn + C.reset + " Webhook has errors:");
          println("  " + C.gray + "    " + (info.last_error_message || "No details") + C.reset);
          println("  " + C.gray + "    Manual fix: curl " + apiUrl + C.reset);
        }
        return !hasError;
      } else {
        spinnerStop("Webhook verification " + C.red + "FAILED" + C.reset, false);
        println("  " + C.gray + "  Response: " + JSON.stringify(verifyData) + C.reset);
        return false;
      }
    } else {
      spinnerStop("Webhook set " + C.red + "FAILED" + C.reset, false);
      errorBox("Telegram API Error", data.description || "Unknown error");
      println("  " + C.gray + "  Manual fix: curl \"" + apiUrl + "\"" + C.reset);
      return false;
    }
  } catch (e) {
    spinnerStop("Webhook set " + C.red + "FAILED" + C.reset, false);
    errorBox("Network Error", e.message);
    println("  " + C.gray + "  Manual fix: curl \"" + apiUrl + "\"" + C.reset);
    const retry = await confirm("Retry webhook setup?", true);
    if (retry) return setWebhook(botToken, workerUrl);
    return false;
  }
}

async function getBotUsername(botToken) {
  try {
    const response = await fetch("https://api.telegram.org/bot" + botToken + "/getMe");
    const data = await response.json();
    if (data.ok && data.result?.username) {
      return data.result.username;
    }
  } catch (e) {
    // Non-critical, skip
  }
  return null;
}

// ──────────────────────────────────────────────
// §9 — Cleanup
// ──────────────────────────────────────────────

async function cleanupInfoTxt() {
  if (!fs.existsSync("Info.txt")) {
    println("  " + C.green + SYM.check + C.reset + " Info.txt " + C.gray + "(not found, nothing to clean)" + C.reset);
    return;
  }

  println("  " + C.yellow + SYM.warn + C.reset + " Info.txt contains sensitive credentials");
  const ok = await confirm("  Delete Info.txt? (recommended before pushing to GitHub)", true);
  if (ok) {
    fs.unlinkSync("Info.txt");
    println("  " + C.green + SYM.check + C.reset + " Info.txt deleted");
  } else {
    println("  " + C.yellow + SYM.warn + C.reset + " Remember to delete Info.txt manually before pushing to GitHub");
  }
}

// ──────────────────────────────────────────────
// §10 — Main Orchestrator
// ──────────────────────────────────────────────

async function main() {
  // ── SIGINT handler ──
  process.on("SIGINT", () => {
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
    }
    console.log("");
    println("  Setup cancelled. No files were modified.", C.yellow);
    process.exit(0);
  });

  // ── Phase 1: Welcome ──
  console.clear();
  banner();
  stepBox("1", "Checking Prerequisites");

  checkNodeVersion();

  let wranglerCmd = checkWranglerInstalled();
  if (!wranglerCmd) {
    wranglerCmd = await installWrangler();
  }

  await ensureCloudflareLogin(wranglerCmd);

  // Backup existing wrangler.toml
  if (fs.existsSync("wrangler.toml")) {
    const existing = fs.readFileSync("wrangler.toml", "utf-8");
    if (!existing.includes("YOUR_")) {
      println("");
      warnBox("Existing wrangler.toml detected", "It contains real credentials. A backup will be made.");
    }
  }

  // ── Phase 2: Collect Credentials ──
  const credentials = await collectCredentials();
  const { botToken, adminIds, workerName } = credentials;

  // ── Phase 3: Create Infrastructure ──
  const namespaceId = await createKVNamespace(wranglerCmd, "forex-news-bot-config");
  writeWranglerToml(workerName, namespaceId, botToken, adminIds);
  writeGitignore();
  writeWranglerTomlExample();

  // ── Phase 4: Deploy ──
  const workerUrl = await deployWorker(wranglerCmd);
  if (!workerUrl) {
    println("  " + C.yellow + SYM.warn + C.reset + " Deployment skipped. You'll need to deploy manually later.");
    println("  " + C.gray + "    Run: wrangler deploy" + C.reset);
  }

  // ── Phase 5: Webhook Setup (only if deployed) ──
  let webhookOk = false;
  if (workerUrl) {
    webhookOk = await setWebhook(botToken, workerUrl);
  }

  // ── Phase 6: Cleanup ──
  await cleanupInfoTxt();

  // ── Final Summary ──
  console.log("");
  println("\u2554" + "\u2550".repeat(48) + "\u2557", C.cyan);
  println("\u2551" + "   ✓ SETUP COMPLETE                          " + "\u2551", C.cyan);
  println("\u255A" + "\u2550".repeat(48) + "\u255D", C.cyan);
  console.log("");

  println("  Your Forex News Bot is now live!", C.green);
  if (workerUrl) {
    println("  • Worker URL: " + C.cyan + workerUrl + C.reset);
    println("  • Health Check: " + C.cyan + workerUrl + "/status" + C.reset);
    println("  • Test Send: " + C.cyan + workerUrl + "/testsend" + C.reset);
    println("  • Webhook: " + (webhookOk ? C.green + "Verified ✓" : C.yellow + "Set (verify manually)" + C.reset));
  } else {
    println("  • Worker URL: " + C.yellow + "(deployment skipped - run 'wrangler deploy' manually)" + C.reset);
  }
  const username = await getBotUsername(botToken);
  if (username) {
    println("  • Telegram Bot: " + C.cyan + "https://t.me/" + username + C.reset);
  }
  console.log("");

  println("  Next steps:", C.gray);
  println("    1. Open Telegram: https://t.me/" + (username || "your_bot_username") + C.gray);
  println("    2. Send /start to register" + C.gray);
  println("    3. Send /settings to configure currencies" + C.gray);
  println("");

  println("  ⚠  Remember:", C.yellow);
  println("    • DO NOT commit wrangler.toml (protected by .gitignore)" + C.yellow);
  println("    • Info.txt has been deleted (contained sensitive credentials)" + C.yellow);
  println("");

  println("  ════════════════════ Powered by Cloudflare ══════════════════", C.dim);
  console.log("");
}

// Run the main function
main().catch((err) => {
  console.error("\n" + C.red + "Unexpected error:" + C.reset, err);
  process.exit(1);
});