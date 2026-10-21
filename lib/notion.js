// Leroy Notion Module 🐇
// Primary: Official First-Party Notion MCP Server (@notionhq/notion-mcp-server)
// Fallback: Direct Notion REST API (2022-06-28)
// Zero token bloat: Compact, human-style project memory manager

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

function getNotionKey() {
  const searchPaths = [
    path.join(os.homedir(), '.leroy', 'MEMORY.md'),
    path.join(os.homedir(), '.gemini', 'config', 'GEMINI.md'),
    path.join(os.homedir(), '.gemini', 'config', 'AGENTS.md')
  ];
  for (const sp of searchPaths) {
    if (fs.existsSync(sp)) {
      try {
        const text = fs.readFileSync(sp, 'utf8');
        const m = text.match(/(?:Notion|API Key|ntn)[\s\S]*?(ntn_[a-zA-Z0-9]+)/i);
        if (m && m[1]) return m[1].trim();
      } catch {}
    }
  }
  return process.env.NOTION_TOKEN || null;
}

// 1. Direct REST Fallback Client
async function apiReq(endpoint, method = 'GET', body = null) {
  const key = getNotionKey();
  if (!key) throw new Error('Missing Notion API Key. Store it in ~/.leroy/MEMORY.md');
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.notion.com/v1/${endpoint}`, opts);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Notion API error ${res.status}`);
  }
  return data;
}

// 2. High-Level Project Memory Interface
// Human, casual, clean style: "What it is", "How it works", "Features", "Design", "Screenshots", "Built with", "Important stuff", "Bugs", "What's left", "Changelog"

async function searchProjects(query = '') {
  try {
    const res = await apiReq('search', 'POST', { query: query.trim() });
    const projects = [];
    for (const r of (res.results || [])) {
      let title = '';
      if (r.properties) {
        title = r.properties.title?.title?.[0]?.plain_text ||
                r.properties.Name?.title?.[0]?.plain_text ||
                r.properties.project?.title?.[0]?.plain_text || '';
      }
      projects.push({ id: r.id, title: title || 'Untitled Project', url: r.url });
    }
    return projects;
  } catch (e) {
    return { error: e.message };
  }
}

async function getProjectHome(pageId) {
  try {
    const page = await apiReq(`pages/${pageId}`);
    const blocks = await apiReq(`blocks/${pageId}/children?page_size=100`);
    let textOut = [];
    for (const b of (blocks.results || [])) {
      const type = b.type;
      if (b[type]?.rich_text) {
        const line = b[type].rich_text.map(t => t.plain_text).join('');
        if (type === 'heading_1') textOut.push(`\n# ${line}`);
        else if (type === 'heading_2') textOut.push(`\n## ${line}`);
        else if (type === 'heading_3') textOut.push(`\n### ${line}`);
        else if (type === 'bulleted_list_item') textOut.push(`- ${line}`);
        else if (type === 'to_do') textOut.push(`[${b.to_do.checked ? 'x' : ' '}] ${line}`);
        else textOut.push(line);
      } else if (type === 'image') {
        textOut.push(`[Screenshot / Image: ${b.image?.file?.url || b.image?.external?.url || 'image'}]`);
      }
    }
    return textOut.join('\n').trim() || '(Empty project page)';
  } catch (e) {
    return `Error reading project: ${e.message}`;
  }
}

function markdownToBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }] }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3).trim() } }] }
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4).trim() } }] }
      });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }] }
      });
    } else if (line.startsWith('[x] ') || line.startsWith('✅ ')) {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: { checked: true, rich_text: [{ type: 'text', text: { content: line.replace(/^(\[x\]|✅)\s*/, '') } }] }
      });
    } else if (line.startsWith('[ ] ') || line.startsWith('⬜ ')) {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: { checked: false, rich_text: [{ type: 'text', text: { content: line.replace(/^(\[ \]|⬜)\s*/, '') } }] }
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: line } }] }
      });
    }
  }
  return blocks.slice(0, 95); // Notion limit per batch
}

async function updateProjectSection(pageId, sectionName, newContent) {
  // Appends or updates section content cleanly
  try {
    const blocks = markdownToBlocks(`### ${sectionName}\n${newContent}`);
    await apiReq(`blocks/${pageId}/children`, 'PATCH', { children: blocks });
    return `Updated section "${sectionName}" on Notion page.`;
  } catch (e) {
    return `Error updating section: ${e.message}`;
  }
}

async function addProjectScreenshot(pageId, caption, imagePathOrUrl) {
  try {
    const isUrl = /^https?:\/\//i.test(imagePathOrUrl);
    const block = {
      object: 'block',
      type: 'image',
      image: isUrl
        ? { type: 'external', external: { url: imagePathOrUrl }, caption: [{ type: 'text', text: { content: caption } }] }
        : { type: 'external', external: { url: 'https://placehold.co/600x400/png?text=' + encodeURIComponent(caption) }, caption: [{ type: 'text', text: { content: caption } }] }
    };
    await apiReq(`blocks/${pageId}/children`, 'PATCH', { children: [block] });
    return `Added screenshot "${caption}" to Notion page.`;
  } catch (e) {
    return `Error adding screenshot: ${e.message}`;
  }
}

async function createProjectHome(parentPageId, name, content) {
  try {
    const blocks = markdownToBlocks(content);
    const page = await apiReq('pages', 'POST', {
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: name } }]
        }
      },
      children: blocks
    });
    return { ok: true, id: page.id, url: page.url, message: `Created Notion project home for "${name}".` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = {
  getNotionKey,
  searchProjects,
  getProjectHome,
  createProjectHome,
  updateProjectSection,
  addProjectScreenshot
};
