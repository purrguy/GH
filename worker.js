/**
 * greedyhudzell.xyz — site pages + lua proxy + obfuscator
 * / → redirect /home
 * /home /status /executors /guide /pricing /tos /privacy /obfuscator
 *
 * Key validate on /home uses POST /validate (same origin — wire to your key Worker
 * or point VALIDATE_URL to the key API host).
 */
const GH = "https://raw.githubusercontent.com/mixask/GH/main";
const DISCORD = "https://discord.gg/sbVuaT9a2T";
const FREE_KEY = "https://work.ink/28wp/Greedy-hudzell";
const VALIDATE_PATH = "/validate"; // same-origin or set absolute in page JS
const WEAO = "https://weao.xyz/api/status/exploits";

const LUAOBF_NEW = "https://api.luaobfuscator.com/v1/obfuscator/newscript";
const LUAOBF_RUN = "https://api.luaobfuscator.com/v1/obfuscator/obfuscate";
const FALLBACK_KEY = "11ad3847-d943-4a76-ee19-f9acab3e85144ea9";

const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache",
  "Access-Control-Allow-Origin": "*",
};
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-cache",
  "Access-Control-Allow-Origin": "*",
};
const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-cache",
};

async function proxyGithub(file) {
  const response = await fetch(`${GH}/${file}`, {
    cf: { cacheTtl: 0, cacheEverything: false },
  });
  if (!response.ok) {
    return new Response(`${file} not found`, { status: 404, headers: TEXT_HEADERS });
  }
  return new Response(await response.text(), { headers: TEXT_HEADERS });
}

/* 5.2.0: private gh-secret builds (loader). Token never leaves the worker. */
async function proxySecret(env, file) {
  const token = env.GITHUB_TOKEN || "";
  if (!token) {
    return new Response("hub not published", { status: 503, headers: TEXT_HEADERS });
  }
  const repo = env.GH_SECRET_REPO || "purrguy/gh-secret";
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw", "User-Agent": "gh-proxy" },
  });
  if (!res.ok) {
    return new Response(`${file} not found`, { status: 404, headers: TEXT_HEADERS });
  }
  const text = await res.text();
  if (!text || text.length < 40) {
    return new Response(`${file} empty`, { status: 404, headers: TEXT_HEADERS });
  }
  return new Response(text, { headers: TEXT_HEADERS });
}

function navHtml(active) {
  const items = [
    ["/home", "Home"],
    ["/pricing", "Pricing"],
    ["/status", "Status"],
    ["/executors", "Executors"],
    ["/guide", "Guide"],
    ["/tos", "ToS"],
    ["/obfuscator", "Obfuscator"],
  ];
  return items
    .map(([href, label]) => {
      const key = label.toLowerCase();
      const on = active === key;
      return `<a href="${href}"${on ? ' class="active"' : ""}>${label}</a>`;
    })
    .join("\n      ");
}

function baseStyles(extra = "") {
  return `
:root{
  --bg:#0a0a0a;--bg2:#111;--card:#141414;--border:#2a2a2a;
  --text:#f2f2f2;--muted:#9a9a9a;--gold:#C9A227;--gold-soft:#E8C547;
  --ok:#4caf7a;--bad:#e85d5d;--radius:16px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);
  min-height:100vh;line-height:1.55;
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -20%,rgba(201,162,39,.08),transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%,rgba(255,255,255,.03),transparent);
}
a{color:var(--gold-soft);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{width:min(980px,94vw);margin:0 auto;padding:28px 0 80px}
.wrap.wide{width:min(1100px,94vw)}
.top{
  position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);
  background:rgba(10,10,10,.78);border-bottom:1px solid var(--border);
}
.top-inner{
  width:min(1100px,94vw);margin:0 auto;display:flex;align-items:center;
  justify-content:space-between;gap:16px;padding:14px 0;flex-wrap:wrap;
}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;color:var(--text);text-decoration:none}
.brand:hover{text-decoration:none}
.brand-mark{
  width:34px;height:34px;border-radius:10px;
  background:linear-gradient(135deg,#1a1a1a,#2a2410);
  border:1px solid var(--gold);display:grid;place-items:center;
  color:var(--gold);font-size:14px;font-weight:700;
}
.nav{display:flex;flex-wrap:wrap;gap:6px}
.nav a{
  color:var(--muted);padding:8px 14px;border-radius:999px;
  border:1px solid transparent;font-size:13px;font-weight:500;text-decoration:none;
}
.nav a:hover{color:var(--text);border-color:var(--border);background:var(--card);text-decoration:none}
.nav a.active{color:#0a0a0a;background:var(--gold);border-color:var(--gold)}
.page-header{margin:28px 0 22px}
.page-header h1{font-size:1.85rem;font-weight:700;margin-bottom:6px}
.page-header .sub{color:var(--muted);font-size:14px}
.badge{
  display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;
  border-radius:999px;background:rgba(201,162,39,.12);color:var(--gold);
  border:1px solid rgba(201,162,39,.25);margin-bottom:14px;
}
.section{margin-bottom:28px}
.section h2{
  font-size:1.05rem;font-weight:600;color:var(--gold-soft);
  margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);
}
.section p,.section li{color:#c8c8c8;font-size:14px;line-height:1.7}
.section ul{padding-left:20px;margin-bottom:10px}
.section li{margin-bottom:4px}
.card{
  background:var(--card);border:1px solid var(--border);border-radius:var(--radius);
  padding:18px;margin-bottom:14px;
}
.card h3{font-size:1rem;margin-bottom:8px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:720px){.grid-2{grid-template-columns:1fr}}
.btn{
  display:inline-flex;align-items:center;justify-content:center;
  padding:11px 16px;border-radius:999px;font-size:13px;font-weight:600;
  border:1px solid var(--border);background:var(--bg2);color:var(--text);
  cursor:pointer;text-decoration:none;
}
.btn:hover{border-color:var(--gold);color:var(--gold-soft);text-decoration:none}
.btn-gold{
  background:linear-gradient(135deg,var(--gold),#a8841a);
  color:#0a0a0a;border-color:var(--gold);
}
.btn-gold:hover{color:#0a0a0a;filter:brightness(1.05);text-decoration:none}
input,select,textarea{
  width:100%;border-radius:10px;border:1px solid var(--border);
  background:#0c0c0c;color:var(--text);padding:11px 12px;font-size:13px;
}
input:focus,select:focus,textarea:focus{outline:1px solid rgba(201,162,39,.4)}
label.field{display:block;color:var(--muted);font-size:12px;margin:10px 0 6px;font-weight:600}
.status-pill{
  display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;
  font-size:12px;font-weight:600;border:1px solid var(--border);background:var(--bg2);
}
.status-pill .dot{width:8px;height:8px;border-radius:50%}
.status-pill.ok .dot{background:var(--ok)}
.status-pill.warn .dot{background:#e8a838}
.status-pill.bad .dot{background:var(--bad)}
.status-pill.ok{color:var(--ok)}
.status-pill.warn{color:#e8a838}
.status-pill.bad{color:var(--bad)}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--border)}
th{color:var(--muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.muted{color:var(--muted);font-size:13px}
.ok{color:var(--ok)}
.err{color:var(--bad)}
footer.site{margin-top:32px;text-align:center;color:#555;font-size:12px}
.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.price-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}
@media(max-width:900px){.price-grid{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.price-grid{grid-template-columns:1fr}}
.price-card{
  background:var(--card);border:1px solid var(--border);border-radius:var(--radius);
  padding:18px;display:flex;flex-direction:column;gap:8px;position:relative;
}
.price-card.featured{border-color:var(--gold);box-shadow:0 0 0 1px rgba(201,162,39,.2)}
.price-card .tag{
  position:absolute;top:12px;right:12px;font-size:10px;font-weight:700;
  background:var(--gold);color:#0a0a0a;padding:3px 8px;border-radius:999px;
}
.price-card .amount{font-size:1.7rem;font-weight:700;color:var(--gold-soft)}
.price-card .amount span{font-size:12px;color:var(--muted);font-weight:500}
.price-card ul{list-style:none;padding:0;margin:6px 0;flex:1}
.price-card ul li{font-size:13px;color:#c8c8c8;padding:4px 0 4px 16px;position:relative}
.price-card ul li::before{content:"✓";position:absolute;left:0;color:var(--gold);font-size:12px}
${extra}`;
}

function pageShell(title, active, content, wide = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} · Greedy Hudzell</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>${baseStyles()}</style>
</head>
<body>
<header class="top">
  <div class="top-inner">
    <a class="brand" href="/home">
      <div class="brand-mark">GH</div>
      <span>Greedy Hudzell</span>
    </a>
    <nav class="nav">${navHtml(active)}</nav>
  </div>
</header>
<main class="wrap${wide ? " wide" : ""}">
${content}
  <footer class="site">
    © Greedy Hudzell · <a href="${DISCORD}">Discord</a> ·
    <a href="/privacy">Privacy</a> · <a href="/tos">ToS</a> ·
    Not affiliated with Roblox
  </footer>
</main>
</body>
</html>`;
}

/* ===================== PAGES ===================== */

function homeHtml() {
  const content = `
  <div class="page-header">
    <div class="badge">Official site</div>
    <h1>Greedy Hudzell</h1>
    <p class="sub">Parkour tooling hub — keys, loader, updates. Black &amp; gold, no clutter.</p>
    <div class="hero-actions">
      <a class="btn btn-gold" href="${FREE_KEY}" target="_blank" rel="noopener">Get free key</a>
      <a class="btn" href="/pricing">Pricing</a>
      <a class="btn" href="${DISCORD}" target="_blank" rel="noopener">Discord</a>
    </div>
  </div>

  <div class="grid-2">
    <section class="card">
      <h3>Key status</h3>
      <p class="muted" style="margin-bottom:10px">Check if a key is valid for a Roblox username.</p>
      <label class="field">Key</label>
      <input id="k_key" placeholder="GH-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false"/>
      <label class="field">Roblox username</label>
      <input id="k_user" placeholder="Not display name" autocomplete="off" spellcheck="false"/>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn btn-gold" id="k_btn">Check key</button>
      </div>
      <p id="k_out" class="muted" style="margin-top:12px;white-space:pre-wrap"></p>
    </section>

    <section class="card">
      <h3>Quick links</h3>
      <ul style="list-style:none;padding:0;margin:0">
        <li style="margin:8px 0"><a href="/guide">Guide</a> — install &amp; first run</li>
        <li style="margin:8px 0"><a href="/executors">Executors</a> — support overview</li>
        <li style="margin:8px 0"><a href="/status">Status</a> — service health</li>
        <li style="margin:8px 0"><a href="/pricing">Pricing</a> — free / week / month / year</li>
        <li style="margin:8px 0"><a href="/obfuscator">Obfuscator</a> — Lua tools</li>
      </ul>
      <p class="muted" style="margin-top:14px">Loader:
        <code style="color:var(--gold-soft)">loadstring(game:HttpGet("https://greedyhudzell.xyz/loader.lua"))()</code>
      </p>
    </section>
  </div>

  <section class="section" style="margin-top:8px">
    <h2>Plans at a glance</h2>
    <p>Free 24h via Work.ink · Paid plans include <b>account rewire</b>. Full details on <a href="/pricing">Pricing</a>.</p>
  </section>

<script>
(function(){
  const out = document.getElementById('k_out');
  const btn = document.getElementById('k_btn');
  btn.onclick = async function(){
    const key = (document.getElementById('k_key').value || '').trim();
    const username = (document.getElementById('k_user').value || '').trim();
    if(!key || !username){
      out.className = 'err';
      out.textContent = 'Enter key and Roblox username.';
      return;
    }
    out.className = 'muted';
    out.textContent = 'Checking...';
    btn.disabled = true;
    try{
      const res = await fetch(${JSON.stringify(VALIDATE_PATH)}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, username })
      });
      const data = await res.json();
      if(data.valid === true){
        out.className = 'ok';
        const exp = data.expires_at ? new Date(Number(data.expires_at) * 1000).toUTCString() : 'n/a';
        out.textContent = 'VALID\\nPlan: ' + (data.plan || 'n/a') + '\\nExpires: ' + exp + ' (unix ' + (data.expires_at || '?') + ')';
      } else {
        out.className = 'err';
        out.textContent = 'INVALID — ' + (data.reason || res.status);
      }
    } catch(e){
      out.className = 'err';
      out.textContent = 'Request failed: ' + e;
    }
    btn.disabled = false;
  };
})();
</script>
`;
  return pageShell("Home", "home", content, true);
}

function statusHtml() {
  const content = `
  <div class="page-header">
    <div class="badge">Operations</div>
    <h1>Status</h1>
    <p class="sub">High-level health of public GH endpoints. Manual snapshot — not a full probe grid.</p>
  </div>
  <div class="card">
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">
      <span class="status-pill ok"><span class="dot"></span> Website</span>
      <span class="status-pill ok"><span class="dot"></span> Key API</span>
      <span class="status-pill ok"><span class="dot"></span> Loader proxy</span>
      <span class="status-pill warn"><span class="dot"></span> Game updates may break features</span>
    </div>
    <p class="muted">For live incidents and ban-wave notes we use the Discord status channel. Use the bot <code>/status</code> command on the server when available.</p>
  </div>
  <div class="section">
    <h2>Components</h2>
    <table>
      <thead><tr><th>Component</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>greedyhudzell.xyz</td><td>Pages, pricing, guide</td></tr>
        <tr><td>/validate</td><td>Key check (loader + home form)</td></tr>
        <tr><td>/loader.lua</td><td>Private build v5.2.0</td></tr>
        <tr><td>Discord bot</td><td>Keys, verify, updates</td></tr>
        <tr><td>Work.ink free keys</td><td>Depends on third-party unlock flow</td></tr>
      </tbody>
    </table>
  </div>
  <div class="section">
    <h2>Report an issue</h2>
    <p>Open a ticket on <a href="${DISCORD}">Discord</a> with executor name, screenshot, and loader report log if any.</p>
  </div>
`;
  return pageShell("Status", "status", content);
}

function executorsHtml() {
  const content = `
  <div class="page-header">
    <div class="badge">Compatibility</div>
    <h1>Executors</h1>
    <p class="sub">GH targets common Windows executors with UNC-style APIs (http, files, queue_on_teleport). Support is best-effort.</p>
  </div>
  <div class="card">
    <h3>What we look for</h3>
    <ul style="margin:8px 0 0 18px;color:#c8c8c8;font-size:14px;line-height:1.7">
      <li><code>loadstring</code> / <code>HttpGet</code></li>
      <li><code>request</code> / <code>http_request</code> / <code>syn.request</code></li>
      <li><code>writefile</code> · <code>readfile</code> · <code>isfile</code></li>
      <li><code>queue_on_teleport</code> (rejoin features)</li>
      <li>Stable UI (Drawings optional)</li>
    </ul>
  </div>
  <div class="section">
    <h2>Guidance</h2>
    <p><b>Recommended:</b> maintained executors with high sUNC / documented http + filesystem. Wave/Delta/madium-class tools are commonly used by the community; always verify the build yourself.</p>
    <p><b>External / mobile:</b> often limited — some features (files, queue on tp) may be missing.</p>
    <p><b>Offline / free hosts:</b> may inject older environments; if the loader fails, try another executor before opening a ticket.</p>
  </div>
  <div class="section">
    <h2>Live list</h2>
    <p class="muted">Optional live data from weao.xyz (if reachable from your network):</p>
    <div id="ex_out" class="card muted">Loading executor status…</div>
  </div>
<script>
function fmtPct(v){
  if(v==null||v==="")return "—";
  if(typeof v==="number")return v+"%";
  if(typeof v==="boolean")return v?"yes":"no";
  if(typeof v==="string"){
    var t=v.trim();
    if(!t)return "—";
    if(/^\d+(\.\d+)?$/.test(t))return t+"%";
    return t;
  }
  return "—";
}
function pickSunc(x){
  if(!x||typeof x!=="object")return "—";
  // weao.xyz: score is suncPercentage; field "sunc" is metadata only
  if(x.suncPercentage!=null)return fmtPct(x.suncPercentage);
  if(x.uncPercentage!=null)return fmtPct(x.uncPercentage);
  if(typeof x.sunc==="number"||typeof x.sunc==="string")return fmtPct(x.sunc);
  if(typeof x.sUNC==="number"||typeof x.sUNC==="string")return fmtPct(x.sUNC);
  if(x.percentage!=null)return fmtPct(x.percentage);
  if(x.percent!=null)return fmtPct(x.percent);
  return "—";
}
function fmtStatus(x){
  if(x.updateStatus===true||x.updateStatus==="true"||x.updateStatus==="Updated")return "Updated";
  if(x.updateStatus===false||x.updateStatus==="false")return "Not updated";
  if(x.updateStatus!=null&&typeof x.updateStatus!=="object")return String(x.updateStatus);
  if(x.status!=null&&typeof x.status!=="object")return String(x.status);
  if(x.updatedDate)return String(x.updatedDate);
  return "—";
}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
(async function(){
  const el = document.getElementById('ex_out');
  try{
    const res = await fetch(${JSON.stringify(WEAO)}, { headers: { 'Accept': 'application/json' } });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.exploits || data.data || data.results || []);
    if(!list.length){
      el.textContent = 'No structured list returned. Check weao.xyz manually.';
      return;
    }
    const rows = list.slice(0, 40).map(function(x){
      const name = x.title || x.name || x.executor || '?';
      const up = fmtStatus(x);
      const sunc = pickSunc(x);
      return '<tr><td>' + esc(name) + '</td><td>' + esc(up) + '</td><td>' + esc(sunc) + '</td></tr>';
    }).join('');
    el.innerHTML = '<table><thead><tr><th>Executor</th><th>Status</th><th>sUNC %</th></tr></thead><tbody>' + rows + '</tbody></table>';
    el.className = 'card';
  } catch(e){
    el.textContent = 'Could not load weao.xyz (' + e + '). Use Discord recommendations.';
  }
})();
</script>
`;
  return pageShell("Executors", "executors", content);
}

function guideHtml() {
  const content = `
  <div class="page-header">
    <div class="badge">Docs</div>
    <h1>Guide</h1>
    <p class="sub">From zero to running Greedy Hudzell.</p>
  </div>
  <div class="section">
    <h2>1. Get a key</h2>
    <ul>
      <li><b>Free (24h)</b> — <a href="${FREE_KEY}" target="_blank" rel="noopener">Work.ink unlock</a>, then bind your Roblox username</li>
      <li><b>Paid</b> — Discord ticket / seller · Week $3.99 · Month $6.99 · Year $12.99 · includes rewire</li>
    </ul>
  </div>
  <div class="section">
    <h2>2. Executor</h2>
    <p>Use a maintained executor with HTTP + files. See <a href="/executors">Executors</a>.</p>
  </div>
  <div class="section">
    <h2>3. Run the loader</h2>
    <p>In the executor:</p>
    <div class="card"><code style="color:var(--gold-soft);font-size:13px;word-break:break-all">loadstring(game:HttpGet("https://greedyhudzell.xyz/loader.lua"))()</code></div>
    <p>Enter your key when prompted. Only run the official loader from this domain / GitHub.</p>
  </div>
  <div class="section">
    <h2>4. After login</h2>
    <ul>
      <li>Open the hub UI (Insert / minimize icon depending on build)</li>
      <li>Enable only what you need — start with Safe autofarm settings</li>
      <li>Queue on teleport is optional; enable after the hub is stable</li>
    </ul>
  </div>
  <div class="section">
    <h2>5. Troubleshooting</h2>
    <ul>
      <li><b>invalid_key / expired</b> — check <a href="/home">Home → Key status</a></li>
      <li><b>username_mismatch</b> — key bound to another account (paid may rewire)</li>
      <li><b>stack overflow after obfuscation</b> — do not ship Full/VM obfuscation on the hub; use light/medium or raw</li>
      <li><b>Loader freezes</b> — another executor; send loader report in Discord</li>
    </ul>
  </div>
  <div class="section">
    <h2>6. Support</h2>
    <p><a href="${DISCORD}">Discord</a> · attach loader report + executor name.</p>
  </div>
`;
  return pageShell("Guide", "guide", content);
}

function pricingHtml() {
  const content = `
  <div class="page-header">
    <div class="badge">USD</div>
    <h1>Pricing</h1>
    <p class="sub">Free day key via Work.ink · Paid plans include <b>account rewire</b></p>
  </div>
  <div class="price-grid">
    <article class="price-card">
      <h3>Free</h3>
      <div class="amount">$0 <span>/ 24h</span></div>
      <ul>
        <li>Full script access</li>
        <li>1 Roblox username</li>
        <li>Work.ink unlock</li>
        <li>No rewire</li>
      </ul>
      <a class="btn" href="${FREE_KEY}" target="_blank" rel="noopener">Get free key</a>
    </article>
    <article class="price-card">
      <h3>Week</h3>
      <div class="amount">$3.99 <span>/ 7 days</span></div>
      <ul>
        <li>Full script access</li>
        <li>Account rewire included</li>
        <li>Priority Discord support</li>
      </ul>
      <a class="btn" href="${DISCORD}" target="_blank" rel="noopener">Buy on Discord</a>
    </article>
    <article class="price-card featured">
      <span class="tag">Popular</span>
      <h3>Month</h3>
      <div class="amount">$6.99 <span>/ 30 days</span></div>
      <ul>
        <li>Full script access</li>
        <li>Account rewire included</li>
        <li>Best balance price / time</li>
      </ul>
      <a class="btn btn-gold" href="${DISCORD}" target="_blank" rel="noopener">Buy on Discord</a>
    </article>
    <article class="price-card">
      <h3>Year</h3>
      <div class="amount">$12.99 <span>/ 365 days</span></div>
      <ul>
        <li>Full script access</li>
        <li>Account rewire included</li>
        <li>Best long-term value</li>
      </ul>
      <a class="btn" href="${DISCORD}" target="_blank" rel="noopener">Buy on Discord</a>
    </article>
  </div>
  <p class="muted">See <a href="/tos">Terms of Service</a> for rewire, refunds, and key rules.</p>
`;
  return pageShell("Pricing", "pricing", content, true);
}

function tosHtml() {
  const content = `
  <div class="page-header"><div class="badge">Legal</div><h1>Terms of Service</h1>
  <p class="sub">Last updated: August 2026</p></div>
  <div class="section"><h2>1. Acceptance</h2>
  <p>By using Greedy Hudzell (keys, loader, site, Discord), you agree to these terms.</p></div>
  <div class="section"><h2>2. Plans &amp; pricing</h2>
  <ul>
    <li><b>Free</b> — ~24h, one username, no rewire</li>
    <li><b>Week</b> — $3.99 / 7 days</li>
    <li><b>Month</b> — $6.99 / 30 days</li>
    <li><b>Year</b> — $12.99 / 365 days</li>
  </ul>
  <p>Paid plans include account rewire (fair use). Details: <a href="/pricing">/pricing</a>.</p></div>
  <div class="section"><h2>3. License</h2>
  <p>Personal, non-transferable use only. No resale, no redistribution, no reverse-engineering for redistribution.</p></div>
  <div class="section"><h2>4. Refunds</h2>
  <p>Sales are final after key delivery. Extensions may be granted at our discretion for our outages.</p></div>
  <div class="section"><h2>5. Risk</h2>
  <p>Not affiliated with Roblox. Executors/scripts can result in moderation actions — you accept that risk.</p></div>
  <div class="section"><h2>6. Contact</h2>
  <p><a href="${DISCORD}">Discord</a> · <a href="/privacy">Privacy</a></p></div>
`;
  return pageShell("Terms of Service", "tos", content);
}

function privacyHtml() {
  const content = `
  <div class="page-header"><div class="badge">Legal</div><h1>Privacy Policy</h1>
  <p class="sub">Last updated: August 2026</p></div>
  <div class="section"><h2>Data we use</h2>
  <p>Roblox username (key bind), Discord IDs (bot), key metadata, minimal technical logs for abuse prevention.</p></div>
  <div class="section"><h2>Contact</h2>
  <p><a href="${DISCORD}">Discord</a></p></div>
`;
  return pageShell("Privacy Policy", "privacy", content);
}

/* Minimal obfuscator page (link to full tools) */
function obfuscateHtml() {
  return pageShell(
    "Obfuscator",
    "obfuscator",
    `
  <div class="page-header">
    <div class="badge">Tools</div>
    <h1>Obfuscator</h1>
    <p class="sub">API endpoint is available at <code>POST /api/obfuscate</code>. Prefer light/medium presets for large hubs — Full/VM can cause stack overflow.</p>
  </div>
  <div class="card">
    <p>Use the dedicated obfuscator UI if deployed on this host, or GH worker <code>/obfuscator</code>.</p>
    <p class="muted" style="margin-top:10px">Loader errors like <b>stack overflow</b> after obfuscation usually mean the preset is too heavy — ship raw or light obfuscation for production.</p>
  </div>`
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // / → /home
    if (path === "/") {
      return Response.redirect(new URL("/home", url).toString(), 302);
    }

    // Lua proxies (5.2.0: loader from private gh-secret; script.lua is gone,
    // the hub ships inside /validate)
    if (path === "/script.lua") {
      return new Response("gone: hub ships inside /validate since 5.2.0", { status: 410, headers: TEXT_HEADERS });
    }
    if (path === "/library.lua") return proxyGithub("greedylibrary.lua");
    if (path === "/loader.lua") return proxySecret(env, "greedyloader.lua");
    if (path === "/modules.lua") return proxyGithub("greedymodules.lua");

    // Pages
    if (path === "/home") return new Response(homeHtml(), { headers: HTML_HEADERS });
    if (path === "/status") return new Response(statusHtml(), { headers: HTML_HEADERS });
    if (path === "/executors") return new Response(executorsHtml(), { headers: HTML_HEADERS });
    if (path === "/guide") return new Response(guideHtml(), { headers: HTML_HEADERS });
    if (path === "/pricing") return new Response(pricingHtml(), { headers: HTML_HEADERS });
    if (path === "/tos") return new Response(tosHtml(), { headers: HTML_HEADERS });
    if (path === "/privacy") return new Response(privacyHtml(), { headers: HTML_HEADERS });
    if (path === "/obfuscator" || path === "/obfuscate") {
      return new Response(obfuscateHtml(), { headers: HTML_HEADERS });
    }

    // Note: POST /validate should be handled by your key Worker.
    // If this worker is merged with the key system, keep handleValidate here.

    return new Response("Not Found", { status: 404, headers: TEXT_HEADERS });
  },
};
