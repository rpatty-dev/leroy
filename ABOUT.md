# About Leroy 🐇🥕

Leroy is an autonomous, lop-eared coding and reverse-engineering agent designed to run locally on your computer with zero subscriptions, zero telemetry, and zero censorship.

Named after a calm rabbit resting in a clover meadow, Leroy pairs local open-weights coding models with native operating system capabilities across macOS and Windows.

---

## 🌿 Philosophy & Principles

1. **Local & Private First**:
   Your code, credentials, and thoughts stay on your device. All inference runs directly on your local GPU (Apple Silicon Metal or Windows Vulkan/CUDA).
2. **Execution-First**:
   When you tell Leroy to do something (*"Uninstall TeamViewer"*, *"Add meeting with Conor"*, *"Refactor this endpoint"*, *"Deploy to Vercel"*), Leroy **executes** it directly using available system tools instead of returning a generic tutorial.
3. **Ponytail Architecture**:
   The best code is code never written. Minimal boilerplate, stdlib and native platform primitives first.
4. **Token Efficiency (RTK + Caveman)**:
   Leroy compresses command outputs by 43–90% via RTK and uses dynamic tool schema loading to cut tool overhead by over 55%, keeping persistent prompt context under ~356 tokens.
5. **Abliterated / Uncensored Reasoning**:
   Equipped with uncensored Qwen-Coder models for authorized bug bounties, binary disassembly, malware research, and full developer freedom.

---

## 🐇 Model Hierarchy

- **FAST (Default)**: `Qwen2.5-Coder-3B-Instruct-abliterated Q4_K_M` (~1.95 GiB)
  - Lightning-fast generation (~40 tok/s on Apple M2, TTFT ~34ms).
  - Handles daily file edits, git workflows, commands, and quick answers.
- **STRONG**: `Qwen2.5-Coder-7B-Instruct-abliterated Q4_K_M` (~4.36 GiB)
  - Deep multi-step reasoning, decompilation analysis, concurrency bugs, and complex architecture.
  - Automatically routed or triggered with `leroy --strong`.

---

## 🛠️ Cross-Platform Capabilities

- **macOS**: Native Apple Silicon Metal GPU acceleration (`-ngl 99 -fa on`), Homebrew Cask / App bundle management, Google Chrome control, Apple Calendar integration via AppleScript.
- **Windows**: Multi-threaded CPU / Vulkan GPU, `winget` package management, Chrome process control, PowerShell integration (`leroy.cmd`).
- **Developer Tools**: Git/GitHub (`gh`), Vercel CLI, REA (`morluto/rea`), REST HTTP testing, and Gmail SMTP/IMAP.

---

*“Rest in the clover, code with precision.”* 🐇🌸
