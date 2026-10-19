const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');
const os = require('os');

const ROOT = __dirname;
const PORT = 4173;
const BIN_DIR = '/tmp/ubiq-bins';
try { fs.mkdirSync(BIN_DIR, {recursive:true}); } catch{}

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css',
  '.js':'text/javascript; charset=utf-8',
  '.svg':'image/svg+xml',
  '.json':'application/json',
  '.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon',
  '.txt':'text/plain','.wasm':'application/wasm'
};

function serveStatic(req, res){
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  // ignore api paths
  if (url.startsWith('/api/')) return false;
  let filePath = path.join(ROOT, decodeURIComponent(url));
  // prevent traversal
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return true; }
  try {
    let stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    let data = fs.readFileSync(filePath);
    let ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-cache'});
    res.end(data);
    return true;
  } catch(e){
    return false;
  }
}

function collectBody(req){
  return new Promise((resolve, reject)=>{
    let d=''; req.on('data',c=>d+=c); req.on('end',()=>resolve(d)); req.on('error',reject);
  });
}

async function handleApi(req,res){
  if (!req.url.startsWith('/api/')) return false;
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method==='OPTIONS'){ res.writeHead(204); res.end(); return true; }

  if (req.url === '/api/exec' && req.method==='POST'){
    let body = await collectBody(req);
    let {code, language='cpp', stdin='', filename='main.cpp', out='a.out'} = {};
    try{ ({code, language, stdin, filename, out} = JSON.parse(body)); } catch{e=>{}}
    if (!code){ res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({success:false, error:'no code'})); return true; }
    // decide compiler
    let ext = language==='c' ? '.c' : '.cpp';
    let tmpSrc = path.join(os.tmpdir(), `ubiq_${Date.now()}_${Math.random().toString(36).slice(2,6)}${ext}`);
    let tmpBin = path.join(BIN_DIR, out.replace(/[^a-zA-Z0-9._-]/g,'_'));
    // ensure bin dir exists
    try{ fs.mkdirSync(path.dirname(tmpBin), {recursive:true}); }catch{}
    fs.writeFileSync(tmpSrc, code, 'utf8');
    let compiler = language==='c' ? 'gcc' : 'g++';
    // compile
    let compileCmd = `${compiler} "${tmpSrc}" -o "${tmpBin}" 2>&1`;
    // add extra flags for c++17
    if (language!=='c') compileCmd = `${compiler} -std=c++17 "${tmpSrc}" -o "${tmpBin}" 2>&1`;
    let compileOut = '';
    try{ compileOut = execSync(compileCmd, {timeout: 10000, encoding:'utf8', maxBuffer: 1024*1024}); } catch(e){
      let err = (e.stdout||'') + (e.stderr||'') + (e.message||'');
      // e.stdout may contain compile error
      if (e.stdout) err = e.stdout.toString();
      else if (e.stderr) err = e.stderr.toString();
      // try to get output from execSync error
      compileOut = err;
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({success:false, compileError: compileOut, stage:'compile'}));
      try{ fs.unlinkSync(tmpSrc);}catch{}
      return true;
    }
    // run
    let runStdout='', runStderr='', exitCode=0;
    try{
      let run = spawnSync(tmpBin, [], {
        input: stdin || '',
        encoding:'utf8',
        timeout: 5000,
        maxBuffer: 1024*1024,
        env: {...process.env}
      });
      runStdout = run.stdout || '';
      runStderr = run.stderr || '';
      exitCode = run.status ?? 0;
      if (run.error) throw run.error;
    } catch(e){
      runStderr += '\n' + (e.message||e.toString());
      exitCode = 1;
    }
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({success:true, stdout: runStdout, stderr: runStderr, exitCode, compileLog: compileOut}));
    try{ fs.unlinkSync(tmpSrc);}catch{}
    return true;
  }

  if (req.url === '/api/run' && req.method==='POST'){
    let body = await collectBody(req);
    let {out='a.out', stdin=''} = {};
    try{ ({out, stdin} = JSON.parse(body)); }catch{}
    let binPath = path.join(BIN_DIR, out.replace(/[^a-zA-Z0-9._-]/g,'_'));
    if (!fs.existsSync(binPath)){ res.writeHead(404, {'Content-Type':'application/json'}); res.end(JSON.stringify({success:false, error:'binary not found. Compile first: g++ file.cpp -o '+out})); return true; }
    let stdout='', stderr='', exitCode=0;
    try{
      let run = spawnSync(binPath, [], {input: stdin||'', encoding:'utf8', timeout:5000, maxBuffer:1024*1024});
      stdout = run.stdout||''; stderr=run.stderr||''; exitCode=run.status??0;
    } catch(e){ stderr = e.message; }
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({success:true, stdout, stderr, exitCode}));
    return true;
  }

  if (req.url.startsWith('/api/health')){
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ok:true, compiler:'g++ 12.2', time: new Date().toISOString()}));
    return true;
  }

  res.writeHead(404, {'Content-Type':'application/json'});
  res.end(JSON.stringify({error:'not found'}));
  return true;
}

const server = http.createServer(async (req,res)=>{
  try{
    if (await handleApi(req,res)) return;
    if (serveStatic(req,res)) return;
    // fallback to index for SPA?
    let idx = path.join(ROOT, 'index.html');
    if (fs.existsSync(idx)){
      res.writeHead(200, {'Content-Type':'text/html'}); res.end(fs.readFileSync(idx));
    } else { res.writeHead(404); res.end('not found'); }
  } catch(e){
    res.writeHead(500); res.end('server error '+e.message);
  }
});
server.listen(PORT, '0.0.0.0', ()=> console.log(`✓ ubiquitious-guacamole on http://0.0.0.0:${PORT} — real g++ backend ready`));
