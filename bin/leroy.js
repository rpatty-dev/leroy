#!/usr/bin/env node
// Leroy 🐇 - bunny-themed local coding & reverse engineering agent CLI
// Powered by LeroyObliterated (llama.cpp) with REA (morluto/rea) agent, Ponytail & Taste skills.

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { spawn, spawnSync } = require('child_process');

const PORT = 8080;
const API = `http://127.0.0.1:${PORT}/v1`;
const LLM = path.join(os.homedir(), 'Documents', 'LocalLLM');
const MODELS = {
  main: path.join(LLM, 'models', 'LeroyObliterated.Q4_K_M.gguf'),
  fast: path.join(LLM, 'models', 'Qwen2.5-Coder-3B-abliterated.Q4_K_M.gguf')
};
const REPOS = path.join(os.homedir(), '.leroy', 'repos');
const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'target', '__pycache__', '.venv', 'vendor']);

// Terminal ANSI colors
const c = (rgb, s) => `\x1b[38;2;${rgb}m${s}\x1b[0m`;
const sky = s => c('56;189;248', s);
const carrot = s => c('251;146;60', s);
const cream = s => c('231;226;214', s);
const dim = s => c('130;126;115', s);
const red = s => c('248;113;113', s);
const green = s => c('134;239;172', s);

const BANNER = `
${sky(' (\\__/ )')}
${sky(" (='.'= )")}  ${cream('L E R O Y')}  ${carrot('🥕')}  ${dim('v2.0 [LeroyObliterated + REA + Ponytail + Taste]')}
${sky(' (")_(" )')}  ${dim('Offline lop-eared reverse-engineer & systems architect')}
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
  if (git(['--version']).error) die('git not found on PATH. Install Git for Windows.');
  if (fs.existsSync(path.join(dest, '.git'))) {
    console.log(dim(`🥕 Dug into cached repo ${slug.owner}/${slug.repo}`));
  } else {
    fs.mkdirSync(REPOS, { recursive: true });
    console.log(sky(`🐇 Hopping to github.com/${slug.owner}/${slug.repo} (shallow clone)…`));
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

function readmeHead(root) {
  const f = ['README.md', 'readme.md', 'README'].map(n => path.join(root, n)).find(fs.existsSync);
  return f ? fs.readFileSync(f, 'utf8').slice(0, 800) : '';
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
  fn('list_dir', 'List files in a directory', { path: { type: 'string' } }),
  fn('read_file', 'Read a file (optionally a line range)', { path: { type: 'string' }, start_line: { type: 'integer' }, end_line: { type: 'integer' } }, ['path']),
  fn('search', 'Find text or regex pattern across files', { pattern: { type: 'string' }, path: { type: 'string' } }, ['pattern']),
  fn('write_file', 'Create or overwrite a file', { path: { type: 'string' }, content: { type: 'string' } }, ['path', 'content']),
  fn('run', 'Run a shell command in the repo', { command: { type: 'string' } }, ['command']),
  fn('rea', 'Execute REA (Reverse Engineer Anything) tool against a native binary, electron/js app, or directory', {
    command: { type: 'string', enum: REA_SAFE },
    args: { type: 'string', description: 'Arguments like file path or options' }
  }, ['command'])
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
  try {
    if (name === 'list_dir') return tree(inside(root, a.path), 1, 60) || '(empty)';
    if (name === 'read_file') {
      const lines = fs.readFileSync(inside(root, a.path), 'utf8').split('\n');
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
      const r = spawnSync(a.command, { cwd: root, shell: true, encoding: 'utf8', timeout: 60000 });
      return cap(`exit ${r.status}\n${r.stdout || ''}${r.stderr || ''}`);
    }
    if (name === 'rea') {
      console.log(sky(`  🐰 Invoking REA reverse-engineer agent: rea ${a.command} ${a.args || ''}`));
      return runRea(a.command, a.args, root);
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

async function ensureServer(opts) {
  if (await serverUp()) return;
  const model = opts.fast ? MODELS.fast : MODELS.main;
  const exe = path.join(LLM, 'llama', 'llama-server.exe');
  if (!fs.existsSync(exe) || !fs.existsSync(model)) die(`Missing binary or model:\n  ${exe}\n  ${model}`);
  
  console.log(dim(`🥕 Waking up LeroyObliterated (ctx: ${opts.ctx}, IvyBridge AVX optimized)...`));
  const args = [
    '-m', model,
    '--alias', 'LeroyObliterated',
    '-t', '4',
    '-c', String(opts.ctx),
    '-b', '512',
    '-ub', '256',
    '--host', '127.0.0.1',
    '--port', String(PORT),
    '--reasoning-budget', '0'
  ];
  spawn(exe, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();

  for (let i = 0; i < 40; i++) {
    if (await serverUp()) return;
    await new Promise(r => setTimeout(r, 1000));
  }
  die('Failed to start llama-server. Check free RAM or port 8080.');
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
  return { text, calls: calls.filter(Boolean) };
}

function spinner(label) {
  const frames = ['🥕', '🐇', '🥕', '🐰'];
  let i = 0;
  const t = setInterval(() => process.stdout.write(`\r${dim(frames[i++ % 4] + ' ' + label)}   `), 250);
  return () => { clearInterval(t); process.stdout.write('\r' + ' '.repeat(label.length + 8) + '\r'); };
}

async function turn(messages, ctx, opts) {
  for (let step = 0; step < 8; step++) {
    const stop = spinner(step ? 'chewing data…' : 'thinking…');
    let started = false, res;
    try {
      res = await completion(messages, TOOLS, t => {
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

    const msg = { role: 'assistant', content: res.text || '' };
    if (res.calls.length) {
      msg.tool_calls = res.calls.map((c, i) => ({
        id: c.id || `call_${step}_${i}`,
        type: 'function',
        function: { name: c.name, arguments: c.args || '{}' }
      }));
    }
    messages.push(msg);

    if (!res.calls.length) return;

    for (const tc of msg.tool_calls) {
      let args = {}; try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      console.log(dim(`  🥕 ${tc.function.name}(${Object.values(args).map(v => String(v).slice(0, 40)).join(', ')})`));
      const out = await runTool(tc.function.name, args, ctx);
      messages.push({ role: 'tool', tool_call_id: tc.id, content: out });
    }
  }
}

// Built-in Skill Prompts: Ponytail (Simplicity/Zero Fluff), Claude Taste (Design/UI), REA (Reverse Engineering)
const SKILL_INSTRUCTIONS = `
# LEROY CORE OPERATING SKILLS

## 1. PONYTAIL SKILL (Lazy Senior Architect)
- Minimum code that solves the problem. Delete before adding.
- Stdlib first, native platform features second, dependencies last.
- Zero fluff, conversational preamble, or redundant abstractions.
- Match existing style. Touch only what is strictly necessary.

## 2. TASTE & DESIGN SKILL (Apple / Claude Elite UI Craft)
- Strict visual hierarchy, intentional typographic scale, thoughtful whitespace.
- Apple-grade dark palette: deep obsidian (#0c0e14), frosted glass layers, restrained accents.
- Responsive design tokens: clean pill badges, sharp data tables, clear micro-interactions.

## 3. REA SKILL (Reverse Engineer Anything)
- Use the 'rea' tool to analyze binaries, PE/ELF executables, Electron ASARs, and web bundles.
- Ground all reverse-engineering conclusions in concrete Evidence (offsets, strings, disassembly, imports).
- Present decompiled logic concisely: signature, inferred purpose, call graph context.
`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(BANNER + `\nUsage:\n  leroy <github-url | owner/repo | local-path>\n  leroy\n\nOptions:\n  --fast    Use 3B Coder model\n  --yes     Auto-approve file changes\n  --ctx N   Context tokens (default: 4096)`);
    return;
  }
  console.log(BANNER);
  const root = resolveRoot(opts.target);
  console.log(`${carrot('📁')} ${cream(root)}\n`);
  await ensureServer(opts);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => opts.yes ? Promise.resolve(true) : new Promise(r => rl.question(`${q} ${dim('[y/N]')} `, a => r(/^y/i.test(a))));

  const fresh = () => [{ role: 'system', content: 'You are Leroy 🐇, a rabbit-themed expert reverse-engineer and programmer. Reply concisely.' }];
  let messages = fresh();
  const ctx = { root, ask };

  console.log(green('✓ LeroyObliterated server connected & ready.'));
  console.log(dim('Type your question or instruction. /tree, /clear, /exit.\n'));

  const prompt = () => rl.question(`${carrot('🥕')} ${sky('›')} `, async line => {
    line = line.trim();
    if (!line) return prompt();
    if (line === '/exit' || line === '/quit') { console.log(sky('Bye! 🐇💨')); process.exit(0); }
    if (line === '/clear') { messages = fresh(); console.log(dim('Context cleared.')); return prompt(); }
    if (line === '/tree') { console.log(tree(root)); return prompt(); }

    // If first real task, inject full system skills + repo context
    const isGreeting = /^(hi|hello|hey|yo|sup|test|ping)[\s!.]*$/i.test(line);
    if (!isGreeting && messages.length <= 1) {
      messages[0] = {
        role: 'system',
        content: `You are Leroy 🐇, a rabbit-themed expert reverse-engineer, systems programmer, and software craftsman.
Model: LeroyObliterated.
Working Directory: "${path.basename(root)}" (${root}).

${SKILL_INSTRUCTIONS}

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

if (require.main === module) main().catch(e => die(e.stack || String(e)));
