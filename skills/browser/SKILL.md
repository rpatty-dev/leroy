# Browser Automation Skill

### Comparison: Browser-Use vs Browserclaw
- **Browser-Use**: Python-based (`pip install browser-use`), uses Playwright under the hood, but orchestrates DOM observation, accessibility trees, and agent actions. It is actively maintained and has a rich ecosystem. However, running an LLM agent inside an agent on an 8GB Apple M2 introduces heavy RAM pressure (Chromium ~500MB-1GB + Python runtime + llama.cpp model).
- **Chrome DevTools Protocol (CDP) / DevTools MCP**: Connects directly to an existing running Google Chrome instance via remote debugging (`--remote-debugging-port=9222`). Zero additional memory overhead, zero heavy duplicate browser engines loaded in RAM.
- **Recommendation**: DevTools MCP / direct CDP commands via curl/websockets for inspecting live web apps and DOM, with lightweight scripts for browser navigation.
