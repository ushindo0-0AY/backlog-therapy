/**
 * generate-pages.js
 * 
 * Reads log.json and generates individual HTML pages for each game
 * under the /games/ directory. Also updates index.html to link to
 * individual game pages instead of using modals.
 * 
 * Usage: node generate-pages.js
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────
const RAW_BASE = 'https://raw.githubusercontent.com/ushindo0-0AY/backlog-therapy/refs/heads/main';
const LOG_FILE = path.join(__dirname, 'log.json');
const GAMES_DIR = path.join(__dirname, 'games');
const INDEX_FILE = path.join(__dirname, 'index.html');
const ICON = 'icon-512.png';

// ─── Helpers ─────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function r2(n) { return Math.round(n * 100) / 100; }
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function sc(s) {
  if (s >= 9) return '#4ade80';
  if (s >= 7.5) return '#60a5fa';
  if (s >= 6) return '#facc15';
  if (s >= 4.5) return '#fb923c';
  return '#ff4d6d';
}

function slbl(s) {
  if (s >= 9.5) return 'Masterpiece';
  if (s >= 9) return 'Outstanding';
  if (s >= 8.5) return 'Excellent';
  if (s >= 8) return 'Great';
  if (s >= 7.5) return 'Good';
  if (s >= 7) return 'Solid';
  if (s >= 6.5) return 'Above Avg';
  if (s >= 6) return 'Average';
  if (s >= 5.5) return 'Below Avg';
  if (s >= 5) return 'Mediocre';
  if (s >= 4) return 'Poor';
  return 'Offensive';
}

const CAT_META = {
  gameplay:     { label: 'Gameplay',     icon: '🎮', color: '#ff2d6b' },
  graphics:     { label: 'Graphics',     icon: '🎨', color: '#7c3aed' },
  story:        { label: 'Story',        icon: '📖', color: '#3b82f6' },
  sound:        { label: 'Sound',        icon: '🔊', color: '#06b6d4' },
  performance:  { label: 'Performance',  icon: '⚡', color: '#f59e0b' },
  replayability:{ label: 'Replayability',icon: '🔄', color: '#10b981' },
  innovation:   { label: 'Innovation',   icon: '💡', color: '#8b5cf6' },
  multiplayer:  { label: 'Multiplayer',  icon: '👥', color: '#ec4899' },
  progression:  { label: 'Progression',  icon: '📈', color: '#14b8a6' },
  immersion:    { label: 'Immersion',    icon: '🌍', color: '#f97316' },
};

const GENRES = {
  "Action": "🔫", "Action-Adventure": "🗡️", "Adventure": "🗺️", "Arcade": "👾",
  "Battle Royale": "🏆", "Card Game": "🃏", "Casual": "🎈", "Fighting": "🥊",
  "First-Person Shooter": "🔫", "Horror": "👻", "Indie": "💎", "MMO": "🌐",
  "MOBA": "⚔️", "Open World": "🌍", "Platformer": "🏃", "Puzzle": "🧩",
  "Racing": "🏎️", "Real-Time Strategy": "⏱️", "Roguelike": "🎲", "RPG": "🧙",
  "Sandbox/Open World": "🏗️", "Shooter": "🎯", "Simulation": "🎛️", "Sports": "⚽",
  "Stealth": "🕵️", "Strategy": "♟️", "Survival": "🏕️", "Survival Horror": "🧟",
  "Tower Defense": "🗼", "Turn-Based Strategy": "🔄", "Visual Novel": "📚",
  "Party": "🎉", "Metroidvania": "🗝️", "Souls-like": "💀", "Hack and Slash": "⚔️"
};

const PLATFORMS = ["PC","PlayStation 5","PlayStation 4","Xbox Series X|S","Xbox One","Xbox 360","Nintendo Switch","Wii U","Wii","PS Vita","3DS","Mobile","VR","Other"];

function genreLabel(g) { return GENRES[g] ? `${GENRES[g]} ${g}` : g; }
function perspLabel(p) {
  const icons = {"First-Person":"👁️","Third-Person":"🧍","Top-Down":"⬇️","Side-Scroller":"➡️","Isometric":"🔷","2.5D":"🔶","Mixed":"🔀"};
  return icons[p] ? `${icons[p]} ${p}` : p;
}

function catLabel(cat) { return CAT_META[cat]?.label || cat; }
function subLabel(cat, idx) {
  const defaults = {
    gameplay: ["Controls & Movement","Combat Mechanics","Pacing & Feedback"],
    graphics: ["Art Direction","Technical Quality","Animation","Camera & Composition"],
    story: ["Plot & Structure","Characters & Dialogue","Thematic Depth"],
    sound: ["Score & Themes","Sound Effects","Voice Acting","Ambience"],
    performance: ["Frame Rate & Stability","Load Times","Bug Count","Platform Optimization"],
    replayability: ["Post-Game Content","Branching Paths","Player Incentives"],
    innovation: ["Originality","Execution of Ideas","Genre Impact"],
    multiplayer: ["Netcode","Matchmaking","Community","Content Depth"],
    progression: ["Structure","Pacing","Balance","Integration with Gameplay"],
    immersion: ["World Building","Tone Consistency","Emotional Engagement","UI & HUD"]
  };
  return (defaults[cat] || [])[idx] || '';
}

// ─── Game Page HTML Template ─────────────────────────────────────────────
function gamePageHTML(entry, allGames) {
  const slug = slugify(entry.title);
  const clr = sc(entry.finalScore);
  const ac = Object.keys(entry.subs || {}).filter(c => c !== 'multiplayer' || entry.hasMP);

  // Build related games (same genres)
  const related = allGames
    .filter(g => g.id !== entry.id && (g.genres || []).some(ge => (entry.genres || []).includes(ge)))
    .slice(0, 4);

  // Build category breakdown HTML
  let catHTML = '';
  if (ac.length) {
    catHTML = `<div class="lbl">${'breakdown'}</div>
    <div class="cat-grid">${ac.map(cat => {
      const subs = (entry.subs || {})[cat] || [];
      const cs = subs.length ? r2(avg(subs.map(s => s.score))) : 5;
      const w = (entry.fw || {})[cat] || 0;
      const m = CAT_META[cat] || { label: cat, icon: '', color: '#ff2d6b' };
      const note = (entry.notes || {})[cat] || '';
      const subsHTML = subs.length ? subs.map((s, i) => {
        const sn = subLabel(cat, i) || s.name || '—';
        return `<div class="sub-row"><span>${sn}</span><div class="sub-bar"><div class="sub-fill" style="width:${s.score * 10}%;background:${m.color}"></div></div><span class="sub-score" style="color:${sc(s.score)}">${s.score}</span></div>`;
      }).join('') : '';
      const noteHTML = note ? `<div class="cat-note">"${note}"</div>` : '';
      return `<div class="cat-card" style="--c:${m.color}">
        <div class="cat-top-bar" style="background:linear-gradient(90deg,${m.color},transparent)"></div>
        <div class="cat-label" style="color:${m.color}">${m.icon} ${catLabel(cat).toUpperCase()}</div>
        <div class="cat-score-row">
          <div class="cat-score" style="color:${sc(cs)}">${cs}</div>
          <div class="cat-meta"><span>w:${w}%</span><span style="color:${m.color}">+${(cs * w / 100).toFixed(2)}</span></div>
        </div>
        <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${cs * 10}%;background:${m.color}"></div></div>
        ${subsHTML ? `<div class="cat-subs">${subsHTML}</div>` : ''}
        ${noteHTML}
      </div>`;
    }).join('')}</div>`;
  }

  // Verdict
  const verdictHTML = entry.verdict
    ? `<div class="verdict-box"><div class="lbl">Verdict</div><div class="verdict-text">${entry.verdict}</div></div>`
    : '';

  // Related games
  const relatedHTML = related.length
    ? `<div class="related-section"><div class="lbl">Related Games</div><div class="related-grid">${related.map(g => {
        const rs = slugify(g.title);
        return `<a href="${rs}.html" class="related-card"><div class="related-score" style="color:${sc(g.finalScore)}">${g.finalScore}</div><div class="related-title">${g.title}</div><div class="related-meta">${g.platform}${g.date ? ' · ' + g.date : ''}</div></a>`;
      }).join('')}</div></div>`
    : '';

  // Genre tags
  const genreTags = (entry.genres || []).map(g =>
    `<span class="gtag" style="color:rgba(255,107,138,.9);border-color:rgba(255,45,107,.3);background:rgba(255,45,107,.07)">${genreLabel(g)}</span>`
  ).join('');

  const perspTag = entry.perspective
    ? `<span class="gtag" style="color:#a78bfa;border-color:rgba(167,139,250,.3);background:rgba(167,139,250,.07)">${perspLabel(entry.perspective)}</span>`
    : '';

  const recTag = entry.recommend != null
    ? `<span style="font-size:14px;font-weight:700;color:${entry.recommend ? '#4ade80' : '#ff4d6d'}">${entry.recommend ? '✅ Recommended' : '❌ Not Recommended'}</span>`
    : '';

  const dateStr = entry.savedAt ? new Date(entry.savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${entry.title} | Backlog Therapy</title>
<link rel="icon" type="image/png" href="../${ICON}"/>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#03030a;--bg2:#07070f;--bg3:#0c0c18;--border:rgba(255,255,255,.05);--border2:rgba(255,255,255,.1);--text:#dde0f0;--muted:#383855;--muted2:#5a5a80;--accent:#ff2d6b;--accent2:#7c3aed}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Rajdhani',sans-serif;min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;opacity:.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:9997}
body::after{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.08) 2px,rgba(0,0,0,.08) 4px);pointer-events:none;z-index:9999}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1a1a35;border-radius:2px}
a{color:inherit;text-decoration:none}

/* Header */
.hdr{position:sticky;top:0;z-index:100;background:rgba(3,3,10,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:0 48px;height:60px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.logo{font-family:'Orbitron',sans-serif;font-size:15px;font-weight:900;letter-spacing:4px;color:#fff}
.logo em{color:var(--accent);font-style:normal}
.hdr-nav{display:flex;gap:24px;align-items:center}
.hdr-nav a{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--muted2);letter-spacing:2px;transition:color .15s}
.hdr-nav a:hover{color:#fff}
.hdr-nav a.active{color:var(--accent)}

/* Breadcrumb */
.breadcrumb{padding:16px 48px;font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--muted2);letter-spacing:1px}
.breadcrumb a{color:var(--muted2);transition:color .15s}
.breadcrumb a:hover{color:var(--accent)}
.breadcrumb span{margin:0 8px;opacity:.4}

/* Hero */
.game-hero{position:relative;padding:60px 48px 48px;overflow:hidden}
.hero-bar{position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${clr},${clr}44,transparent)}
.hero-bg-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 70% 40%,${clr}08,transparent 60%);pointer-events:none}
.hero-inner{position:relative;max-width:1100px;margin:0 auto}
.meta-line{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--accent);letter-spacing:3px;margin-bottom:12px;opacity:.7}
.game-title{font-family:'Orbitron',sans-serif;font-size:clamp(24px,4vw,42px);font-weight:900;color:#fff;margin-bottom:24px;line-height:1.1}
.score-section{display:flex;align-items:flex-end;gap:32px;flex-wrap:wrap}
.score-big{font-family:'Orbitron',sans-serif;font-size:80px;font-weight:900;color:${clr};line-height:1;filter:drop-shadow(0 0 20px ${clr}88)}
.score-label{font-family:'Rajdhani',sans-serif;font-size:14px;color:${clr};font-weight:700;letter-spacing:2px;margin-top:6px}
.tags-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.gtag{font-size:12px;padding:4px 12px;border-radius:4px;font-family:'Rajdhani',sans-serif;font-weight:700}

/* Body */
.game-body{max-width:1100px;margin:0 auto;padding:0 48px 80px}
.lbl{font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:#3a3a5a;text-transform:uppercase;margin-bottom:12px}

/* Category Grid */
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-bottom:32px}
.cat-card{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:16px 20px;position:relative;overflow:hidden;transition:border-color .2s,transform .15s}
.cat-card:hover{border-color:var(--border2);transform:translateY(-1px)}
.cat-top-bar{position:absolute;top:0;left:0;right:0;height:2px}
.cat-label{font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:1px;margin-bottom:8px;padding-top:4px}
.cat-score-row{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px}
.cat-score{font-family:'Orbitron',sans-serif;font-size:24px;font-weight:900}
.cat-meta{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--muted2);text-align:right;display:flex;flex-direction:column;gap:2px}
.cat-bar-track{height:3px;background:rgba(255,255,255,.05);border-radius:2px;margin-bottom:12px}
.cat-bar-fill{height:100%;border-radius:2px;opacity:.7;transition:width .4s ease}
.cat-subs{border-top:1px solid var(--border);padding-top:8px;margin-top:4px}
.sub-row{display:flex;align-items:center;gap:10px;padding:5px 0}
.sub-row span:first-child{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;color:#b0b0c8;flex:1}
.sub-bar{width:50px;height:3px;background:rgba(255,255,255,.07);border-radius:2px;flex-shrink:0}
.sub-fill{height:100%;border-radius:2px;opacity:.7}
.sub-score{font-family:'Share Tech Mono',monospace;font-size:13px;font-weight:700;flex-shrink:0;min-width:22px;text-align:right}
.cat-note{font-family:'Rajdhani',sans-serif;font-size:13px;color:#7070a0;font-style:italic;margin-top:10px;padding:10px 14px;background:rgba(255,255,255,.02);border-radius:8px;border-left:2px solid var(--border);line-height:1.6}

/* Verdict */
.verdict-box{background:var(--bg3);border:1px solid var(--border);border-left:3px solid rgba(255,45,107,.5);border-radius:8px;padding:16px 20px;margin-bottom:32px}
.verdict-text{font-family:'Rajdhani',sans-serif;font-size:15px;color:#c0c0d8;line-height:1.7}

/* Related */
.related-section{margin-top:48px;padding-top:32px;border-top:1px solid var(--border)}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.related-card{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:16px;transition:border-color .15s,transform .15s;display:block}
.related-card:hover{border-color:var(--border2);transform:translateY(-2px)}
.related-score{font-family:'Orbitron',sans-serif;font-size:28px;font-weight:900;margin-bottom:8px}
.related-title{font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#e0e0f0;margin-bottom:4px}
.related-meta{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--muted2)}

/* Back button */
.back-btn{display:inline-flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted2);letter-spacing:2px;padding:8px 0;transition:color .15s;cursor:pointer;border:none;background:none}
.back-btn:hover{color:var(--accent)}

/* Footer */
.footer{text-align:center;padding:40px 48px;border-top:1px solid var(--border);font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--muted2);letter-spacing:2px}

@media(max-width:768px){
  .hdr{padding:0 20px}
  .breadcrumb{padding:12px 20px}
  .game-hero,.game-body{padding-left:20px;padding-right:20px}
  .score-big{font-size:56px}
  .cat-grid{grid-template-columns:1fr}
  .related-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
  .footer{padding:30px 20px}
}
</style>
</head>
<body>
<div class="hdr">
  <a href="../index.html" class="logo">BACKLOG<em>THERAPY</em></a>
  <div class="hdr-nav">
    <a href="../index.html">HOME</a>
    <a href="../index.html#list">GAMES</a>
    <a href="https://github.com/ushindo0-0AY/backlog-therapy" target="_blank">GITHUB</a>
  </div>
</div>

<div class="breadcrumb">
  <a href="../index.html">Home</a><span>›</span><a href="../index.html#list">Games</a><span>›</span>${entry.title}
</div>

<div class="game-hero">
  <div class="hero-bar"></div>
  <div class="hero-bg-glow"></div>
  <div class="hero-inner">
    <div class="meta-line">${entry.platform}${entry.date ? ' // ' + entry.date : ''}${entry.playTime ? ' // ' + entry.playTime + 'HRS' : ''}</div>
    <div class="game-title">${entry.title}</div>
    <div class="score-section">
      <div>
        <div class="score-big">${entry.finalScore}</div>
        <div class="score-label">${slbl(entry.finalScore).toUpperCase()}</div>
      </div>
      <div>
        <div class="tags-row">${genreTags}${perspTag}</div>
        ${recTag}
      </div>
    </div>
  </div>
</div>

<div class="game-body">
  ${catHTML}
  ${verdictHTML}
  ${relatedHTML}
  <div style="margin-top:32px">
    <a href="../index.html" class="back-btn">← BACK TO ALL GAMES</a>
  </div>
</div>

<div class="footer">
  BACKLOG THERAPY — ${new Date().getFullYear()}
</div>
</body>
</html>`;
}

// ─── Main ────────────────────────────────────────────────────────────────
function main() {
  console.log('🎮 Backlog Therapy — Page Generator');
  console.log('===================================');

  // Read log.json
  if (!fs.existsSync(LOG_FILE)) {
    console.error('❌ log.json not found at:', LOG_FILE);
    process.exit(1);
  }
  const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  console.log(`📦 Loaded ${log.length} games from log.json`);

  // Ensure games/ directory exists
  if (!fs.existsSync(GAMES_DIR)) {
    fs.mkdirSync(GAMES_DIR, { recursive: true });
    console.log('📁 Created games/ directory');
  }

  // Clean old game pages
  const existingFiles = fs.readdirSync(GAMES_DIR).filter(f => f.endsWith('.html'));
  existingFiles.forEach(f => fs.unlinkSync(path.join(GAMES_DIR, f)));
  if (existingFiles.length) console.log(`🧹 Cleaned ${existingFiles.length} old game page(s)`);

  // Generate pages
  log.forEach(entry => {
    const slug = slugify(entry.title);
    const html = gamePageHTML(entry, log);
    const filePath = path.join(GAMES_DIR, `${slug}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`  ✅ ${slug}.html`);
  });

  console.log(`\n🎉 Done! Generated ${log.length} game page(s) in /games/`);
  console.log('   Push to GitHub and they will be live at:');
  log.forEach(entry => {
    const slug = slugify(entry.title);
    console.log(`   https://ushindo0-0ay.github.io/backlog-therapy/games/${slug}.html`);
  });
}

main();
