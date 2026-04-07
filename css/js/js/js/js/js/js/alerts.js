// ═══════════════════════════════════════════════════════════════════
// ALERTS TAB
// ═══════════════════════════════════════════════════════════════════

const ALERT_STATS = [
  {key:'score',         label:'Total Score',         unit:'',    dir:'low',  fmt:(v)=>v==null?'—':v.toFixed(1)},
  {key:'plus_minus',    label:'+/- to Par',           unit:'',    dir:'low',  fmt:(v)=>v==null?'—':(v>=0?'+':'')+v.toFixed(1)},
  {key:'gir_pct',       label:'GIR %',               unit:'%',   dir:'high', fmt:(v)=>v==null?'—':v.toFixed(1)+'%'},
  {key:'fw_pct',        label:'Fairways Hit %',       unit:'%',   dir:'high', fmt:(v)=>v==null?'—':v.toFixed(1)+'%'},
  {key:'scrambling',    label:'Scrambling %',         unit:'%',   dir:'high', fmt:(v)=>v==null?'—':v.toFixed(1)+'%'},
  {key:'driver_dist',   label:'Driver Distance',      unit:'yds', dir:'high', fmt:(v)=>v==null?'—':v.toFixed(0)+' yds'},
  {key:'birdies',       label:'Birdie+ per Round',    unit:'',    dir:'high', fmt:(v)=>v==null?'—':v.toFixed(1)},
  {key:'bogeys_total',  label:'Bogey+ per Round',     unit:'',    dir:'low',  fmt:(v)=>v==null?'—':v.toFixed(1)},
  {key:'one_putts',     label:'1-Putts (GIR)',        unit:'',    dir:'high', fmt:(v)=>v==null?'—':v.toFixed(1)},
  {key:'one_putt_scram',label:'1-Putts Scrambling',   unit:'%',   dir:'high', fmt:(v)=>v==null?'—':v.toFixed(1)+'%'},
  {key:'proximity',     label:'Approach Proximity',   unit:'ft',  dir:'low',  fmt:(v)=>v==null?'—':v.toFixed(1)+' ft'},
  {key:'gir1putt',      label:'GIR 1-Putt %',         unit:'%',   dir:'high', fmt:(v)=>v==null?'—':v.toFixed(1)+'%'},
  {key:'three_putts',   label:'3-Putts',              unit:'',    dir:'low',  fmt:(v)=>v==null?'—':v.toFixed(1)},
  {key:'longest_putt',  label:'Longest Putt Made',    unit:'ft',  dir:'high', fmt:(v)=>v==null?'—':v.toFixed(0)+' ft'},
  {key:'penalties',     label:'Penalty Strokes',      unit:'',    dir:'low',  fmt:(v)=>v==null?'—':v.toFixed(1)},
  {key:'short_sided',   label:'Short-Sided Count',    unit:'',    dir:'low',  fmt:(v)=>v==null?'—':v.toFixed(1)},
];

// ─── My Game (Welcome) window control ────────────────────────────────────────
function setMgWindow(n, btn) {
  mgWindow = n;
  const lbl    = document.getElementById('mg-window-label');
  const snap   = document.getElementById('mg-snapshot-title');
  const scTitle = document.getElementById('mg-score-title');
  const stTitle = document.getElementById('mg-stats-title');
  const focusLbl = document.getElementById('mg-focus-label');
  if (lbl)      lbl.textContent    = n;
  if (snap)     snap.textContent   = `Last ${n} Rounds`;
  if (scTitle)  scTitle.textContent = `Scoring — Last ${n} Rounds`;
  if (stTitle)  stTitle.textContent = `Key Stats — Last ${n} Rounds`;
  if (focusLbl) focusLbl.textContent = `Focus Areas — Last ${n} Rounds`;
  document.querySelectorAll('#mg-window-btns .roll-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  buildMyGame();
}

// ─── Per-round stat extractor ─────────────────────────────────────────────────
function alertGetVal(rnd) {
  const r = rnd;
  switch (alertsStatKey) {
    case 'score':        return r.score != null ? r.score : null;
    case 'plus_minus':   return r.plus_minus != null ? r.plus_minus : null;
    case 'gir_pct':      return r.gir_pct > 0 ? r.gir_pct : null;
    case 'fw_pct':       return r.fw_pct != null ? r.fw_pct : null;
    case 'scrambling':   return r.scrambling != null ? r.scrambling : null;
    case 'driver_dist':  return r.driver_dist != null ? r.driver_dist : null;
    case 'birdies':      return r.birdies != null ? r.birdies : null;
    case 'bogeys_total': return r.bogeys != null ? (r.bogeys + (r.doubles_plus || 0)) : null;
    case 'one_putts':    return r.one_putts != null ? r.one_putts : null;
    case 'one_putt_scram': return r.scrambling != null ? r.scrambling : null;
    case 'proximity': {
      const apprShots = (currentPlayer.approach_shots || [])
        .filter(s => s.date === r.date && s.x != null && s.y != null);
      if (!apprShots.length) return null;
      const radials = apprShots.map(s => Math.sqrt(s.x*s.x + s.y*s.y));
      return Math.round(radials.reduce((a,b) => a+b, 0) / radials.length * 10) / 10;
    }
    case 'putts':        return r.putts != null ? r.putts : null;
    case 'gir1putt': {
      const g  = r.gir_pct > 0 ? r.gir_pct : null;
      const op = r.one_putts != null ? r.one_putts : null;
      if (g == null || op == null) return null;
      const girCount = Math.max(1, Math.round(g / 100 * (r.holes || 18)));
      return Math.round((op / girCount) * 1000) / 10;
    }
    case 'three_putts':  return r.three_putts != null ? r.three_putts : null;
    case 'longest_putt': return null;
    case 'penalties':    return r.penalties != null ? r.penalties : null;
    case 'short_sided':  return null;
    default:             return null;
  }
}

function alertsAvg(rounds) {
  const vals = rounds.map(r => alertGetVal(r)).filter(v => v != null);
  return vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
}

function alertsDelta(a, b, dir) {
  if (a == null || b == null) return null;
  const diff = a - b;
  const improving = dir === 'high' ? diff > 0 : diff < 0;
  const neutral   = Math.abs(diff) < 0.15;
  if (neutral) return { diff, cls:'flat', arrow:'→' };
  return { diff, cls: improving ? 'up' : 'down', arrow: improving ? '↑' : '↓' };
}

// ─── Build alerts tab ─────────────────────────────────────────────────────────
function buildAlerts() {
  const picker = document.getElementById('alerts-stat-picker');
  if (!picker) return;

  const s_sorted = [...currentPlayer.rounds].sort((a,b) => a.date.localeCompare(b.date));
  const orig_key = alertsStatKey;

  picker.innerHTML = ALERT_STATS.map(stat => {
    alertsStatKey = stat.key;
    const last4  = s_sorted.slice(-4).map(r => alertGetVal(r)).filter(v => v != null);
    const last10 = s_sorted.slice(-10).map(r => alertGetVal(r)).filter(v => v != null);
    const avg4   = last4.length  ? last4.reduce((a,b) => a+b, 0)  / last4.length  : null;
    const avg10  = last10.length ? last10.reduce((a,b) => a+b, 0) / last10.length : null;

    let trendCls = '';
    if (avg4 != null && avg10 != null) {
      const improving  = stat.dir === 'high' ? avg4 > avg10 : avg4 < avg10;
      const regressing = stat.dir === 'high' ? avg4 < avg10 : avg4 > avg10;
      if (improving)  trendCls = ' btn-trend-good';
      else if (regressing) trendCls = ' btn-trend-bad';
    }

    alertsStatKey = orig_key;
    return `<button class="alerts-stat-btn${stat.key === alertsStatKey ? ' active' : ''}${trendCls}" onclick="setAlertsStat('${stat.key}',this)">${stat.label}</button>`;
  }).join('');

  renderAlertsContent();
}

function setAlertsStat(key, btn) {
  alertsStatKey = key;
  document.querySelectorAll('.alerts-stat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAlertsContent();
}

function renderAlertsContent() {
  const s    = [...currentPlayer.rounds].sort((a,b) => a.date.localeCompare(b.date));
  const stat = ALERT_STATS.find(x => x.key === alertsStatKey);
  if (!stat || !s.length) return;

  const lastRnd = s[s.length - 1];
  const last4   = s.slice(-4);
  const last10  = s.slice(-10);
  const valLast = alertGetVal(lastRnd);
  const avg4    = alertsAvg(last4);
  const avg10   = alertsAvg(last10);

  // KPI cards
  function kpiCard(label, val, delta, cls, note, sub) {
    const formatted = stat.fmt(val);
    const color = val == null ? 'var(--text-dim)' : stat.dir === 'high'
      ? (val >= avg10*1.05 ? 'var(--green)' : val <= avg10*0.95 ? 'var(--red)' : 'var(--text)')
      : (val <= avg10*0.95 ? 'var(--green)' : val >= avg10*1.05 ? 'var(--red)' : 'var(--text)');
    const deltaHtml = delta
      ? `<div class="alert-delta ${delta.cls}">${delta.arrow} ${Math.abs(delta.diff).toFixed(1)}${stat.unit} vs ${note}</div>`
      : '';
    return `<div class="alert-kpi ${cls}">
      <div class="alert-kpi-label">${label}</div>
      <div class="alert-kpi-val" style="color:${color}">${formatted}</div>
      <div class="alert-kpi-sub">${sub || ''}</div>
      ${deltaHtml}
    </div>`;
  }

  const kpiEl = document.getElementById('alerts-kpis');
  if (kpiEl) {
    const d1     = alertsDelta(valLast, avg4,  stat.dir);
    const d2     = alertsDelta(avg4,   avg10,  stat.dir);
    const l4sub  = last4.length  ? last4.map(r => r.date).sort().reduce((f,l) => `${f.slice(5)} – ${l.slice(5)}`) : '';
    const l10sub = last10.length ? last10.map(r => r.date).sort().reduce((f,l) => `${f.slice(5)} – ${l.slice(5)}`) : '';
    kpiEl.innerHTML =
      kpiCard('Last Round',                       valLast, d1,   'kpi-last', '4-rnd avg',  `${lastRnd.date.slice(5)} — ${lastRnd.course}`) +
      kpiCard('Recent Performance (4-Round Avg)', avg4,    d2,   'kpi-4',   '10-rnd avg', 'Short-term trend · ' + l4sub) +
      kpiCard('Long-Term Average (10 Rounds)',    avg10,   null, 'kpi-10',  '',           'Baseline benchmark · ' + l10sub);
  }

  // Chart title
  const titleEl = document.getElementById('alerts-chart-title');
  if (titleEl) titleEl.textContent = stat.label + ' — Rolling Trend';

  // Rolling averages chart
  const allVals = s.map(r => alertGetVal(r));
  const labels  = s.map(r => r.date.slice(5, 10));

  function rollingAvgStat(arr, w) {
    return arr.map((_, i) => {
      if (i < w - 1) return null;
      const slice = arr.slice(i - w + 1, i + 1).filter(v => v != null);
      return slice.length ? slice.reduce((a,b) => a+b, 0) / slice.length : null;
    });
  }

  const ra4  = rollingAvgStat(allVals, 4);
  const ra10 = rollingAvgStat(allVals, 10);

  if (charts['chart-alerts-trend']) { try { charts['chart-alerts-trend'].destroy(); } catch(e) {} }
  const el = document.getElementById('chart-alerts-trend');
  if (!el) return;

  const allChartVals = [...allVals, ...ra4, ...ra10].filter(v => v != null);
  const yMin = allChartVals.length ? Math.min(...allChartVals) - Math.abs(Math.min(...allChartVals)*0.05) - 1 : 0;
  const yMax = allChartVals.length ? Math.max(...allChartVals) + Math.abs(Math.max(...allChartVals)*0.05) + 1 : 100;

  charts['chart-alerts-trend'] = new Chart(el.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Each Round',  data:allVals, borderColor:'rgba(148,163,184,0.3)', backgroundColor:'transparent',
          pointBackgroundColor:'rgba(148,163,184,0.5)', pointRadius:3, tension:0.2, order:3 },
        { label:'4-Round Avg', data:ra4,     borderColor:C.amber, backgroundColor:'transparent',
          borderWidth:2.5, pointRadius:0, tension:0.4, order:2 },
        { label:'10-Round Avg',data:ra10,    borderColor:C.green, backgroundColor:'transparent',
          borderWidth:2.5, pointRadius:0, tension:0.4, order:1 },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display:true, labels:{ color:C.txt, font:FONT, boxWidth:20 } },
        tooltip: {
          backgroundColor:'#162016', titleColor:'#60a5fa', bodyColor:'#e8f0e8',
          borderColor:'#2a3a2a', borderWidth:1,
          callbacks: { label(ctx) { return `${ctx.dataset.label}: ${ctx.parsed.y != null ? stat.fmt(ctx.parsed.y) : '—'}`; } }
        }
      },
      scales: {
        x: { grid:{ color:C.grid }, ticks:{ color:C.txt, font:FONT, maxTicksLimit:16 } },
        y: { grid:{ color:C.grid }, ticks:{ color:C.txt, font:FONT }, min:yMin, max:yMax,
             title:{ display:true, text:stat.unit||stat.label, color:C.txt, font:FONT } }
      }
    }
  });
}
