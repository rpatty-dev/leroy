<div align="center">

# `LEROY` 🐇🥕

**Chill Autonomous Local AI Coding & Reverse-Engineering Agent CLI**  
*Powered by Local LLMs (Apple Silicon Metal GPU & AVX), RTK Token-Compression, Ponytail Architecture, Tokless Disciplines & REA (`morluto/rea`).*

<br/>

<p align="center">
  <img src="assets/leroy-munch.gif" alt="Leroy Munching Carrot" width="68" />
  &nbsp;&nbsp;
  <img src="assets/leroy-laptop.gif" alt="Leroy Coding at Laptop" width="68" />
  &nbsp;&nbsp;
  <img src="assets/leroy-binky.gif" alt="Leroy Doing a Binky" width="68" />
  &nbsp;&nbsp;
  <img src="assets/leroy-love.gif" alt="Leroy Love" width="68" />
  &nbsp;&nbsp;
  <img src="assets/leroy-flop.gif" alt="Leroy Flop" width="68" />
</p>

<p align="center">
  <img src="assets/ascii-bunny.gif" alt="Animated ASCII Lop Bunny" width="320" />
</p>

```text
        🌾  🌸        🌿       🌼       🌷   🌾
         (\__/ )
         (='.'= )   L E R O Y  🥕  v2.0
         (")_(" )   Chill local offline agent in the meadow
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       Metal GPU / AVX  •  RTK Compression  •  Ponytail  •  REA
```

</div>

---

## 🌾 What is Leroy?

**Leroy** is an open-source, terminal-native AI coding agent built for developers who want **complete privacy, zero subscriptions, and offline execution**. 

Leroy hops directly into your repositories, analyzes code, runs commands with built-in token compression, inspects compiled binaries, and performs surgical code modifications—all driven by an offline local model.

### 🐰 Core Superpowers Built In:
1. **🐇 Git & Repo Ingestion**: Pass any GitHub repository URL (`leroy https://github.com/owner/repo`) or run inside your working folder.
2. **⚡ RTK (Rust Token Killer) Built-in**: Seamless integration with RTK for 60%–90% shell output compression (smart compact diffs, error isolation, filtered logs, and quiet tool runs).
3. **✂️ Ponytail Architecture**: Minimal, surgical code generation. Zero filler, stdlib-first, no speculative bloat.
4. **🧠 Memory & Rules Inheritance**: Automatically reads and respects your environment rules and shared memory (`~/.gemini/config/GEMINI.md`, `AGENTS.md`, and `~/.leroy/MEMORY.md`).
5. **🔍 REA Agent (`morluto/rea`)**: Built-in inspection of native binaries, Mach-O/PE/ELF executables, Electron ASARs, and web bundles.
6. **🎨 Apple & Claude Craft**: Calm typographic hierarchy, thoughtful terminal styling, and meadow-themed feedback.
7. **🍎 Metal GPU Acceleration**: Automatic Apple Silicon GPU offloading via `llama.cpp` unified memory (45–65+ tokens/second).

---

## 🚀 Quick Start Guide

### 🍎 On macOS (Apple Silicon M1/M2/M3/M4)

```bash
# 1. Install prerequisites (llama.cpp with Metal GPU + RTK compression)
brew install llama.cpp
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | bash
npm install -g rea-agents

# 2. Clone repository & link globally
git clone https://github.com/rpatty-dev/leroy.git
cd leroy
npm install
npm link

# 3. Download the quantized model (~/.leroy/models/LeroyObliterated.gguf)
mkdir -p ~/.leroy/models
curl -L -o ~/.leroy/models/LeroyObliterated.gguf \
  https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf

# 4. Hop into any repo or start in your current folder
leroy https://github.com/anomalyco/opencode
```

---

### 🪟 On Windows

```powershell
# 1. Install prerequisites
winget install llama.cpp
npm install -g rea-agents

# 2. Clone repository & install
git clone https://github.com/rpatty-dev/leroy.git
cd leroy
npm install
npm link

# 3. Download the quantized model
New-Item -ItemType Directory -Force -Path "$HOME\.leroy\models"
curl.exe -L -o "$HOME\.leroy\models\LeroyObliterated.gguf" `
  https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf

# 4. Launch Leroy
leroy https://github.com/anomalyco/opencode
```

---

## 🛠️ CLI Options

| Flag | Description |
| :--- | :--- |
| `leroy <url>` | Shallow-clones the repo into `~/.leroy/repos` and launches the session |
| `leroy` | Launches Leroy targeting your current directory |
| `--fast` | Switches to the fast 3B Coder model |
| `--yes`, `-y` | Auto-approves file modifications and shell execution |
| `--ctx <tokens>` | Configures local context window size (Default: `4096`) |

---

## 🐰 Built-in Session Commands

Inside the Leroy prompt (`🥕 ›`):
- `/tree` — Prints current repository file structure
- `/clear` — Flushes conversation context without exiting
- `/exit` — Closes Leroy session cleanly (`🐇🌸💨`)

---

## ⚖️ License
MIT License • Created by [rpatty-dev](https://github.com/rpatty-dev)

---

Built with help from [Nitech](https://nitech.dev).
