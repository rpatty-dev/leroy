<div align="center">

# `LEROY` 🐇🥕

**Autonomous Terminal Coding & Reverse-Engineering Agent CLI**  
*Powered by Local LLMs (Metal / Apple Silicon GPU & AVX), REA Agent (`morluto/rea`), Ponytail Architecture & Apple Taste.*

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
 (\__/ )
 (='.'= )  L E R O Y  🥕  v2.0
 (")_(" )  Zero Cloud. Zero Subscription. Fully Autonomous.
```

</div>

---

## ⚡ What is Leroy?

**Leroy** is an open-source, terminal-native AI coding agent built for developers who want **complete code privacy and local execution**. Similar to OpenCode, Leroy operates directly inside your repositories, analyzes files, runs builds, and performs deep static reverse-engineering—all driven by an offline local model.

### 🐰 Core Superpowers Built In:
1. **🐇 Git & Repo Ingestion**: Pass any GitHub repository URL (`leroy https://github.com/owner/repo`) or run inside your working folder.
2. **🔍 REA Skill (`morluto/rea`)**: Built-in integration with the Reverse Engineer Anything agent for inspecting native binaries, PE/ELF executables, Electron ASARs, and web bundles.
3. **📐 Ponytail Architecture**: Minimal, surgical code generation. Zero filler, stdlib-first, no speculative bloat.
4. **🎨 Claude / Apple Taste**: High-standard UI/UX principles embedded in its reasoning and styling suggestions.
5. **⚡ Multi-Model Support**: Defaults to `LeroyObliterated` (Qwen 4B Q4_K_M) with optional ultra-fast coder mode (`--fast` Qwen2.5-Coder 3B).

---

## 🚀 Quick Start Guide

### 🍎 On macOS (MacBook Pro / Apple Silicon) — *Recommended (40–60+ tokens/sec)*

```bash
# 1. Clone repository
git clone https://github.com/rpatty-dev/leroy.git
cd leroy

# 2. Run automated setup (installs llama.cpp with Metal GPU acceleration & dependencies)
npm install
npm link
```

Run Leroy against any codebase:
```bash
leroy https://github.com/anomalyco/opencode
```

---

### 🪟 On Windows

```powershell
git clone https://github.com/rpatty-dev/leroy.git
cd leroy
npm link
```

Start inspecting:
```powershell
# Inspect any repo from GitHub
leroy https://github.com/anomalyco/opencode

# Or hop into any local project directory
cd C:\path\to\my-app
leroy
```

---

## 🛠️ CLI Options

| Flag | Description |
| :--- | :--- |
| `leroy <url>` | Automatically shallow-clones the repo into `~/.leroy/repos` and launches the session |
| `leroy` | Launches Leroy targeting your current directory |
| `--fast` | Switches to the fast 3B Coder model for instantaneous response times |
| `--yes`, `-y` | Auto-approves file modifications and shell execution |
| `--ctx <tokens>` | Configures local context window size (Default: `4096`) |

---

## 🐰 Built-in Session Commands

Inside the Leroy prompt (`🥕 ›`):
- `/tree` — Prints current repository file structure
- `/clear` — Flushes conversation context without exiting
- `/exit` — Closes Leroy session cleanly (`🐇💨`)

---

## ⚖️ License
MIT License • Created by [rpatty-dev](https://github.com/rpatty-dev)
