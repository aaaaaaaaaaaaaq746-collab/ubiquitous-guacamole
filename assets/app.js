/* VS Code Clone - Vanilla JS, REA-inspired no-framework architecture */
(() => {
  'use strict';

  // --- File System ---
  const initialFS = {
    name: 'ubiquitous-guacamole',
    type: 'folder',
    path: '',
    children: [
      { name: '.vscode', type: 'folder', path: '.vscode', children: [
        { name: 'settings.json', type: 'file', path: '.vscode/settings.json', content: `{
  "editor.fontSize": 13,
  "editor.tabSize": 2,
  "editor.wordWrap": "on",
  "editor.minimap.enabled": true,
  "workbench.colorTheme": "Dark Modern",
  "files.autoSave": "afterDelay"
}` },
        { name: 'launch.json', type: 'file', path: '.vscode/launch.json', content: `{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "\${workspaceFolder}/src/app.js"
    }
  ]
}`}
      ]},
      { name: 'src', type: 'folder', path: 'src', children: [
        { name: 'app.js', type: 'file', path: 'src/app.js', content: `// Welcome to VS Code Clone
// Edit this file and see live updates - same fidelity as desktop VS Code

function greet(name) {
  console.log(\`Hello, \${name}! Welcome to the web VS Code.\`);
  return { message: \`Hi \${name}\`, time: Date.now() };
}

class Editor {
  constructor() {
    this.tabs = [];
    this.theme = 'dark';
  }
  open(path) {
    console.log('Opening', path);
  }
}

greet('Developer');
export default Editor;
` },
        { name: 'styles.css', type: 'file', path: 'src/styles.css', content: `/* Main styles - edit me! */
:root {
  --accent: #007acc;
  --bg: #1f1f1f;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: var(--bg);
  color: #cccccc;
}

.card {
  background: #252526;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  padding: 16px;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--accent);
}
` },
        { name: 'index.html', type: 'file', path: 'src/index.html', content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My App</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <main class="card">
    <h1>Hello from VS Code Web</h1>
    <p>Edit <code>src/app.js</code> and watch the preview update.</p>
    <button onclick="greet('World')">Greet</button>
  </main>
  <script src="./app.js"></script>
</body>
</html>
` },
      ]},
      { name: 'public', type: 'folder', path: 'public', children: [
        { name: 'index.html', type: 'file', path: 'public/index.html', content: '<!-- Public assets -->\n<div>Public folder</div>' }
      ]},
      { name: 'README.md', type: 'file', path: 'README.md', content: `# ubiquitous-guacamole

> VS Code in the browser — same to same.

This is a fully functional Visual Studio Code clone built with vanilla HTML/CSS/JS,
inspired by the clean, no-framework approach of [morluto/rea](https://github.com/morluto/rea).

## Features

- File explorer with create/rename/delete
- Monaco editor with syntax highlighting
- Integrated terminal
- Command palette (Ctrl+Shift+P)
- Search, Source Control, Extensions UI
- Copilot Chat panel
- Live HTML preview
- Themes, status bar, breadcrumbs

## Get Started

1. Open \`src/app.js\` to start coding
2. Use \`Ctrl+P\` to quick open files
3. Try the terminal: type \`help\`

Built with ❤️ — not affiliated with Microsoft.
` },
      { name: 'package.json', type: 'file', path: 'package.json', content: `{
  "name": "ubiquitous-guacamole",
  "version": "1.0.0",
  "description": "VS Code Web Clone",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {},
  "devDependencies": {
    "vite": "^6.0.0"
  }
}` },
      { name: 'hi.txt', type: 'file', path: 'hi.txt', content: 'hi' },
    ]
  };

  // State
  let fsRoot = structuredClone(initialFS);
  // Try load from localStorage
  try {
    const saved = localStorage.getItem('vscode-fs-v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      // merge to keep structure but restore content changes
      fsRoot = parsed;
    }
  } catch {}

  function saveFS() {
    try { localStorage.setItem('vscode-fs-v1', JSON.stringify(fsRoot)); } catch {}
  }

  let expanded = new Set(['', 'src', '.vscode']);
  let openTabs = []; // {path, dirty}
  let activePath = null;
  let recent = JSON.parse(localStorage.getItem('vscode-recent') || '[]');

  // --- Helpers ---
  function findNode(path, root = fsRoot) {
    if (!path || path === '') return root;
    const parts = path.split('/').filter(Boolean);
    let cur = root;
    for (const p of parts) {
      if (!cur.children) return null;
      cur = cur.children.find(c => c.name === p);
      if (!cur) return null;
    }
    return cur;
  }
  function findParent(path) {
    const idx = path.lastIndexOf('/');
    const parentPath = idx === -1 ? '' : path.slice(0, idx);
    const name = idx === -1 ? path : path.slice(idx+1);
    return { parent: findNode(parentPath), parentPath, name };
  }
  function getAllFiles(root = fsRoot, acc = []) {
    if (root.type === 'file') acc.push(root);
    if (root.children) for (const c of root.children) getAllFiles(c, acc);
    return acc;
  }
  function getLanguage(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    const map = { js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown', txt: 'plaintext', py: 'python', sh: 'shell', yml: 'yaml', yaml: 'yaml', svg: 'xml', xml: 'xml' };
    return map[ext] || 'plaintext';
  }
  function iconFor(path, isFolder, isOpen) {
    if (isFolder) return isOpen ? '📁' : '📂';
    const ext = path.split('.').pop()?.toLowerCase();
    const icons = {
      js: '🟨', ts: '🔷', html: '🌐', css: '🎨', json: '{ }', md: '📝', txt: '📄',
      py: '🐍', yml: '⚙️', yaml: '⚙️', svg: '🖼️', sh: '▸_'
    };
    return icons[ext] || '📄';
  }
  function colorForIcon(path) {
    const ext = path.split('.').pop();
    const map = { js: '#f1e05a', ts: '#3178c6', html: '#e34c26', css: '#563d7c', json: '#f1e05a', md: '#083fa1' };
    return map[ext] || '';
  }

  // --- DOM refs ---
  const fileTreeEl = document.getElementById('fileTree');
  const tabsBar = document.getElementById('tabsBar');
  const welcomePage = document.getElementById('welcomePage');
  const monacoContainer = document.getElementById('monacoContainer');
  const fallbackEditor = document.getElementById('fallbackEditor');
  const fallbackTextarea = document.getElementById('fallbackTextarea');
  const previewPane = document.getElementById('previewPane');
  const previewFrame = document.getElementById('previewFrame');
  const breadcrumbFile = document.getElementById('breadcrumbFile');
  const titlebarFilename = document.getElementById('titlebarFilename');
  const statusLanguage = document.getElementById('statusLanguage');
  const statusPosition = document.getElementById('statusPosition');
  const sidebar = document.getElementById('sidebar');
  const auxiliaryBar = document.getElementById('auxiliaryBar');
  const panel = document.getElementById('panel');
  const recentList = document.getElementById('recentList');

  // --- File Tree Rendering — Subpart 1.3 (enhanced) ---
  function renderTree() {
    fileTreeEl.innerHTML = '';
    // update file count
    const allFiles = getAllFiles();
    const countEl = document.getElementById('explorerFileCount');
    if (countEl) countEl.textContent = `${allFiles.length} files`;

    // helper to draw indent guides
    function indentGuides(depth) {
      if (depth === 0) return '';
      let g = '';
      for (let i=0;i<depth;i++) g += `<span class="indent-guide"></span>`;
      return g;
    }

    function walk(node, depth) {
      const isFolder = node.type === 'folder';
      const isExpanded = expanded.has(node.path);
      const el = document.createElement('div');
      el.className = `tree-item depth-${depth} ${isFolder ? 'is-folder' : ''} ${activePath === node.path ? 'is-active' : ''}`;
      el.setAttribute('role', 'treeitem');
      el.setAttribute('aria-selected', activePath === node.path ? 'true' : 'false');
      el.setAttribute('aria-expanded', isFolder ? String(isExpanded) : null);
      el.dataset.path = node.path;
      el.dataset.type = node.type;
      el.draggable = true;

      let toggle = '';
      if (isFolder) toggle = `<span class="tree-toggle">${isExpanded ? '▾' : '▸'}</span>`;
      else toggle = `<span class="tree-toggle"></span>`;

      const icon = iconFor(node.path, isFolder, isExpanded);
      const dirty = (!isFolder && openTabs.find(t => t.path === node.path)?.dirty) ? `<span style="margin-left:auto;font-size:10px;color:var(--fg-muted)" title="Unsaved">●</span>` : `<span style="margin-left:auto"></span>`;
      // indent guides + label
      el.innerHTML = `${indentGuides(depth)}${toggle}<span class="file-icon">${icon}</span><span class="tree-label">${node.name || 'ubiquitous-guacamole'}</span>${dirty}`;
      // drag handlers
      el.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', node.path); e.dataTransfer.effectAllowed='move'; el.classList.add('is-dragging'); });
      el.addEventListener('dragend', ()=>el.classList.remove('is-dragging'));
      el.addEventListener('dragover', (e)=>{ e.preventDefault(); if(isFolder) el.classList.add('is-drop-target'); });
      el.addEventListener('dragleave', ()=>el.classList.remove('is-drop-target'));
      el.addEventListener('drop', (e)=>{
        e.preventDefault(); el.classList.remove('is-drop-target');
        const srcPath = e.dataTransfer.getData('text/plain');
        if (!srcPath || srcPath===node.path) return;
        movePath(srcPath, node.path);
      });
      // keyboard navigation: arrows expand/collapse, Enter open
      el.addEventListener('keydown', (e)=>{
        if (e.key==='ArrowRight' && isFolder && !isExpanded) { expanded.add(node.path); renderTree(); }
        else if (e.key==='ArrowLeft' && isFolder && isExpanded) { expanded.delete(node.path); renderTree(); }
        else if (e.key==='Enter') { if(isFolder){ if(isExpanded) expanded.delete(node.path); else expanded.add(node.path); renderTree(); } else openFile(node.path); }
      });
      el.tabIndex = 0;
      fileTreeEl.appendChild(el);

      if (isFolder && isExpanded && node.children) {
        // sort folders first then files
        const sorted = [...node.children].sort((a,b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
        for (const child of sorted) walk(child, depth+1);
      }
    }
    // root children
    const sortedRoot = [...fsRoot.children].sort((a,b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
    for (const child of sortedRoot) walk(child, 0);
  }

  // Enhanced click: folder toggle, file open, outline refresh
  fileTreeEl.addEventListener('click', (e) => {
    const item = e.target.closest('.tree-item');
    if (!item) return;
    const path = item.dataset.path;
    const node = findNode(path);
    if (!node) return;
    if (node.type === 'folder') {
      if (expanded.has(path)) expanded.delete(path);
      else expanded.add(path);
      renderTree();
    } else {
      openFile(path);
      refreshOutlineAndTimeline();
    }
    item.focus();
  });
  // Collapse All handler
  document.querySelector('[data-cmd="collapseAll"]')?.addEventListener('click', ()=>{
    expanded.clear(); expanded.add(''); renderTree(); toast('All folders collapsed');
  });
  // Explorer section toggles (Outline/Timeline)
  document.querySelectorAll('.section-header[data-toggle]').forEach(h=>{
    h.addEventListener('click', ()=>{
      const key = h.dataset.toggle;
      const content = document.getElementById(key==='outline'?'outlineTree':'timelineList');
      const isOpen = !content.classList.contains('hidden');
      if (isOpen) { content.classList.add('hidden'); h.setAttribute('aria-expanded','false'); h.querySelector('.chevron').textContent='▸'; }
      else {
        content.classList.remove('hidden'); h.setAttribute('aria-expanded','true'); h.querySelector('.chevron').textContent='▾';
        if (key==='outline') renderOutline();
        if (key==='timeline') renderTimeline();
      }
    });
  });
  // Outline & Timeline renderers
  function renderOutline() {
    const outlineEl = document.getElementById('outlineTree');
    if (!outlineEl || !activePath) { if(outlineEl) outlineEl.innerHTML='<div class="muted small" style="padding:6px 12px">No active file</div>'; return; }
    const node = findNode(activePath);
    if (!node) return;
    const text = node.content;
    const symbols = [];
    const funcRe = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*\(.*\)\s*=>|class\s+(\w+)|(\w+)\s*\(.*\)\s*\{)/g;
    let m;
    while ((m=funcRe.exec(text))!==null) {
      const name = m[1]||m[2]||m[3]||m[4];
      if (name) symbols.push({name, kind: m[3]?'class': m[1]||m[4]?'function':'variable', line: text.slice(0,m.index).split('\n').length});
    }
    if (symbols.length===0) { outlineEl.innerHTML='<div class="muted small" style="padding:6px 12px">No symbols found</div>'; return; }
    outlineEl.innerHTML = symbols.map(s=>`<div class="outline-item" data-line="${s.line}"><span class="sym sym-${s.kind}">${s.kind[0].toUpperCase()}</span><span>${s.name}</span><span class="muted small" style="margin-left:auto">:${s.line}</span></div>`).join('');
    outlineEl.querySelectorAll('.outline-item').forEach(el=>el.addEventListener('click', ()=>{
      openFile(activePath);
      setTimeout(()=>{ if(monacoEditor) monacoEditor.revealLineInCenter(parseInt(el.dataset.line)); monacoEditor.setPosition({lineNumber:parseInt(el.dataset.line), column:1}); },100);
    }));
    // update header count
    const header = document.querySelector('[data-toggle="outline"] .muted');
    if (header) header.textContent = `${symbols.length} symbols`;
  }
  function renderTimeline() {
    const tl = document.getElementById('timelineList');
    if (!tl) return;
    const entries = JSON.parse(localStorage.getItem('vscode-timeline')||'[]');
    if (entries.length===0) { tl.innerHTML='<div class="muted small" style="padding:6px 12px">No local history yet — edits create timeline entries</div>'; return; }
    tl.innerHTML = entries.slice(-10).reverse().map(e=>`<div class="timeline-item"><span>✎</span><span>${e.path.split('/').pop()}</span><span class="muted small">${e.action}</span><span class="time">${e.time}</span></div>`).join('');
  }
  function refreshOutlineAndTimeline(){
    const outlineVisible = !document.getElementById('outlineTree').classList.contains('hidden');
    if (outlineVisible) renderOutline();
    // timeline auto-add on save/open
    const now = new Date().toLocaleTimeString();
    if (activePath) {
      let tl = JSON.parse(localStorage.getItem('vscode-timeline')||'[]');
      tl.push({path:activePath, action:'Opened', time: now});
      if (tl.length>50) tl=tl.slice(-50);
      localStorage.setItem('vscode-timeline', JSON.stringify(tl));
    }
  }
  function movePath(srcPath, destFolderPath) {
    const srcNode = findNode(srcPath);
    const destNode = findNode(destFolderPath);
    if (!srcNode || !destNode || destNode.type!=='folder') return;
    if (srcPath===destFolderPath || destFolderPath.startsWith(srcPath+'/')) { toast('Cannot move folder into itself'); return; }
    // remove from old parent
    const {parent: oldParent, name} = findParent(srcPath);
    if (!oldParent) return;
    oldParent.children = oldParent.children.filter(c=>c.path!==srcPath);
    // check duplicate name in dest
    if (destNode.children.find(c=>c.name===srcNode.name)) { toast('Destination already has '+srcNode.name); oldParent.children.push(srcNode); return; }
    // update path
    const newPath = destFolderPath ? destFolderPath + '/' + srcNode.name : srcNode.name;
    function updatePaths(n, base){ n.path = base ? base + '/' + n.name : n.name; if(n.children) for(const ch of n.children) updatePaths(ch, n.path); }
    srcNode.path = newPath;
    if (srcNode.children) for(const ch of srcNode.children) updatePaths(ch, srcNode.path);
    destNode.children.push(srcNode);
    expanded.add(destFolderPath);
    saveFS(); renderTree();
    // update tabs paths
    openTabs.forEach(t=>{ if(t.path===srcPath) t.path=newPath; else if(t.path.startsWith(srcPath+'/')) t.path=newPath+t.path.slice(srcPath.length); });
    if(activePath===srcPath) activePath=newPath; else if(activePath?.startsWith(srcPath+'/')) activePath=newPath+activePath.slice(srcPath.length);
    toast(`Moved ${name} → ${destFolderPath||'root'}`);
  }

  fileTreeEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const item = e.target.closest('.tree-item');
    if (!item) return showContextMenu(e.clientX, e.clientY, [{ label: 'New File...', action: () => createNew('file', item.dataset.path) }, {label:'New Folder...', action: () => createNew('folder', item.dataset.path)}]);
    const path = item.dataset.path;
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New File...', kbd: '', action: () => createNew('file', path) },
      { label: 'New Folder...', action: () => createNew('folder', path) },
      { type: 'sep' },
      { label: 'Rename...', action: () => renamePath(path) },
      { label: 'Delete', action: () => deletePath(path) },
      { type: 'sep' },
      { label: 'Copy Path', action: () => { navigator.clipboard.writeText(path); toast('Copied path: ' + path); } },
      { label: 'Copy Relative Path', action: () => { navigator.clipboard.writeText(path); toast('Copied'); } },
    ]);
  });

  function createNew(type, basePath) {
    let parentPath = basePath;
    const node = findNode(basePath);
    if (node && node.type === 'file') {
      parentPath = findParent(basePath).parentPath;
    }
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;
    if (name.includes('/')) { toast('Name cannot contain /'); return; }
    const parent = findNode(parentPath);
    if (!parent || !parent.children) return;
    if (parent.children.find(c => c.name === name)) { toast('Already exists'); return; }
    const newPath = parentPath ? parentPath + '/' + name : name;
    const newNode = type === 'file' ? { name, type: 'file', path: newPath, content: '' } : { name, type: 'folder', path: newPath, children: [] };
    parent.children.push(newNode);
    if (type === 'folder') expanded.add(newPath);
    saveFS();
    renderTree();
    if (type === 'file') openFile(newPath);
    terminalLog(`created ${newPath}`);
  }
  function renamePath(path) {
    const { parent, name } = findParent(path);
    const newName = prompt('New name:', name);
    if (!newName || newName === name) return;
    if (newName.includes('/')) { toast('Invalid name'); return; }
    const node = findNode(path);
    if (!node) return;
    const oldPath = node.path;
    const parentPath = findParent(path).parentPath;
    const newPath = parentPath ? parentPath + '/' + newName : newName;
    // check duplicate
    if (parent.children.find(c => c.name === newName)) { toast('Name already exists'); return; }
    node.name = newName;
    // update paths recursively
    function updatePaths(n, base) {
      n.path = base ? base + '/' + n.name : n.name;
      if (n.children) for (const ch of n.children) updatePaths(ch, n.path);
    }
    // for file rename, just update this node and its descendants
    // Need to re-derive base: parentPath + newName
    const base = parentPath;
    // rebuild path for node
    node.path = newPath;
    if (node.children) for (const ch of node.children) updatePaths(ch, node.path);
    // update openTabs
    openTabs.forEach(t => {
      if (t.path === oldPath) t.path = newPath;
      else if (t.path.startsWith(oldPath + '/')) t.path = newPath + t.path.slice(oldPath.length);
    });
    if (activePath === oldPath) activePath = newPath;
    else if (activePath && activePath.startsWith(oldPath + '/')) activePath = newPath + activePath.slice(oldPath.length);
    saveFS();
    renderTree(); renderTabs(); updateBreadcrumbs();
    toast(`Renamed to ${newName}`);
  }
  function deletePath(path) {
    if (!confirm(`Delete ${path}? This cannot be undone.`)) return;
    const { parent, name } = findParent(path);
    if (!parent) return;
    parent.children = parent.children.filter(c => c.name !== name);
    openTabs = openTabs.filter(t => t.path !== path && !t.path.startsWith(path + '/'));
    if (activePath === path || activePath?.startsWith(path + '/')) {
      activePath = openTabs[openTabs.length - 1]?.path || null;
      if (activePath) openFile(activePath); else showWelcome();
    }
    saveFS(); renderTree(); renderTabs();
    terminalLog(`deleted ${path}`);
  }

  // --- Tabs ---
  function renderTabs() {
    tabsBar.innerHTML = '';
    for (const tab of openTabs) {
      const isActive = tab.path === activePath;
      const node = findNode(tab.path);
      const label = tab.path.split('/').pop();
      const el = document.createElement('div');
      el.className = `tab ${isActive ? 'is-active' : ''}`;
      el.setAttribute('role', 'tab');
      el.dataset.path = tab.path;
      el.innerHTML = `
        <span class="tab-icon">${iconFor(tab.path, false, false)}</span>
        <span class="tab-label">${label}</span>
        ${tab.dirty ? `<span class="tab-dirty" title="Unsaved changes"></span>` : ''}
        <button class="tab-close" aria-label="Close ${label}">×</button>
      `;
      el.addEventListener('click', (e) => {
        if (e.target.closest('.tab-close')) {
          closeTab(tab.path);
          e.stopPropagation();
          return;
        }
        openFile(tab.path);
      });
      // middle click close
      el.addEventListener('auxclick', (e) => { if (e.button === 1) closeTab(tab.path); });
      tabsBar.appendChild(el);
    }
  }
  function openFile(path) {
    const node = findNode(path);
    if (!node || node.type !== 'file') return;
    // add to recent
    recent = [path, ...recent.filter(p => p !== path)].slice(0, 10);
    localStorage.setItem('vscode-recent', JSON.stringify(recent));
    renderRecent();

    let tab = openTabs.find(t => t.path === path);
    if (!tab) {
      tab = { path, dirty: false };
      openTabs.push(tab);
    }
    activePath = path;
    renderTabs(); renderTree(); updateBreadcrumbs(); showEditor();
    loadIntoEditor(node);
    // update title
    titlebarFilename.textContent = `${path.split('/').pop()} — ${path} — Visual Studio Code`;
    statusLanguage.textContent = getLanguage(path) === 'plaintext' ? 'Plain Text' : getLanguage(path).charAt(0).toUpperCase() + getLanguage(path).slice(1);
  }
  function closeTab(path) {
    const tab = openTabs.find(t => t.path === path);
    if (tab?.dirty) {
      if (!confirm(`${path} has unsaved changes. Close anyway?`)) return;
    }
    openTabs = openTabs.filter(t => t.path !== path);
    if (activePath === path) {
      activePath = openTabs[openTabs.length - 1]?.path || null;
      if (activePath) {
        const node = findNode(activePath);
        showEditor();
        loadIntoEditor(node);
        updateBreadcrumbs();
      } else {
        showWelcome();
      }
    }
    renderTabs(); renderTree();
  }
  function showWelcome() {
    welcomePage.classList.remove('hidden');
    monacoContainer.classList.add('hidden');
    fallbackEditor.classList.add('hidden');
    previewPane.classList.add('hidden');
    breadcrumbFile.textContent = 'Welcome';
    titlebarFilename.textContent = 'Welcome — ubiquitous-guacamole — Visual Studio Code';
    statusLanguage.textContent = 'Markdown';
    activePath = null;
    renderTabs();
  }
  function showEditor() {
    welcomePage.classList.add('hidden');
    // decide monaco vs fallback later
    if (monacoEditor) {
      monacoContainer.classList.remove('hidden');
      fallbackEditor.classList.add('hidden');
    } else {
      fallbackEditor.classList.remove('hidden');
      monacoContainer.classList.add('hidden');
    }
    // preview hidden unless html
    if (activePath && activePath.endsWith('.html')) {
      // keep preview optionally
    }
  }
  function updateBreadcrumbs() {
    if (!activePath) { breadcrumbFile.textContent = 'Welcome'; return; }
    breadcrumbFile.textContent = activePath;
  }

  // --- Monaco ---
  let monacoEditor = null;
  let monacoInstance = null;
  let isMonacoReady = false;
  let pendingContent = null;

  function initMonaco() {
    if (typeof require === 'undefined') {
      console.warn('Monaco loader not found, using fallback');
      fallbackMode();
      return;
    }
    try {
      require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' }});
      require(['vs/editor/editor.main'], function() {
        isMonacoReady = true;
        monacoInstance = monaco;
        createMonacoEditor();
        if (pendingContent) {
          const node = findNode(pendingContent.path);
          if (node) loadIntoEditor(node);
          pendingContent = null;
        }
        // handle resize
        window.addEventListener('resize', () => monacoEditor && monacoEditor.layout());
        // observe container resize
        const ro = new ResizeObserver(() => monacoEditor && monacoEditor.layout());
        ro.observe(monacoContainer);
        console.log('Monaco ready');
      }, function(err){
        console.error('Monaco failed', err);
        fallbackMode();
      });
      // timeout fallback
      setTimeout(() => { if (!isMonacoReady) { console.warn('Monaco timeout, fallback'); fallbackMode(); } }, 4000);
    } catch (e) {
      console.error(e);
      fallbackMode();
    }
  }
  function fallbackMode() {
    isMonacoReady = false;
    monacoEditor = null;
    if (activePath) {
      fallbackEditor.classList.remove('hidden');
      monacoContainer.classList.add('hidden');
    }
  }
  function createMonacoEditor() {
    if (monacoEditor || !isMonacoReady) return;
    monacoEditor = monaco.editor.create(monacoContainer, {
      value: '// Select a file to start editing',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 13,
      fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace',
      lineHeight: 20,
      padding: { top: 12, bottom: 12 },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      suggest: { showKeywords: true }
    });
    monacoEditor.onDidChangeModelContent(() => {
      if (!activePath) return;
      const value = monacoEditor.getValue();
      const node = findNode(activePath);
      if (node && node.content !== value) {
        node.content = value;
        const tab = openTabs.find(t => t.path === activePath);
        if (tab) tab.dirty = true;
        renderTabs(); renderTree();
        debouncedSave();
        updateStatusPosition();
      }
    });
    monacoEditor.onDidChangeCursorPosition(updateStatusPosition);
  }
  let saveTimeout = null;
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveFS();
      // mark clean after save? In VS Code dirty stays until save (Ctrl+S). We'll auto-save but keep dirty indicator for realism, then clear after 800ms?
      // For this clone, auto-save clears dirty after delay
      // Actually keep dirty false after save to simulate autoSave
      // Let's keep manual save semantics: Save on Ctrl+S, but also auto-save to LS
      // Don't clear dirty here to let user press Ctrl+S
    }, 400);
  }
  function saveCurrent() {
    if (!activePath) return;
    const tab = openTabs.find(t => t.path === activePath);
    if (tab) tab.dirty = false;
    saveFS();
    renderTabs();
    toast(`Saved ${activePath}`);
    terminalLog(`saved ${activePath}`);
  }
  function loadIntoEditor(node) {
    if (!node) return;
    if (isMonacoReady && monacoEditor) {
      const model = monaco.editor.createModel(node.content, getLanguage(node.path));
      monacoEditor.setModel(model);
      updateStatusPosition();
      monacoContainer.classList.remove('hidden');
      fallbackEditor.classList.add('hidden');
    } else if (isMonacoReady && !monacoEditor) {
      // monaco ready but editor not yet created? create with value
      pendingContent = { path: node.path, content: node.content };
      if (!monacoEditor) createMonacoEditor();
    } else {
      // fallback
      fallbackTextarea.value = node.content;
      fallbackEditor.classList.remove('hidden');
      monacoContainer.classList.add('hidden');
      // handle input
      fallbackTextarea.oninput = () => {
        node.content = fallbackTextarea.value;
        const tab = openTabs.find(t => t.path === activePath);
        if (tab) tab.dirty = true;
        renderTabs(); debouncedSave();
      };
    }
    breadcrumbFile.textContent = node.path;
  }
  function updateStatusPosition() {
    if (!monacoEditor || !activePath) { statusPosition.textContent = 'Ln 1, Col 1'; return; }
    const pos = monacoEditor.getPosition();
    if (pos) statusPosition.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
  }

  // --- Recent ---
  function renderRecent() {
    if (!recentList) return;
    recentList.innerHTML = '';
    if (recent.length === 0) {
      recentList.innerHTML = `<div class="muted">No recent files</div>`;
      return;
    }
    for (const p of recent.slice(0,5)) {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `<span class="recent-icon">${iconFor(p, false, false)}</span><span><strong>${p.split('/').pop()}</strong><br><small class="muted">${p}</small></span>`;
      item.addEventListener('click', () => openFile(p));
      recentList.appendChild(item);
    }
  }

  // --- Search ---
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) { searchResults.innerHTML = '<div class="muted">Type to search across files</div>'; return; }
      const files = getAllFiles();
      let html = '';
      let count = 0;
      for (const f of files) {
        if (f.content.toLowerCase().includes(q)) {
          const lines = f.content.split('\n');
          const matches = [];
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(q)) matches.push({ idx: idx+1, text: line.trim().slice(0,80) });
          });
          if (matches.length) {
            count += matches.length;
            html += `<div class="search-result-group">${f.path} • ${matches.length}</div>`;
            for (const m of matches.slice(0,3)) {
              html += `<div class="search-result-item" data-path="${f.path}" data-line="${m.idx}">${m.idx}: ${escapeHtml(m.text)}</div>`;
            }
          }
        }
      }
      if (!html) html = `<div class="muted">No results for "${escapeHtml(q)}"</div>`;
      else html = `<div class="muted">${count} results in ${files.length} files</div>` + html;
      searchResults.innerHTML = html;
    });
    searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      openFile(item.dataset.path);
      // TODO: jump to line
      setTimeout(() => {
        if (monacoEditor) monacoEditor.revealLineInCenter(parseInt(item.dataset.line));
      }, 100);
    });
  }
  function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // --- Activity Bar — Subpart 1.2: fully functional ---
  const viewTitles = { explorer:'Explorer', search:'Search', scm:'Source Control', debug:'Run and Debug', extensions:'Extensions', remote:'Remote Explorer', accounts:'Accounts', manage:'Manage' };
  let currentView = 'explorer';
  function switchView(view, {toggle=true}={}) {
    const btn = document.querySelector(`.activity-btn[data-view="${view}"]`);
    if (!btn) return;
    const isSame = currentView === view && !sidebar.classList.contains('is-collapsed');
    if (toggle && isSame) {
      sidebar.classList.add('is-collapsed');
      btn.classList.remove('is-active');
      btn.removeAttribute('aria-current');
      toast(`${viewTitles[view]||view} hidden — Ctrl+B to show`);
      return;
    }
    currentView = view;
    document.querySelectorAll('.activity-btn').forEach(b => { b.classList.remove('is-active'); b.removeAttribute('aria-current'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-current','true');
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const panel = document.querySelector(`.view[data-view-panel="${view}"]`);
    if (panel) {
      panel.classList.remove('hidden');
      panel.querySelector('input, textarea')?.focus();
    } else {
      toast(`${viewTitles[view]||view} — view coming in next sub-part`);
    }
    const titleEl = document.getElementById('sidebarTitle');
    if (titleEl) titleEl.textContent = viewTitles[view] || view.charAt(0).toUpperCase()+view.slice(1);
    sidebar.classList.remove('is-collapsed');
    if (monacoEditor) setTimeout(()=>monacoEditor.layout(), 50);
  }
  // expose globally for title menus
  window.switchView = switchView;

  document.querySelectorAll('.activity-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
    // tooltip already via title attr, enhance with keyboard hint
    btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); switchView(btn.dataset.view); }});
    btn.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      const view = btn.dataset.view;
      showContextMenu(e.clientX, e.clientY, [
        {label:`${viewTitles[view]||view} — Keep visible`, action:()=>{ switchView(view,{toggle:false}); toast('View pinned'); }},
        {label:'Hide Activity Bar', action:()=>{ document.querySelector('.activitybar').classList.toggle('hidden'); toast('Activity Bar hidden — View → Appearance to restore'); }},
        {type:'sep'},
        {label:'Customize Activity Bar...', action:()=>toast('Drag to reorder — coming soon')}
      ]);
    });
  });

  // Keyboard shortcuts for activity bar — Ctrl+Shift+ E/F/G/D/X
  document.addEventListener('keydown', (e)=>{
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey) {
      const k = e.key.toLowerCase();
      if (k==='e') { e.preventDefault(); switchView('explorer'); }
      else if (k==='f') { e.preventDefault(); switchView('search'); }
      else if (k==='g') { e.preventDefault(); switchView('scm'); }
      else if (k==='d') { e.preventDefault(); switchView('debug'); }
      else if (k==='x') { e.preventDefault(); switchView('extensions'); }
    }
  });

  // Badges — dynamic
  function updateBadges() {
    const changesCount = getAllFiles().filter(f=>f.path.includes('app.js')||f.path.endsWith('.md')).length; // demo: 2 changes
    const scmBadge = document.getElementById('scmBadge');
    if (scmBadge) {
      const dirtyTabs = openTabs.filter(t=>t.dirty).length;
      const count = changesCount + dirtyTabs;
      scmBadge.textContent = count || 2;
      scmBadge.hidden = count===0;
      const btn = document.querySelector('.activity-btn[data-view="scm"]');
      if (btn) btn.setAttribute('aria-label', `Source Control (${count} changes)`);
    }
    // Extensions badge demo
    const extBadge = document.querySelector('.activity-btn[data-view="extensions"] .activity-badge');
    if (extBadge) { /* keep hidden until updates */ }
  }
  // refresh badges on relevant events
  const _origSave = saveCurrent;
  const origRenderTabsForBadge = renderTabs;
  // hook into renderTabs to update badges
  // We'll call updateBadges after FS changes — patched via wrapper below

  // Helper to refresh badges after file ops
  function refreshActivityBadges(){ updateBadges(); }
  setTimeout(updateBadges, 500);

  // Right-click on activity bar empty area
  document.querySelector('.activitybar')?.addEventListener('contextmenu', (e)=>{
    if (e.target.closest('.activity-btn')) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      {label:'Move Primary Side Bar Right', action:()=>{ document.querySelector('.workbench').style.flexDirection='row-reverse'; toast('Side Bar moved right'); }},
      {label:'Hide Activity Bar', action:()=>{ document.querySelector('.activitybar').classList.add('hidden'); toast('Activity Bar hidden — use View menu to restore'); }},
    ]);
  });

  // --- Panel Tabs ---
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('is-active', 'is-active-panel'));
      tab.classList.add('is-active');
      // For demo, all show terminal
    });
  });

  // --- Terminal ---
  const terminalOutput = document.getElementById('terminalOutput');
  const terminalInput = document.getElementById('terminalInput');
  function terminalLog(text, type='info') {
    const line = document.createElement('div');
    line.className = 'term-line';
    if (type === 'input') {
      line.innerHTML = `<span class="term-prompt">➜</span> <span>${escapeHtml(text)}</span>`;
    } else {
      line.textContent = text;
    }
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
  // initial logs
  terminalLog('ubiquitous-guacamole — bash — 80x24');
  terminalLog('Type "help" for available commands. This terminal is fully functional — try ls, cat, npm, node, clear.');
  terminalLog('');

  const commands = {
    help: () => terminalLog(`Available commands:
  help            Show this help
  ls [path]       List files
  cat <file>      Show file content
  clear           Clear terminal
  pwd             Show current directory
  echo <text>     Echo text
  date            Show date
  whoami          Show user
  npm <args>      Simulate npm
  node <file>     Run JS file (mock)
  git status      Show git status
  code <file>     Open file in editor
  mkdir <name>    Create folder
  touch <name>    Create file
  rm <file>       Delete file
  preview <html>  Live preview HTML
  theme           Toggle theme
  open <file>     Open file
`),
    ls: (args) => {
      const path = args[0] || '';
      const node = path ? findNode(path) : fsRoot;
      if (!node) { terminalLog(`ls: cannot access '${path}': No such file or directory`); return; }
      if (node.type === 'file') { terminalLog(node.name); return; }
      const entries = node.children || [];
      if (entries.length === 0) { terminalLog('(empty)'); return; }
      for (const e of entries) {
        terminalLog(`${e.type === 'folder' ? 'd' : '-'} ${e.name}${e.type === 'folder' ? '/' : ''}`);
      }
    },
    cat: (args) => {
      if (!args[0]) { terminalLog('cat: missing operand'); return; }
      const node = findNode(args[0]);
      if (!node) { terminalLog(`cat: ${args[0]}: No such file`); return; }
      if (node.type === 'folder') { terminalLog(`cat: ${args[0]}: Is a directory`); return; }
      terminalLog(node.content);
    },
    pwd: () => terminalLog('/home/user/ubiquitous-guacamole'),
    echo: (args) => terminalLog(args.join(' ')),
    date: () => terminalLog(new Date().toString()),
    whoami: () => terminalLog('developer'),
    clear: () => { terminalOutput.innerHTML = ''; },
    npm: (args) => {
      if (args[0] === 'run' && args[1] === 'dev') {
        terminalLog('> ubiquitous-guacamole@1.0.0 dev');
        terminalLog('> vite');
        terminalLog('');
        terminalLog('  VITE v6.0.0  ready in 312 ms');
        terminalLog('  ➜  Local:   http://localhost:5173/');
        terminalLog('  ➜  Network: use --host to expose');
      } else if (args[0] === 'install' || args[0] === 'i') {
        terminalLog('added 12 packages, and audited 13 packages in 1s');
      } else {
        terminalLog(`npm ${args.join(' ')} — simulated in web container`);
      }
    },
    node: (args) => {
      if (!args[0]) { terminalLog('Welcome to Node.js v22.11.0. Type ".exit" to exit.'); return; }
      const node = findNode(args[0]);
      if (!node) { terminalLog(`node: cannot open ${args[0]}`); return; }
      terminalLog(`> Running ${args[0]}...`);
      // naive run: extract console.log strings
      const logs = [...node.content.matchAll(/console\.log\(([^)]+)\)/g)].map(m => m[1]);
      if (logs.length) logs.forEach(l => terminalLog(`< ${l}`));
      else terminalLog('(no output)');
    },
    git: (args) => {
      if (args[0] === 'status') {
        terminalLog('On branch main');
        terminalLog('Changes not staged for commit:');
        terminalLog('  modified:   src/app.js');
        terminalLog('  untracked:  README.md');
      } else terminalLog(`git ${args.join(' ')} — simulated`);
    },
    code: (args) => { if (args[0]) openFile(args[0]); else terminalLog('code: missing file operand'); },
    open: (args) => { if (args[0]) openFile(args[0]); else terminalLog('open: missing file'); },
    mkdir: (args) => {
      if (!args[0]) { terminalLog('mkdir: missing operand'); return; }
      const name = args[0];
      if (findNode(name)) { terminalLog(`mkdir: cannot create directory ‘${name}’: File exists`); return; }
      const { parent, name: base, parentPath } = findParent(name);
      const p = parent || fsRoot;
      if (!p) { terminalLog('mkdir: invalid path'); return; }
      const newPath = name;
      p.children.push({ name: base, type: 'folder', path: newPath, children: [] });
      expanded.add(newPath);
      saveFS(); renderTree();
      terminalLog(`created directory ${name}`);
    },
    touch: (args) => {
      if (!args[0]) { terminalLog('touch: missing file operand'); return; }
      const name = args[0];
      if (findNode(name)) { terminalLog(`touch: ${name} already exists`); return; }
      const { parent, name: base } = findParent(name);
      const p = parent || fsRoot;
      p.children.push({ name: base, type: 'file', path: name, content: '' });
      saveFS(); renderTree();
      terminalLog(`created file ${name}`);
    },
    rm: (args) => {
      if (!args[0]) { terminalLog('rm: missing operand'); return; }
      const node = findNode(args[0]);
      if (!node) { terminalLog(`rm: cannot remove '${args[0]}': No such file`); return; }
      deletePath(args[0]);
      terminalLog(`removed ${args[0]}`);
    },
    preview: (args) => {
      const path = args[0] || 'src/index.html';
      const node = findNode(path);
      if (!node) { terminalLog(`preview: ${path} not found`); return; }
      showPreview(path);
    },
    theme: () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vscode-theme', next);
      terminalLog(`Theme switched to ${next}`);
    }
  };

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const raw = terminalInput.value.trim();
      if (!raw) return;
      terminalLog(`➜ ${raw}`, 'input');
      const [cmd, ...args] = raw.split(/\s+/);
      const fn = commands[cmd];
      if (fn) fn(args);
      else if (raw) terminalLog(`bash: command not found: ${cmd} — type 'help'`);
      terminalInput.value = '';
      // history
      terminalHistory.push(raw);
      histIdx = terminalHistory.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; terminalInput.value = terminalHistory[histIdx] || ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < terminalHistory.length-1) { histIdx++; terminalInput.value = terminalHistory[histIdx] || ''; } else { histIdx = terminalHistory.length; terminalInput.value = ''; }
    }
  });
  let terminalHistory = JSON.parse(localStorage.getItem('vscode-term-history') || '[]');
  let histIdx = terminalHistory.length;
  terminalInput.addEventListener('change', () => {
    localStorage.setItem('vscode-term-history', JSON.stringify(terminalHistory.slice(-50)));
  });

  function showPreview(path) {
    const node = findNode(path);
    if (!node) return;
    previewPane.classList.remove('hidden');
    welcomePage.classList.add('hidden');
    monacoContainer.classList.add('hidden');
    fallbackEditor.classList.add('hidden');
    // For html files, render content; for others show raw
    if (path.endsWith('.html')) {
      previewFrame.srcdoc = node.content;
    } else {
      previewFrame.srcdoc = `<pre style="padding:16px;font-family:monospace;white-space:pre-wrap">${escapeHtml(node.content)}</pre>`;
    }
    breadcrumbFile.textContent = path + ' (Preview)';
  }

  // --- Command Palette ---
  const paletteOverlay = document.getElementById('paletteOverlay');
  const paletteInput = document.getElementById('paletteInput');
  const paletteList = document.getElementById('paletteList');
  const quickInput = document.getElementById('quickInput');

  const paletteCommands = [
    { id: 'newFile', label: 'File: New Untitled File', kbd: 'Ctrl+N', action: () => createNew('file', '') },
    { id: 'newFolder', label: 'File: New Folder', action: () => createNew('folder', '') },
    { id: 'save', label: 'File: Save', kbd: 'Ctrl+S', action: saveCurrent },
    { id: 'closeEditor', label: 'View: Close Editor', kbd: 'Ctrl+F4', action: () => activePath && closeTab(activePath) },
    { id: 'closeAll', label: 'View: Close All Editors', action: () => { openTabs.slice().forEach(t => closeTab(t.path)); } },
    { id: 'toggleSidebar', label: 'View: Toggle Primary Side Bar', kbd: 'Ctrl+B', action: () => toggleSidebar() },
    { id: 'togglePanel', label: 'View: Toggle Panel', kbd: 'Ctrl+J', action: () => togglePanel() },
    { id: 'toggleAux', label: 'View: Toggle Secondary Side Bar', action: () => toggleAux() },
    { id: 'commandPalette', label: 'Show All Commands', kbd: 'Ctrl+Shift+P', action: () => openPalette('>') },
    { id: 'quickOpen', label: 'Go to File...', kbd: 'Ctrl+P', action: () => openPalette('') },
    { id: 'preview', label: 'Preview: Show Preview', action: () => activePath && showPreview(activePath) },
    { id: 'themeDark', label: 'Preferences: Color Theme — Dark Modern', action: () => setTheme('dark') },
    { id: 'themeLight', label: 'Preferences: Color Theme — Light Modern', action: () => setTheme('light') },
    { id: 'clearRecent', label: 'Clear Recent', action: () => { recent=[]; localStorage.removeItem('vscode-recent'); renderRecent(); toast('Recent cleared'); } },
    { id: 'resetFS', label: 'Developer: Reset Workspace', action: () => { if(confirm('Reset all files?')) { localStorage.removeItem('vscode-fs-v1'); location.reload(); } } },
    { id: 'help', label: 'Help: About', action: () => toast('VS Code Web Clone — v1.104.0 — Built with REA clean architecture — Not affiliated with Microsoft') },
  ];

  function openPalette(prefix='') {
    paletteOverlay.classList.remove('hidden');
    paletteInput.value = prefix;
    paletteInput.focus();
    paletteInput.select();
    renderPalette(prefix);
  }
  function closePalette() { paletteOverlay.classList.add('hidden'); }
  function renderPalette(q) {
    const query = q.replace(/^>/,'').trim().toLowerCase();
    const files = getAllFiles();
    let items = [];
    if (q.startsWith('>') || q === '') {
      // commands
      items = paletteCommands.filter(c => !query || c.label.toLowerCase().includes(query)).map(c => ({ label: c.label, sub: c.kbd || '', action: c.action, type: 'cmd' }));
      // if no > prefix and query matches files, also show files
      if (!q.startsWith('>') && query) {
        const fileMatches = files.filter(f => f.path.toLowerCase().includes(query)).slice(0,5).map(f => ({ label: f.path, sub: 'Open file', action: () => openFile(f.path), type: 'file' }));
        items = [...fileMatches, ...items];
      } else if (!q.startsWith('>') && !query) {
        // quick open recent files
        const recents = recent.slice(0,5).map(p => ({ label: p, sub: 'Recent', action: () => openFile(p) }));
        items = [...recents, ...items.slice(0,8)];
      }
    } else {
      // file search
      items = files.filter(f => f.path.toLowerCase().includes(query)).slice(0,8).map(f => ({ label: f.path, sub: getLanguage(f.path), action: () => openFile(f.path) }));
      if (items.length===0) items = [{ label: `No files matching "${query}"`, sub: '', action: ()=>{} }];
    }
    paletteList.innerHTML = '';
    items.forEach((it, idx) => {
      const el = document.createElement('div');
      el.className = 'palette-item' + (idx===0 ? ' is-active' : '');
      el.setAttribute('role','option');
      el.innerHTML = `<span>${escapeHtml(it.label)}</span><small>${escapeHtml(it.sub)}</small>`;
      el.addEventListener('click', () => { it.action(); closePalette(); });
      paletteList.appendChild(el);
    });
    paletteList._items = items;
    paletteList._active = 0;
  }
  paletteInput.addEventListener('input', () => renderPalette(paletteInput.value));
  paletteInput.addEventListener('keydown', (e) => {
    const items = paletteList.querySelectorAll('.palette-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      let idx = paletteList._active || 0;
      items[idx]?.classList.remove('is-active');
      idx = Math.min(idx+1, items.length-1);
      items[idx]?.classList.add('is-active');
      items[idx]?.scrollIntoView({ block: 'nearest' });
      paletteList._active = idx;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      let idx = paletteList._active || 0;
      items[idx]?.classList.remove('is-active');
      idx = Math.max(idx-1, 0);
      items[idx]?.classList.add('is-active');
      items[idx]?.scrollIntoView({ block: 'nearest' });
      paletteList._active = idx;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = paletteList._active || 0;
      const it = paletteList._items?.[idx];
      if (it) { it.action(); closePalette(); }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });
  paletteOverlay.addEventListener('click', (e) => { if (e.target === paletteOverlay) closePalette(); });

  quickInput.addEventListener('focus', () => openPalette(''));
  quickInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { openPalette(quickInput.value); }
  });

  // --- Shortcuts ---
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); openPalette('>'); }
    else if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); openPalette(''); }
    else if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(''); quickInput.focus(); }
    else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveCurrent(); }
    else if (mod && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleSidebar(); }
    else if (mod && e.key.toLowerCase() === 'j') { e.preventDefault(); togglePanel(); }
    else if (e.key === 'Escape') { closePalette(); hideContextMenu(); }
    else if (e.key === 'F1') { e.preventDefault(); openPalette('>'); }
  });

  function toggleSidebar() { sidebar.classList.toggle('is-collapsed'); }
  function togglePanel() { panel.classList.toggle('hidden'); if (monacoEditor) setTimeout(()=>monacoEditor.layout(), 50); }
  function toggleAux() { auxiliaryBar.classList.toggle('hidden'); if (monacoEditor) setTimeout(()=>monacoEditor.layout(), 50); }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('vscode-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'dark' ? '#181818' : '#f3f3f3';
    if (monacoInstance) monaco.editor.setTheme(t === 'dark' ? 'vs-dark' : 'vs');
    toast(`Color theme: ${t}`);
  }

  document.querySelectorAll('[data-action="toggle-sidebar"]').forEach(b=>b.addEventListener('click', toggleSidebar));
  document.querySelectorAll('[data-action="toggle-panel"]').forEach(b=>b.addEventListener('click', togglePanel));
  document.querySelectorAll('[data-action="toggle-aux"],[data-action="close-aux"]').forEach(b=>b.addEventListener('click', toggleAux));
  document.querySelectorAll('[data-action="close-panel"]').forEach(b=>b.addEventListener('click', () => panel.classList.add('hidden')));
  document.querySelectorAll('[data-action="maximize-panel"]').forEach(b=>b.addEventListener('click', () => panel.classList.toggle('maximized')));

  // --- Context Menu ---
  const contextMenu = document.getElementById('contextMenu');
  function showContextMenu(x,y, items) {
    contextMenu.innerHTML = '';
    items.forEach(it => {
      if (it.type === 'sep') { const d = document.createElement('div'); d.className = 'ctx-item sep'; contextMenu.appendChild(d); return; }
      const el = document.createElement('div');
      el.className = 'ctx-item';
      el.setAttribute('role','menuitem');
      el.innerHTML = `<span>${it.label}</span>${it.kbd ? `<span class="ctx-kbd">${it.kbd}</span>` : ''}`;
      el.addEventListener('click', () => { hideContextMenu(); it.action(); });
      contextMenu.appendChild(el);
    });
    contextMenu.style.left = Math.min(x, window.innerWidth - 240) + 'px';
    contextMenu.style.top = Math.min(y, window.innerHeight - contextMenu.offsetHeight - 20) + 'px';
    contextMenu.classList.remove('hidden');
    setTimeout(() => document.addEventListener('click', hideContextMenu, { once: true }), 0);
  }
  function hideContextMenu() {
    contextMenu.classList.add('hidden');
    const tm = document.getElementById('titleMenu');
    if (tm) tm.classList.add('hidden');
    document.querySelectorAll('.menubar-item.is-active').forEach(b=>b.classList.remove('is-active'));
    openMenu = null;
  }
  // extend showContextMenu to support titleMenu
  const originalShowContextMenu = showContextMenu;
  // Override to handle titleMenu id
  function showContextMenu(x,y, items, menuId='contextMenu') {
    const menuEl = document.getElementById(menuId);
    if (!menuEl) return;
    menuEl.innerHTML = '';
    items.forEach(it => {
      if (it.type === 'sep') { const d = document.createElement('div'); d.className = 'ctx-item sep'; menuEl.appendChild(d); return; }
      const el = document.createElement('div');
      el.className = 'ctx-item';
      el.setAttribute('role','menuitem');
      el.innerHTML = `<span>${it.label}</span>${it.kbd ? `<span class="ctx-kbd">${it.kbd}</span>` : ''}`;
      el.addEventListener('click', () => { hideContextMenu(); it.action(); });
      menuEl.appendChild(el);
    });
    menuEl.style.left = Math.min(x, window.innerWidth - 240) + 'px';
    menuEl.style.top = Math.min(y, window.innerHeight - menuEl.offsetHeight - 20) + 'px';
    menuEl.classList.remove('hidden');
    setTimeout(() => document.addEventListener('click', hideContextMenu, { once: true }), 0);
  }
  document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('.file-tree') && !e.target.closest('.tabs-bar')) return;
    // handled above for file-tree; for tabs show close others etc.
  });

  // --- Chat ---
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const sendChat = document.getElementById('sendChat');
  function addChatMsg(role, text) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = `<div class="msg-avatar">${role === 'user' ? '◆' : '✦'}</div><div class="msg-body"><p>${escapeHtml(text).replace(/\n/g,'<br>')}</p></div>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function botReply(userText) {
    const q = userText.toLowerCase();
    let reply = '';
    if (q.includes('hello') || q.includes('hi')) reply = 'Hello! I can help you edit code, explain files, or create new features. Try asking “Explain src/app.js” or “Create a new React component”.';
    else if (q.includes('explain')) {
      const file = activePath || 'src/app.js';
      const node = findNode(file);
      reply = `Here's what's in ${file}:\n\n` + (node ? node.content.slice(0,600) + (node.content.length>600?'…':'') : 'No file open.') + `\n\nThis file defines the main app logic. Want me to refactor it?`;
    } else if (q.includes('create') || q.includes('make')) {
      reply = 'I can create that for you. Tell me the file name and I will scaffold it — or use the Explorer “New File” action.';
    } else if (q.includes('search')) reply = 'Use Ctrl+Shift+F for project search, or ask me to find patterns with REA-style inspection.';
    else if (q.includes('theme')) reply = 'You can switch themes via Command Palette (Ctrl+Shift+P → Color Theme) or click the status bar.';
    else reply = `You said: "${userText}"\n\nI'm a demo Copilot. In a real workspace I'd have access to your files, terminal, and REA inspection tools to explain behavior down to native binaries.`;
    setTimeout(() => addChatMsg('assistant', reply), 400);
  }
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addChatMsg('user', text);
    chatInput.value = '';
    botReply(text);
  }
  sendChat.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // --- Resizers ---
  function makeResizer(handle, target, dir) {
    let start = 0, startSize = 0;
    handle.addEventListener('mousedown', (e) => {
      start = dir === 'horizontal' ? e.clientY : e.clientX;
      startSize = dir === 'horizontal' ? target.offsetHeight : target.offsetWidth;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = dir === 'horizontal' ? 'row-resize' : 'col-resize';
      const onMove = (ev) => {
        const cur = dir === 'horizontal' ? ev.clientY : ev.clientX;
        const delta = dir === 'horizontal' ? start - cur : cur - start;
        // for sidebar, delta positive increases width when dragging right; for panel, dragging up increases height
        if (target === sidebar) {
          const newW = Math.max(170, Math.min(600, startSize + (cur - start)));
          target.style.width = newW + 'px';
        } else if (target === panel) {
          const newH = Math.max(80, Math.min(window.innerHeight * 0.6, startSize + (start - cur)));
          target.style.height = newH + 'px';
          if (monacoEditor) monacoEditor.layout();
        } else if (target === auxiliaryBar) {
          const newW = Math.max(200, Math.min(600, startSize + (start - cur)));
          target.style.width = newW + 'px';
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        if (monacoEditor) monacoEditor.layout();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
  makeResizer(document.querySelector('[data-resize="sidebar"]'), sidebar, 'vertical');
  makeResizer(document.querySelector('[data-resize="panel"]'), panel, 'horizontal');
  makeResizer(document.querySelector('[data-resize="aux"]'), auxiliaryBar, 'vertical');

  // --- Welcome actions ---
  document.querySelectorAll('[data-cmd="newFile"]').forEach(b=>b.addEventListener('click', () => createNew('file','')));
  document.querySelectorAll('[data-cmd="openFolder"]').forEach(b=>b.addEventListener('click', () => toast('Folder picker — in a real app this would show system dialog. Use Explorer to create files.')));
  document.querySelectorAll('[data-open]').forEach(a=>a.addEventListener('click', (e)=>{ e.preventDefault(); openFile(a.dataset.open); }));
  document.querySelectorAll('[data-cmd="split"]').forEach(b=>b.addEventListener('click', ()=>toast('Split editor — open another file to compare side by side (demo)')));
  document.querySelectorAll('[data-cmd="closePreview"]').forEach(b=>b.addEventListener('click', ()=>{ previewPane.classList.add('hidden'); if(activePath) showEditor(); }));
  document.querySelectorAll('[data-cmd="newFolder"]').forEach(b=>b.addEventListener('click', ()=>createNew('folder','')));
  document.querySelectorAll('[data-cmd="newTerminal"]').forEach(b=>b.addEventListener('click', ()=>{ terminalLog('New terminal created'); terminalInput.focus(); }));
  document.querySelectorAll('[data-cmd="refresh"]').forEach(b=>b.addEventListener('click', ()=>{ renderTree(); toast('Explorer refreshed'); }));
  document.querySelectorAll('[data-cmd="commit"]').forEach(b=>b.addEventListener('click', ()=>toast('Committed to main — 2 files changed (demo)')));

  // --- Status bar interactions ---
  document.getElementById('statusLanguage')?.addEventListener('click', ()=>openPalette('>language'));
  document.getElementById('statusZoom')?.addEventListener('click', ()=>{
    const cur = parseInt(document.body.style.zoom || '100');
    const next = cur === 100 ? 120 : cur === 120 ? 90 : 100;
    document.body.style.zoom = next + '%';
    document.getElementById('statusZoom').textContent = `Zoom: ${next}%`;
  });

  // --- Titlebar: Full menus (Subpart 1.1) ---
  const titleMenus = {
    file: [
      {label:'New Text File', kbd:'Ctrl+N', action:()=>createNew('file','')},
      {label:'New File...', kbd:'Ctrl+Alt+N', action:()=>createNew('file','')},
      {label:'New Folder...', action:()=>createNew('folder','')},
      {type:'sep'},
      {label:'Open File...', kbd:'Ctrl+O', action:()=>openPalette('')},
      {label:'Open Folder...', kbd:'Ctrl+K Ctrl+O', action:()=>toast('Open Folder — use Explorer “New File” or drag & drop a file here')},
      {label:'Open Recent...', kbd:'Ctrl+R', action:()=>openPalette('')},
      {type:'sep'},
      {label:'Save', kbd:'Ctrl+S', action:saveCurrent},
      {label:'Save As...', kbd:'Ctrl+Shift+S', action:()=>{ saveCurrent(); toast('Saved As — download triggered'); downloadCurrent(); }},
      {label:'Save All', kbd:'Ctrl+K S', action:()=>{ openTabs.forEach(t=>{ const tab=findNode(t.path); if(tab) t.dirty=false; }); renderTabs(); saveFS(); toast('All files saved'); }},
      {type:'sep'},
      {label:'Close Editor', kbd:'Ctrl+F4', action:()=>activePath && closeTab(activePath)},
      {label:'Close Folder', kbd:'Ctrl+K F', action:()=>{ openTabs=[]; activePath=null; showWelcome(); renderTabs(); toast('Folder closed'); }},
      {label:'Close Window', kbd:'Alt+F4', action:()=>toast('Close Window — browser tab would close (blocked)')},
      {type:'sep'},
      {label:'Exit', action:()=>toast('Exit — use browser close')},
    ],
    edit: [
      {label:'Undo', kbd:'Ctrl+Z', action:()=>{ if(monacoEditor) monacoEditor.trigger('kb','undo'); else document.execCommand('undo'); toast('Undo'); }},
      {label:'Redo', kbd:'Ctrl+Y', action:()=>{ if(monacoEditor) monacoEditor.trigger('kb','redo'); else document.execCommand('redo'); toast('Redo'); }},
      {type:'sep'},
      {label:'Cut', kbd:'Ctrl+X', action:()=>{ document.execCommand('cut'); toast('Cut'); }},
      {label:'Copy', kbd:'Ctrl+C', action:()=>{ document.execCommand('copy'); toast('Copied'); }},
      {label:'Paste', kbd:'Ctrl+V', action:()=>{ document.execCommand('paste'); toast('Paste'); }},
      {type:'sep'},
      {label:'Find', kbd:'Ctrl+F', action:()=>openFindWidget()},
      {label:'Replace', kbd:'Ctrl+H', action:()=>openFindWidget(true)},
      {label:'Find in Files', kbd:'Ctrl+Shift+F', action:()=>switchView('search')},
      {label:'Replace in Files', kbd:'Ctrl+Shift+H', action:()=>switchView('search')},
      {type:'sep'},
      {label:'Toggle Line Comment', kbd:'Ctrl+/', action:()=>{ if(monacoEditor) monacoEditor.getAction('editor.action.commentLine').run(); toast('Toggled comment'); }},
      {label:'Toggle Block Comment', kbd:'Shift+Alt+A', action:()=>{ if(monacoEditor) monacoEditor.getAction('editor.action.blockComment').run(); }},
    ],
    selection: [
      {label:'Select All', kbd:'Ctrl+A', action:()=>{ if(monacoEditor) monacoEditor.setSelection(monacoEditor.getModel().getFullModelRange()); else fallbackTextarea.select(); }},
      {label:'Expand Selection', kbd:'Shift+Alt+→', action:()=>toast('Expand Selection — via Monaco smart select')},
      {label:'Shrink Selection', kbd:'Shift+Alt+←', action:()=>toast('Shrink Selection')},
      {type:'sep'},
      {label:'Copy Line Up', kbd:'Shift+Alt+↑', action:()=>{ if(monacoEditor) monacoEditor.getAction('editor.action.copyLinesDownAction').run(); }},
      {label:'Move Line Up', kbd:'Alt+↑', action:()=>{ if(monacoEditor) monacoEditor.getAction('editor.action.moveLinesUpAction').run(); }},
      {label:'Move Line Down', kbd:'Alt+↓', action:()=>{ if(monacoEditor) monacoEditor.getAction('editor.action.moveLinesDownAction').run(); }},
      {label:'Add Cursor Above', kbd:'Ctrl+Alt+↑', action:()=>toast('Add cursor — Ctrl+Alt+Up (Monaco)')},
      {label:'Add Cursor Below', kbd:'Ctrl+Alt+↓', action:()=>toast('Add cursor — Ctrl+Alt+Down')},
    ],
    view: [
      {label:'Command Palette...', kbd:'Ctrl+Shift+P', action:()=>openPalette('>')},
      {label:'Open View...', kbd:'Ctrl+Q', action:()=>openPalette('>View:')},
      {type:'sep'},
      {label:'Explorer', kbd:'Ctrl+Shift+E', action:()=>switchView('explorer')},
      {label:'Search', kbd:'Ctrl+Shift+F', action:()=>switchView('search')},
      {label:'Source Control', kbd:'Ctrl+Shift+G', action:()=>switchView('scm')},
      {label:'Run and Debug', kbd:'Ctrl+Shift+D', action:()=>switchView('debug')},
      {label:'Extensions', kbd:'Ctrl+Shift+X', action:()=>switchView('extensions')},
      {type:'sep'},
      {label:'Toggle Primary Side Bar', kbd:'Ctrl+B', action:toggleSidebar},
      {label:'Toggle Panel', kbd:'Ctrl+J', action:togglePanel},
      {label:'Toggle Secondary Side Bar', kbd:'Ctrl+Alt+B', action:toggleAux},
      {label:'Toggle Status Bar', action:()=>{ document.querySelector('.statusbar').classList.toggle('hidden'); toast('Status Bar toggled'); }},
      {type:'sep'},
      {label:'Word Wrap', kbd:'Alt+Z', action:()=>{ const cur=localStorage.getItem('vscode-wordwrap')!=='off'; const next=!cur; localStorage.setItem('vscode-wordwrap', next?'on':'off'); if(monacoEditor) monacoEditor.updateOptions({wordWrap: next?'on':'off'}); toast('Word Wrap: '+(next?'On':'Off')); }},
      {label:'Minimap', action:()=>{ const cur=localStorage.getItem('vscode-minimap')!=='off'; const next=!cur; localStorage.setItem('vscode-minimap', next?'on':'off'); if(monacoEditor) monacoEditor.updateOptions({minimap:{enabled:next}}); toast('Minimap: '+(next?'On':'Off')); }},
      {label:'Appearance → Full Screen', kbd:'F11', action:()=>{ if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }},
      {label:'Appearance → Zen Mode', kbd:'Ctrl+K Z', action:()=>{ document.body.classList.toggle('zen-mode'); toast('Zen Mode toggled — press Esc to exit'); }},
    ],
    go: [
      {label:'Back', kbd:'Alt+←', action:()=>toast('Go Back — history navigation')},
      {label:'Forward', kbd:'Alt+→', action:()=>toast('Go Forward')},
      {type:'sep'},
      {label:'Go to File...', kbd:'Ctrl+P', action:()=>openPalette('')},
      {label:'Go to Symbol', kbd:'Ctrl+Shift+O', action:()=>openPalette('@')},
      {label:'Go to Definition', kbd:'F12', action:()=>toast('Go to Definition — Monaco peek')},
      {label:'Go to Line/Column...', kbd:'Ctrl+G', action:()=>openGotoLine()},
      {type:'sep'},
      {label:'Next Problem', kbd:'F8', action:()=>toast('Next Problem — see Problems panel (Ctrl+Shift+M)')},
      {label:'Previous Problem', kbd:'Shift+F8', action:()=>toast('Previous Problem')},
    ],
    run: [
      {label:'Start Debugging', kbd:'F5', action:()=>{ switchView('debug'); document.getElementById('startDebugBtn')?.click(); toast('Debugging started — breakpoint will pause (demo)'); }},
      {label:'Run Without Debugging', kbd:'Ctrl+F5', action:()=>toast('Run without Debugging — executing via terminal node')},
      {label:'Stop Debugging', kbd:'Shift+F5', action:()=>toast('Debugging stopped')},
      {type:'sep'},
      {label:'Open Configurations', action:()=>openFile('.vscode/launch.json')},
      {label:'Add Configuration...', action:()=>toast('Add Configuration to launch.json')},
      {type:'sep'},
      {label:'Step Over', kbd:'F10', action:()=>toast('Step Over (debug)')},
      {label:'Step Into', kbd:'F11', action:()=>toast('Step Into')},
      {label:'Continue', kbd:'F5', action:()=>toast('Continue')},
    ],
    terminal: [
      {label:'New Terminal', kbd:'Ctrl+`', action:()=>{ togglePanel(); document.getElementById('terminalInput')?.focus(); toast('New Terminal — bash ready'); }},
      {label:'Split Terminal', kbd:'Ctrl+Shift+5', action:()=>toast('Split Terminal — use new tab (demo)')},
      {label:'Kill Terminal', action:()=>{ document.getElementById('terminalOutput').innerHTML=''; toast('Terminal cleared'); }},
      {type:'sep'},
      {label:'Run Build Task...', kbd:'Ctrl+Shift+B', action:()=>terminalLog('Task: npm run build — simulated', 'info')},
      {label:'Run Active File', action:()=>{ if(activePath) terminalLog(`Running ${activePath}...`); if(activePath?.endsWith('.js')) commands.node([activePath]); }},
      {type:'sep'},
      {label:'Clear Terminal', kbd:'Ctrl+K', action:()=>{ document.getElementById('terminalOutput').innerHTML=''; }},
    ],
    help: [
      {label:'Welcome', action:()=>showWelcome()},
      {label:'Show All Commands', kbd:'Ctrl+Shift+P', action:()=>openPalette('>')},
      {label:'Keyboard Shortcuts Reference', kbd:'Ctrl+K Ctrl+S', action:()=>toast('Keyboard Shortcuts — Ctrl+K Ctrl+S to open settings')},
      {type:'sep'},
      {label:'Documentation', action:()=>window.open('https://code.visualstudio.com/docs','_blank')},
      {label:'Check for Updates...', action:()=>toast('VS Code Web is up to date — v1.104.0')},
      {label:'About', action:()=>toast('Visual Studio Code — Web Clone — v1.104.0 • REA-inspired • MIT • Not affiliated with Microsoft')},
    ]
  };

  // switchView already defined in Activity Bar section (1.2) with toggle & badges
  function openFindWidget(showReplace=false) {
    const w = document.getElementById('findWidget');
    if (!w) return;
    w.classList.remove('hidden');
    document.getElementById('findInput').focus();
    if (showReplace) document.getElementById('replaceRow2').classList.remove('hidden');
    // also trigger Monaco find
    if (monacoEditor) monacoEditor.getAction('actions.find').run();
  }
  function openGotoLine() {
    const p = document.getElementById('gotoLinePalette');
    if (!p) return; p.classList.remove('hidden');
    document.getElementById('gotoLineInput').focus();
  }
  function downloadCurrent() {
    if (!activePath) return;
    const node = findNode(activePath);
    if (!node) return;
    const blob = new Blob([node.content], {type:'text/plain'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=node.name; a.click();
  }

  // Titlebar menubar — full 8 menus with hover
  let openMenu = null;
  document.querySelectorAll('.menubar-item').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const key = btn.dataset.menu;
      const items = titleMenus[key];
      if (!items) return;
      if (openMenu === key) { hideContextMenu(); openMenu=null; return; }
      openMenu = key;
      const rect = btn.getBoundingClientRect();
      showContextMenu(rect.left, rect.bottom + 4, items, 'titleMenu');
      btn.classList.add('is-active');
    });
    btn.addEventListener('mouseenter', ()=>{
      if (openMenu && openMenu !== btn.dataset.menu) {
        hideContextMenu();
        btn.click();
      }
    });
  });
  // close title menu on outside click handled by contextMenu listener

  // Search bar in titlebar — quick open
  const quickInputEl = document.getElementById('quickInput');
  if (quickInputEl) {
    quickInputEl.addEventListener('focus', ()=>{ openPalette(''); quickInputEl.select(); });
    quickInputEl.addEventListener('keydown', (e)=>{
      if (e.key==='Enter') { openPalette(quickInputEl.value); }
      if (e.key==='Escape') quickInputEl.blur();
    });
    quickInputEl.addEventListener('input', ()=>{ if (quickInputEl.value.length>1) openPalette(quickInputEl.value); });
  }

  // Window controls — functional
  document.querySelector('.win-btn.minimize')?.addEventListener('click', ()=>toast('Minimize — browser window minimize (handled by OS)'));
  document.querySelector('.win-btn.maximize')?.addEventListener('click', ()=>{
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(()=>toast('Maximize — fullscreen requested')); toast('Window maximized — F11 to exit'); }
    else document.exitFullscreen();
  });
  document.querySelector('.win-btn.close')?.addEventListener('click', ()=>{
    if (confirm('Close window? Unsaved changes may be lost.')) toast('Close — use browser tab close (Ctrl+W)');
  });
  // Titlebar drag region ignored for web, but we support double-click to maximize
  document.querySelector('.titlebar')?.addEventListener('dblclick', ()=>{
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
  });

  // --- Toast ---
  const toastContainer = document.getElementById('toastContainer');
  function toast(msg, ms=2500) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, ms);
  }

  // --- Init ---
  renderTree();
  renderTabs();
  renderRecent();
  initMonaco();
  terminalInput.focus();

  // Open README by default? Keep welcome for fidelity, but also show demo file after 1s if user hasn't interacted?
  // Keep welcome as VS Code does.

  // handle file drop
  document.addEventListener('dragover', e=>e.preventDefault());
  document.addEventListener('drop', e=>{
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      const content = reader.result;
      const path = file.name;
      // save to root
      fsRoot.children.push({ name: file.name, type:'file', path, content });
      saveFS(); renderTree(); openFile(path);
      toast(`Opened ${file.name}`);
    };
    reader.readAsText(file);
  });

  // Expose for debugging
  window.vscode = { openFile, createNew, deletePath, findNode, commands };

})();
