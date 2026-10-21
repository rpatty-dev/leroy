#!/usr/bin/env node
// Leroy 🐇 - chill lop-eared autonomous coding & reverse engineering agent CLI
// Powered by LeroyObliterated (llama.cpp) with RTK (Token Compression), REA, Ponytail & Taste skills.

const fs = require('fs');
const path = require('path');
const os = require('os');
const notion = require('../lib/notion.js');
const readline = require('readline');
const { spawn, spawnSync } = require('child_process');

const PORT = 8080;
const API = `http://127.0.0.1:${PORT}/v1`;
const LEROY_DIR = path.join(os.homedir(), '.leroy');
const LEGACY_LLM = path.join(os.homedir(), 'Documents', 'LocalLLM');

function resolveModelPath(primaryName, fallbackName) {
  const candidates = [
    path.join(LEROY_DIR, 'models', primaryName),
    path.join(LEROY_DIR, 'models', fallbackName),
    path.join(LEGACY_LLM, 'models', primaryName),
    path.join(LEGACY_LLM, 'models', fallbackName)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

const MODELS = {
  main: resolveModelPath('LeroyObliterated.gguf', 'LeroyObliterated.Q4_K_M.gguf'),
  fast: resolveModelPath('LeroyObliterated.gguf', 'Qwen2.5-Coder-3B-Instruct.gguf'),
  strong: resolveModelPath('Qwen2.5-Coder-7B-Instruct-abliterated-Q4_K_M.gguf', 'Qwen2.5-Coder-7B-Instruct-abliterated.gguf')
};
const REPOS = path.join(os.homedir(), '.leroy', 'repos');
const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'target', '__pycache__', '.venv', 'vendor']);

// Terminal ANSI colors - Meadow & Twilight theme
const c = (rgb, s) => `\x1b[38;2;${rgb}m${s}\x1b[0m`;
const meadow = s => c('134;239;172', s);  // clover green (#86efac)
const flower = s => c('244;114;182', s);  // wildflower pink (#f472b6)
const carrot = s => c('251;146;60', s);   // carrot orange (#fb923c)
const butter = s => c('254;240;138', s);  // dandelion yellow (#fef08a)
const sky = s => c('125;211;252', s);     // soft spring sky (#7dd3fc)
const cream = s => c('245;245;244', s);   // warm cream (#f5f5f4)
const earth = s => c('168;162;158', s);   // loam / stone (#a8a29e)
const dim = s => c('120;113;108', s);     // soft soil (#78716c)
const red = s => c('252;165;165', s);     // berry red (#fca5a5)

const BANNER = `
${meadow('        🌾  🌸        🌿       🌼       🌷   🌾')}
${sky('         (\\__/ )')}
${sky("         (='.'= )")}   ${cream('L E R O Y')}  ${carrot('🥕')}  ${butter('v2.0')}
${sky('         (")_(" )')}   ${earth('Chill local offline agent in the meadow')}
${meadow('      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')}
${dim('       Metal GPU / AVX  •  RTK Compression  •  Ponytail  •  REA')}
`;

function parseArgs(argv) {
  const o = { target: null, fast: false, strong: false, yes: false, ctx: 4096 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fast') o.fast = true;
    else if (a === '--strong') o.strong = true;
    else if (a === '--yes' || a === '-y') o.yes = true;
    else if (a === '--ctx') o.ctx = parseInt(argv[++i], 10) || 4096;
    else if (a === '-h' || a === '--help') o.help = true;
    else if (!o.target) o.target = a;
  }
  return o;
}

function githubSlug(t) {
  if (!t) return null;
  let m = t.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#?].*)?$/i);
  if (m) return { owner: m[1], repo: m[2] };
  if (!fs.existsSync(t) && (m = t.match(/^([\w.-]+)\/([\w.-]+)$/))) return { owner: m[1], repo: m[2] };
  return null;
}

function git(args, cwd) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function findLocalRepo(name) {
  const norm = name.toLowerCase().replace(/[\s_]/g, '-');
  const searchCandidates = [
    process.cwd(),
    path.join(os.homedir(), norm),
    path.join(os.homedir(), 'Desktop', norm),
    path.join(os.homedir(), 'Documents', norm),
    path.join(os.homedir(), 'Developer', norm),
    path.join(os.homedir(), 'Projects', norm),
    path.join(os.homedir(), 'repos', norm),
    path.join(REPOS, norm)
  ];
  for (const c of searchCandidates) {
    if (fs.existsSync(path.join(c, '.git')) || fs.existsSync(path.join(c, 'package.json'))) return c;
  }
  return null;
}

function resolveRoot(target) {
  if (target) {
    const local = findLocalRepo(target);
    if (local) return local;
  }
  const slug = githubSlug(target);
  if (!slug) {
    const p = path.resolve(target || process.cwd());
    if (!fs.existsSync(p)) die(`Leroy can't find ${p} 🐇`);
    // If user launched from home directory and no repo is in ~, check if ~/leroy exists as default coding meadow
    if (p === os.homedir()) {
      const defaultMeadow = path.join(os.homedir(), 'leroy');
      if (fs.existsSync(path.join(defaultMeadow, '.git'))) {
        return defaultMeadow;
      }
    }
    return p;
  }
  const dest = path.join(REPOS, `${slug.owner}__${slug.repo}`);
  if (git(['--version']).error) die('git not found on PATH. Please install git.');
  if (fs.existsSync(path.join(dest, '.git'))) {
    console.log(dim(`🥕 Hopped into meadow burrow for ${slug.owner}/${slug.repo}`));
  } else {
    fs.mkdirSync(REPOS, { recursive: true });
    console.log(sky(`🐇 Hopping across fields to github.com/${slug.owner}/${slug.repo} (shallow clone)…`));
    const r = git(['clone', '--depth', '1', `https://github.com/${slug.owner}/${slug.repo}.git`, dest]);
    if (r.status !== 0) die(`Clone failed: ${(r.stderr || '').trim()}`);
  }
  return dest;
}

function die(msg) { console.error(red(msg)); process.exit(1); }

function tree(root, depth = 2, max = 50) {
  const out = [];
  (function walk(dir, d, prefix) {
    if (out.length >= max) return;
    let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    ents.sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));
    for (const e of ents) {
      if (SKIP.has(e.name) || (e.name.startsWith('.') && e.name !== '.github')) continue;
      if (out.length >= max) { out.push(prefix + '…'); return; }
      out.push(prefix + e.name + (e.isDirectory() ? '/' : ''));
      if (e.isDirectory() && d < depth) walk(path.join(dir, e.name), d + 1, prefix + '  ');
    }
  })(root, 1, '');
  return out.join('\n');
}

const inside = (root, p) => {
  const full = path.resolve(root, p || '.');
  if (!full.startsWith(path.resolve(root))) throw new Error('Path escapes current project root');
  return full;
};

const cap = (s, n = 2000) => (s.length > n ? s.slice(0, n) + `\n…[trimmed ${s.length - n} chars]` : s);

function fn(name, description, properties, required = []) {
  return { type: 'function', function: { name, description, parameters: { type: 'object', properties, required } } };
}

// RTK integration: Check if rtk is installed on system
let _hasRtk = null;
function hasRtk() {
  if (_hasRtk !== null) return _hasRtk;
  const candidates = [
    '/opt/homebrew/bin/rtk',
    '/usr/local/bin/rtk',
    path.join(os.homedir(), '.local', 'bin', 'rtk')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) { _hasRtk = c; return _hasRtk; }
  }
  try {
    const res = spawnSync('which', ['rtk'], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout.trim()) {
      _hasRtk = res.stdout.trim();
      return _hasRtk;
    }
  } catch {}
  _hasRtk = false;
  return false;
}

// Allowed REA commands (Reverse Engineer Anything agent)
const REA_SAFE = [
  'doctor', 'capabilities', 'providers', 'analyze', 'inspect', 'decompile', 'function', 'search', 'trace', 'xrefs',
  'analyze-javascript-application', 'inspect-pe-resources', 'inspect-binary-layout', 'read-function-instructions',
  'procedure-pseudo-code', 'procedure-assembly', 'list-strings', 'search-strings', 'list-procedures', 'search-procedures', 'binary-overview'
];

function runRea(cmd, extraArgs, cwd) {
  const args = [cmd];
  if (extraArgs) {
    const split = extraArgs.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    args.push(...split.map(s => s.replace(/^"|"$/g, '')));
  }
  args.push('--format', 'md', '--token-limit', '800');
  const r = spawnSync('rea', args, { cwd, shell: true, encoding: 'utf8', timeout: 120000 });
  if (r.error) return `rea command error: ${r.error.message}`;
  return cap(`Exit: ${r.status}\n${r.stdout || ''}${r.stderr || ''}`, 2500);
}


// Tool definitions with category tags for Dynamic Tool Loading
const TOOL_DEFINITIONS = {
  edit_file: fn('edit_file', 'Surgically find and replace an exact block of code inside a file (like Claude Code / Antigravity)', {
    path: { type: 'string', description: 'File path relative to workspace' },
    target: { type: 'string', description: 'Exact text block to replace' },
    replacement: { type: 'string', description: 'New replacement text' }
  }, ['path', 'target', 'replacement']),

  notion: fn('notion', 'Human-readable visual project memory in Notion (search, read, update, add_screenshot, create)', {
    action: { type: 'string', enum: ['search', 'read', 'update_section', 'add_screenshot', 'create'], description: 'Action to perform' },
    project_name: { type: 'string', description: 'Name of project or search query' },
    page_id: { type: 'string', description: 'Target Notion page ID' },
    section: { type: 'string', description: 'Section name: "What it does", "How it works", "Features", "Design", "Important stuff", "Bugs", "Whats left", "Changelog"' },
    content: { type: 'string', description: 'Casual, plain-English content for the section' },
    caption: { type: 'string', description: 'Short casual caption for screenshot' },
    image_url: { type: 'string', description: 'Public URL or local path of screenshot' }
  }, ['action']),

  diagram_design: fn('diagram_design', 'Generate or embed an editorial HTML/SVG architecture diagram using diagram-design skill into a target file', {
    target_file: { type: 'string', description: 'File to update, e.g. README.md' },
    diagram_type: { type: 'string', description: 'architecture, flowchart, process, or layer_stack' },
    title: { type: 'string', description: 'Diagram title' },
    svg_content: { type: 'string', description: 'Self-contained SVG/HTML diagram markup' }
  }, ['target_file', 'svg_content']),

  // Core Code & Filesystem Tools (Default)
  list_dir: fn('list_dir', 'List files in local directory (token-compacted with tree/rtk)', { path: { type: 'string' } }),
  read_file: fn('read_file', 'Read targeted range of a file with line numbers', { path: { type: 'string' }, start_line: { type: 'integer' }, end_line: { type: 'integer' } }, ['path']),
  search: fn('search', 'Search regex or text across codebase', { pattern: { type: 'string' }, path: { type: 'string' } }, ['pattern']),
  write_file: fn('write_file', 'Create or overwrite file surgically', { path: { type: 'string' }, content: { type: 'string' } }, ['path', 'content']),
  run: fn('run', 'Execute shell command with RTK token-compression', { command: { type: 'string' } }, ['command']),
  project: fn('project', 'Detect or inspect current project metadata (name, stack, commands, paths, issues)', {
    action: { type: 'string', enum: ['info', 'set', 'detect'] },
    key: { type: 'string' },
    value: { type: 'string' }
  }),
  memory: fn('memory', 'Structured persistent key-value memory (get, set, list, delete)', {
    action: { type: 'string', enum: ['get', 'set', 'list', 'delete'] },
    key: { type: 'string' },
    value: { type: 'string' }
  }),
  read_memory: fn('read_memory', 'Query user credentials or persistent environment notes', { topic: { type: 'string' } }),

  // Application Management (Native macOS)
  app: fn('app', 'Manage macOS applications (detect, install via brew, uninstall/trash, verify)', {
    action: { type: 'string', enum: ['detect', 'install', 'uninstall', 'list'], description: 'Action to perform' },
    name: { type: 'string', description: 'Application name or brew package name' }
  }, ['action', 'name']),

  // Browser Control & Web Inspection
  browser: fn('browser', 'Lightweight browser automation & DOM inspection (open, navigate, read text, click, eval js, screenshot)', {
    action: { type: 'string', enum: ['open', 'read', 'click', 'eval', 'screenshot', 'close'], description: 'Browser action' },
    url: { type: 'string', description: 'Target URL to open or navigate to' },
    selector: { type: 'string', description: 'CSS selector or text to click/inspect' },
    script: { type: 'string', description: 'JavaScript code to execute in browser' }
  }, ['action']),

  // HTTP & API Testing (Postman equivalent)
  http: fn('http', 'Execute HTTP / REST API request (GET, POST, PUT, DELETE) with headers/payload', {
    method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'HTTP method' },
    url: { type: 'string', description: 'Target URL' },
    headers: { type: 'object', description: 'Request headers' },
    data: { type: 'string', description: 'Request body payload' }
  }, ['method', 'url']),

  // Gmail Management
  mail: fn('mail', 'Read recent emails or send email using configured Gmail SMTP/IMAP credentials', {
    action: { type: 'string', enum: ['send', 'read_recent', 'search'], description: 'Action to perform' },
    to: { type: 'string', description: 'Recipient email address' },
    subject: { type: 'string', description: 'Email subject line' },
    body: { type: 'string', description: 'Email body text' },
    query: { type: 'string', description: 'Search term or count for reading recent emails' }
  }, ['action']),

  // Apple Calendar & Productivity Management
  calendar: fn('calendar', 'Read or schedule events in macOS Calendar via native AppleScript', {
    action: { type: 'string', enum: ['list', 'add'], description: 'Action to perform' },
    title: { type: 'string', description: 'Event title / meeting name' },
    date: { type: 'string', description: 'Date/time string, e.g. "today 5:30pm", "tomorrow 10:00am"' },
    notes: { type: 'string', description: 'Optional meeting notes or context' }
  }, ['action']),

  // GitHub Tools
  github_repos: fn('github_repos', 'List/search GitHub repositories (uses gh CLI / RTK)', {
    owner: { type: 'string' },
    limit: { type: 'integer' }
  }),
  github_clone: fn('github_clone', 'Clone or hop into GitHub repository', { repo: { type: 'string' } }, ['repo']),
  github_commit_push: fn('github_commit_push', 'Commit and push changes with automatic privacy sanitization', {
    message: { type: 'string' },
    branch: { type: 'string' }
  }, ['message']),

  // Vercel Tools
  vercel: fn('vercel', 'Execute Vercel CLI commands (project ls, deployments ls, whoami, deploy)', {
    command: { type: 'string' }
  }),

  // Reverse Engineering Tools
  rea: fn('rea', 'Execute REA tool against native binary or bundle', {
    command: { type: 'string', enum: REA_SAFE },
    args: { type: 'string' }
  }, ['command']),

  // Dynamic Tool Discovery
  discover_tools: fn('discover_tools', 'Discover and request schemas for additional specialized tool sets', {
    capability: { type: 'string', enum: ['all', 'browser', 'github', 'vercel', 'rea', 'productivity', 'app', 'http'] }
  }, ['capability'])
};

const ALL_TOOLS = Object.values(TOOL_DEFINITIONS);
const TOOLS = ALL_TOOLS; // For backwards compatibility and schema validation


function detectProject(root) {
  const p = {
    name: path.basename(root),
    stack: 'unknown',
    dev: null,
    build: null,
    test: null,
    deploy: null,
    repo: null,
    environment: 'development',
    important_paths: []
  };

  // Git remote
  try {
    const gr = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' });
    if (gr.status === 0 && gr.stdout.trim()) p.repo = gr.stdout.trim();
  } catch {}

  // Package.json detection
  const pkgJsonPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      p.name = pkg.name || p.name;
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.next) p.stack = 'Next.js (React)';
      else if (deps.react) p.stack = 'React';
      else if (deps.vue) p.stack = 'Vue.js';
      else if (deps.express) p.stack = 'Node.js Express';
      else p.stack = 'Node.js';

      if (pkg.scripts) {
        if (pkg.scripts.dev) p.dev = 'npm run dev';
        else if (pkg.scripts.start) p.dev = 'npm start';
        if (pkg.scripts.build) p.build = 'npm run build';
        if (pkg.scripts.test) p.test = 'npm test';
      }
      p.important_paths.push('package.json');
    } catch {}
  }

  // Python detection
  if (fs.existsSync(path.join(root, 'requirements.txt')) || fs.existsSync(path.join(root, 'pyproject.toml'))) {
    p.stack = p.stack === 'unknown' ? 'Python' : `${p.stack} + Python`;
    p.important_paths.push('pyproject.toml');
  }

  // Cargo / Rust detection
  if (fs.existsSync(path.join(root, 'Cargo.toml'))) {
    p.stack = 'Rust';
    p.build = 'cargo build';
    p.test = 'cargo test';
    p.important_paths.push('Cargo.toml');
  }

  // Vercel / Deploy targets
  if (fs.existsSync(path.join(root, 'vercel.json')) || fs.existsSync(path.join(root, '.vercel'))) {
    p.deploy = 'vercel deploy';
    p.important_paths.push('vercel.json');
  }

  return p;
}

const STRUCTURED_MEM_FILE = path.join(LEROY_DIR, 'structured_memory.json');
function getStructuredMemory() {
  if (fs.existsSync(STRUCTURED_MEM_FILE)) {
    try { return JSON.parse(fs.readFileSync(STRUCTURED_MEM_FILE, 'utf8')); } catch {}
  }
  return {};
}
function saveStructuredMemory(mem) {
  fs.mkdirSync(LEROY_DIR, { recursive: true });
  fs.writeFileSync(STRUCTURED_MEM_FILE, JSON.stringify(mem, null, 2), 'utf8');
}

function selectActiveTools(userText, requestedCapabilities = []) {
  const selected = new Set([
    'list_dir', 'read_file', 'search', 'write_file', 'edit_file', 'run', 'project', 'memory', 'read_memory', 'discover_tools'
  ]);

  const text = (userText || '').toLowerCase();

  // App management intent
  if (/\b(install|uninstall|app|application|trash|remove|dmg|brew|cask|teamviewer|slack|discord|chrome|vscode)\b/.test(text) || requestedCapabilities.includes('app')) {
    selected.add('app');
  }

  // Browser intent
  if (/\b(browse|browser|open url|chrome|dom|screenshot|click|eval|web page|website|inspect ui|http:\/\/|https:\/\/|localhost)\b/.test(text) || requestedCapabilities.includes('browser')) {
    selected.add('browser');
  }

  // HTTP / API testing intent
  if (/\b(http|api|postman|rest|endpoint|fetch|request|curl|status code|json response)\b/.test(text) || requestedCapabilities.includes('http')) {
    selected.add('http');
  }

  // Email / Mail intent
  if (/\b(mail|email|gmail|inbox|send email|check mail|message conor|email me)\b/.test(text) || requestedCapabilities.includes('mail') || requestedCapabilities.includes('productivity')) {
    selected.add('mail');
  }

  // Calendar / Productivity intent
  if (/\b(calendar|meeting|event|schedule|appointment|conor|tonight|today|tomorrow)\b/.test(text) || requestedCapabilities.includes('calendar') || requestedCapabilities.includes('productivity')) {
    selected.add('calendar');
  }

  // GitHub intent
  if (/\b(github|repo|clone|commit|push|pull request|gh cli|repos)\b/.test(text) || requestedCapabilities.includes('github')) {
    selected.add('github_repos');
    selected.add('github_clone');
    selected.add('github_commit_push');
  }

  // Notion visual memory intent
  if (/\b(notion|notes|project home|organis|organiz|visual memory|summary page|docs)\b/.test(text) || requestedCapabilities.includes('notion')) {
    selected.add('notion');
  }

  // Vercel intent
  if (/\b(vercel|deploy|production|preview url|deployments)\b/.test(text) || requestedCapabilities.includes('vercel')) {
    selected.add('vercel');
  }

  // Reverse engineering intent
  if (/\b(rea|reverse[- ]engineer|disassemble|decompile|macho|binary|strings|symbols|ghidra|ida|hex)\b/.test(text) || requestedCapabilities.includes('rea')) {
    selected.add('rea');
  }

  if (requestedCapabilities.includes('all')) {
    return Object.values(TOOL_DEFINITIONS);
  }

  return Array.from(selected).map(k => TOOL_DEFINITIONS[k]).filter(Boolean);
}

function classifyComplexity(prompt) {
  // Routes to strong (7B) model on reverse-engineering, security audits, architecture decisions, deep debugging
  const strongPatterns = [
    /\b(reverse[- ]engineer|disassemble|decompile|ghidra|ida|macho|elf|pe32|binary|exploit|vulnerability|cve|overflow|heap|rop|fuzz|bug[- ]bounty|audit)\b/i,
    /\b(architect|refactor|concurrency|race condition|memory leak|deadlock|crypto|protocol)\b/i,
    /\b(difficult bug|deep debug|system architecture|complex code analysis)\b/i
  ];
  return strongPatterns.some(re => re.test(prompt));
}

function grep(root, base, re, hits = [], limit = 30) {
  let st; try { st = fs.statSync(base); } catch { return hits; }
  if (st.isFile()) {
    if (st.size > 300000) return hits;
    let txt; try { txt = fs.readFileSync(base, 'utf8'); } catch { return hits; }
    if (txt.includes('\0')) return hits;
    txt.split('\n').forEach((l, i) => {
      if (hits.length < limit && re.test(l)) hits.push(`${path.relative(root, base)}:${i + 1}: ${l.trim().slice(0, 140)}`);
    });
    return hits;
  }
  for (const e of fs.readdirSync(base, { withFileTypes: true })) {
    if (hits.length >= limit) break;
    if (SKIP.has(e.name)) continue;
    grep(root, path.join(base, e.name), re, hits, limit);
  }
  return hits;
}

async function runTool(name, a, ctx) {
  const { root, ask } = ctx;
  const rtkBin = hasRtk();

  try {
    if (name === 'list_dir') {
      const targetDir = inside(root, a.path);
      if (rtkBin) {
        const r = spawnSync(rtkBin, ['ls', targetDir], { encoding: 'utf8', timeout: 10000 });
        if (r.status === 0 && r.stdout.trim()) return cap(r.stdout.trim(), 2000);
      }
      return tree(targetDir, 1, 60) || '(empty)';
    }

    if (name === 'read_file') {
      const full = inside(root, a.path);
      if (!fs.existsSync(full)) {
        return `File "${a.path}" does not exist in "${root}". Available files:\n${tree(root, 1, 15)}`;
      }
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      const s = Math.max(1, a.start_line || 1), e = Math.min(lines.length, a.end_line || s + 80);
      return cap(lines.slice(s - 1, e).map((l, i) => `${s + i}| ${l}`).join('\n'), 2500);
    }

    if (name === 'search') {
      let re; try { re = new RegExp(a.pattern, 'i'); } catch { re = new RegExp(a.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
      const hits = grep(root, inside(root, a.path), re);
      return hits.length ? hits.join('\n') : 'no matches';
    }

    if (name === 'write_file') {
      if (!(await ask(`${carrot('✎')} write ${cream(a.path)} (${(a.content || '').length} chars)?`))) return 'user declined';
      const full = inside(root, a.path);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, a.content);
      return `wrote ${a.path}`;
    }

    if (name === 'run') {
      if (!(await ask(`${carrot('$')} run ${cream(a.command)}?`))) return 'user declined';
      // Route through RTK proxy if available for 60-90% token reduction
      let cmdToRun = a.command;
      if (rtkBin && !cmdToRun.startsWith('rtk ')) {
        const testRewrite = spawnSync(rtkBin, ['rewrite', cmdToRun], { encoding: 'utf8', timeout: 3000 });
        if (testRewrite.status === 0 && testRewrite.stdout.trim()) {
          cmdToRun = testRewrite.stdout.trim();
        }
      }
      const r = spawnSync(cmdToRun, { cwd: root, shell: true, encoding: 'utf8', timeout: 60000 });
      return cap(`exit ${r.status}\n${r.stdout || ''}${r.stderr || ''}`);
    }

    if (name === 'github_repos') {
      const owner = a.owner ? String(a.owner).trim() : '';
      const limit = String(Math.min(a.limit || 15, 30));
      console.log(sky(`  🐰 Checking GitHub repositories ${owner ? `for ${owner}` : '(authenticated user)'}…`));
      
      const ghArgs = ['repo', 'list'];
      if (owner) ghArgs.push(owner);
      ghArgs.push('--limit', limit);

      if (rtkBin) {
        const r = spawnSync(rtkBin, ['gh', ...ghArgs], { encoding: 'utf8', timeout: 15000 });
        if (r.status === 0 && r.stdout.trim()) return cap(r.stdout.trim(), 2000);
      }
      const r = spawnSync('gh', ghArgs, { encoding: 'utf8', timeout: 15000 });
      if (r.error) return `gh CLI not available: ${r.error.message}`;
      if (r.status !== 0) return cap(`gh error: ${(r.stderr || r.stdout || '').trim()}`, 1000);
      return cap(r.stdout.trim() || 'No repositories found.', 2000);
    }

    if (name === 'github_clone') {
      const slug = githubSlug(a.repo);
      if (!slug) return `Invalid GitHub repository format: "${a.repo}". Use "owner/repo" or "https://github.com/owner/repo"`;
      console.log(sky(`  🐰 Hopping to GitHub repository ${slug.owner}/${slug.repo}…`));
      const targetDir = resolveRoot(`https://github.com/${slug.owner}/${slug.repo}`);
      ctx.root = targetDir;
      return `Switched active workspace to cloned repository: ${targetDir}\nFiles:\n${tree(targetDir, 2, 20)}`;
    }

    if (name === 'github_commit_push') {
      const gitDir = path.join(ctx.root, '.git');
      if (!fs.existsSync(gitDir)) return `Active workspace "${ctx.root}" is not a git repository.`;

      // Check for unstaged/staged diff
      const st = spawnSync('git', ['status', '--short'], { cwd: ctx.root, encoding: 'utf8' });
      if (!st.stdout.trim()) return 'No changes to commit (working tree clean).';

      // Native sanitization hook: verify diff does not contain personal credentials or raw keys
      const diffCheck = spawnSync('git', ['diff'], { cwd: ctx.root, encoding: 'utf8' });
      const diffContent = (diffCheck.stdout || '') + (st.stdout || '');
      const leakedPatterns = [/gho_[a-zA-Z0-9]{30,}/, /[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}/, /tgjg\s*bwjk/, /cfla-qkrp/];
      for (const pat of leakedPatterns) {
        if (pat.test(diffContent)) {
          return `BLOCKED: Detected potential secret/credential leak matching pattern in git diff. Never commit secrets!`;
        }
      }

      // Show diff summary and ask confirmation
      const diffStat = spawnSync('git', ['diff', '--stat'], { cwd: ctx.root, encoding: 'utf8' });
      console.log(dim(diffStat.stdout || st.stdout));
      const confirmed = await ask(`${carrot('📤')} Commit and push (${cream(a.message)})?`);
      if (!confirmed) return 'Commit and push declined by user.';

      // Sanitize commit author: enforce no-reply email or clean author to prevent personal email leakage
      spawnSync('git', ['add', '-A'], { cwd: ctx.root });
      const commitRes = spawnSync('git', ['commit', '-m', a.message, '--author=rpatty-dev <ryan@nitech.dev>'], { cwd: ctx.root, encoding: 'utf8' });
      if (commitRes.status !== 0) return cap(`Git commit error: ${commitRes.stderr || commitRes.stdout}`);

      const branch = a.branch || 'master';
      const pushRes = spawnSync('git', ['push', 'origin', branch], { cwd: ctx.root, encoding: 'utf8' });
      if (pushRes.status !== 0) return cap(`Git push error: ${pushRes.stderr || pushRes.stdout}`);

      return `Successfully committed and pushed to origin/${branch}:\n${commitRes.stdout.trim()}\n${pushRes.stdout.trim()}`;
    }

    if (name === 'rea') {
      console.log(sky(`  🐰 Inspecting artifact with REA: rea ${a.command} ${a.args || ''}`));
      return runRea(a.command, a.args, root);
    }

    if (name === 'vercel') {
      const sub = (a.command || 'project ls').trim();
      console.log(sky(`  🐰 Running Vercel CLI: vercel ${sub}…`));
      const r = spawnSync('vercel', sub.split(/\s+/), { cwd: root, encoding: 'utf8', timeout: 30000 });
      return cap(`exit ${r.status}\n${r.stdout || ''}${r.stderr || ''}`, 2500);
    }

    if (name === 'project') {
      const p = detectProject(root);
      if (a.action === 'set' && a.key) {
        p[a.key] = a.value;
        return `Updated project ${a.key} = ${a.value}`;
      }
      if (a.key && p[a.key] !== undefined) {
        return `${a.key}: ${JSON.stringify(p[a.key])}`;
      }
      return JSON.stringify(p, null, 2);
    }

    if (name === 'memory') {
      const mem = getStructuredMemory();
      const action = a.action || 'list';
      if (action === 'get') {
        return a.key && mem[a.key] !== undefined ? JSON.stringify(mem[a.key]) : `Key "${a.key}" not found`;
      }
      if (action === 'set' && a.key) {
        mem[a.key] = a.value;
        saveStructuredMemory(mem);
        return `Saved "${a.key}" to structured memory`;
      }
      if (action === 'delete' && a.key) {
        delete mem[a.key];
        saveStructuredMemory(mem);
        return `Deleted "${a.key}" from structured memory`;
      }
      return `Keys in structured memory: ${Object.keys(mem).join(', ') || '(empty)'}`;
    }

    if (name === 'read_memory') {
      return querySelectiveMemory(a.topic || 'all');
    }

    if (name === 'discover_tools') {
      const cap = a.capability || 'all';
      if (ctx.requestedCapabilities) ctx.requestedCapabilities.push(cap);
      return `Capability "${cap}" activated. Additional tool schemas are now loaded for your next step.`;
    }

    if (name === 'app') {
      const act = a.action || 'detect';
      const appName = (a.name || '').trim();
      if (!appName) return 'Error: app name required';
      const isWin = process.platform === 'win32';

      if (isWin) {
        if (act === 'detect' || act === 'list') {
          const r = spawnSync('winget', ['list', '-q', appName], { encoding: 'utf8', shell: true });
          if (r.status === 0 && r.stdout.includes(appName)) return `Application "${appName}" is INSTALLED:\n${r.stdout.trim()}`;
          const ps = spawnSync('powershell', ['-NoProfile', '-Command', `Get-AppxPackage -Name '*${appName}*' | Select-Object -ExpandProperty Name`], { encoding: 'utf8' });
          if (ps.status === 0 && ps.stdout.trim()) return `Application "${appName}" found in AppxPackages:\n${ps.stdout.trim()}`;
          return `Application "${appName}" is NOT installed on this Windows PC.`;
        }
        if (act === 'install') {
          if (!(await ask(`${carrot('📦')} Install ${cream(appName)} via winget?`))) return 'User declined installation.';
          const r = spawnSync('winget', ['install', '--id', appName, '-e', '--silent', '--accept-source-agreements', '--accept-package-agreements'], { encoding: 'utf8', shell: true });
          return r.status === 0 ? `Done — Installed ${appName} via winget.` : `winget install error: ${r.stderr || r.stdout}`;
        }
        if (act === 'uninstall') {
          if (!(await ask(`${red('🗑')} Uninstall ${cream(appName)} via winget?`))) return 'User declined uninstallation.';
          const r = spawnSync('winget', ['uninstall', '--id', appName, '-e', '--silent'], { encoding: 'utf8', shell: true });
          return r.status === 0 ? `Done — Uninstalled ${appName} via winget.` : `winget uninstall error: ${r.stderr || r.stdout}`;
        }
      }

      if (act === 'detect' || act === 'list') {
        const appPaths = [
          path.join('/Applications', `${appName}.app`),
          path.join(os.homedir(), 'Applications', `${appName}.app`)
        ];
        for (const ap of appPaths) {
          if (fs.existsSync(ap)) return `Application "${appName}" is INSTALLED at ${ap}`;
        }
        // Search mdfind
        const mf = spawnSync('mdfind', [`kMDItemKind == 'Application' && kMDItemFSName == '*${appName}*'`], { encoding: 'utf8' });
        if (mf.status === 0 && mf.stdout.trim()) {
          return `Found applications matching "${appName}":\n${mf.stdout.trim()}`;
        }
        // Check brew
        const brewCheck = spawnSync('brew', ['list', '--cask', appName], { encoding: 'utf8' });
        if (brewCheck.status === 0) return `Application "${appName}" is installed via Homebrew Cask.`;
        return `Application "${appName}" is NOT installed on this Mac.`;
      }

      if (act === 'uninstall') {
        if (!(await ask(`${red('🗑')} Uninstall application ${cream(appName)}?`))) return 'User declined uninstallation.';
        // 1. Try brew uninstall if cask exists
        const brewUn = spawnSync('brew', ['uninstall', '--cask', appName], { encoding: 'utf8' });
        if (brewUn.status === 0) return `Uninstalled ${appName} via brew cask.`;

        // 2. Locate .app bundles and official uninstallers
        const candidates = [
          path.join('/Applications', `${appName}.app`),
          path.join('/Applications', `${appName.charAt(0).toUpperCase() + appName.slice(1)}.app`),
          path.join(os.homedir(), 'Applications', `${appName}.app`)
        ];
        let targetApp = null;
        for (const c of candidates) {
          if (fs.existsSync(c)) { targetApp = c; break; }
        }
        if (!targetApp) return `Could not find ${appName}.app in /Applications.`;

        // Check for official uninstaller in /Library/Application Support or app bundle
        const officialUninstallers = [
          path.join('/Library/Application Support', appName, `${appName}Uninstaller.app`),
          path.join('/Library/Application Support', 'TeamViewer', 'TeamViewerUninstaller.app'),
          path.join(targetApp, 'Contents', 'Resources', 'uninstaller.sh')
        ];
        for (const un of officialUninstallers) {
          if (fs.existsSync(un)) {
            console.log(dim(`Running official uninstaller: ${un}...`));
            spawnSync('open', ['-a', un], { encoding: 'utf8' });
          }
        }

        // Try direct rm
        let rmRes = spawnSync('rm', ['-rf', targetApp], { encoding: 'utf8' });
        if (rmRes.status === 0 && !fs.existsSync(targetApp)) {
          return `Done — ${appName} was successfully uninstalled and removed from ${targetApp}.`;
        }

        // If permission denied due to root ownership, use osascript with administrator privileges
        console.log(dim(`Root ownership detected on ${targetApp}. Requesting admin authorization to move to Trash...`));
        const adminRm = spawnSync('osascript', ['-e', `do shell script "rm -rf '${targetApp}'" with administrator privileges`], { encoding: 'utf8' });
        if (adminRm.status === 0 && !fs.existsSync(targetApp)) {
          return `Done — ${appName} was successfully uninstalled from ${targetApp}.`;
        }
        return `Failed to remove ${targetApp}. Error: ${adminRm.stderr || rmRes.stderr || 'Permission denied'}`;
      }

      if (act === 'install') {
        if (!(await ask(`${carrot('📦')} Install application ${cream(appName)} via Homebrew?`))) return 'User declined installation.';
        const r = spawnSync('brew', ['install', '--cask', appName], { encoding: 'utf8', timeout: 120000 });
        if (r.status === 0) return `Done — Successfully installed ${appName} via Homebrew Cask.`;
        // Fallback formula
        const rf = spawnSync('brew', ['install', appName], { encoding: 'utf8', timeout: 120000 });
        if (rf.status === 0) return `Done — Successfully installed ${appName} via Homebrew formula.`;
        return `Install error:\n${r.stderr || r.stdout || rf.stderr || rf.stdout}`;
      }
    }

    if (name === 'browser') {
      const act = a.action || 'open';
      const isWin = process.platform === 'win32';
      if (act === 'open') {
        const u = a.url || 'http://localhost:3000';
        if (isWin) {
          spawnSync('powershell', ['-NoProfile', '-Command', `Start-Process chrome "${u}"`], { shell: true });
        } else {
          spawnSync('osascript', ['-e', `tell application "Google Chrome" to open location "${u}"`]);
        }
        return `Opened ${u} in Google Chrome.`;
      }
      if (act === 'read') {
        // Read active tab title and URL
        const script = `
tell application "Google Chrome"
  set currentTab to active tab of front window
  return (title of currentTab) & " | " & (URL of currentTab)
end tell`;
        const res = spawnSync('osascript', ['-e', script], { encoding: 'utf8' });
        return cap(res.stdout || res.stderr || 'No response from Chrome');
      }
      if (act === 'eval') {
        const js = a.script || 'document.title';
        // Execute javascript on active tab
        const script = `
tell application "Google Chrome"
  tell active tab of front window
    execute javascript "${js.replace(/"/g, '\\"')}"
  end tell
end tell`;
        const res = spawnSync('osascript', ['-e', script], { encoding: 'utf8' });
        if (res.status === 0) return cap(res.stdout.trim() || 'Executed script successfully.');
        return `Browser eval note: If JavaScript execution is disabled in AppleScript, enable it in Chrome: View > Developer > Allow JavaScript from Apple Events. Stderr: ${res.stderr.trim()}`;
      }
      if (act === 'screenshot') {
        const targetPath = path.join(os.tmpdir(), `screenshot_${Date.now()}.png`);
        spawnSync('screencapture', ['-x', targetPath]);
        return `Captured screen to ${targetPath}`;
      }
      if (act === 'close') {
        spawnSync('osascript', ['-e', 'tell application "Google Chrome" to close active tab of front window']);
        return 'Closed active browser tab.';
      }
    }

    if (name === 'http') {
      const method = (a.method || 'GET').toUpperCase();
      const url = a.url;
      const opts = { method, headers: a.headers || {} };
      if (a.data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        if (!opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
        opts.body = typeof a.data === 'string' ? a.data : JSON.stringify(a.data);
      }
      const t0 = Date.now();
      const res = await fetch(url, opts);
      const dt = Date.now() - t0;
      const body = await res.text();
      return cap(`HTTP ${res.status} ${res.statusText} (${dt}ms)\n${body}`, 2500);
    }

    if (name === 'mail') {
      const act = a.action || 'read_recent';
      const mem = querySelectiveMemory('gmail');
      const pwMatch = mem.match(/App Password:\s*([a-z0-9 ]+)/i);
      const emailMatch = mem.match(/Email:\s*([\w.-]+@[\w.-]+)/i);
      const email = emailMatch ? emailMatch[1].trim() : 'pattisonryan6@gmail.com';
      const pw = pwMatch ? pwMatch[1].replace(/\s+/g, '') : 'tgjgbwjkutylqygo';

      if (act === 'send') {
        if (!a.to || !a.subject || !a.body) return 'Error: to, subject, and body required';
        if (!(await ask(`${carrot('✉')} Send email to ${cream(a.to)} with subject "${a.subject}"?`))) return 'User declined sending email.';
        const pyScript = `
import smtplib
from email.mime.text import MIMEText
msg = MIMEText("""${a.body.replace(/"/g, '\\"')}""")
msg['Subject'] = "${a.subject.replace(/"/g, '\\"')}"
msg['From'] = "${email}"
msg['To'] = "${a.to}"
with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
    server.login("${email}", "${pw}")
    server.sendmail("${email}", ["${a.to}"], msg.as_string())
print("SUCCESS")
`;
        const r = spawnSync('python3', ['-c', pyScript], { encoding: 'utf8' });
        if (r.stdout.includes('SUCCESS')) return `Done — Email sent to ${a.to} via Gmail SMTP.`;
        return `Failed to send email: ${r.stderr || r.stdout}`;
      }

      if (act === 'read_recent') {
        const pyScript = `
import imaplib, email
from email.header import decode_header
try:
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login("${email}", "${pw}")
    mail.select("inbox")
    status, messages = mail.search(None, "ALL")
    ids = messages[0].split()
    latest_ids = ids[-5:] if len(ids) >= 5 else ids
    latest_ids.reverse()
    results = []
    for mid in latest_ids:
        _, msg_data = mail.fetch(mid, "(RFC822.HEADER)")
        for response in msg_data:
            if isinstance(response, tuple):
                msg = email.message_from_bytes(response[1])
                subj, enc = decode_header(msg.get("Subject", ""))[0]
                if isinstance(subj, bytes): subj = subj.decode(enc or "utf-8", errors="ignore")
                results.append(f"- From: {msg.get('From', '')} | Subject: {subj} | Date: {msg.get('Date', '')}")
    mail.logout()
    print("\n".join(results) if results else "No emails found.")
except Exception as e:
    print(f"IMAP Error: {e}")
`;
        const r = spawnSync('python3', ['-c', pyScript], { encoding: 'utf8', timeout: 15000 });
        return cap(r.stdout.trim() || r.stderr.trim(), 2000);
      }
    }

    if (name === 'calendar') {
      const act = a.action || 'list';
      if (act === 'list') {
        const osa = `
tell application "Calendar"
  set outList to {}
  set todayDate to (current date)
  set time of todayDate to 0
  set tomorrowDate to todayDate + (2 * days)
  repeat with cal in calendars
    set evs to (every event of cal whose start date >= todayDate and start date < tomorrowDate)
    repeat with ev in evs
      set end of outList to (summary of ev) & " (" & (start date of ev as string) & ")"
    end repeat
  end repeat
  if (count of outList) is 0 then return "No events scheduled for today or tomorrow."
  return (outList as string)
end tell`;
        const r = spawnSync('osascript', ['-e', osa], { encoding: 'utf8' });
        return cap(r.stdout.trim() || r.stderr.trim() || 'Calendar checked.');
      }
      if (act === 'add') {
        const title = a.title || 'Meeting';
        const notes = a.notes || '';
        // Add event to default Calendar
        const osa = `
tell application "Calendar"
  tell default calendar
    make new event with properties {summary:"${title.replace(/"/g, '\\"')}", start date:(current date) + (4 * hours), end date:(current date) + (5 * hours), description:"${notes.replace(/"/g, '\\"')}"}
  end tell
  return "Event added"
end tell`;
        const r = spawnSync('osascript', ['-e', osa], { encoding: 'utf8' });
        return `Done — Added "${title}" to Apple Calendar.`;
      }
    }

    
    if (name === 'diagram_design' || name === 'diagram-design') {
      const target = inside(root, a.target_file || a.path || 'README.md');
      const svg = a.svg_content || a.content || '';
      if (!svg) {
        // If model called it to inspect range, redirect to read_file
        if (a.path || a.start_line) {
          const lines = fs.readFileSync(target, 'utf8').split('\n');
          const s = Math.max(1, a.start_line || 1), e = Math.min(lines.length, a.end_line || s + 80);
          return cap(lines.slice(s - 1, e).map((l, i) => `${s + i}| ${l}`).join('\n'), 2500);
        }
        return 'diagram_design error: svg_content required';
      }
      let existing = '';
      if (fs.existsSync(target)) existing = fs.readFileSync(target, 'utf8');
      const updated = existing.includes('<!-- diagram -->')
        ? existing.replace(/<!-- diagram -->[\s\S]*?<!-- \/diagram -->/, `<!-- diagram -->\n${svg}\n<!-- /diagram -->`)
        : `${existing}\n\n<!-- diagram -->\n${svg}\n<!-- /diagram -->\n`;
      fs.writeFileSync(target, updated, 'utf8');
      return `Successfully embedded diagram into ${path.basename(target)}`;
    }

    
    if (name === 'notion') {
      const act = a.action || 'search';
      if (act === 'search') {
        const q = a.project_name || '';
        const list = await notion.searchProjects(q);
        if (Array.isArray(list)) {
          if (!list.length) {
            return 'No shared Notion project pages found. To grant Leroy access, open a page in Notion, click "...", then "Connect to" -> "Leroy".';
          }
          return `Found Notion projects:\n` + list.map(p => `- ${p.title} (ID: ${p.id})\n  URL: ${p.url}`).join('\n');
        }
        return `Notion search error: ${list.error || 'Failed to search'}`;
      }

      if (act === 'read') {
        if (!a.page_id) return 'Error: page_id required to read project home.';
        return await notion.getProjectHome(a.page_id);
      }

      if (act === 'update_section') {
        if (!a.page_id || !a.section || !a.content) return 'Error: page_id, section, and content required.';
        return await notion.updateProjectSection(a.page_id, a.section, a.content);
      }

      if (act === 'add_screenshot') {
        if (!a.page_id || !a.caption) return 'Error: page_id and caption required.';
        return await notion.addProjectScreenshot(a.page_id, a.caption, a.image_url || 'https://placehold.co/600x400/png?text=App+Screenshot');
      }

      if (act === 'create') {
        if (!a.page_id || !a.project_name || !a.content) {
          return 'Error: parent page_id, project_name, and content required. Note: internal Notion integrations require a parent page ID to create child project pages.';
        }
        const res = await notion.createProjectHome(a.page_id, a.project_name, a.content);
        return res.ok ? `Done — ${res.message}\nURL: ${res.url}` : `Failed to create Notion page: ${res.error}`;
      }
    }

    
    if (name === 'edit_file') {
      const full = inside(root, a.path);
      if (!fs.existsSync(full)) return `File "${a.path}" does not exist in "${root}".`;
      const original = fs.readFileSync(full, 'utf8');
      if (!original.includes(a.target)) {
        return `edit_file error: Target string not found in ${a.path}. Make sure whitespace and line breaks match exactly.`;
      }
      const updated = original.replace(a.target, a.replacement);
      fs.writeFileSync(full, updated, 'utf8');
      return `Successfully applied surgical edit to ${a.path}.`;
    }

    return `unknown tool ${name}`;
  } catch (e) {
    return `error: ${e.message}`;
  }
}

async function serverUp() {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/v1/models`, { signal: AbortSignal.timeout(1200) });
    return res.ok;
  } catch {
    return false;
  }
}

function findLlamaServer() {
  try {
    const which = spawnSync('which', ['llama-server'], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  } catch {}

  const candidates = [
    '/opt/homebrew/bin/llama-server',
    '/usr/local/bin/llama-server',
    path.join(LEGACY_LLM, 'llama', 'llama-server'),
    path.join(LEGACY_LLM, 'llama', 'llama-server.exe')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

let currentServerModel = null;
async function ensureServer(opts, modelType = null) {
  const chosen = modelType === 'strong' || opts.strong ? MODELS.strong : (modelType === 'fast' || opts.fast ? MODELS.fast : MODELS.main);
  if (await serverUp() && currentServerModel === chosen) return;

  // If server is up with different model, kill it and restart
  if (await serverUp() && currentServerModel && currentServerModel !== chosen) {
    console.log(dim(`🐇 Switching server model to ${path.basename(chosen)}…`));
    spawnSync('pkill', ['-f', 'llama-server']);
    await new Promise(r => setTimeout(r, 1200));
  } else if (await serverUp()) {
    currentServerModel = chosen;
    return;
  }

  const exe = findLlamaServer();
  if (!exe) die('Missing llama-server. Install via Homebrew: brew install llama.cpp');
  if (!fs.existsSync(chosen)) die(`Missing model:\n  ${chosen}\nDownload to ~/.leroy/models/`);

  const isMacArm = process.platform === 'darwin' && (process.arch === 'arm64' || os.cpus()[0]?.model?.includes('Apple'));
  console.log(dim(`🥕 Waking up ${path.basename(chosen, '.gguf')} in the clover (ctx: ${opts.ctx}, ${isMacArm ? 'Metal GPU accelerated' : 'CPU optimized'})...`));

  const args = [
    '-m', chosen,
    '--alias', 'LeroyObliterated',
    '-c', String(opts.ctx),
    '-b', '512',
    '-ub', '256',
    '--host', '127.0.0.1',
    '--port', String(PORT),
    '--reasoning-budget', '0'
  ];

  if (isMacArm) {
    args.push('-ngl', '99'); // Offload 100% of layers to Apple Silicon Metal GPU
    args.push('-fa', 'on');   // Enable Flash Attention
  } else {
    args.push('-t', '4');
  }

  spawn(exe, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();

  for (let i = 0; i < 40; i++) {
    if (await serverUp()) {
      currentServerModel = chosen;
      return;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  die('Failed to start llama-server. Check free memory or port 8080.');
}

async function completion(messages, tools, onText) {
  const res = await fetch(`${API}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'LeroyObliterated',
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      stream: true,
      temperature: 0.2,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    })
  });

  if (!res.ok) throw new Error(`Server error ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const dec = new TextDecoder();
  let buf = '', text = '';
  const calls = [];

  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const l of lines) {
      if (!l.startsWith('data: ') || l.includes('[DONE]')) continue;
      let d; try { d = JSON.parse(l.slice(6)).choices[0].delta; } catch { continue; }
      if (d.content) {
        text += d.content;
        onText(d.content);
      }
      for (const tc of d.tool_calls || []) {
        const c = calls[tc.index || 0] || (calls[tc.index || 0] = { id: '', name: '', args: '' });
        if (tc.id) c.id = tc.id;
        if (tc.function?.name) c.name += tc.function.name;
        if (tc.function?.arguments) c.args += tc.function.arguments;
      }
    }
  }

  // Model tool-call fallback parsing (markdown or inline json)
  if (!calls.length && text) {
    const jsonMatch = text.match(/```(?:json)?\s*(\{\s*"name"\s*:\s*"[^"]+".*?\})\s*```/s) ||
                      text.match(/(\{\s*"name"\s*:\s*"[^"]+",\s*"arguments"\s*:\s*\{.*?\}\s*\})/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.name && typeof parsed.name === 'string') {
          calls.push({
            id: `call_json_${Date.now()}`,
            name: parsed.name,
            args: typeof parsed.arguments === 'string' ? parsed.arguments : JSON.stringify(parsed.arguments || {})
          });
        }
      } catch {}
    }
  }

  return { text, calls: calls.filter(Boolean) };
}

function spinner(label) {
  const frames = ['🌾', '🐇', '🥕', '🌸', '🐰', '🌼'];
  let i = 0;
  const t = setInterval(() => process.stdout.write(`\r${dim(frames[i++ % frames.length] + ' ' + label)}   `), 250);
  return () => { clearInterval(t); process.stdout.write('\r' + ' '.repeat(label.length + 10) + '\r'); };
}

async function compactContext(messages) {
  if (messages.length <= 14) return messages;
  const sys = messages[0];
  const recent = messages.slice(-8);
  const mid = messages.slice(1, -8);
  const summary = mid
    .filter(m => m.role === 'tool' || (m.role === 'assistant' && m.content))
    .map(m => m.role === 'tool' ? `[Tool Output]: ${m.content.slice(0, 100)}` : `[Assistant]: ${m.content.slice(0, 100)}`)
    .join('\n');
  const compacted = [
    sys,
    { role: 'system', content: `Prior Context Summary:\n${summary.slice(0, 800)}` },
    ...recent
  ];
  return compacted;
}

async function turn(messages, ctx, opts) {
  messages = await compactContext(messages);
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const isCasual = /^(hi|hello|hey|yo|sup|test|ping|how are you|who are you)[\s!.]*$/i.test(lastUserMsg.trim());
  if (!ctx.requestedCapabilities) ctx.requestedCapabilities = [];
  const activeTools = isCasual ? [] : selectActiveTools(lastUserMsg, ctx.requestedCapabilities);

  for (let step = 0; step < 8; step++) {
    const stop = spinner(step ? 'nibbling clover…' : 'resting in the meadow…');
    let started = false, res;
    let streamedTokens = '';
    let isSuppressedToolJson = false;
    try {
      res = await completion(messages, activeTools, t => {
        streamedTokens += t;
        const trimmed = streamedTokens.trimStart();
        // If the model is outputting a JSON object or code block tool call, NEVER stream it to terminal!
        if (isSuppressedToolJson || trimmed.startsWith('{') || trimmed.startsWith('```json') || trimmed.startsWith('```')) {
          isSuppressedToolJson = true;
          return;
        }
        if (!started) {
          started = true;
          stop();
          process.stdout.write(sky('🐇 '));
        }
        process.stdout.write(t);
      });
    } catch (e) {
      stop();
      console.log(red(`\n${e.message}`));
      return;
    }
    if (!started) stop();

    // Map all common model alias hallucinations
    for (const c of (res.calls || [])) {
      if (c.name === 'diagram-design' || c.name === 'diagram_design') {
        let a = {}; try { a = JSON.parse(c.args || '{}'); } catch {}
        if (a.path && (a.start_line || a.end_line)) {
          c.name = 'read_file';
          c.args = JSON.stringify({ path: a.path, start_line: a.start_line, end_line: a.end_line });
        } else if (a.content || a.svg_content) {
          c.name = 'write_file';
          c.args = JSON.stringify({ path: a.path || a.target_file || 'README.md', content: a.content || a.svg_content });
        } else {
          c.name = 'read_file';
          c.args = JSON.stringify({ path: a.path || 'README.md', start_line: 1, end_line: 100 });
        }
      } else if (c.name === 'readme') {
        c.name = 'write_file';
        let a = {}; try { a = JSON.parse(c.args || '{}'); } catch {}
        c.args = JSON.stringify({ path: 'README.md', content: a.content || a.text || '' });
      }
    }
    // Filter hallucinated tools that do not exist in TOOLS
    const validCalls = (res.calls || []).filter(c => TOOLS.some(t => t.function.name === c.name));

    // Strip out any JSON tool payloads from assistantText so raw tool calls are NEVER printed as speech
    let assistantText = (res.text || '')
      .replace(/\`\`\`json[\s\S]*?\`\`\`/g, '')
      .replace(/\`\`\`[\s\S]*?\`\`\`/g, '')
      .replace(/\{\s*"name"\s*:\s*"[^"]+?"\s*,\s*"arguments"\s*:[\s\S]*?\}/g, '')
      .trim();

    // If valid calls exist, DO NOT echo hallucinated tool text or raw JSON to stdout!
    if (!validCalls.length && isSuppressedToolJson && !assistantText) {
      // Empty hallucinated tool call with no valid tools
      console.log(dim('  (Adjusting approach...)'));
    }

    const msg = { role: 'assistant', content: assistantText };
    if (validCalls.length) {
      msg.tool_calls = validCalls.map((c, i) => ({
        id: c.id || `call_${step}_${i}`,
        type: 'function',
        function: { name: c.name, arguments: c.args || '{}' }
      }));
    }
    messages.push(msg);

    if (!validCalls.length) return;

    for (const tc of msg.tool_calls) {
      let args = {}; try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      console.log(dim(`  🥕 ${tc.function.name}(${Object.values(args).map(v => String(v).slice(0, 40)).join(', ')})`));
      const out = await runTool(tc.function.name, args, ctx);
      messages.push({ role: 'tool', tool_call_id: tc.id, content: out });
    }
  }
}

// Compact persistent skills & disciplines (zero duplicate rules)
const SKILL_INSTRUCTIONS = `
# LEROY EXECUTION DIRECTIVE (CRITICAL)
- Diagram Design Skill: When asked to create diagrams, charts, or architecture schematics (or redesign README with diagrams), load and follow the 'diagram-design' skill (HTML + SVG self-contained, clean editorial aesthetic, no Mermaid slop, dark/light meadow palette).
- Readme & File Editing: To create or redesign README.md, ALWAYS call the 'write_file' tool with path: 'README.md' and content: '<full text>'. Never call a non-existent 'readme' tool.
- Execution-First: You are an autonomous agent with native OS capabilities. When asked to DO something (uninstall/install apps, fix code, inspect system, test endpoints, browse, deploy, manage calendars, send emails), DO NOT output a tutorial, steps, or "you can do X". EXECUTE the appropriate tools immediately, verify the result, and report what was completed.
- Ponytail: Minimal code. YAGNI. Stdlib & native CLIs first. Surgical edits.
- Caveman: Concise, terse responses with 100% technical accuracy. No fluff or preamble.
- Notion Visual Memory: Use 'notion' tool to keep human-readable, visual project notebooks. Write CASUAL and HUMAN (like Ryan talking, e.g. "this is basically...", "this bit handles..."). Never write stiff corporate documentation. Include What it does, How it works, Features (✅/⬜), Design notes, Screenshots, Tech stack, Gotchas/Bugs (🐛), and What's left.
- Tools Available: 'run' (shell/brew/osascript), 'app' (install/uninstall/detect macOS apps), 'browser' (navigate/read/click/eval web pages), 'http' (REST/API testing), 'mail' (send/read Gmail via app-pw), 'calendar' (read/add Apple Calendar events via osascript), 'project' (stack/commands), 'memory' (key-value storage), 'rea' (reverse engineering), 'vercel', 'github_repos', 'github_clone', 'github_commit_push'.
`;

const PERSISTENT_SECURITY_RULES = `
# SECURITY DIRECTIVE
- NEVER commit personal details, passwords, emails, or credentials to a public repository.
- Use 'read_memory' tool to selectively query accounts, passwords, or personal credentials when needed.
`;

function querySelectiveMemory(topic = 'all') {
  const searchPaths = [
    path.join(os.homedir(), '.leroy', 'MEMORY.md'),
    path.join(os.homedir(), '.gemini', 'config', 'GEMINI.md'),
    path.join(os.homedir(), '.gemini', 'config', 'AGENTS.md')
  ];

  const results = [];
  const t = topic.toLowerCase().trim();

  for (const sp of searchPaths) {
    if (fs.existsSync(sp)) {
      try {
        const text = fs.readFileSync(sp, 'utf8');
        if (t === 'all' || !t) {
          results.push(`### ${path.basename(sp)}:\n${text}`);
        } else {
          // Filter sections matching the topic
          const sections = text.split(/(?=^#+\s)/m);
          const matched = sections.filter(sec => sec.toLowerCase().includes(t));
          if (matched.length) {
            results.push(`### ${path.basename(sp)} (matched "${topic}"):\n${matched.join('\n').trim()}`);
          }
        }
      } catch {}
    }
  }

  return results.length ? results.join('\n\n') : `No memory records found for query "${topic}".`;
}

function loadGlobalMemoryAndRules() {
  // Returns only lean, non-duplicate persistent directives.
  // Full credentials and large memory are kept on disk and retrieved selectively via 'read_memory'.
  return PERSISTENT_SECURITY_RULES.trim();
}


async function runSetup() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(`${q} `, r));

  console.log(BANNER);
  console.log(meadow('🌿 Welcome to Leroy Setup! Setting up local AI coding agent...\n'));

  // 1. Check & create ~/.leroy directory
  fs.mkdirSync(path.join(LEROY_DIR, 'models'), { recursive: true });
  fs.mkdirSync(path.join(LEROY_DIR, 'repos'), { recursive: true });
  console.log(sky('✓ Directory structure ~/.leroy ready.'));

  // 2. Check llama-server
  const srv = findLlamaServer();
  if (srv) {
    console.log(sky(`✓ llama.cpp installed at: ${srv}`));
  } else {
    console.log(red('✗ llama-server not found on PATH.'));
    if (process.platform === 'darwin') {
      const installBrew = await ask(`${carrot('?')} Install llama.cpp via Homebrew now? [y/N]`);
      if (/^y/i.test(installBrew.trim())) {
        console.log(dim('Running brew install llama.cpp...'));
        spawnSync('brew', ['install', 'llama.cpp'], { stdio: 'inherit' });
      }
    } else if (process.platform === 'win32') {
      console.log(dim('Install via winget: winget install llama.cpp, or download from github.com/ggml-org/llama.cpp/releases'));
    }
  }

  // 3. Check models
  const fastModelPath = MODELS.fast;
  const strongModelPath = MODELS.strong;
  const fastExists = fs.existsSync(fastModelPath);
  const strongExists = fs.existsSync(strongModelPath);

  console.log(`\n${earth('Model Status:')}`);
  console.log(`  - FAST (3B Coder): ${fastExists ? meadow('INSTALLED') : red('MISSING')} (${path.basename(fastModelPath)})`);
  console.log(`  - STRONG (7B Coder): ${strongExists ? meadow('INSTALLED') : red('MISSING')} (${path.basename(strongModelPath)})`);

  if (!fastExists) {
    const dlFast = await ask(`\n${carrot('?')} Download FAST 3B model (~1.95 GiB) now from HuggingFace? [y/N]`);
    if (/^y/i.test(dlFast.trim())) {
      console.log(sky('🐇 Downloading LeroyObliterated (Qwen2.5-Coder-3B Q4_K_M)...'));
      const url = 'https://huggingface.co/bartowski/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf';
      spawnSync('curl', ['-L', '-o', fastModelPath, url, '--progress-bar'], { stdio: 'inherit' });
    }
  }

  if (!strongExists) {
    const dlStrong = await ask(`\n${carrot('?')} Download STRONG 7B model (~4.36 GiB) for deep reverse engineering/architecture? [y/N]`);
    if (/^y/i.test(dlStrong.trim())) {
      console.log(sky('🐇 Downloading Qwen2.5-Coder-7B-Instruct-abliterated-Q4_K_M (~4.36 GiB)...'));
      const url = 'https://huggingface.co/bartowski/Qwen2.5-Coder-7B-Instruct-abliterated-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-abliterated-Q4_K_M.gguf';
      spawnSync('curl', ['-L', '-o', strongModelPath, url, '--progress-bar'], { stdio: 'inherit' });
    }
  }

  // 4. Verify RTK & Tools
  const rtkPath = hasRtk();
  console.log(`\n${earth('Tool Status:')}`);
  console.log(`  - RTK Token Compression: ${rtkPath ? meadow('ACTIVE (' + rtkPath + ')') : dim('Optional (install via cargo/brew for 43% token savings)')}`);
  console.log(`  - Git: ${spawnSync('git', ['--version']).status === 0 ? meadow('AVAILABLE') : red('NOT FOUND')}`);

  console.log(`\n${meadow('🌾 Leroy setup complete! Start anytime by running: leroy')}\n`);
  rl.close();
  process.exit(0);
}

async function main() {
  if (process.argv.slice(2)[0] === 'setup') return runSetup();
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(BANNER + `\nUsage:\n  leroy <github-url | owner/repo | local-path>\n  leroy\n\nOptions:\n  --fast    Use 3B Coder model\n  --yes     Auto-approve changes\n  --ctx N   Context tokens (default: 4096)`);
    return;
  }
  console.log(BANNER);
  const root = resolveRoot(opts.target);
  console.log(`${meadow('🌿 Meadow:')} ${cream(root)}\n`);
  await ensureServer(opts);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => opts.yes ? Promise.resolve(true) : new Promise(r => rl.question(`${q} ${dim('[y/N]')} `, a => r(/^y/i.test(a))));

  const fresh = () => [{ role: 'system', content: 'You are Leroy 🐇, a calm rabbit-themed expert reverse-engineer and programmer resting in a quiet clover meadow. Reply concisely and helpfully.' }];
  let messages = fresh();
  const ctx = { root, ask };

  console.log(meadow('✓ Leroy is relaxing in the clover with full Metal GPU & RTK acceleration.'));
  console.log(dim('Type your question or instruction. /tree, /clear, /exit.\n'));

  const inheritedMemory = loadGlobalMemoryAndRules();

  const prompt = () => rl.question(`${carrot('🥕')} ${sky('›')} `, async line => {
    line = line.trim();
    if (!line) return prompt();
    if (line === '/exit' || line === '/quit') {
      console.log(flower('Bye! Hopping back through the flowers... 🐇🌸💨'));
      process.exit(0);
    }
    if (line === '/clear') {
      messages = fresh();
      console.log(meadow('🌱 Meadow refreshed. Context cleared.'));
      return prompt();
    }
    if (line === '/tree') {
      console.log(tree(ctx.root));
      return prompt();
    }
    if (line === '/compact') {
      messages = await compactContext(messages);
      console.log(meadow('🌾 Context compacted to free local token window.'));
      return prompt();
    }
    if (line === '/model') {
      console.log(sky(`Model: ${currentServerModel ? path.basename(currentServerModel) : 'Default'}`));
      return prompt();
    }
    if (line === '/tools') {
      console.log(earth(`Registered Tools: ${Object.keys(TOOL_DEFINITIONS).join(', ')}`));
      return prompt();
    }

    // Auto-detect if user refers to a specific local repository (e.g. "for leroy", "for repo leroy", "in PrinterStats")
    const repoMatch = line.match(/(?:in|for|of|to)\s+(?:the\s+)?(?:git\s*repo(?:sitory)?|repo)?\s*([a-zA-Z0-9_-]+)/i);
    if (repoMatch && repoMatch[1]) {
      const detected = findLocalRepo(repoMatch[1]);
      if (detected && detected !== ctx.root) {
        ctx.root = detected;
        console.log(sky(`  🐰 Auto-switched workspace to ${detected}`));
      }
    }

    // Inject system skills, inherited memory/rules & repo context
    const isGreeting = /^(hi|hello|hey|yo|sup|test|ping)[\s!.]*$/i.test(line);
    if (!isGreeting && messages.length <= 1) {
      messages[0] = {
        role: 'system',
        content: `You are Leroy 🐇, a calm, lop-eared autonomous coding & reverse-engineering agent resting in a meadow.
Model: LeroyObliterated.
Working Meadow (Directory): "${path.basename(ctx.root)}" (${ctx.root}).

${SKILL_INSTRUCTIONS}
${inheritedMemory}

Repo Overview:
${tree(ctx.root, 2, 25)}`
      };
    }

    // Automatic model routing: check if user task requires the secondary strong model
    if (!opts.fast && !opts.strong && classifyComplexity(line)) {
      await ensureServer(opts, 'strong');
    }

    messages.push({ role: 'user', content: line });
    await turn(messages, ctx, opts);
    console.log();
    prompt();
  });
  prompt();
}

if (require.main === module) {
  main().catch(e => die(e.stack || String(e)));
} else {
  module.exports = { runTool,  selectActiveTools, TOOL_DEFINITIONS,  githubSlug, tree, parseArgs, TOOLS, SKILL_INSTRUCTIONS, MODELS, loadGlobalMemoryAndRules, querySelectiveMemory };
}
