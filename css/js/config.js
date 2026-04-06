// ─── Supabase client ────────────────────────────────────────────────────────
let sb;
try {
  const { createClient } = supabase;
  sb = createClient(
    'https://teedtnlqtfjkburfeucl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZWR0bmxxdGZqa2J1cmZldWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDc4OTQsImV4cCI6MjA4OTg4Mzg5NH0.x6qoqeu-Uv6RpSNRY-7OsTN6CeiZwAqX-6LEiz4akEU',
    {
      auth: {
        persistSession: true,
        storageKey: 'ti_auth',
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      // Prevents DataCloneError: Headers object could not be cloned
      global: { fetch: (url, options = {}) => fetch(url, options) },
      realtime: { params: { eventsPerSecond: 1 } }
    }
  );
} catch(e) {
  console.warn('Supabase client failed to initialize:', e.message);
}

// ─── Global state ────────────────────────────────────────────────────────────
let currentPlayer = null;
let puttHoleData  = null;   // null = unfetched, [] = fetched but empty
let tigerHoleData = null;
let pinHoleData   = null;
const charts = {};          // Chart.js instance registry — keyed by canvas id

// Rolling window defaults
let rollingWindow   = 4;
let girRollingWindow = 4;
let bbRollingWindow  = 4;
let drRollingWindow  = 4;
let mgWindow         = 4;
let teeDrClub        = 'Dr';
let teeScatterClub   = 'Dr';
let teeScatterCI     = 0.50;
let dispCat          = 'Mid Iron';
let dispCI           = 0.50;
let dispRecent       = 'all';
let drillState       = {};
let alertsStatKey    = 'gir_pct';
let puttViewMode     = 'make';
let pinStat          = 'pm';
let pinWindow        = 0;
let pinClub          = 'All';
let pinSelected      = null;
let deHoles          = [];
let deCurrentHole    = 0;
let deEditingHole    = -1;
let deTotalHoles     = 18;
let deRoundMeta      = {};
let deEnabled        = {};

// ─── Chart colour palette & font ─────────────────────────────────────────────
const C = {
  green:'rgba(74,222,128,0.9)',  gd:'rgba(74,222,128,0.4)',  gfill:'rgba(74,222,128,0.07)',
  red:  'rgba(248,113,113,0.9)', rd:'rgba(248,113,113,0.4)',
  amber:'rgba(251,191,36,0.9)',  ad:'rgba(251,191,36,0.4)',
  blue: 'rgba(96,165,250,0.9)', bd:'rgba(96,165,250,0.4)',  bfill:'rgba(96,165,250,0.07)',
  grid: 'rgba(42,58,42,0.5)',   txt:'#8fa88f'
};
const FONT = { family:'Barlow', size:12, weight:'500' };

// ─── Shared chart helpers ────────────────────────────────────────────────────
function bOpts(yT = '') {
  return {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor:'#162016', titleColor:'#60a5fa', bodyColor:'#e8f0e8', borderColor:'#2a3a2a', borderWidth:1 }
    },
    scales: {
      x: { grid:{ color:C.grid }, ticks:{ color:C.txt, font:FONT } },
      y: { grid:{ color:C.grid }, ticks:{ color:C.txt, font:FONT },
           title:{ display:!!yT, text:yT, color:C.txt, font:FONT } }
    }
  };
}

function mkChart(id, type, data, opts, plugins) {
  if (charts[id]) { try { charts[id].destroy(); } catch(e) {} }
  const el = document.getElementById(id);
  if (!el) return null;
  charts[id] = new Chart(el.getContext('2d'), { type, data, options: opts || bOpts(), plugins: plugins || [] });
  return charts[id];
}

// ─── Shared utility functions ────────────────────────────────────────────────
function avg(arr) {
  const v = arr.filter(x => x != null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function fmt(v, d = 1) { return v != null && !isNaN(v) ? Number(v).toFixed(d) : '—'; }
function fmtPM(v) { if (v == null) return '—'; return v > 0 ? '+' + v : String(v); }
function rollingAvg(arr, w) {
  return arr.map((_, i) => {
    if (i < w - 1) return null;
    const s = arr.slice(i - w + 1, i + 1).filter(x => x != null);
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
  });
}
function sorted() {
  return [...currentPlayer.rounds].sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Global error catcher ────────────────────────────────────────────────────
window.onerror = function(msg, src, line, col, err) {
  console.error('GLOBAL ERROR:', msg, 'at', src + ':' + line, err);
};
