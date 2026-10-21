#!/usr/bin/env node
// Leroy 🐇 - chill lop-eared autonomous coding & reverse engineering agent CLI
// Powered by LeroyObliterated (llama.cpp) with RTK (Token Compression), REA, Ponytail & Taste skills.

const fs = require('fs');
const path = require('path');
const os = require('os');
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
  fast: resolveModelPath('Qwen2.5-Coder-3B-Instruct.gguf', 'Qwen2.5-Coder-3B-abliterated.Q4_K_M.gguf')
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
  const o = { target: null, fast: false, yes: false, ctx: 4096 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fast') o.fast = true;
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

function resolveRoot(target) {
  const slug = githubSlug(target);
  if (!slug) {
    const p = path.resolve(target || process.cwd());
    if (!fs.existsSync(p)) die(`Leroy can't find ${p} 🐇`);
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

const TOOLS = [
  fn('list_dir', 'List files in a directory (token-compacted with tree/rtk)', { path: { type: 'string' } }),
  fn('read_file', 'Read a targeted range of a file with line numbers', { path: { type: 'string' }, start_line: { type: 'integer' }, end_line: { type: 'integer' } }, ['path']),
  fn('search', 'Search text or regex pattern across codebase (strips noise)', { pattern: { type: 'string' }, path: { type: 'string' } }, ['pattern']),
  fn('write_file', 'Create or overwrite a file surgically', { path: { type: 'string' }, content: { type: 'string' } }, ['path', 'content']),
  fn('run', 'Execute shell command with RTK token-compression', { command: { type: 'string' } }, ['command']),
  fn('rea', 'Execute REA (Reverse Engineer Anything) tool against a native binary, electron/js app, or directory', {
    command: { type: 'string', enum: REA_SAFE },
    args: { type: 'string', description: 'Arguments like file path or options' }
  }, ['command']),
  fn('read_memory', 'Selectively look up saved user credentials, accounts, or persistent environment notes', {
    topic: { type: 'string', description: 'Topic or key to query: e.g. "email", "credentials", "accounts", "rules", or "all"' }
  })
];

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

    if (name === 'rea') {
      console.log(sky(`  🐰 Inspecting artifact with REA: rea ${a.command} ${a.args || ''}`));
      return runRea(a.command, a.args, root);
    }

    if (name === 'read_memory') {
      return querySelectiveMemory(a.topic || 'all');
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

async function ensureServer(opts) {
  if (await serverUp()) return;
  const model = opts.fast ? MODELS.fast : MODELS.main;
  const exe = findLlamaServer();
  if (!exe) die('Missing llama-server. Install via Homebrew: brew install llama.cpp');
  if (!fs.existsSync(model)) die(`Missing model:\n  ${model}\nDownload to ~/.leroy/models/LeroyObliterated.gguf`);

  const isMacArm = process.platform === 'darwin' && (process.arch === 'arm64' || os.cpus()[0]?.model?.includes('Apple'));
  console.log(dim(`🥕 Waking up LeroyObliterated in the clover (ctx: ${opts.ctx}, ${isMacArm ? 'Metal GPU accelerated' : 'CPU optimized'})...`));

  const args = [
    '-m', model,
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
    if (await serverUp()) return;
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
      stream: true,
      temperature: 0.2
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

async function turn(messages, ctx, opts) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const isCasual = /^(hi|hello|hey|yo|sup|test|ping|how are you|who are you)[\s!.]*$/i.test(lastUserMsg.trim());
  const activeTools = isCasual ? [] : TOOLS;

  for (let step = 0; step < 8; step++) {
    const stop = spinner(step ? 'nibbling clover…' : 'resting in the meadow…');
    let started = false, res;
    try {
      res = await completion(messages, activeTools, t => {
        if (!started) { started = true; stop(); process.stdout.write(sky('🐇 ')); }
        process.stdout.write(t);
      });
    } catch (e) {
      stop();
      console.log(red(`\n${e.message}`));
      return;
    }
    if (!started) stop();
    if (res.text) console.log();

    // Filter hallucinated tools that do not exist in TOOLS
    const validCalls = (res.calls || []).filter(c => TOOLS.some(t => t.function.name === c.name));

    const msg = { role: 'assistant', content: res.text || '' };
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
# LEROY CORE SKILLS
- Ponytail: Minimal code. YAGNI. Reuse existing patterns. Stdlib first. Surgical changes.
- Caveman: Concise, fluff-free responses with exact technical accuracy.
- REA: Use 'rea' tool to analyze binaries, Mach-O/PE/ELF executables, and web bundles.
- Taste: Calm visual hierarchy, dark palette, intentional layout.
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

async function main() {
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
      console.log(tree(root));
      return prompt();
    }

    // Inject system skills, inherited memory/rules & repo context
    const isGreeting = /^(hi|hello|hey|yo|sup|test|ping)[\s!.]*$/i.test(line);
    if (!isGreeting && messages.length <= 1) {
      messages[0] = {
        role: 'system',
        content: `You are Leroy 🐇, a calm, lop-eared offline AI coding & reverse-engineering agent resting peacefully in a meadow.
Model: LeroyObliterated.
Working Meadow (Directory): "${path.basename(root)}" (${root}).

${SKILL_INSTRUCTIONS}
${inheritedMemory}

Repo Overview:
${tree(root, 2, 25)}`
      };
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
  module.exports = { githubSlug, tree, parseArgs, TOOLS, SKILL_INSTRUCTIONS, MODELS, loadGlobalMemoryAndRules, querySelectiveMemory };
}
