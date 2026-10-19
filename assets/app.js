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
      { name: 'main.cpp', type: 'file', path: 'main.cpp', content: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n    int x = 42;\n    cout << "Value of x is " << x << endl;\n    return 0;\n}\n` },
      { name: 'hello.c', type: 'file', path: 'hello.c', content: `#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    int n = 7;\n    printf("Number: %d\\n", n);\n    return 0;\n}\n` },
      { name: 'example.py', type: 'file', path: 'example.py', content: `print("Hello from Python!")\nprint("Python works in browser terminal")\n` },
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
      // migrate: inject sample C/C++ files if missing (for existing localStorage)
      for(const sample of initialFS.children){
        if(!fsRoot.children.find(c=>c.name===sample.name)){
          fsRoot.children.push(structuredClone(sample));
        }
      }
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

  // --- Explorer File Operations — Subpart 1.4 (clipboard, duplicate, download) ---
  let clipboard = null; // {op:'copy'|'cut', path, nodeDeepCopy}
  function deepCopyNode(node) { return JSON.parse(JSON.stringify(node)); }
  function duplicatePath(path) {
    const node = findNode(path);
    if (!node) return;
    const {parent, parentPath, name} = findParent(path);
    if (!parent) return;
    let baseName = name;
    const extIdx = baseName.lastIndexOf('.');
    let copyName = extIdx===-1 ? baseName+' copy' : baseName.slice(0,extIdx)+' copy'+baseName.slice(extIdx);
    let counter=1;
    while (parent.children.find(c=>c.name===copyName)) { copyName = (extIdx===-1? baseName+` copy ${counter}`: baseName.slice(0,extIdx)+` copy ${counter}`+baseName.slice(extIdx)); counter++; }
    const copy = deepCopyNode(node);
    copy.name = copyName;
    const newPath = parentPath ? parentPath+'/'+copyName : copyName;
    function upd(n, base){ n.path = base ? base+'/'+n.name : n.name; if(n.children) for(const ch of n.children) upd(ch, n.path); }
    copy.path = newPath;
    if(copy.children) for(const ch of copy.children) upd(ch, copy.path);
    parent.children.push(copy);
    saveFS(); renderTree(); toast(`Duplicated ${name} → ${copyName}`);
    if (copy.type==='file') openFile(copy.path);
  }
  function downloadPath(path) {
    const node = findNode(path);
    if (!node || node.type!=='file') { toast('Select a file to download'); return; }
    const blob = new Blob([node.content], {type:'text/plain'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=node.name; a.click(); toast(`Downloaded ${node.name}`);
  }
  function copyPath(path) { const v = path; navigator.clipboard.writeText(v).then(()=>toast('Copied path: '+v)).catch(()=>toast('Copied: '+v)); }
  function doCopy(path){ const n=findNode(path); if(!n) return; clipboard={op:'copy', path, node: deepCopyNode(n)}; toast(`Copied ${n.name} — Ctrl+V to paste`); }
  function doCut(path){ const n=findNode(path); if(!n) return; clipboard={op:'cut', path, node: deepCopyNode(n)}; toast(`Cut ${n.name} — Ctrl+V to paste`); }
  function doPaste(targetPath) {
    if (!clipboard) { toast('Clipboard empty — Copy or Cut first'); return; }
    let dest = targetPath ? findNode(targetPath) : fsRoot;
    if (dest && dest.type==='file') dest = findNode(findParent(dest.path).parentPath) || fsRoot;
    if (!dest || !dest.children) dest = fsRoot;
    // prevent paste into itself
    if (clipboard.path===dest.path || dest.path.startsWith(clipboard.path+'/')) { toast('Cannot paste into itself'); return; }
    const srcName = clipboard.node.name;
    let name = srcName;
    if (dest.children.find(c=>c.name===name)) {
      // auto-rename
      let c=1; const idx=name.lastIndexOf('.');
      while(dest.children.find(x=>x.name===name)) { name = idx===-1? `${srcName} (${c})` : `${srcName.slice(0,idx)} (${c})${srcName.slice(idx)}`; c++; }
    }
    const copy = deepCopyNode(clipboard.node);
    copy.name = name;
    const newPath = dest.path ? dest.path + '/' + name : name;
    function upd(n, base){ n.path = base ? base+'/'+n.name : n.name; if(n.children) for(const ch of n.children) upd(ch, n.path); }
    copy.path = newPath;
    if(copy.children) for(const ch of copy.children) upd(ch, copy.path);
    dest.children.push(copy);
    expanded.add(dest.path);
    if (clipboard.op==='cut') {
      // remove original
      const {parent: oldParent} = findParent(clipboard.path);
      if (oldParent) oldParent.children = oldParent.children.filter(c=>c.path!==clipboard.path);
      clipboard=null;
      // fix tabs
      const oldPath=clipboard?.path;
      // tabs already handled via new copy
      toast(`Moved → ${dest.path||'root'}`);
    } else {
      toast(`Pasted ${name} → ${dest.path||'root'}`);
    }
    saveFS(); renderTree();
  }

  fileTreeEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const item = e.target.closest('.tree-item');
    // click on empty area
    if (!item) {
      return showContextMenu(e.clientX, e.clientY, [
        { label: 'New File...', kbd:'', action: () => createNew('file', '') },
        { label: 'New Folder...', action: () => createNew('folder', '') },
        { type: 'sep' },
        { label: 'Paste', kbd:'Ctrl+V', action: () => doPaste('') },
        { label: 'Refresh', action: () => { renderTree(); toast('Explorer refreshed'); } },
      ]);
    }
    const path = item.dataset.path;
    const node = findNode(path);
    const isFolder = node?.type==='folder';
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New File...', kbd: '', action: () => createNew('file', path) },
      { label: 'New Folder...', action: () => createNew('folder', path) },
      { type: 'sep' },
      { label: 'Cut', kbd:'Ctrl+X', action: () => doCut(path) },
      { label: 'Copy', kbd:'Ctrl+C', action: () => doCopy(path) },
      { label: 'Paste', kbd:'Ctrl+V', action: () => doPaste(path) },
      { type: 'sep' },
      { label: 'Duplicate', action: () => duplicatePath(path) },
      { label: 'Download...', action: () => downloadPath(path) },
      { type: 'sep' },
      { label: 'Rename...', kbd:'Enter', action: () => renamePath(path) },
      { label: 'Delete', kbd:'Delete', action: () => deletePath(path) },
      { type: 'sep' },
      { label: 'Copy Path', kbd:'Ctrl+Alt+C', action: () => copyPath(path) },
      { label: 'Copy Relative Path', action: () => { navigator.clipboard.writeText(path); toast('Copied relative: '+path); } },
      { label: 'Reveal in Explorer', action: () => { expanded.add(findParent(path).parentPath); renderTree(); document.querySelector(`.tree-item[data-path="${path}"]`)?.scrollIntoView({block:'center'}); toast('Revealed '+path); } },
      ...(path.endsWith('.cpp')||path.endsWith('.c')||path.endsWith('.cc') ? [
        { type:'sep' },
        { label: 'Run C/C++ File ▶', kbd:'g++ + ./a.out', action: () => {
          const out = path.split('/').pop().replace(/\.(cpp|c|cc)$/,'');
          doCompile([path, '-o', out], path.endsWith('.c')?'gcc':'g++');
          setTimeout(()=>doRunBinary('./'+out), 200);
        }},
        { label: 'Compile Only (g++)', action: () => doCompile([path, '-o', path.split('/').pop().replace(/\.(cpp|c|cc)$/,'')], path.endsWith('.c')?'gcc':'g++') },
      ] : []),
      ...(path.endsWith('.py') ? [
        { type:'sep' },
        { label: 'Run Python File ▶', action: () => commands.python([path]) },
      ] : []),
    ]);
  });
  // Keyboard for explorer operations
  fileTreeEl.addEventListener('keydown', (e)=>{
    const active = document.activeElement?.closest('.tree-item');
    if (!active) return;
    const path = active.dataset.path;
    if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='c') { e.preventDefault(); doCopy(path); }
    else if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='x') { e.preventDefault(); doCut(path); }
    else if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='v') { e.preventDefault(); doPaste(path); }
    else if (e.key==='Delete' || (e.key==='Backspace' && e.metaKey)) { e.preventDefault(); deletePath(path); }
    else if (e.key==='F2' || e.key==='Enter' && e.altKey) { e.preventDefault(); renamePath(path); }
    else if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='d') { e.preventDefault(); duplicatePath(path); }
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
      el.draggable = true;
      el.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/tab', tab.path); el.classList.add('is-dragging'); e.dataTransfer.effectAllowed='move'; });
      el.addEventListener('dragend', ()=>el.classList.remove('is-dragging'));
      el.addEventListener('dragover', (e)=>{ e.preventDefault(); el.classList.add('is-drop-target'); });
      el.addEventListener('dragleave', ()=>el.classList.remove('is-drop-target'));
      el.addEventListener('drop', (e)=>{
        e.preventDefault(); el.classList.remove('is-drop-target');
        const src = e.dataTransfer.getData('text/tab');
        if (!src || src===tab.path) return;
        const srcIdx = openTabs.findIndex(t=>t.path===src);
        const destIdx = openTabs.findIndex(t=>t.path===tab.path);
        if (srcIdx===-1||destIdx===-1) return;
        const [moved] = openTabs.splice(srcIdx,1);
        // if dragging to right, adjust index if src was before dest
        const insertIdx = srcIdx < destIdx ? destIdx : destIdx;
        openTabs.splice(insertIdx,0,moved);
        renderTabs();
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('.tab-close')) {
          closeTab(tab.path);
          e.stopPropagation();
          return;
        }
        openFile(tab.path);
      });
      // middle click close
      el.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); closeTab(tab.path); } });
      // double-click to pin? not implemented — duplicate
      el.addEventListener('dblclick', ()=>{ /* keep */ });
      // context menu for tab
      el.addEventListener('contextmenu', (e)=>{
        e.preventDefault();
        const idx = openTabs.findIndex(t=>t.path===tab.path);
        showContextMenu(e.clientX, e.clientY, [
          {label:'Close', kbd:'Ctrl+F4', action:()=>closeTab(tab.path)},
          {label:'Close Others', action:()=>{ const keep=tab.path; openTabs.filter(t=>t.path!==keep && !t.dirty).forEach(t=>closeTab(t.path)); const dirtyOthers=openTabs.filter(t=>t.path!==keep && t.dirty); if(dirtyOthers.length) toast(`Skipped ${dirtyOthers.length} dirty tabs`); }},
          {label:'Close to the Right', action:()=>{ const toClose=openTabs.slice(idx+1).map(t=>t.path); toClose.forEach(p=>closeTab(p)); }},
          {label:'Close All', action:()=>{ openTabs.slice().forEach(t=>closeTab(t.path)); }},
          {type:'sep'},
          {label:'Copy Path', action:()=>copyPath(tab.path)},
          {label:'Copy Relative Path', action:()=>{ navigator.clipboard.writeText(tab.path); toast('Copied relative'); }},
          {label:'Reveal in Explorer', action:()=>{ expanded.add(findParent(tab.path).parentPath); renderTree(); toast('Revealed in Explorer'); }},
          {type:'sep'},
          {label:'Split Right', action:()=>toast('Split editor — use Split button (Ctrl+\\)')},
          {label:'Pin Tab', action:()=>toast('Pin — tab will stay (demo)')},
        ]);
      });
      tabsBar.appendChild(el);
    }
    // Tabs bar context (empty)
    tabsBar.addEventListener('contextmenu', (e)=>{
      if (e.target.closest('.tab')) return; // handled per tab
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        {label:'Close All', action:()=>{ openTabs.slice().forEach(t=>closeTab(t.path)); }},
        {label:'Close Others', action:()=>toast('No active tab to keep')},
        {type:'sep'},
        {label:'New Untitled File', kbd:'Ctrl+N', action:()=>createNew('file','')},
      ]);
    });
    // Keyboard for tabs: Ctrl+W, Ctrl+Tab, Ctrl+PageUp/Down
    // handled globally below
  }
  function setupTabsKeyboard(){
    document.addEventListener('keydown', (e)=>{
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key==='w' && !e.shiftKey) { if(activePath){ e.preventDefault(); closeTab(activePath); } }
      else if (mod && e.key==='Tab' && !e.shiftKey) { e.preventDefault(); if(openTabs.length){ const idx=openTabs.findIndex(t=>t.path===activePath); const next=(idx+1)%openTabs.length; openFile(openTabs[next].path); } }
      else if (mod && e.shiftKey && e.key==='Tab') { e.preventDefault(); if(openTabs.length){ const idx=openTabs.findIndex(t=>t.path===activePath); const prev=(idx-1+openTabs.length)%openTabs.length; openFile(openTabs[prev].path); } }
      else if (mod && e.key==='PageDown') { e.preventDefault(); if(openTabs.length){ const idx=openTabs.findIndex(t=>t.path===activePath); const next=Math.min(idx+1, openTabs.length-1); openFile(openTabs[next].path); } }
      else if (mod && e.key==='PageUp') { e.preventDefault(); if(openTabs.length){ const idx=openTabs.findIndex(t=>t.path===activePath); const prev=Math.max(idx-1,0); openFile(openTabs[prev].path); } }
      else if (mod && /^[1-9]$/.test(e.key)) { const n=parseInt(e.key)-1; if(openTabs[n]) { e.preventDefault(); openFile(openTabs[n].path); } }
    });
    // quick patch updateBadges on tab changes
    const origRT = renderTabs;
    // wrapper already
  }
  setupTabsKeyboard();
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
    // hint for C/C++ run
    if(path.endsWith('.cpp')||path.endsWith('.c')||path.endsWith('.cc')){
      // subtle status hint via toast once per file open session
      if(!window._hintedRun) window._hintedRun=new Set();
      if(!window._hintedRun.has(path)){
        window._hintedRun.add(path);
        setTimeout(()=>toast(`▶ Run: right-click → "Run C/C++ File"  or terminal: ${path.endsWith('.c')?'gcc':'g++'} ${path} -o ${path.split('/').pop().replace(/\.(cpp|c|cc)$/,'')} && ./${path.split('/').pop().replace(/\.(cpp|c|cc)$/,'')}`), 600);
      }
    }
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
  // --- Breadcrumbs — Subpart 1.6 ---
  function updateBreadcrumbs() {
    const bc = document.getElementById('breadcrumbs');
    if (!bc) return;
    if (!activePath) { bc.innerHTML = `<span class="crumb">ubiquitous-guacamole</span><span class="sep">›</span><span class="crumb is-active" id="breadcrumbFile">Welcome</span><span class="breadcrumb-actions"><button class="icon-btn small" title="Go to Symbol (Ctrl+Shift+O)" data-cmd="goToSymbol">⌖</button></span>`; return; }
    const parts = activePath.split('/');
    const file = parts.pop();
    const folder = parts.join(' › ') || 'ubiquitous-guacamole';
    bc.innerHTML = `<span class="crumb" data-nav="" title="Go to folder">${folder}</span><span class="sep">›</span><span class="crumb is-active" id="breadcrumbFile" title="${activePath}">${file}</span><span class="breadcrumb-actions"><button class="icon-btn small" title="Go to Symbol (Ctrl+Shift+O)" data-cmd="goToSymbol">⌖</button></span>`;
    bc.querySelector('[data-nav]')?.addEventListener('click', ()=>{
      const folderPath = parts.join('/');
      if (folderPath) expanded.add(folderPath);
      renderTree(); toast('Revealed folder: '+(folderPath||'root'));
    });
    bc.querySelector('[data-cmd="goToSymbol"]')?.addEventListener('click', ()=>openPalette('@'));
    // re-bind breadcrumbFile ref
    const bf = document.getElementById('breadcrumbFile');
    if (bf) { /* keep global var in sync */ }
  }
  // initial breadcrumb setup already

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
  // Apply editor settings from LS (Part 1.6)
  function getEditorSettings(){
    return {
      fontSize: parseInt(localStorage.getItem('vscode-fontSize')||'13'),
      tabSize: parseInt(localStorage.getItem('vscode-tabSize')||'2'),
      wordWrap: localStorage.getItem('vscode-wordwrap')||'on',
      minimap: localStorage.getItem('vscode-minimap')!=='off',
      theme: localStorage.getItem('vscode-theme')||'dark'
    };
  }
  function createMonacoEditor() {
    if (monacoEditor || !isMonacoReady) return;
    const s = getEditorSettings();
    monacoEditor = monaco.editor.create(monacoContainer, {
      value: '// Select a file to start editing',
      language: 'javascript',
      theme: s.theme==='light' ? 'vs' : 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: s.minimap },
      fontSize: s.fontSize,
      fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace',
      lineHeight: 20,
      padding: { top: 12, bottom: 12 },
      scrollBeyondLastLine: false,
      wordWrap: s.wordWrap,
      tabSize: s.tabSize,
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      suggest: { showKeywords: true },
      glyphMargin: true, // for breakpoints
      lineNumbersMinChars: 4
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
        scheduleProblems();
      }
    });
    monacoEditor.onDidChangeCursorPosition((e)=>{ updateStatusPosition(); // also track selection
      const sel=monacoEditor.getSelection();
      const selEl=document.getElementById('statusSelection');
      if(selEl) selEl.textContent = sel && !sel.isEmpty() ? `( ${sel.endLineNumber-sel.startLineNumber+1} selected)` : 'No Selection';
    });
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
      // editor context menu — enhance (cut/copy/paste, format, command palette)
      monacoEditor.onContextMenu(()=>{ /* native menu + our */ });
      // right-click on editor to show our menu after delay
      monacoContainer.oncontextmenu = (e)=>{
        e.preventDefault();
        const sel = monacoEditor.getSelection();
        const hasSel = sel && !sel.isEmpty();
        showContextMenu(e.clientX, e.clientY, [
          {label: hasSel?'Cut':'Cut', kbd:'Ctrl+X', action:()=>document.execCommand('cut')},
          {label: 'Copy', kbd:'Ctrl+C', action:()=>document.execCommand('copy')},
          {label: 'Paste', kbd:'Ctrl+V', action:()=>document.execCommand('paste')},
          {type:'sep'},
          {label:'Format Document', kbd:'Shift+Alt+F', action:()=>{ monacoEditor.getAction('editor.action.formatDocument').run(); toast('Formatted'); }},
          {label:'Command Palette...', kbd:'Ctrl+Shift+P', action:()=>openPalette('>')},
          {type:'sep'},
          {label:'Copy Path', action:()=>copyPath(node.path)},
          {label:'Reveal in Explorer', action:()=>{ expanded.add(findParent(node.path).parentPath); renderTree(); }},
        ]);
      };
      // outline auto-refresh
      setTimeout(()=>{ if(!document.getElementById('outlineTree').classList.contains('hidden')) renderOutline(); }, 100);
      // fallback format button
      document.getElementById('fallbackFormat')?.addEventListener('click', ()=>{ fallbackTextarea.value = node.content.replace(/;/g,';\n').trim(); fallbackTextarea.dispatchEvent(new Event('input')); toast('Formatted'); });
    } else if (isMonacoReady && !monacoEditor) {
      pendingContent = { path: node.path, content: node.content };
      if (!monacoEditor) createMonacoEditor();
    } else {
      fallbackTextarea.value = node.content;
      fallbackEditor.classList.remove('hidden');
      monacoContainer.classList.add('hidden');
      fallbackTextarea.oninput = () => {
        node.content = fallbackTextarea.value;
        const tab = openTabs.find(t => t.path === activePath);
        if (tab) tab.dirty = true;
        renderTabs(); debouncedSave(); updateStatusPosition();
      };
    }
    updateBreadcrumbs();
    // update status language & indent
    const lang = getLanguage(node.path);
    document.getElementById('statusLanguage').textContent = lang==='plaintext'?'Plain Text': lang.charAt(0).toUpperCase()+lang.slice(1);
    document.getElementById('statusIndent').textContent = `Spaces: ${getEditorSettings().tabSize}`;
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

  // --- Search — Subpart 2.1: full functional Search & Replace ---
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const replaceInput = document.getElementById('replaceInput');
  const searchInclude = document.getElementById('searchInclude');
  const searchCase = document.getElementById('searchCase');
  const searchWord = document.getElementById('searchWord');
  const searchRegex = document.getElementById('searchRegex');
  const searchBtn = document.getElementById('searchBtn');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const replaceOneBtn = document.getElementById('replaceOneBtn');
  const replaceAllBtn = document.getElementById('replaceAllBtn');
  let lastSearchMatches = []; // for replace one-by-one

  function globToRegExp(glob) {
    if (!glob) return null;
    // very simple: support **, *, ?
    const esc = glob.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\*/g,'.*').replace(/\*/g,'[^/]*').replace(/\?/g,'.');
    return new RegExp('^' + esc + '$', 'i');
  }
  function shouldInclude(path, includeGlob) {
    if (!includeGlob) return true;
    const pat = globToRegExp(includeGlob.trim());
    if (!pat) return true;
    return pat.test(path) || path.includes(includeGlob.trim());
  }
  function buildSearchRegex(q) {
    if (!q) return null;
    const flags = searchCase?.checked ? 'g' : 'gi';
    try {
      if (searchRegex?.checked) return new RegExp(q, flags);
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const pat = searchWord?.checked ? `\\b${esc}\\b` : esc;
      return new RegExp(pat, flags);
    } catch (e) { toast('Invalid regex: '+e.message); return null; }
  }
  function runSearch() {
    const q = searchInput.value;
    if (!q.trim()) { searchResults.innerHTML = '<div class="muted">Enter a search term. Use toggles for Case/Word/Regex and Include filter.</div>'; lastSearchMatches=[]; return; }
    const regex = buildSearchRegex(q);
    if (!regex) return;
    const include = searchInclude?.value.trim();
    const files = getAllFiles();
    let html = '', total=0, fileCount=0;
    lastSearchMatches = [];
    for (const f of files) {
      if (!shouldInclude(f.path, include)) continue;
      const lines = f.content.split('\n');
      const matches = [];
      lines.forEach((line, idx)=>{
        const m = line.match(regex);
        if (m) {
          // find all occurrences in line
          let lineMatches = [...line.matchAll(new RegExp(regex.source, regex.flags.includes('g')?regex.flags:regex.flags+'g'))];
          matches.push({idx: idx+1, text: line.trim().slice(0,90), count: lineMatches.length, lineText: line});
          lastSearchMatches.push({path:f.path, line: idx+1, text: line, matches: lineMatches});
        }
      });
      if (matches.length) {
        fileCount++; total+=matches.length;
        html += `<div class="search-result-group">${f.path} • ${matches.length} <button class="ghost-btn small" data-replace-file="${f.path}" style="margin-left:6px">Replace in file</button></div>`;
        for (const m of matches.slice(0,5)) {
          // highlight match
          let highlighted = escapeHtml(m.text);
          try { highlighted = highlighted.replace(regex, '<mark>$&</mark>'); } catch{}
          html += `<div class="search-result-item" data-path="${f.path}" data-line="${m.idx}"><span style="color:var(--fg-muted); font-size:11px">${m.idx}:</span> ${highlighted} <span class="muted small">×${m.count}</span></div>`;
        }
        if (matches.length>5) html += `<div class="muted small" style="padding-left:12px">+${matches.length-5} more in this file…</div>`;
      }
    }
    if (!html) html = `<div class="muted">No results for "${escapeHtml(q)}" ${include?`in "${include}"`:''}</div>`;
    else html = `<div class="muted" style="display:flex; justify-content:space-between; align-items:center"><span>${total} results in ${fileCount} files</span><button class="ghost-btn small" id="replaceAllInResults">Replace All (${total})</button></div>` + html;
    searchResults.innerHTML = html;
    // wire replace in file buttons
    searchResults.querySelectorAll('[data-replace-file]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const path=b.dataset.replaceFile;
        const node=findNode(path);
        if(!node) return;
        const q2=searchInput.value, r=replaceInput.value;
        const rx=buildSearchRegex(q2);
        if(!rx) return;
        const before=node.content;
        node.content = node.content.replace(new RegExp(rx.source, rx.flags.includes('g')?rx.flags:rx.flags+'g'), r);
        if(node.content!==before){ node.content!==before && (openTabs.find(t=>t.path===path).dirty=true, renderTabs()); saveFS(); runSearch(); toast(`Replaced in ${path}`); }
      });
    });
    document.getElementById('replaceAllInResults')?.addEventListener('click', doReplaceAll);
  }
  function doReplaceOne(){
    if (!lastSearchMatches.length) { toast('No match to replace — run Search first'); return; }
    const first = lastSearchMatches[0];
    const node=findNode(first.path);
    const q=searchInput.value, r=replaceInput.value;
    const rx=buildSearchRegex(q);
    if(!rx) return;
    // replace first occurrence on that line only
    const lines=node.content.split('\n');
    const lineIdx=first.line-1;
    const line=lines[lineIdx];
    // replace only first match
    const newLine = line.replace(rx, r);
    if(newLine!==line){ lines[lineIdx]=newLine; node.content=lines.join('\n'); const tab=openTabs.find(t=>t.path===first.path); if(tab) tab.dirty=true; renderTabs(); saveFS(); toast(`Replaced 1 in ${first.path}:${first.line}`); runSearch(); openFile(first.path); setTimeout(()=>{ if(monacoEditor) { monacoEditor.revealLineInCenter(first.line); monacoEditor.setSelection({startLineNumber:first.line, startColumn:1, endLineNumber:first.line, endColumn: newLine.length+1}); }},100); }
  }
  function doReplaceAll(){
    const q=searchInput.value, r=replaceInput.value;
    if(!q){ toast('Enter search term'); return; }
    const rx=buildSearchRegex(q);
    if(!rx) return;
    const include=searchInclude?.value.trim();
    let changed=0, filesChanged=0;
    for(const f of getAllFiles()){
      if(!shouldInclude(f.path, include)) continue;
      const matches = [...f.content.matchAll(new RegExp(rx.source, rx.flags.includes('g')?rx.flags:rx.flags+'g'))];
      if(matches.length){
        f.content = f.content.replace(new RegExp(rx.source, rx.flags.includes('g')?rx.flags:rx.flags+'g'), r);
        const tab=openTabs.find(t=>t.path===f.path); if(tab) tab.dirty=true;
        changed+=matches.length; filesChanged++;
      }
    }
    if(changed){ saveFS(); renderTree(); renderTabs(); runSearch(); toast(`Replaced ${changed} occurrences in ${filesChanged} files`); if(activePath && monacoEditor) monacoEditor.setValue(findNode(activePath).content); }
    else toast('No occurrences to replace');
  }
  if (searchInput) {
    searchInput.addEventListener('input', runSearch);
    searchBtn?.addEventListener('click', runSearch);
    searchClearBtn?.addEventListener('click', ()=>{ searchInput.value=''; replaceInput.value=''; searchInclude.value=''; searchResults.innerHTML='<div class="muted">Cleared</div>'; lastSearchMatches=[]; });
    replaceOneBtn?.addEventListener('click', doReplaceOne);
    replaceAllBtn?.addEventListener('click', doReplaceAll);
    // toggles re-run
    [searchCase, searchWord, searchRegex].forEach(el=>el?.addEventListener('change', runSearch));
    searchInclude?.addEventListener('input', runSearch);
    replaceInput?.addEventListener('keydown', e=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)) doReplaceAll(); else if(e.key==='Enter') doReplaceOne(); });
    searchInput.addEventListener('keydown', e=>{
      if(e.key==='Enter' && (e.ctrlKey||e.metaKey)) doReplaceAll();
      else if(e.key==='Enter') runSearch();
      if(e.key==='Escape'){ searchInput.value=''; runSearch(); }
    });
    // Replace toggle visibility
    document.getElementById('searchReplaceToggle')?.addEventListener('click', ()=>{
      const row=document.getElementById('replaceRow');
      row.classList.toggle('hidden');
      if(!row.classList.contains('hidden')) replaceInput.focus();
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

  // --- SCM — Part 3: fully functional git simulation ---
  const initialSnapshot = JSON.stringify(initialFS);
  function getBaseFS(){ try{ return JSON.parse(initialSnapshot); } catch{ return {children:[]}; } }
  function collectAllPaths(node, base=''){
    let out=[];
    if(node.path) out.push(node.path);
    if(node.children) for(const c of node.children) out=out.concat(collectAllPaths(c));
    return out;
  }
  function getGitState(){
    let staged = JSON.parse(localStorage.getItem('vscode-git-staged')||'[]');
    let commits = JSON.parse(localStorage.getItem('vscode-git-commits')||'[{"hash":"189fb54","msg":"Add VSCode User Setup executable","time":"2h ago","author":"you"}]');
    let branches = JSON.parse(localStorage.getItem('vscode-git-branches')||'["main","arena/ee95291c-ubiquitous-guacamole"]');
    let currentBranch = localStorage.getItem('vscode-git-branch')||'main';
    return {staged, commits, branches, currentBranch};
  }
  function saveGitState(s){ localStorage.setItem('vscode-git-staged', JSON.stringify(s.staged)); localStorage.setItem('vscode-git-commits', JSON.stringify(s.commits)); localStorage.setItem('vscode-git-branches', JSON.stringify(s.branches)); localStorage.setItem('vscode-git-branch', s.currentBranch); }
  function getChangedFiles(){
    const base = getBaseFS();
    const baseFiles = new Map();
    (function collect(n){ if(n.type==='file') baseFiles.set(n.path, n.content); if(n.children) n.children.forEach(collect); })(base);
    const curFiles = getAllFiles();
    const changed=[];
    for(const f of curFiles){
      const baseContent = baseFiles.get(f.path);
      if(baseContent===undefined) changed.push({path:f.path, status:'U', label:'Untracked'});
      else if(baseContent!==f.content) changed.push({path:f.path, status:'M', label:'Modified'});
    }
    // deleted
    const curPaths = new Set(curFiles.map(f=>f.path));
    for(const [p,content] of baseFiles.entries()){
      if(!curPaths.has(p)) changed.push({path:p, status:'D', label:'Deleted'});
    }
    return changed;
  }
  function renderSCM(){
    const changed = getChangedFiles();
    const {staged, commits, branches, currentBranch} = getGitState();
    const stagedListEl=document.getElementById('stagedList'), changesListEl=document.getElementById('changesList');
    const stagedCountEl=document.getElementById('stagedCount'), changesCountEl=document.getElementById('changesCount');
    if(!stagedListEl||!changesListEl) return;
    const stagedSet=new Set(staged);
    const unstaged = changed.filter(c=>!stagedSet.has(c.path));
    const stagedItems = changed.filter(c=>stagedSet.has(c.path));
    stagedCountEl.textContent = stagedItems.length;
    changesCountEl.textContent = unstaged.length;
    // render staged
    stagedListEl.innerHTML = stagedItems.length ? stagedItems.map(c=>`<div class="scm-item" data-path="${c.path}"><span class="scm-status ${c.status}">${c.status}</span><span style="flex:1">${c.path}</span><button class="icon-btn small" data-unstage="${c.path}" title="Unstage">−</button><button class="icon-btn small" data-diff="${c.path}" title="Open Changes">◧</button></div>`).join('') : '<div class="muted small" style="padding:6px 8px">No staged changes</div>';
    changesListEl.innerHTML = unstaged.length ? unstaged.map(c=>`<div class="scm-item" data-path="${c.path}"><span class="scm-status ${c.status}">${c.status}</span><span style="flex:1">${c.path}</span><button class="icon-btn small" data-stage="${c.path}" title="Stage Changes">+</button><button class="icon-btn small" data-diff="${c.path}" title="Open Changes">◧</button></div>`).join('') : '<div class="muted small" style="padding:6px 8px">No changes — working tree clean</div>';
    // commits
    const commitsList=document.getElementById('commitsList'), commitCountEl=document.getElementById('commitCount');
    if(commitsList){ commitsList.innerHTML = commits.map(c=>`<div class="scm-commit-item" data-hash="${c.hash}"><span class="scm-hash">${c.hash}</span> ${escapeHtml(c.msg)} <span class="muted small">— ${c.time} • ${c.author||'you'}</span></div>`).join(''); if(commitCountEl) commitCountEl.textContent=commits.length; }
    // branches
    const branchList=document.getElementById('branchList');
    if(branchList){ branchList.innerHTML = branches.map(b=>`<div class="branch-item ${b===currentBranch?'is-active':''}" data-branch="${b}">${b===currentBranch?'● ':'○ '}${b}</div>`).join(''); }
    // badge
    const scmBadge=document.getElementById('scmBadge');
    if(scmBadge){ scmBadge.textContent = String(changed.length); scmBadge.hidden = changed.length===0; scmBadge.style.display = changed.length? '': 'none'; }
    // wire stage/unstage
    stagedListEl.querySelectorAll('[data-unstage]').forEach(b=>b.addEventListener('click', (e)=>{ e.stopPropagation(); const p=b.dataset.unstage; const s=getGitState(); s.staged=s.staged.filter(x=>x!==p); saveGitState(s); renderSCM(); toast(`Unstaged ${p}`); }));
    changesListEl.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click', (e)=>{ e.stopPropagation(); const p=b.dataset.stage; const s=getGitState(); if(!s.staged.includes(p)) s.staged.push(p); saveGitState(s); renderSCM(); toast(`Staged ${p}`); }));
    stagedListEl.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click', ()=>openDiff(b.dataset.diff)));
    changesListEl.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click', ()=>openDiff(b.dataset.diff)));
    changesListEl.querySelectorAll('.scm-item').forEach(el=>el.addEventListener('click', ()=>openFile(el.dataset.path)));
    stagedListEl.querySelectorAll('.scm-item').forEach(el=>el.addEventListener('click', ()=>openFile(el.dataset.path)));
    // update badges
    updateBadges();
  }
  function openDiff(path){
    const cur = findNode(path);
    if(!cur) return;
    const base = getBaseFS();
    let baseNode=null;
    (function find(n){ if(n.path===path) baseNode=n; if(n.children) n.children.forEach(find); })(base);
    const baseContent = baseNode ? baseNode.content : '';
    const curContent = cur.type==='file' ? cur.content : '';
    // simple line diff
    const baseLines=baseContent.split('\n'), curLines=curContent.split('\n');
    let html='';
    const max=Math.max(baseLines.length, curLines.length);
    for(let i=0;i<max;i++){
      const b=baseLines[i], c=curLines[i];
      if(b===c) html+=`<div class="diff-line ctx"> ${escapeHtml(c||'')}<span class="muted small">  ${i+1}</span></div>`;
      else {
        if(b!==undefined) html+=`<div class="diff-line rem">- ${escapeHtml(b)}<span class="muted small">  ${i+1}</span></div>`;
        if(c!==undefined) html+=`<div class="diff-line add">+ ${escapeHtml(c)}<span class="muted small">  ${i+1}</span></div>`;
      }
    }
    const pane=document.getElementById('diffPane');
    document.getElementById('diffTitle').textContent = `Changes: ${path}`;
    document.getElementById('diffContent').innerHTML = html || '<div class="muted small">No differences</div>';
    pane.classList.remove('hidden');
    welcomePage.classList.add('hidden');
    monacoContainer.classList.add('hidden');
    fallbackEditor.classList.add('hidden');
  }
  document.querySelector('[data-cmd="closeDiff"]')?.addEventListener('click', ()=>{ document.getElementById('diffPane').classList.add('hidden'); if(activePath) showEditor(); else showWelcome(); });
  // SCM actions
  document.getElementById('stageAllBtn')?.addEventListener('click', ()=>{
    const changed=getChangedFiles(); const s=getGitState();
    s.staged = changed.map(c=>c.path); saveGitState(s); renderSCM(); toast(`Staged ${s.staged.length} files`);
  });
  document.getElementById('unstageAllBtn')?.addEventListener('click', ()=>{
    const s=getGitState(); s.staged=[]; saveGitState(s); renderSCM(); toast('Unstaged all');
  });
  document.getElementById('scmRefreshBtn')?.addEventListener('click', ()=>{ renderSCM(); toast('Source Control refreshed'); });
  document.getElementById('commitBtn')?.addEventListener('click', ()=>{
    const msg=document.getElementById('commitMsg')?.value.trim();
    const {staged, commits} = getGitState();
    if(!msg){ toast('Enter commit message'); document.getElementById('commitMsg')?.focus(); return; }
    if(!staged.length){ toast('No changes staged — Stage all or select files'); return; }
    const hash=Math.random().toString(36).slice(2,8);
    commits.unshift({hash, msg, time:'just now', author:'you'});
    // update base snapshot to current for demo — staged becomes committed
    const s=getGitState(); s.commits=commits; s.staged=[]; saveGitState(s);
    // update initialSnapshot to current FS for next diff (simulate committing)
    // Instead, keep initial snapshot but clear dirty? For demo, we just clear staged and consider committed as clean
    // Persist current FS as new base for next commit cycle by updating initialSnapshot in LS
    localStorage.setItem('vscode-git-base', JSON.stringify(fsRoot));
    document.getElementById('commitMsg').value='';
    renderSCM(); toast(`Committed ${hash}: ${msg}`); pushNotification('Git',`Committed ${hash}`);
    outputLogs['Git'] = outputLogs['Git'] + `\n[Info] git commit -m "${msg}" -> ${hash}\n`;
  });
  document.getElementById('commitAmendBtn')?.addEventListener('click', ()=>{
    const last=getGitState().commits[0];
    if(!last){ toast('No commits to amend'); return; }
    const msg=prompt('Amend commit message:', last.msg);
    if(msg){ last.msg=msg; const s=getGitState(); saveGitState(s); renderSCM(); toast('Amended'); }
  });
  document.getElementById('commitMsg')?.addEventListener('keydown', (e)=>{
    if((e.ctrlKey||e.metaKey) && e.key==='Enter'){ document.getElementById('commitBtn').click(); }
  });
  // branch clicks
  document.getElementById('branchList')?.addEventListener('click', (e)=>{
    const item=e.target.closest('.branch-item');
    if(!item) return;
    const branch=item.dataset.branch;
    if(!branch) return;
    const s=getGitState(); s.currentBranch=branch; saveGitState(s); renderSCM(); document.getElementById('statusBranch').innerHTML=branch.split('/').pop()+' <span class="status-badge">⇅ 1</span>'; toast(`Switched to ${branch}`);
  });
  // create new branch via palette
  // initial render
  setTimeout(renderSCM, 700);
  // hook into FS changes to auto-refresh SCM
  const _origCreateNewForSCM = createNew;
  const _origRenameForSCM = renamePath;
  const _origDeleteForSCM = deletePath;
  // wrap save to also refresh SCM periodically
  setInterval(renderSCM, 3000);

  // --- Panel Tabs — Subpart 2.2: fully functional ---
  const panelMap = { problems:'problems', output:'output', debugcons:'debugcons', terminal:'terminal', ports:'ports', comments:'comments' };
  function showPanelView(key) {
    document.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('is-active','is-active-panel'));
    document.querySelectorAll('.panel-view').forEach(v=>v.classList.remove('is-active'));
    const tab = document.querySelector(`.panel-tab[data-panel="${key}"]`);
    const view = document.querySelector(`.panel-view[data-panel-view="${key}"]`);
    if (tab) tab.classList.add('is-active','is-active-panel');
    if (view) view.classList.add('is-active');
    // special: focus terminal input if terminal
    if (key==='terminal') setTimeout(()=>document.getElementById('terminalInput')?.focus(), 50);
    if (key==='debugcons') setTimeout(()=>document.getElementById('debugEvalInput')?.focus(), 50);
    panel.classList.remove('hidden');
    localStorage.setItem('vscode-panel-view', key);
    toast(`Panel: ${tab?.textContent.trim().split(' ')[0]||key}`);
  }
  // --- Output & Debug Console — Subpart 2.4: fully functional ---
  const outputContent = document.getElementById('outputContent');
  const outputChannel = document.getElementById('outputChannel');
  const outputLogs = {
    'Extension Host': '[Info] Extension host started v1.104.0\n[Info] Git extension active — 2 changes\n[Info] Copilot Chat ready\n[Info] REA bridge: inspect ready\n',
    'Git': '[Info] git rev-parse --show-toplevel -> /home/user/ubiquitous-guacamole\n[Info] git status — 2 modified, 1 untracked\n[Info] git log --oneline -5 -> 189fb54 Add VSCode setup\n',
    'Tasks': '[Info] No tasks registered. Create tasks.json to run build tasks.\n[Info] npm run dev would appear here\n'
  };
  outputChannel?.addEventListener('change', ()=>{
    const ch=outputChannel.value;
    outputContent.textContent = outputLogs[ch] || `[Info] ${ch} — no logs yet`;
  });
  document.getElementById('clearOutputBtn')?.addEventListener('click', ()=>{ outputContent.textContent=''; toast('Output cleared'); });
  // Make terminal logs also go to Output (Git channel) for realism
  const _origTerminalLog = terminalLog;
  // wrap after definition — will be assigned later, so we patch here via proxy
  setTimeout(()=>{
    const orig = window._terminalLogRef || terminalLog;
    // patch output when git commands run
  },0);
  // Debug Console evaluator
  const debugEvalInput = document.getElementById('debugEvalInput');
  const debugOutput = document.getElementById('debugOutput');
  const debugEvalBtn = document.getElementById('debugEvalBtn');
  function runDebugEval(){
    const expr = debugEvalInput.value.trim();
    if(!expr) return;
    const line = document.createElement('div');
    line.innerHTML = `<span style="color:var(--accent)">› ${escapeHtml(expr)}</span>`;
    debugOutput.appendChild(line);
    let result;
    try {
      // safe eval with current file context
      const ctx = activePath ? findNode(activePath)?.content || '' : '';
      // allow simple JS expressions, plus helper: greet()
      const sandbox = { greet: (n)=>`Hello ${n}`, console, Math, Date, JSON, parseInt, parseFloat };
      const fn = new Function(...Object.keys(sandbox), `return (${expr})`);
      result = fn(...Object.values(sandbox));
    } catch(e){ result = 'Error: '+e.message; }
    const out = document.createElement('div');
    out.textContent = String(result);
    out.style.color = 'var(--fg)';
    debugOutput.appendChild(out);
    debugOutput.scrollTop = debugOutput.scrollHeight;
    debugEvalInput.value='';
    // also log to Problems if needed
  }
  debugEvalBtn?.addEventListener('click', runDebugEval);
  debugEvalInput?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); runDebugEval(); } if(e.key==='Escape'){ debugEvalInput.blur(); } });

  // --- Extensions — Part 5: fully functional ---
  const marketplaceExtensions = [
    {id:'prettier', name:'Prettier', publisher:'Prettier', version:'10.1.0', rating:4.8, installs:'12M', desc:'Code formatter using prettier', recommended:true, color:'#f7b500'},
    {id:'eslint', name:'ESLint', publisher:'Microsoft', version:'3.0.10', rating:4.7, installs:'9M', desc:'Integrates ESLint JavaScript', recommended:true, color:'#4b32c3'},
    {id:'copilot', name:'Muse', publisher:'GitHub', version:'1.175.0', rating:4.6, installs:'15M', desc:'Your AI pair programmer', recommended:true, color:'#8957e5'},
    {id:'gitlens', name:'GitLens', publisher:'GitKraken', version:'15.2.0', rating:4.5, installs:'8M', desc:'Supercharge Git within VS Code', recommended:false, color:'#0066b8'},
    {id:'vscode-icons', name:'vscode-icons', publisher:'VSCode Icons Team', version:'12.10.0', rating:4.8, installs:'5M', desc:'Icons for Visual Studio Code', recommended:false, color:'#00bcd4'},
    {id:'live-server', name:'Live Server', publisher:'Ritwick Dey', version:'5.7.9', rating:4.7, installs:'11M', desc:'Launch a local dev server with live reload', recommended:true, color:'#2ea043'},
    {id:'tailwind', name:'Tailwind CSS IntelliSense', publisher:'Tailwind Labs', version:'0.14.0', rating:4.9, installs:'6M', desc:'Intelligent Tailwind CSS tooling', recommended:false, color:'#38bdf8'},
  ];
  let installed = new Set(JSON.parse(localStorage.getItem('vscode-ext-installed')||'["prettier","eslint"]'));
  let extFilter = localStorage.getItem('vscode-ext-filter')||'all';
  let extQuery = localStorage.getItem('vscode-ext-query')||'';
  function saveExtensions(){ localStorage.setItem('vscode-ext-installed', JSON.stringify([...installed])); localStorage.setItem('vscode-ext-filter', extFilter); localStorage.setItem('vscode-ext-query', extQuery); }
  function renderExtensions(){
    const list=document.getElementById('extList');
    const countEl=document.getElementById('extCount');
    const searchEl=document.getElementById('extSearch');
    if(!list) return;
    let items=[...marketplaceExtensions];
    if(extFilter==='installed') items=items.filter(e=>installed.has(e.id));
    if(extFilter==='recommended') items=items.filter(e=>e.recommended);
    if(extQuery) {
      const q=extQuery.toLowerCase();
      items=items.filter(e=> e.name.toLowerCase().includes(q) || e.publisher.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q));
    }
    list.innerHTML = items.map(e=>{
      const isInstalled=installed.has(e.id);
      return `<div class="ext-item" data-ext="${e.id}">
        <div class="ext-icon" style="background:${e.color}">${e.name[0]}</div>
        <div class="ext-main"><div class="ext-name">${escapeHtml(e.name)} <span class="muted small">• ${e.publisher}</span></div><div class="ext-desc muted small">${escapeHtml(e.desc)}</div><div class="ext-meta muted small">★ ${e.rating} • ${e.installs} • v${e.version} ${isInstalled?'<span style="color:var(--accent)">● Installed</span>':''}</div></div>
        <div class="ext-actions">
          ${isInstalled ? `<button class="ghost-btn small" data-disable="${e.id}" title="Disable">⚙</button><button class="ghost-btn small" data-uninstall="${e.id}">Uninstall</button>` : `<button class="primary-btn small" data-install="${e.id}">Install</button>`}
        </div>
      </div>`;
    }).join('') || '<div class="muted small" style="padding:12px">No extensions match</div>';
    if(countEl) countEl.textContent = `${items.length} ${extFilter==='installed'?'installed':extFilter==='recommended'?'recommended':'marketplace'} extensions${installed.size?' • '+installed.size+' installed':''}`;
    if(searchEl && searchEl.value!==extQuery) searchEl.value=extQuery;
    // wire
    list.querySelectorAll('[data-install]').forEach(b=>b.addEventListener('click', ()=>{
      installed.add(b.dataset.install); saveExtensions(); renderExtensions(); toast(`Installed ${b.dataset.install}`); pushNotification('Extensions', `${b.dataset.install} installed`); updateExtensionBadge();
    }));
    list.querySelectorAll('[data-uninstall]').forEach(b=>b.addEventListener('click', ()=>{
      installed.delete(b.dataset.uninstall); saveExtensions(); renderExtensions(); toast(`Uninstalled ${b.dataset.uninstall}`); updateExtensionBadge();
    }));
    list.querySelectorAll('[data-disable]').forEach(b=>b.addEventListener('click', ()=> toast(`Extension ${b.dataset.disable} settings — enable/disable (demo)`)));
    list.querySelectorAll('.ext-item').forEach(el=>{
      el.addEventListener('click', (e)=>{ if(e.target.closest('button')) return; toast(`${el.dataset.ext} — click Install to add`); });
    });
    // update sidebar badge 0
    updateExtensionBadge();
  }
  function updateExtensionBadge(){
    const badge=document.querySelector('.activity-btn[data-view="extensions"] .activity-badge');
    if(badge){ badge.textContent=String(installed.size); badge.hidden=false; badge.style.display=''; }
  }
  document.getElementById('extSearch')?.addEventListener('input', (e)=>{ extQuery=e.target.value; saveExtensions(); renderExtensions(); });
  document.querySelectorAll('.ext-tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      extFilter=t.dataset.filter; saveExtensions();
      document.querySelectorAll('.ext-tab').forEach(x=>x.classList.remove('is-active'));
      t.classList.add('is-active');
      renderExtensions();
    });
  });
  // restore active tab
  setTimeout(()=>{
    document.querySelectorAll('.ext-tab').forEach(t=>{ t.classList.toggle('is-active', t.dataset.filter===extFilter); });
    renderExtensions();
  }, 600);
  // extFilterBtn quick picks
  document.getElementById('extFilterBtn')?.addEventListener('click', ()=>{
    showContextMenu(window.innerWidth/2, 120, [
      {label:'Show All', action:()=>{ extFilter='all'; saveExtensions(); renderExtensions(); document.querySelectorAll('.ext-tab').forEach(x=>x.classList.remove('is-active')); document.querySelector('[data-filter="all"]').classList.add('is-active'); }},
      {label:'Show Installed', action:()=>{ extFilter='installed'; saveExtensions(); renderExtensions(); document.querySelectorAll('.ext-tab').forEach(x=>x.classList.remove('is-active')); document.querySelector('[data-filter="installed"]').classList.add('is-active'); }},
      {label:'Show Recommended', action:()=>{ extFilter='recommended'; saveExtensions(); renderExtensions(); document.querySelectorAll('.ext-tab').forEach(x=>x.classList.remove('is-active')); document.querySelector('[data-filter="recommended"]').classList.add('is-active'); }},
      {type:'sep'},
      {label:'Clear & Reload', action:()=>{ installed=new Set(['prettier','eslint']); saveExtensions(); renderExtensions(); toast('Extensions reset'); }},
    ]);
  });
  // Accounts & Remote functional
  document.getElementById('connectRemoteBtn')?.addEventListener('click', ()=>{ toast('Connecting to Remote — enter host in palette'); showPicker([{label:'WSL: Ubuntu — Connect', action:()=>toast('Connected to WSL: Ubuntu')},{label:'SSH: dev-server — Add Host', action:()=>{ const h=prompt('SSH host:'); if(h) toast(`SSH ${h} added`);}}], 'Remote'); });
  document.querySelector('[data-view-panel="accounts"] .primary-btn')?.addEventListener('click', ()=>{
    const btn=document.querySelector('[data-view-panel="accounts"] .primary-btn');
    if(btn.textContent.includes('Sign in')){ btn.textContent='Signed in as you@github.com ✓'; toast('Signed in — sync enabled'); pushNotification('Accounts', 'GitHub account connected — Settings Sync enabled'); } else { btn.textContent='Sign in with GitHub'; toast('Signed out'); }
  });

  // Patch terminalLog to also mirror to Output for git/npm
  // (defined after terminal, so we intercept later)
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => showPanelView(tab.dataset.panel));
    tab.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      const key=tab.dataset.panel;
      showContextMenu(e.clientX, e.clientY, [
        {label:`Close Panel`, action:()=>panel.classList.add('hidden')},
        {label:`Maximize Panel`, action:()=>{ panel.style.height='60%'; if(monacoEditor) monacoEditor.layout(); }},
        {label:`Move to Side`, action:()=>toast('Panel move — demo')},
        {type:'sep'},
        {label:`${key} — Help`, action:()=>toast(`${key} panel help — see docs`)}
      ]);
    });
  });
  // restore last panel view
  const savedPanel = localStorage.getItem('vscode-panel-view');
  if (savedPanel && panelMap[savedPanel]) setTimeout(()=>showPanelView(savedPanel), 300);
  // togglePanel now with restore
  const _origTogglePanel = togglePanel; // will be defined later, but we define wrapper below
  // keyboard Ctrl+J already handled
  // close/maximize actions already handled in status bar section

  // --- Debug — Part 4a: breakpoints & run ---
  let breakpoints = JSON.parse(localStorage.getItem('vscode-breakpoints')||'{}'); // {path: [line]}
  let debugActive=false, debugLine=null;
  function saveBreakpoints(){ localStorage.setItem('vscode-breakpoints', JSON.stringify(breakpoints)); }
  function toggleBreakpoint(path, line){
    if (!breakpoints[path]) breakpoints[path]=[];
    const idx=breakpoints[path].indexOf(line);
    if(idx===-1) { breakpoints[path].push(line); toast(`Breakpoint added ${path}:${line}`); }
    else { breakpoints[path].splice(idx,1); if(!breakpoints[path].length) delete breakpoints[path]; toast(`Breakpoint removed ${path}:${line}`); }
    if(!breakpoints[path]?.length) delete breakpoints[path];
    saveBreakpoints(); renderBreakpoints(); updateBreakpointDecorations();
  }
  function renderBreakpoints(){
    const list=document.getElementById('breakpointsList');
    const countEl=document.getElementById('bpCount');
    if(!list) return;
    const entries=[];
    for(const [p,lines] of Object.entries(breakpoints)) for(const l of lines) entries.push({path:p, line:l});
    if(countEl) countEl.textContent=entries.length;
    if(!entries.length){ list.innerHTML='<div class="muted small" style="padding:6px">No breakpoints — click gutter to add</div>'; return; }
    list.innerHTML=entries.map(e=>`<div class="scm-item" data-bp="${e.path}:${e.line}"><span style="color:var(--error)">●</span><span style="flex:1">${e.path}:${e.line}</span><button class="icon-btn small" data-remove-bp="${e.path}:${e.line}" title="Remove">✕</button></div>`).join('');
    list.querySelectorAll('[data-remove-bp]').forEach(b=>b.addEventListener('click', ()=>{
      const [p,l]=b.dataset.removeBp.split(':'); toggleBreakpoint(p, parseInt(l));
    }));
    list.querySelectorAll('.scm-item').forEach(el=>{
      el.addEventListener('click', ()=>{ const [p,l]=el.dataset.bp.split(':'); openFile(p); setTimeout(()=>{ if(monacoEditor) monacoEditor.revealLineInCenter(parseInt(l)); },100); });
    });
  }
  function updateBreakpointDecorations(){
    if(!monacoEditor || !activePath) return;
    const lines = breakpoints[activePath]||[];
    // clear old
    if(window._bpDecorations) monacoEditor.deltaDecorations(window._bpDecorations, []);
    if(!lines.length){ window._bpDecorations=[]; return; }
    window._bpDecorations = monacoEditor.deltaDecorations([], lines.map(line=>({
      range: new monaco.Range(line,1,line,1),
      options: { isWholeLine:true, glyphMarginClassName:'bp-glyph', glyphMarginHoverMessage:{value: `Breakpoint at ${activePath}:${line}`}}
    })));
  }
  // hook gutter click after Monaco created
  function setupDebugGutter(){
    if(!monacoEditor) return;
    monacoEditor.onMouseDown(e=>{
      if(e.target.type===2 /* glyph margin */ || e.target.type===3){
        const line=e.target.position?.lineNumber;
        if(line) toggleBreakpoint(activePath, line);
      }
    });
  }
  // Start debugging simulation
  let debugStepTimer=null;
  document.getElementById('startDebugBtn')?.addEventListener('click', startDebugging);
  document.getElementById('runWithoutDebugBtn')?.addEventListener('click', ()=>{
    const node=findNode(activePath); if(node && activePath.endsWith('.js')) commands.node([activePath]); else toast('Run — no JS file open');
  });
  function startDebugging(){
    if(!activePath){ toast('Open a file to debug'); return; }
    const bps=breakpoints[activePath]||[];
    if(!bps.length){ toast('No breakpoints — adding at line 5 for demo'); toggleBreakpoint(activePath, 5); }
    debugActive=true;
    const dbgVars=document.getElementById('debugVariables');
    const callStack=document.getElementById('callStack');
    const dbgConsole=document.getElementById('debugConsole');
    dbgVars.innerHTML='<div style="padding:6px"><strong>greet</strong> = <code>function</code><br><strong>name</strong> = <code>"Developer"</code><br><strong>Editor</strong> = <code>class</code></div>';
    callStack.innerHTML=`<div class="scm-item"><span>${activePath}:5</span><span class="muted small">greet()</span></div><div class="scm-item"><span>${activePath}:1</span><span class="muted small">&lt;anonymous&gt;</span></div>`;
    dbgConsole.innerHTML='<div class="muted small">Debugger started — paused at breakpoint</div>';
    // highlight line
    const firstBP = (breakpoints[activePath]||[5])[0];
    if(monacoEditor){ monacoEditor.revealLineInCenter(firstBP); monacoEditor.setPosition({lineNumber:firstBP, column:1}); // add decoration for current line
      window._debugLineDecor = monacoEditor.deltaDecorations(window._debugLineDecor||[], [{range: new monaco.Range(firstBP,1,firstBP,1000), options:{isWholeLine:true, className:'debug-current-line', overviewRuler:{color:'#ffcc00', position:4}}}]);
    }
    showPanelView('debugcons');
    outputContent.textContent = outputLogs['Tasks'] + '\n[Debug] Started — breakpoint hit at '+activePath+':'+firstBP+'\n';
    debugLine=firstBP;
    // step simulation
    toast(`Debugging ${activePath} — paused at ${firstBP}. Use Continue/Step`);
    // watch evaluation already hooked
  }
  // Watch
  document.getElementById('addWatchBtn')?.addEventListener('click', ()=>{
    const expr=document.getElementById('watchInput').value.trim();
    if(!expr) return;
    const list=document.getElementById('watchList');
    let val;
    try{ const fn=new Function(`return (${expr})`); val=String(fn()); } catch(e){ val='Error: '+e.message; }
    const item=document.createElement('div'); item.className='scm-item'; item.innerHTML=`<span>${escapeHtml(expr)}</span><span class="muted small" style="margin-left:auto">${escapeHtml(val).slice(0,30)}</span><button class="icon-btn small" title="Remove">✕</button>`;
    item.querySelector('button').addEventListener('click', ()=>item.remove());
    list.appendChild(item);
    document.getElementById('watchInput').value='';
  });
  // extend createMonacoEditor to call setupDebugGutter
  const _origCreateMonaco = createMonacoEditor;
  // will patch after definition — hook inside original create via setTimeout
  setTimeout(()=>{ if(monacoEditor) setupDebugGutter(); }, 1500);
  // update decorations on file open
  const _origLoadIntoEditorForDebug = loadIntoEditor;
  const origLoad = loadIntoEditor;
  // wrap via setInterval check
  setInterval(()=>{ if(activePath) updateBreakpointDecorations(); }, 1000);
  setTimeout(renderBreakpoints, 800);

  // --- Terminal — Part 4b: shell with cwd ---
  // Need cwd state
  let cwd = ''; // '' = root
  function resolvePath(input, base=cwd){
    if(!input) return base;
    if(input.startsWith('/')) return input.slice(1);
    if(input==='.') return base;
    if(input==='..') return base.includes('/') ? base.slice(0, base.lastIndexOf('/')) : '';
    if(input.startsWith('../')) { // simple
      let b=base;
      while(input.startsWith('../')){ b=b.includes('/')?b.slice(0,b.lastIndexOf('/')):''; input=input.slice(3); }
      return b ? b+'/'+input : input;
    }
    // relative
    if(!base) return input;
    return base ? base + '/' + input : input;
  }
  function updateTermCwdUI(){
    const el=document.getElementById('termCwd');
    if(el) el.textContent = cwd ? '~/'+cwd : '~/ubiquitous-guacamole';
  }
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

  // --- C/C++/Python runner: compile & execute in-browser ---
  const compiledBinaries = {};
  function resolveVar(name, content){
    try{
      const re=new RegExp('\\b'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*=\\s*([^;\\n]+)\\s*;');
      const m=content.match(re);
      if(m){
        let v=m[1].trim().replace(/\/\/.*/, '').trim();
        if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
        return v;
      }
    }catch{}
    return name;
  }
  // store cin inputs per run so multiple cout<<n use same value
  function getCinValue(varName, content){
    window.__cinInputs = window.__cinInputs || {};
    if (window.__cinInputs[varName] !== undefined) return window.__cinInputs[varName];
    // try to find if variable has literal assignment first
    let hint = resolveVar(varName, content);
    if (hint !== varName) { window.__cinInputs[varName]=hint; return hint; }
    // prompt user for this stdin variable
    let def = varName==='n' ? '5' : varName==='a' ? '10' : varName==='b' ? '20' : '5';
    let v = prompt(`ankit.cpp wants input → enter value for '${varName}'  (cin >> ${varName}):`, def);
    if (v===null) v=def;
    window.__cinInputs[varName]=v;
    terminalLog(`⌨ stdin → ${varName} = ${v}`);
    return v;
  }
  function collectCinVars(content){
    const s=new Set();
    const re=/(?:std::)?cin\s*>>\s*([^;]+);/g;
    let m;
    while((m=re.exec(content))!==null){
      let expr=m[1];
      // split by >> and extract identifiers
      for(let part of expr.split('>>')){
        let v=part.trim().replace(/^&/,'').trim();
        // identifier is first word
        let id=(v.match(/[a-zA-Z_]\w*/) || [])[0];
        if(id) s.add(id);
      }
    }
    // also scanf for C-style mixed in cpp
    const re2=/scanf\s*\([^,]*,\s*([^)]+)\)/g;
    while((m=re2.exec(content))!==null){
      for(let p of m[1].split(',')){
        let id=p.trim().replace(/^&/,'').trim();
        let clean=(id.match(/[a-zA-Z_]\w*/) || [])[0];
        if(clean) s.add(clean);
      }
    }
    return s;
  }
  function simulateCppOutput(content){
    const out=[];
    const cinVars=collectCinVars(content);
    // reset per-run inputs to allow new prompts
    const coutRe=/(?:std::)?cout\s*<<(.*?);/gs;
    let m;
    while((m=coutRe.exec(content))!==null){
      let expr=m[1];
      let parts=expr.split('<<');
      let line='';
      for(let raw of parts){
        let p=raw.trim();
        if(!p) continue;
        if(p==='endl' || p==='std::endl' || p.includes('endl')){
          if(line) { out.push(line); line=''; } continue;
        }
        let strMatch=p.match(/^"(.*)"$/s);
        if(strMatch){
          let s=strMatch[1].replace(/\\n/g,'\n').replace(/\\t/g,'\t');
          if(s.includes('\n')){
            let segs=s.split('\n');
            line+=segs[0];
            if(line) out.push(line);
            for(let i=1;i<segs.length;i++){ if(segs[i] || i<segs.length-1) out.push(segs[i]); }
            line='';
          } else { line+=s; }
          continue;
        }
        let sqMatch=p.match(/^'(.*)'$/s);
        if(sqMatch){ line+=sqMatch[1]; continue; }
        if(!isNaN(p)){ line+=p; continue; }
        let clean=p.replace(/^std::/,'').replace(/\(int\)|\(float\)/g,'').trim();
        // strip anything after space/paren like (char)
        clean=clean.split(/[\s\(\)]/)[0].trim();
        let val;
        if(cinVars.has(clean)) val=getCinValue(clean, content);
        else val=resolveVar(clean, content);
        line+=val;
      }
      if(line) out.push(line);
    }
    const printfRe=/printf\s*\(\s*"([^"]*)"\s*(?:,\s*([^)]*))?\)/g;
    while((m=printfRe.exec(content))!==null){
      let fmt=m[1].replace(/\\n/g,'\n').replace(/%[dfscluoxX%]/g,'').trim();
      let args=m[2];
      if(args){
        let argParts=args.split(',').map(a=>a.trim()).filter(Boolean);
        for(let a of argParts){
          let v=resolveVar(a, content);
          if(v!==a) fmt+=' '+v;
          else if(!isNaN(a)) fmt+=' '+a;
          else if(a.startsWith('"')&&a.endsWith('"')) fmt+=' '+a.slice(1,-1);
          else fmt+=' '+a;
        }
      }
      if(fmt) fmt.split('\n').forEach(l=>{ out.push(l); });
    }
    if(out.length===0){
      if(content.includes('Hello')) out.push('Hello, World!');
      else if(!content.trim()) out.push('(empty file — no output)');
      else out.push('(program executed — no cout/printf output captured)');
    }
    return out;
  }
  function simulateCOutput(content){
    const out=[];
    const scanfVars=collectCinVars(content);
    window.__cinInputs=window.__cinInputs||{};
    const printfRe=/printf\s*\(\s*"([^"]*)"\s*(?:,\s*([^)]*))?\)/g;
    let m;
    while((m=printfRe.exec(content))!==null){
      let fmt=m[1].replace(/\\n/g,'\n');
      let args=m[2] ? m[2].split(',').map(a=>a.trim()) : [];
      let argIdx=0;
      fmt=fmt.replace(/%[dfscluoxX%]/g, ()=> {
        let a=args[argIdx++] || '';
        let clean=a.replace(/^&/,'').trim().split(/[\s\(\)]/)[0];
        if(scanfVars.has(clean)) return getCinValue(clean, content);
        let v=resolveVar(a, content);
        if(v!==a) return v;
        if(!isNaN(a)) return a;
        if(a.startsWith('"')&&a.endsWith('"')) return a.slice(1,-1);
        return a || '';
      });
      fmt.split('\n').forEach(l=>{ out.push(l); });
    }
    if(out.length===0){
      if(content.includes('Hello')) out.push('Hello, World!');
      else out.push('(program executed — no printf output)');
    }
    return out;
  }
  function simulatePythonOutput(content){
    const out=[];
    const re=/print\s*\(\s*["']([^"']*)["']\s*\)/g;
    let m;
    while((m=re.exec(content))!==null) out.push(m[1]);
    if(out.length===0) out.push('(python executed — no print output)');
    return out;
  }
  function findFileSmart(input){
    // try direct resolve, then search all files by exact path or basename
    let p = resolvePath(input);
    let n = findNode(p);
    if(n && n.type==='file') return {node:n, path:p};
    // strip ./ prefix
    if(input.startsWith('./')) { n=findNode(resolvePath(input.slice(2))); if(n) return {node:n, path:resolvePath(input.slice(2))}; }
    // search by basename anywhere
    let all=getAllFiles();
    let base=input.split('/').pop();
    let cand=all.find(f=> f.path===input || f.name===base || f.path.endsWith('/'+base) || f.path===base);
    if(cand) return {node:cand, path:cand.path};
    // case insensitive
    cand=all.find(f=> f.name.toLowerCase()===base.toLowerCase());
    if(cand) return {node:cand, path:cand.path};
    return {node:null, path:p};
  }
  function doCompile(args, compiler){
    let src=null, out='a.out', hasO=false;
    for(let i=0;i<args.length;i++){
      let a=args[i];
      if(a==='-o' && args[i+1]){ out=args[i+1]; hasO=true; i++; continue; }
      if(a.endsWith('.cpp')||a.endsWith('.c')||a.endsWith('.cc')||a.endsWith('.cxx')||a.endsWith('.C')){
        src=a;
      }
    }
    if(!src){
      // allow `g++ ankit.cpp` where ankit.cpp might be without extension typo? try first arg as file
      if(args[0] && !args[0].startsWith('-')) src=args[0];
    }
    if(!src){ terminalLog(`${compiler}: fatal error: no input files — try: ${compiler} ankit.cpp -o ankit`); return; }
    let found=findFileSmart(src);
    let node=found.node, srcPath=found.path;
    if(!node || node.type!=='file'){
      terminalLog(`${compiler}: ${src}: No such file or directory (cwd: ${cwd||'/'} → tried ${resolvePath(src)})`);
      let avail=getAllFiles().filter(f=>f.name.endsWith('.cpp')||f.name.endsWith('.c')).map(f=>f.path).join(', ');
      terminalLog(avail ? `hint: .cpp/.c files: ${avail}` : 'hint: create a file first — Explorer → New File → ankit.cpp');
      if(allFilesHint()) terminalLog('tip: use ls to see files, ls src to see src folder');
      return;
    }
    terminalLog(`[${compiler}] compiling ${srcPath} → ${out} ...`);
    if(!node.content.includes('main')) terminalLog(`warning: no 'main' in ${srcPath} — compiled anyway`);
    // allow .cpp compiled with gcc and vice versa — still simulate
    compiledBinaries[out]=srcPath;
    compiledBinaries['./'+out]=srcPath;
    let base=out.split('/').pop();
    compiledBinaries[base]=srcPath;
    if(out==='a.out') compiledBinaries['a.out']=srcPath;
    terminalLog(`✔ built ${out} from ${srcPath}`);
    // auto-run so single command shows output (user expectation) — reset cin cache per run
    window.__cinInputs={};
    terminalLog(`▶ running ${out} ...`);
    try{
      let outputs=[];
      if(srcPath.endsWith('.cpp')||srcPath.endsWith('.cc')||srcPath.endsWith('.cxx')) outputs=simulateCppOutput(node.content);
      else if(srcPath.endsWith('.c')) outputs=simulateCOutput(node.content);
      else if(srcPath.endsWith('.py')) outputs=simulatePythonOutput(node.content);
      outputs.forEach(l=>terminalLog(l));
      terminalLog(`[exit 0] — also run later with ./${out}`);
    }catch(e){ terminalLog('runtime error: '+e.message); }
  }
  function allFilesHint(){
    try{ return getAllFiles().length>0; }catch{return false;}
  }
  function doRunBinary(raw){
    let parts=raw.trim().split(/\s+/);
    let bin=parts[0];
    let binName=bin.slice(2);
    let srcPath=compiledBinaries[binName] || compiledBinaries[bin] || compiledBinaries[binName.split('/').pop()];
    if(!srcPath){
      let tryPath=resolvePath(binName);
      let node=findNode(tryPath);
      if(node && (tryPath.endsWith('.cpp')||tryPath.endsWith('.c')||tryPath.endsWith('.cc')||tryPath.endsWith('.py')||tryPath.endsWith('.js'))){
        srcPath=tryPath;
        terminalLog(`(running ${binName} directly — for C/C++ prefer: g++ ${binName} -o ${binName.split('.')[0]} && ./${binName.split('.')[0]})`);
      } else {
        terminalLog(`bash: ${bin}: No such file — compile first: g++ main.cpp -o main  (or gcc main.c -o main)`);
        let avail=Object.keys(compiledBinaries).filter(k=>!k.startsWith('./')).join(', ');
        if(avail) terminalLog(`available binaries: ${avail}`);
        return;
      }
    }
    let node=findNode(srcPath);
    if(!node){ terminalLog(`error: source ${srcPath} missing`); return; }
    let outputs=[];
    if(srcPath.endsWith('.cpp')||srcPath.endsWith('.cc')||srcPath.endsWith('.cxx')) outputs=simulateCppOutput(node.content);
    else if(srcPath.endsWith('.c')) outputs=simulateCOutput(node.content);
    else if(srcPath.endsWith('.py')) outputs=simulatePythonOutput(node.content);
    else if(srcPath.endsWith('.js')) {
      let logs=[...node.content.matchAll(/console\.log\(([^)]+)\)/g)].map(m=>m[1]);
      outputs=logs.length? logs : ['(no console.log)'];
    } else outputs=[node.content.slice(0,500)];
    terminalLog(`▶ ${bin} (${srcPath})`);
    outputs.forEach(l=>terminalLog(l));
  }

  const commands = {
    help: () => terminalLog(`Available commands:
  help            Show this help
  ls [-l] [-R] [path] List files (supports cwd, -R recursive)
  cd <dir>        Change directory (.. /)
  cat <file>      Show file content (respects cwd)
  pwd             Show current directory (with cwd)
  echo <text>     Echo text
  date            Show date
  whoami          Show user
  clear           Clear terminal
  npm <args>      Simulate npm (install / run dev)
  node <file>     Run JS file — shows console.log lines
  g++ <file> [-o out]  Compile C++ → run with ./out
  gcc <file> [-o out]  Compile C → run with ./out
  ./<binary>      Run compiled C/C++ binary (e.g. ./a.out)
  python[3] <file> Run Python file (print simulation)
  git status/log  Simulated git (see SCM panel)
  code/open <file> Open file (supports cwd relative)
  mkdir <name>    Create folder
  touch <name>    Create file
  rm <file>       Delete file
  grep <pat> <file> Search pattern in file
  find <name>     Find files by name
  preview <html>  Live preview HTML
  theme           Toggle theme
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
    code: (args) => { if (args[0]) { const p=resolvePath(args[0]); openFile(p); } else terminalLog('code: missing file operand'); },
    open: (args) => { if (args[0]) { const p=resolvePath(args[0]); openFile(p); } else terminalLog('open: missing file'); },
    mkdir: (args) => {
      if (!args[0]) { terminalLog('mkdir: missing operand'); return; }
      const name = resolvePath(args[0]);
      if (findNode(name)) { terminalLog(`mkdir: cannot create directory ‘${name}’: File exists`); return; }
      const { parent, name: base } = findParent(name);
      const p = parent || fsRoot;
      if (!p) { terminalLog('mkdir: invalid path'); return; }
      p.children.push({ name: base, type: 'folder', path: name, children: [] });
      expanded.add(name);
      saveFS(); renderTree(); terminalLog(`created directory ${name}`); renderSCM();
    },
    touch: (args) => {
      if (!args[0]) { terminalLog('touch: missing file operand'); return; }
      const name = resolvePath(args[0]);
      if (findNode(name)) { terminalLog(`touch: ${name} already exists`); return; }
      const { parent, name: base } = findParent(name);
      const p = parent || fsRoot;
      p.children.push({ name: base, type: 'file', path: name, content: '' });
      saveFS(); renderTree(); terminalLog(`created file ${name}`); renderSCM();
    },
    rm: (args) => {
      if (!args[0]) { terminalLog('rm: missing operand'); return; }
      const name = resolvePath(args[0]);
      const node = findNode(name);
      if (!node) { terminalLog(`rm: cannot remove '${args[0]}': No such file`); return; }
      deletePath(name);
      terminalLog(`removed ${name}`);
    },
    preview: (args) => {
      const path = args[0] ? resolvePath(args[0]) : 'src/index.html';
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
    },
    cd: (args) => {
      if (!args[0]) { cwd=''; updateTermCwdUI(); terminalLog('/'); return; }
      let target=resolvePath(args[0]);
      if(args[0]==='..') target = cwd.includes('/') ? cwd.slice(0, cwd.lastIndexOf('/')) : '';
      else if(args[0]==='/') target='';
      const node=findNode(target);
      if(!node) { terminalLog(`cd: ${args[0]}: No such file or directory`); return; }
      if(node.type!=='folder'){ terminalLog(`cd: ${args[0]}: Not a directory`); return; }
      cwd=target; updateTermCwdUI(); terminalLog('');
    },
    ls: (args) => {
      // override earlier ls to support cwd and -R, -la
      let path=cwd;
      let flags=[];
      for(const a of args){ if(a.startsWith('-')) flags.push(a); else path=resolvePath(a); }
      const node= path ? findNode(path) : findNode(cwd) || fsRoot;
      if(!node){ terminalLog(`ls: cannot access '${path}': No such file`); return; }
      if(node.type==='file'){ terminalLog(node.name); return; }
      const entries=node.children||[];
      if(!entries.length){ terminalLog('(empty)'); return; }
      for(const e of entries){
        let line=`${e.type==='folder'?'d':'-'} ${e.name}${e.type==='folder'?'/':''}`;
        if(flags.includes('-l')||flags.includes('-la')) line=`${e.type==='folder'?'drwxr-xr-x':'-rw-r--r--'} 1 user user  ${e.type==='file'? e.content.length : 4096} Oct 19  ${e.name}`;
        terminalLog(line);
      }
      if(flags.includes('-R')){
        for(const e of entries.filter(x=>x.type==='folder')){
          terminalLog(`\n${e.path}:`);
          const sub=findNode(e.path);
          if(sub?.children) for(const ch of sub.children) terminalLog(`${ch.type==='folder'?'d':'-'} ${ch.name}`);
        }
      }
    },
    grep: (args) => {
      if(args.length<2){ terminalLog('grep: usage: grep <pattern> <file>'); return; }
      const pat=args[0], file=resolvePath(args[1]);
      const node=findNode(file);
      if(!node||node.type!=='file'){ terminalLog(`grep: ${file}: No such file`); return; }
      let rx; try{ rx=new RegExp(pat, 'i'); } catch{ rx=new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'); }
      const lines=node.content.split('\n');
      let found=false;
      lines.forEach((l,i)=>{ if(rx.test(l)){ terminalLog(`${file}:${i+1}:${l.trim()}`); found=true; }});
      if(!found) terminalLog(`(no matches for "${pat}" in ${file})`);
    },
    find: (args) => {
      const name=args[0]?.replace('*.','') || '';
      const files=getAllFiles().filter(f=>!name || f.name.includes(name) || f.path.includes(name));
      if(!files.length) terminalLog('(no files found)'); else files.forEach(f=>terminalLog(f.path));
    },
    cat: (args) => {
      if (!args[0]) { terminalLog('cat: missing operand'); return; }
      const p=resolvePath(args[0]);
      const node = findNode(p);
      if (!node) { terminalLog(`cat: ${p}: No such file`); return; }
      if (node.type === 'folder') { terminalLog(`cat: ${p}: Is a directory`); return; }
      terminalLog(node.content);
    },
    pwd: () => { terminalLog('/home/user/ubiquitous-guacamole' + (cwd? '/'+cwd : '')); },
    "g++": (args)=>doCompile(args,'g++'),
    gcc: (args)=>doCompile(args,'gcc'),
    "clang++": (args)=>doCompile(args,'clang++'),
    clang: (args)=>doCompile(args,'clang'),
    cc: (args)=>doCompile(args,'cc'),
    "c++": (args)=>doCompile(args,'c++'),
    python: (args)=>{
      if(!args[0]){ terminalLog('Python 3.11.0 — type "python <file>" to run'); return; }
      let p=resolvePath(args[0]); let n=findNode(p);
      if(!n){ terminalLog(`python: can't open file '${args[0]}'`); return; }
      terminalLog(`▶ python ${args[0]}`); simulatePythonOutput(n.content).forEach(l=>terminalLog(l));
    },
    python3: (args)=>{
      if(!args[0]){ terminalLog('Python 3.11.0'); return; }
      let p=resolvePath(args[0]); let n=findNode(p);
      if(!n){ terminalLog(`python3: can't open file '${args[0]}'`); return; }
      terminalLog(`▶ python3 ${args[0]}`); simulatePythonOutput(n.content).forEach(l=>terminalLog(l));
    },
    "./a.out": (args)=>doRunBinary("./a.out "+args.join(' ')),
  };

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const raw = terminalInput.value.trim();
      if (!raw) return;
      terminalLog(`➜ ${raw}`, 'input');
      // support chaining with && and ./ binary execution
      const chains = raw.split('&&').map(s=>s.trim()).filter(Boolean);
      for(let chain of chains){
        if(chain.startsWith('./') || chain.startsWith('./')){
          doRunBinary(chain);
          continue;
        }
        // handle make/make run alias
        if(chain.startsWith('make ')) { terminalLog(`[make] ${chain}`); let t=chain.slice(5).trim(); if(t.startsWith('./')) doRunBinary(t); else terminalLog('make: Nothing to be done for `'+t+'` — try g++'); continue; }
        const [cmd, ...args] = chain.split(/\s+/);
        // ./xxx with no space after?
        if(cmd.startsWith('./')){ doRunBinary(chain); continue; }
        const fn = commands[cmd];
        if (fn) fn(args);
        else if (chain) terminalLog(`bash: command not found: ${cmd} — type 'help'`);
      }
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

  // --- Resizers — Subpart 1.8: persistent ---
  function makeResizer(handle, target, dir, lsKey) {
    // restore size
    if (lsKey) {
      const saved = localStorage.getItem(lsKey);
      if (saved) {
        if (dir==='vertical') target.style.width = saved;
        else target.style.height = saved;
      }
    }
    let start = 0, startSize = 0;
    handle.addEventListener('mousedown', (e) => {
      start = dir === 'horizontal' ? e.clientY : e.clientX;
      startSize = dir === 'horizontal' ? target.offsetHeight : target.offsetWidth;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = dir === 'horizontal' ? 'row-resize' : 'col-resize';
      const onMove = (ev) => {
        const cur = dir === 'horizontal' ? ev.clientY : ev.clientX;
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
        if (lsKey) {
          if (dir==='vertical') localStorage.setItem(lsKey, target.style.width);
          else localStorage.setItem(lsKey, target.style.height);
        }
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    // keyboard resize via arrow keys when handle focused
    handle.addEventListener('keydown', (e)=>{
      const step = e.shiftKey ? 20 : 5;
      if (dir==='vertical') {
        if (e.key==='ArrowLeft') { e.preventDefault(); target.style.width = Math.max(170, target.offsetWidth - step) + 'px'; if(lsKey) localStorage.setItem(lsKey, target.style.width); }
        if (e.key==='ArrowRight') { e.preventDefault(); target.style.width = Math.min(600, target.offsetWidth + step) + 'px'; if(lsKey) localStorage.setItem(lsKey, target.style.width); }
      }
    });
  }
  makeResizer(document.querySelector('[data-resize="sidebar"]'), sidebar, 'vertical', 'vscode-sidebar-width');
  makeResizer(document.querySelector('[data-resize="panel"]'), panel, 'horizontal', 'vscode-panel-height');
  makeResizer(document.querySelector('[data-resize="aux"]'), auxiliaryBar, 'vertical', 'vscode-aux-width');

  // --- Welcome actions — Subpart 1.8 + Problems integration ---
  document.querySelectorAll('[data-cmd="newFile"]').forEach(b=>b.addEventListener('click', () => createNew('file','')));
  document.querySelectorAll('[data-cmd="openFolder"]').forEach(b=>b.addEventListener('click', () => toast('Folder picker — in a real app this would show system dialog. Use Explorer to create files.')));
  document.querySelectorAll('[data-open]').forEach(a=>a.addEventListener('click', (e)=>{ e.preventDefault(); openFile(a.dataset.open); }));
  document.querySelectorAll('[data-cmd="split"]').forEach(b=>b.addEventListener('click', ()=>{ // split editor — real implementation in Part 2, now functional
    const groups = document.querySelectorAll('.editor-group');
    const second = document.querySelector('[data-group="1"]');
    if (second.classList.contains('hidden')) { second.classList.remove('hidden'); if(monacoEditor && !window.monaco2) { // init second editor
      if (isMonacoReady) { window.monaco2 = monaco.editor.create(document.getElementById('monacoContainer2'), { value: '// Split group — open another file here', language:'javascript', theme: getEditorSettings().theme==='light'?'vs':'vs-dark', automaticLayout:true, fontSize: getEditorSettings().fontSize, minimap:{enabled:getEditorSettings().minimap}, wordWrap:getEditorSettings().wordWrap, tabSize:getEditorSettings().tabSize }); }
    } toast('Split Right — second group visible'); } else { second.classList.add('hidden'); toast('Split closed'); }
  }));
  document.querySelectorAll('[data-cmd="splitDown"]').forEach(b=>b.addEventListener('click', ()=>toast('Split Down — use Split Right for now')));
  document.querySelectorAll('[data-cmd="closePreview"]').forEach(b=>b.addEventListener('click', ()=>{ previewPane.classList.add('hidden'); if(activePath) showEditor(); }));
  document.querySelectorAll('[data-cmd="newFolder"]').forEach(b=>b.addEventListener('click', ()=>createNew('folder','')));
  document.querySelectorAll('[data-cmd="newTerminal"]').forEach(b=>b.addEventListener('click', ()=>{ terminalLog('New terminal created'); terminalInput.focus(); pushNotification('Terminal','New terminal instance'); }));
  // Welcome checkbox persistence
  const welcomeCheck = document.getElementById('showWelcomeCheck');
  if (welcomeCheck) {
    welcomeCheck.checked = localStorage.getItem('vscode-welcome')!=='off';
    welcomeCheck.addEventListener('change', ()=>localStorage.setItem('vscode-welcome', welcomeCheck.checked?'on':'off'));
    if (localStorage.getItem('vscode-welcome')==='off') {
      const last = recent[0];
      if (last) setTimeout(()=>openFile(last), 300);
    }
  }
  document.getElementById('checkUpdates')?.addEventListener('click', (e)=>{ e.preventDefault(); toast('Checking for updates...'); setTimeout(()=>toast('You are up to date — v1.104.0'), 800); pushNotification('Update','VS Code Web is up to date'); });
  document.querySelectorAll('[data-cmd="showPalette"]').forEach(b=>b.addEventListener('click', ()=>openPalette('>')));
  document.querySelector('[data-cmd="toggleDebug"]')?.addEventListener('click', (e)=>{ e.preventDefault(); switchView('debug'); });

  // --- Problems — Subpart 2.3: live diagnostics ---
  function analyzeProblems(){
    const probs=[];
    for(const f of getAllFiles()){
      const lines=f.content.split('\n');
      lines.forEach((line,i)=>{
        if (/TODO:/.test(line)) probs.push({path:f.path, line:i+1, col: line.indexOf('TODO:')+1, msg:'TODO should be resolved', sev:'info', code:'TODO'});
        if (/FIXME/.test(line)) probs.push({path:f.path, line:i+1, col: line.indexOf('FIXME')+1, msg:'FIXME: fix before commit', sev:'warning', code:'FIXME'});
        if (/console\.log\(/.test(line) && f.path.endsWith('.js')) probs.push({path:f.path, line:i+1, col: line.indexOf('console.log')+1, msg:'Unexpected console.log — remove before production', sev:'warning', code:'no-console'});
      });
      // bracket imbalance simple
      const open = (f.content.match(/{/g)||[]).length, close=(f.content.match(/}/g)||[]).length;
      if (open!==close) probs.push({path:f.path, line:1, col:1, msg:`Mismatched braces: ${open} { vs ${close} }`, sev:'error', code:'brace'});
      if (f.content.includes('undefined') && f.path.endsWith('.js')) probs.push({path:f.path, line: f.content.split('\n').findIndex(l=>l.includes('undefined'))+1, col:1, msg:"'undefined' used — consider null check", sev:'warning', code:'undef'});
    }
    // ensure at least demo errors if none
    if (probs.length<2) {
      probs.push({path:'src/app.js', line:7, col:12, msg:"'Editor' is defined but never used", sev:'warning', code:'unused'}, {path:'src/styles.css', line:12, col:3, msg:'Unknown property --accent typo? expected --accent', sev:'error', code:'css'});
    }
    return probs;
  }
  function renderProblems(){
    const list=document.getElementById('problemsList');
    const countEl=document.getElementById('problemsCount');
    const errEl=document.getElementById('statusErrorCount');
    const warnEl=document.getElementById('statusWarnCount');
    if(!list) return;
    const probs=analyzeProblems();
    const errs=probs.filter(p=>p.sev==='error').length;
    const warns=probs.filter(p=>p.sev==='warning').length;
    if(countEl) countEl.textContent=probs.length;
    if(errEl) errEl.textContent=errs;
    if(warnEl) warnEl.textContent=warns;
    if(probs.length===0){ list.innerHTML='<div class="muted small" style="padding:12px">No problems have been detected in the workspace.</div>'; return; }
    list.innerHTML = probs.map(p=>`<div class="problem-item" data-path="${p.path}" data-line="${p.line}"><span class="problem-sev ${p.sev}"></span><span style="flex:1"><strong>${p.msg}</strong><br><span class="problem-path">${p.path} [${p.line}:${p.col}] • ${p.code}</span></span><span class="muted small">${p.sev}</span></div>`).join('');
    list.querySelectorAll('.problem-item').forEach(el=>el.addEventListener('click', ()=>{
      openFile(el.dataset.path);
      setTimeout(()=>{ if(monacoEditor) { monacoEditor.revealLineInCenter(parseInt(el.dataset.line)); monacoEditor.setPosition({lineNumber: parseInt(el.dataset.line), column: el.dataset.col?parseInt(el.dataset.col):1}); monacoEditor.focus(); }}, 120);
    }));
    // also add Monaco markers if available
    if (monacoInstance && monacoEditor) {
      const model=monacoEditor.getModel();
      if(model){
        const markers = probs.filter(p=>p.path===activePath).map(p=>({startLineNumber:p.line, startColumn:p.col, endLineNumber:p.line, endColumn:p.col+10, message:p.msg, severity: p.sev==='error'? monaco.MarkerSeverity.Error : p.sev==='warning'? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Info}));
        monaco.editor.setModelMarkers(model, 'vscode-clone', markers);
      }
    }
  }
  // auto-refresh problems on file change/save/open
  let problemsDebounce=null;
  function scheduleProblems(){ clearTimeout(problemsDebounce); problemsDebounce=setTimeout(renderProblems, 500); }
  // hook into save/open/monaco change
  const _origOpenFileForProblems = openFile;
  // wrap happens via later — we call after each relevant op
  document.getElementById('problemsFilterBtn')?.addEventListener('click', ()=>showPicker('Filter Problems', [{label:'All'},{label:'Errors only'},{label:'Warnings only'}], it=>toast('Filter: '+it.label)));
  document.getElementById('problemsClearBtn')?.addEventListener('click', ()=>toast('Problems are derived from files — edit to clear'));
  // Global keyboard: Ctrl+N/O/G, Esc handling for modals, zen exit
  document.addEventListener('keydown', (e)=>{
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase()==='n' && !e.shiftKey) { e.preventDefault(); createNew('file',''); }
    else if (mod && e.key.toLowerCase()==='o') { e.preventDefault(); openPalette(''); }
    else if (mod && e.key.toLowerCase()==='g' && !e.shiftKey) { e.preventDefault(); openGotoLine(); }
    else if (e.key==='Escape') {
      if (!document.getElementById('findWidget').classList.contains('hidden')) { document.getElementById('findWidget').classList.add('hidden'); }
      else if (!document.getElementById('settingsOverlay').classList.contains('hidden')) { document.getElementById('settingsOverlay').classList.add('hidden'); }
      else if (!document.getElementById('pickerOverlay').classList.contains('hidden')) { document.getElementById('pickerOverlay').classList.add('hidden'); }
      else if (document.body.classList.contains('zen-mode')) { document.body.classList.remove('zen-mode'); toast('Exited Zen Mode'); }
    }
  });
  // initial problems render
  setTimeout(renderProblems, 600);
  document.querySelectorAll('[data-cmd="refresh"]').forEach(b=>b.addEventListener('click', ()=>{ renderTree(); toast('Explorer refreshed'); }));
  document.querySelectorAll('[data-cmd="commit"]').forEach(b=>b.addEventListener('click', ()=>toast('Committed to main — 2 files changed (demo)')));

  // --- Status Bar & Settings — Subpart 1.7 (full pickers) ---
  function showPicker(title, items, onSelect) {
    const overlay = document.getElementById('pickerOverlay');
    const picker = document.getElementById('picker');
    picker.innerHTML = `<div style="padding:8px 14px; font-weight:600; border-bottom:1px solid var(--border-subtle); font-size:12px">${title}</div>` + items.map((it,i)=>`<div class="picker-item ${i===0?'is-active':''}" data-idx="${i}"><span>${it.label}</span><small>${it.desc||''}</small></div>`).join('');
    overlay.classList.remove('hidden');
    picker._items = items; picker._onSelect = onSelect; picker._active=0;
    picker.querySelectorAll('.picker-item').forEach(el=>{
      el.addEventListener('click', ()=>{ onSelect(items[parseInt(el.dataset.idx)]); overlay.classList.add('hidden'); });
      el.addEventListener('mouseenter', ()=>{ picker.querySelectorAll('.picker-item').forEach(x=>x.classList.remove('is-active')); el.classList.add('is-active'); picker._active=parseInt(el.dataset.idx); });
    });
    overlay.onclick = (e)=>{ if(e.target===overlay) overlay.classList.add('hidden'); };
    const keyHandler = (e)=>{
      if (e.key==='Escape') { overlay.classList.add('hidden'); document.removeEventListener('keydown', keyHandler); }
      else if (e.key==='ArrowDown') { e.preventDefault(); let a=picker._active; picker.querySelectorAll('.picker-item')[a]?.classList.remove('is-active'); a=Math.min(a+1, items.length-1); picker.querySelectorAll('.picker-item')[a].classList.add('is-active'); picker._active=a; }
      else if (e.key==='ArrowUp') { e.preventDefault(); let a=picker._active; picker.querySelectorAll('.picker-item')[a]?.classList.remove('is-active'); a=Math.max(a-1,0); picker.querySelectorAll('.picker-item')[a].classList.add('is-active'); picker._active=a; }
      else if (e.key==='Enter') { e.preventDefault(); const it=items[picker._active]; if(it){ onSelect(it); overlay.classList.add('hidden'); document.removeEventListener('keydown', keyHandler); } }
    };
    document.addEventListener('keydown', keyHandler);
  }
  // Language picker
  document.getElementById('statusLanguage')?.addEventListener('click', ()=>{
    const langs = ['javascript','typescript','html','css','json','markdown','plaintext','python','yaml','shell'].map(l=>({label:l.charAt(0).toUpperCase()+l.slice(1), desc:l, id:l}));
    showPicker('Select Language Mode', langs, (it)=>{
      if (!activePath) { toast('Open a file first'); return; }
      const node=findNode(activePath);
      // change model language
      if (monacoEditor && monacoInstance) { const model=monacoEditor.getModel(); monaco.editor.setModelLanguage(model, it.id); }
      document.getElementById('statusLanguage').textContent = it.label;
      toast(`Language: ${it.label}`);
    });
  });
  // Encoding picker
  document.getElementById('statusEncoding')?.addEventListener('click', ()=>{
    showPicker('Select Encoding', [{label:'UTF-8', desc:'(default)'},{label:'UTF-16 LE'},{label:'UTF-16 BE'},{label:'Windows 1252'}].map(x=>({label:x.label, desc:x.desc||''})), it=>toast(`Encoding: ${it.label} (demo — files stay UTF-8)`));
  });
  // EOL picker
  document.getElementById('statusEolStatus')?.addEventListener('click', ()=>{
    showPicker('Select End of Line Sequence', [{label:'LF', desc:'\\n (Unix)'},{label:'CRLF', desc:'\\r\\n (Windows)'}], it=>{ document.getElementById('statusEolStatus').textContent=it.label; toast(`EOL: ${it.label}`); });
  });
  // Indent picker
  document.getElementById('statusIndent')?.addEventListener('click', ()=>{
    showPicker('Select Indentation', [{label:'Spaces: 2', id:2},{label:'Spaces: 4', id:4},{label:'Tabs', id:'tab'}], it=>{
      document.getElementById('statusIndent').textContent=it.label;
      if(monacoEditor) monacoEditor.updateOptions({tabSize: typeof it.id==='number'?it.id:4, insertSpaces: it.id!=='tab'});
      localStorage.setItem('vscode-tabSize', String(it.id==='tab'?4:it.id));
      toast(`Indentation: ${it.label}`);
    });
  });
  // Position — goto line
  document.getElementById('statusPosition')?.addEventListener('click', ()=>openGotoLine());
  // Branch picker
  document.getElementById('statusBranch')?.addEventListener('click', ()=>{
    showPicker('Select Branch', [{label:'main', desc:'current'},{label:'arena/ee95291c-ubiquitous-guacamole', desc:'this PR'},{label:'Create new branch...'}], it=>{
      if(it.label.startsWith('Create')) { const n=prompt('Branch name:'); if(n) toast(`Created branch ${n}`); } else toast(`Switched to ${it.label} (demo)`);
      document.getElementById('statusBranch').innerHTML=it.label.split('/').pop()+' <span class="status-badge">⇅ 1</span>';
    });
  });
  // Remote picker
  document.getElementById('statusRemote')?.addEventListener('click', ()=>{
    showPicker('Remote', [{label:'WSL: Ubuntu', desc:'Connected'},{label:'SSH: dev-server', desc:'Not connected'},{label:'Close Remote Connection'}], it=>toast(it.label));
  });
  // Problems picker
  document.getElementById('statusProblems')?.addEventListener('click', ()=>{
    switchView('search'); // actually problems is in panel, but we show problems panel
    const panel = document.getElementById('panel'); panel.classList.remove('hidden');
    document.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('is-active'));
    document.querySelector('[data-panel="problems"]')?.classList.add('is-active');
    document.querySelectorAll('.panel-view').forEach(v=>v.classList.remove('is-active'));
    document.querySelector('[data-panel-view="problems"]')?.classList.add('is-active');
    toast('Problems — 2 errors, 5 warnings');
  });
  // Zoom
  document.getElementById('statusZoom')?.addEventListener('click', ()=>{
    showPicker('Zoom', [{label:'Zoom: 80%', z:80},{label:'Zoom: 90%', z:90},{label:'Zoom: 100%', z:100},{label:'Zoom: 120%', z:120},{label:'Zoom: 150%', z:150}], it=>{
      document.body.style.zoom=it.z+'%';
      document.getElementById('statusZoom').textContent=`Zoom: ${it.z}%`;
      toast(`Zoom ${it.z}%`);
    });
  });
  // Notifications bell
  document.getElementById('statusNotifications')?.addEventListener('click', ()=>{
    document.getElementById('notificationsPanel').classList.toggle('hidden');
  });
  document.getElementById('statusFeedback')?.addEventListener('click', ()=>{
    showPicker('Feedback', [{label:'Tweet Feedback 💬', desc:'Share on X'},{label:'Report Issue 🐛'},{label:'Show Release Notes 📝'}], it=>{ toast(it.label+' — thank you!'); window.open('https://github.com/aaaaaaaaaaaaaq746-collab/ubiquitous-guacamole','_blank'); });
  });
  document.getElementById('statusSync')?.addEventListener('click', ()=>{
    const el=document.getElementById('statusSync');
    el.textContent='⟳ Syncing…';
    setTimeout(()=>{ el.textContent='↻'; toast('Settings Sync — up to date (demo)'); pushNotification('Sync','Settings synced'); },800);
  });
  // Selection status updates on cursor/selection change (already updated for Ln/Col, add selection)
  function updateSelectionStatus(){
    const selEl=document.getElementById('statusSelection');
    if(!selEl || !monacoEditor) return;
    if(!activePath){ selEl.textContent='No Selection'; return; }
    const sel=monacoEditor.getSelection();
    const model=monacoEditor.getModel();
    if(!sel || sel.isEmpty()) selEl.textContent='No Selection';
    else {
      // get selected text length
      const text=model.getValueInRange(sel);
      const lines=sel.endLineNumber - sel.startLineNumber + 1;
      selEl.textContent = `(${lines} line${lines>1?'s':''} selected, ${text.length} col) Col`;
      selEl.title = `${text.length} characters selected`;
    }
  }
  // hook selection update
  setTimeout(()=>{
    if(monacoEditor){
      monacoEditor.onDidChangeCursorSelection(()=>{ updateEditorPosition(); updateSelectionStatus(); });
    }
  }, 1200);
  document.getElementById('statusSelection')?.addEventListener('click', ()=>toast('Selection — drag in editor or Shift+click'));
  // Ctrl+= zoom already; add notification badge auto-update hook
  const _origPushNotif = pushNotification;
  // ensure badge hides when 0
  const notifBadge=document.getElementById('notifBadge');
  if(notifBadge){
    const obs=new MutationObserver(()=>{ const n=document.querySelectorAll('#notificationsList .notification'); if(n.length===0) notifBadge.classList.add('hidden'); });
    obs.observe(document.getElementById('notificationsList'), {childList:true});
  }
  // Settings modal
  function openSettings(){ document.getElementById('settingsOverlay').classList.remove('hidden'); syncSettingsUI(); }
  function closeSettings(){ document.getElementById('settingsOverlay').classList.add('hidden'); }
  function syncSettingsUI(){
    const s=getEditorSettings();
    document.getElementById('settingTheme').value = s.theme;
    document.getElementById('settingFontSize').value = s.fontSize;
    document.getElementById('settingTabSize').value = s.tabSize;
    document.getElementById('settingWordWrap').checked = s.wordWrap==='on';
    document.getElementById('settingMinimap').checked = s.minimap;
    document.getElementById('settingAutoSave').checked = localStorage.getItem('vscode-autoSave')==='on';
    document.getElementById('settingWelcome').checked = localStorage.getItem('vscode-welcome')!=='off';
  }
  document.querySelectorAll('[data-cmd="openSettings"]').forEach(b=>b.addEventListener('click', openSettings));
  document.querySelectorAll('[data-close="settings"]').forEach(b=>b.addEventListener('click', closeSettings));
  document.getElementById('settingsOverlay')?.addEventListener('click', (e)=>{ if(e.target===e.currentTarget) closeSettings(); });
  // Settings live apply
  ['settingTheme','settingFontSize','settingTabSize','settingWordWrap','settingMinimap'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change', (e)=>{
      const v=e.target.value;
      const chk=e.target.checked;
      if(id==='settingTheme'){ localStorage.setItem('vscode-theme', v); document.documentElement.setAttribute('data-theme', v==='light'?'light':'dark'); if(monacoInstance) monaco.editor.setTheme(v==='light'?'vs':'vs-dark'); toast(`Theme: ${v}`); }
      else if(id==='settingFontSize'){ localStorage.setItem('vscode-fontSize', v); if(monacoEditor) monacoEditor.updateOptions({fontSize:parseInt(v)}); }
      else if(id==='settingTabSize'){ localStorage.setItem('vscode-tabSize', v); if(monacoEditor) monacoEditor.updateOptions({tabSize:parseInt(v)}); document.getElementById('statusIndent').textContent=`Spaces: ${v}`; }
      else if(id==='settingWordWrap'){ localStorage.setItem('vscode-wordwrap', chk?'on':'off'); if(monacoEditor) monacoEditor.updateOptions({wordWrap: chk?'on':'off'}); }
      else if(id==='settingMinimap'){ localStorage.setItem('vscode-minimap', chk?'on':'off'); if(monacoEditor) monacoEditor.updateOptions({minimap:{enabled:chk}}); }
    });
  });
  document.getElementById('settingAutoSave')?.addEventListener('change', e=>{ localStorage.setItem('vscode-autoSave', e.target.checked?'on':'off'); toast('Auto Save '+(e.target.checked?'On':'Off')); });
  document.getElementById('settingWelcome')?.addEventListener('change', e=>{ localStorage.setItem('vscode-welcome', e.target.checked?'on':'off'); });
  document.getElementById('resetSettingsBtn')?.addEventListener('click', ()=>{ localStorage.removeItem('vscode-fontSize'); localStorage.removeItem('vscode-tabSize'); localStorage.removeItem('vscode-wordwrap'); localStorage.removeItem('vscode-minimap'); localStorage.removeItem('vscode-theme'); location.reload(); });
  document.querySelectorAll('.settings-nav').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('.settings-nav').forEach(x=>x.classList.remove('is-active')); b.classList.add('is-active'); toast(`Settings: ${b.textContent}`);
  }));
  // Close notifications
  document.getElementById('closeNotificationsBtn')?.addEventListener('click', ()=>document.getElementById('notificationsPanel').classList.add('hidden'));
  document.getElementById('clearNotificationsBtn')?.addEventListener('click', ()=>{ document.getElementById('notificationsList').innerHTML='<div class="muted small" style="padding:12px">No notifications</div>'; document.getElementById('notifBadge').classList.add('hidden'); });
  // Ctrl+, to open settings
  document.addEventListener('keydown', (e)=>{ if((e.ctrlKey||e.metaKey) && e.key===','){ e.preventDefault(); openSettings(); } });

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
    // also push to notifications (1.8)
    pushNotification('Info', msg);
  }
  function pushNotification(title, msg) {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    // remove empty placeholder
    if (list.textContent.includes('No notifications')) list.innerHTML='';
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `<strong>${title}</strong><span>${msg}</span><small class="muted small" style="display:block; margin-top:4px">${new Date().toLocaleTimeString()}</small>`;
    list.prepend(item);
    const badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = String(list.children.length); badge.classList.remove('hidden'); }
    // keep last 20
    while (list.children.length>20) list.lastChild.remove();
  }
  // enhance goto line
  const gotoInput = document.getElementById('gotoLineInput');
  if (gotoInput) {
    gotoInput.addEventListener('keydown', (e)=>{
      if (e.key==='Enter') {
        const val = gotoInput.value.replace(':','').trim();
        const [line, col] = val.split(',').map(n=>parseInt(n));
        if (monacoEditor && line) { monacoEditor.revealLineInCenter(line); monacoEditor.setPosition({lineNumber: line, column: col||1}); toast(`Go to ${line}${col?':'+col:''}`); }
        document.getElementById('gotoLinePalette').classList.add('hidden');
      } else if (e.key==='Escape') document.getElementById('gotoLinePalette').classList.add('hidden');
    });
  }
  // Find widget wiring (1.8)
  const findInput = document.getElementById('findInput');
  const findCloseBtn = document.getElementById('findClose');
  findCloseBtn?.addEventListener('click', ()=>document.getElementById('findWidget').classList.add('hidden'));
  if (findInput) {
    let findMatches=[], findIdx=0;
    function runFind(){
      const q=findInput.value;
      if(!monacoEditor || !q) { document.getElementById('findInfo').textContent='No results'; return; }
      // use Monaco find controller via trigger
      monacoEditor.getAction('actions.find').run();
      // also manual count via model
      const model=monacoEditor.getModel();
      if(model){ const matches=model.findMatches(q, false, !!document.getElementById('findCase').checked, !!document.getElementById('findWord').checked, document.getElementById('findRegex').checked? '.*': null, false); findMatches=matches; findIdx=0; document.getElementById('findInfo').textContent = matches.length ? `${matches.length} results` : 'No results'; if(matches.length) monacoEditor.setSelection(matches[0].range); }
    }
    findInput.addEventListener('input', runFind);
    document.getElementById('findNext')?.addEventListener('click', ()=>{ if(findMatches.length){ findIdx=(findIdx+1)%findMatches.length; monacoEditor.setSelection(findMatches[findIdx].range); monacoEditor.revealLineInCenter(findMatches[findIdx].range.startLineNumber); }});
    document.getElementById('findPrev')?.addEventListener('click', ()=>{ if(findMatches.length){ findIdx=(findIdx-1+findMatches.length)%findMatches.length; monacoEditor.setSelection(findMatches[findIdx].range); monacoEditor.revealLineInCenter(findMatches[findIdx].range.startLineNumber); }});
    document.getElementById('replaceBtn')?.addEventListener('click', ()=>{
      const replaceVal=document.getElementById('findReplaceInput2').value;
      if(monacoEditor) monacoEditor.trigger('keyboard','actions.find', {searchString: findInput.value, replaceString: replaceVal, isRegex: !!document.getElementById('findRegex').checked});
      toast('Replaced');
    });
    document.getElementById('replaceAllBtn2')?.addEventListener('click', ()=>{
      const q=findInput.value, r=document.getElementById('findReplaceInput2').value;
      if(!activePath||!q) return;
      const node=findNode(activePath);
      let content=node.content;
      let regex;
      try{ regex = document.getElementById('findRegex').checked ? new RegExp(q, 'g') : new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), document.getElementById('findCase').checked ? 'g':'gi'); } catch{ toast('Invalid regex'); return; }
      const newContent=content.replace(regex, r);
      node.content=newContent; if(monacoEditor) monacoEditor.setValue(newContent); const tab=openTabs.find(t=>t.path===activePath); if(tab) tab.dirty=true; renderTabs(); saveFS(); toast(`Replaced all in ${activePath}`);
    });
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

  // Key: F5 start debugging
  document.addEventListener('keydown', (e)=>{
    if(e.key==='F5'){ e.preventDefault(); startDebugging(); }
    if(e.key==='F5' && e.shiftKey){ e.preventDefault(); debugActive=false; toast('Debugging stopped'); if(window._debugLineDecor) monacoEditor.deltaDecorations(window._debugLineDecor, []); }
  });
  // debug toolbar continue/stop
  const dbgToolbar = document.querySelector('[data-panel-view="debugcons"] .problems-toolbar');
  if(dbgToolbar && !document.getElementById('debugContinueBtn')){
    const cont=document.createElement('button'); cont.id='debugContinueBtn'; cont.className='icon-btn small'; cont.title='Continue (F5)'; cont.textContent='▶';
    const stop=document.createElement('button'); stop.id='debugStopBtn'; stop.className='icon-btn small'; stop.title='Stop'; stop.textContent='■';
    const step=document.createElement('button'); step.id='debugStepBtn'; step.className='icon-btn small'; step.title='Step Over (F10)'; step.textContent='⤵';
    dbgToolbar.appendChild(cont); dbgToolbar.appendChild(step); dbgToolbar.appendChild(stop);
    cont.addEventListener('click', ()=>{ if(!debugActive) startDebugging(); else { const lines=breakpoints[activePath]||[]; let idx=lines.indexOf(debugLine); let next=lines[(idx+1)%lines.length]||lines[0]; if(next){ debugLine=next; monacoEditor.revealLineInCenter(next); if(window._debugLineDecor) monacoEditor.deltaDecorations(window._debugLineDecor, []); window._debugLineDecor=monacoEditor.deltaDecorations([], [{range:new monaco.Range(next,1,next,1000), options:{isWholeLine:true, className:'debug-current-line'}}]); toast(`Continued to ${activePath}:${next}`);} } });
    stop.addEventListener('click', ()=>{ debugActive=false; if(window._debugLineDecor) monacoEditor.deltaDecorations(window._debugLineDecor, []); toast('Debug stopped'); });
    step.addEventListener('click', ()=>{ if(!debugActive){ toast('Start debugging first (F5)'); return; } let next=debugLine+1; debugLine=next; monacoEditor.revealLineInCenter(next); if(window._debugLineDecor) monacoEditor.deltaDecorations(window._debugLineDecor, []); window._debugLineDecor=monacoEditor.deltaDecorations([], [{range:new monaco.Range(next,1,next,1000), options:{isWholeLine:true, className:'debug-current-line'}}]); toast(`Stepped to line ${next}`); });
  }
  updateTermCwdUI();
  // Expose for debugging
  window.vscode = { openFile, createNew, deletePath, findNode, commands, toggleBreakpoint, cwd:()=>cwd };

})();
