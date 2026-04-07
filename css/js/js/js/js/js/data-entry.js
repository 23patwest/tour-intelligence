// ═══════════════════════════════════════════════════════════════════
// DATA ENTRY
// ═══════════════════════════════════════════════════════════════════

const DE_FIELDS = {
  tee_club:       {label:'Tee Club',               group:'Tee Shot',       def:true},
  shape_ott:      {label:'Shot Shape (OTT)',        group:'Tee Shot',       def:true},
  tee_dist:       {label:'Drive Distance (yds)',    group:'Tee Shot',       def:true},
  fairway:        {label:'Fairway Result',          group:'Tee Shot',       def:true},
  tee_miss_lr:    {label:'Tee Target Miss L/R (ft)',group:'Tee Shot',       def:false},
  wind_strength:  {label:'Wind Strength',           group:'Tee Shot',       def:true},
  wind_dir:       {label:'Wind Direction',          group:'Tee Shot',       def:true},
  appr_club:      {label:'Approach Club',           group:'Approach',       def:true},
  appr_dist:      {label:'Target Distance (yds)',   group:'Approach',       def:true},
  shape_appr:     {label:'Approach Shape',          group:'Approach',       def:false},
  appr_lr:        {label:'Approach L/R Miss (ft)',  group:'Approach',       def:true},
  appr_sl:        {label:'Approach S/L Miss (ft)',  group:'Approach',       def:true},
  pin_loc:        {label:'Pin Location',            group:'Approach',       def:true},
  green:          {label:'Green Result',            group:'Approach',       def:true},
  short_sided:    {label:'Short Sided?',            group:'Approach',       def:false},
  num_putts:      {label:'# of Putts',              group:'Putting',        def:true},
  putt1_len:      {label:'Putt 1 Length (ft)',      group:'Putting',        def:true},
  putt1_break:    {label:'Putt 1 Break Direction',  group:'Putting',        def:false},
  putt1_break_amt:{label:'Putt 1 Break Amount',     group:'Putting',        def:false},
  putt1_slope:    {label:'Putt 1 Slope',            group:'Putting',        def:false},
  putt1_hl:       {label:'Putt 1 High/Low Side',    group:'Putting',        def:true},
  putt2_len:      {label:'Putt 2 Length (ft)',      group:'Putting',        def:false},
  putt2_break:    {label:'Putt 2 Break Direction',  group:'Putting',        def:false},
  penalty:        {label:'Penalty Strokes',         group:'Notes',          def:true},
  swing_thought:  {label:'Swing Thought',           group:'Notes',          def:false},
  pressure:       {label:'Under Pressure?',         group:'Notes',          def:false},
  bad_reason:     {label:'Reason for Bad Score',    group:'Notes',          def:true},
  bad_club:       {label:'Bad Score – Club',        group:'Notes',          def:true},
  putt_notes:     {label:'Putting Notes',           group:'Notes',          def:false},
  sg_off_tee:     {label:'SG: Off the Tee',         group:'Strokes Gained', def:false},
  sg_approach:    {label:'SG: Approach',            group:'Strokes Gained', def:false},
  sg_short_game:  {label:'SG: Short Game',          group:'Strokes Gained', def:false},
  sg_putting:     {label:'SG: Putting',             group:'Strokes Gained', def:false},
};

const CLUBS_LIST = ['Dr','3w','4w','5w','7w','2h','3h','4h','5h','7h',
  '2i','3i','4i','5i','6i','7i','8i','9i','PW','50 Deg','54 Deg','56 Deg','58 Deg','60 Deg','Putter'];

const CAT_MAP_DE = {
  'dr':'Driver','3w':'Wood','4w':'Wood','5w':'Wood','7w':'Wood',
  '2h':'Hybrid','3h':'Hybrid','4h':'Hybrid','5h':'Hybrid','7h':'Hybrid',
  '2i':'Long Iron','3i':'Long Iron','4i':'Long Iron',
  '5i':'Mid Iron','6i':'Mid Iron','7i':'Mid Iron','8i':'Mid Iron',
  '9i':'Short Iron','pw':'Short Iron',
  '50 deg':'Wedge','54 deg':'Wedge','56 deg':'Wedge','58 deg':'Wedge','60 deg':'Wedge'
};

// ─── Init ─────────────────────────────────────────────────────────────────────
function initDataEntry() {
  const today = new Date();
  const y = today.getFullYear(), m = String(today.getMonth()+1).padStart(2,'0'), d = String(today.getDate()).padStart(2,'0');
  const el = document.getElementById('de-date');
  if (el) el.value = `${y}-${m}-${d}`;

  const sel = document.getElementById('de-course-select');
  if (sel && currentPlayer) {
    const courses = [...new Set(currentPlayer.rounds.map(r => r.course))].sort();
    sel.innerHTML = '<option value="">— Select a course —</option>' +
      courses.map(c => `<option value="${c}">${c}</option>`).join('') +
      '<option value="__new__">+ Enter a new course…</option>';
    sel.style.display = 'block';
    document.getElementById('de-course').style.display = 'none';
    document.getElementById('de-course-new-btn').style.display = 'none';
    document.getElementById('de-course').value = '';
  }

  deMaybeRestoreProgress();

  const saved = (() => { try { const s = localStorage.getItem('ti_de_fields_' + currentPlayer?.name); return s ? JSON.parse(s) : null; } catch(e) { return null; } })();
  for (const [k, v] of Object.entries(DE_FIELDS)) {
    deEnabled[k] = saved ? (saved[k] ?? v.def) : v.def;
  }
  deRenderFieldConfig();
}

function deRenderFieldConfig() {
  const container = document.getElementById('de-field-cfg');
  if (!container) return;
  const groups = [...new Set(Object.values(DE_FIELDS).map(f => f.group))];
  container.innerHTML = groups.map(g => `
    <div class="de-field-group">
      <div class="de-field-group-title">${g}</div>
      ${Object.entries(DE_FIELDS).filter(([,v]) => v.group === g).map(([k, v]) => `
        <label class="de-field-check">
          <input type="checkbox" id="de-chk-${k}" ${deEnabled[k] ? 'checked' : ''} onchange="deToggleField('${k}',this.checked)">
          <span class="de-field-check-label">${v.label}</span>
        </label>
      `).join('')}
    </div>
  `).join('');
}

function deToggleField(key, val) {
  deEnabled[key] = val;
  try { const o = JSON.parse(localStorage.getItem('ti_de_fields_' + currentPlayer?.name) || '{}'); o[key] = val; localStorage.setItem('ti_de_fields_' + currentPlayer?.name, JSON.stringify(o)); } catch(e) {}
}

function deCheckAll(val) {
  for (const k of Object.keys(DE_FIELDS)) {
    deEnabled[k] = val;
    const el = document.getElementById('de-chk-' + k);
    if (el) el.checked = val;
  }
  try { localStorage.setItem('ti_de_fields_' + currentPlayer?.name, JSON.stringify(deEnabled)); } catch(e) {}
}

// ─── Option button helpers ────────────────────────────────────────────────────
function deSetOpt(btn, grpId, val) {
  const grp = document.getElementById(grpId);
  if (grp) grp.querySelectorAll('.de-opt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn._val = val;
}
function deGetOpt(grpId, fallback = '') {
  const grp = document.getElementById(grpId);
  if (!grp) return fallback;
  const active = grp.querySelector('.de-opt-btn.active');
  return active ? (active._val || active.textContent.trim()) : fallback;
}
function deToggle(divId, btnId) {
  const div = document.getElementById(divId), btn = document.getElementById(btnId);
  if (!div || !btn) return;
  const open = div.style.display !== 'none';
  div.style.display = open ? 'none' : 'block';
  btn.textContent = btn.textContent.replace(/^[▶▼] /, '');
  btn.textContent = (open ? '▶ ' : '▼ ') + btn.textContent;
}

// ─── Course select helpers ────────────────────────────────────────────────────
function deCourseSelectChange(sel) {
  const courseInput = document.getElementById('de-course');
  const newBtn      = document.getElementById('de-course-new-btn');
  if (sel.value === '__new__') {
    sel.style.display        = 'none';
    courseInput.style.display = 'block';
    newBtn.style.display      = 'block';
    courseInput.focus();
  } else {
    courseInput.value = sel.value;
  }
}
function deCourseBack() {
  const sel        = document.getElementById('de-course-select');
  const courseInput = document.getElementById('de-course');
  const newBtn      = document.getElementById('de-course-new-btn');
  sel.style.display = 'block'; sel.value = '';
  courseInput.style.display = 'none'; courseInput.value = '';
  newBtn.style.display = 'none';
}
function deGetCourse() {
  const sel   = document.getElementById('de-course-select');
  const input = document.getElementById('de-course');
  if (sel && sel.style.display !== 'none' && sel.value && sel.value !== '__new__') return sel.value;
  return input ? input.value.trim() : '';
}

// ─── Progress save / restore ──────────────────────────────────────────────────
function deSaveProgress() {
  if (!currentPlayer || deHoles.filter(h => h != null).length === 0) return;
  try {
    localStorage.setItem('ti_de_progress_' + currentPlayer.name, JSON.stringify({
      holes: deHoles, currentHole: deCurrentHole, totalHoles: deTotalHoles,
      meta: deRoundMeta, savedAt: new Date().toISOString()
    }));
  } catch(e) {}
}
function deMaybeRestoreProgress() {
  if (!currentPlayer) return;
  try {
    const saved = localStorage.getItem('ti_de_progress_' + currentPlayer.name);
    if (!saved) return;
    const data = JSON.parse(saved);
    const filledHoles = data.holes.filter(h => h != null).length;
    if (filledHoles === 0) { localStorage.removeItem('ti_de_progress_' + currentPlayer.name); return; }
    const banner = document.getElementById('de-restore-banner');
    if (banner) {
      banner.style.display = 'flex';
      banner.querySelector('#de-restore-info').textContent =
        `${filledHoles} hole${filledHoles > 1 ? 's' : ''} from ${data.meta.course || 'unknown course'} (${data.meta.date || new Date(data.savedAt).toLocaleDateString()})`;
    }
  } catch(e) {}
}
function deRestoreProgress() {
  try {
    const data = JSON.parse(localStorage.getItem('ti_de_progress_' + currentPlayer.name));
    deHoles = data.holes; deTotalHoles = data.totalHoles;
    deRoundMeta = data.meta; deCurrentHole = data.currentHole; deEditingHole = -1;
    document.getElementById('de-setup').style.display = 'none';
    document.getElementById('de-entry').style.display = 'block';
    document.getElementById('de-round-info').textContent = `${deRoundMeta.course} · ${deRoundMeta.date} · ${deTotalHoles} holes`;
    deRenderScorecard();
    let nextEmpty = deHoles.findIndex(h => h == null);
    if (nextEmpty < 0) nextEmpty = deTotalHoles - 1;
    deShowHole(Math.min(nextEmpty, deTotalHoles - 1));
    document.getElementById('de-restore-banner').style.display = 'none';
  } catch(e) { alert('Could not restore progress.'); }
}
function deClearProgress() {
  try { localStorage.removeItem('ti_de_progress_' + (currentPlayer?.name || '')); } catch(e) {}
  document.getElementById('de-restore-banner').style.display = 'none';
}

// ─── Round start / abort ──────────────────────────────────────────────────────
function deStartRound() {
  const date   = document.getElementById('de-date').value;
  const course = deGetCourse();
  const err    = document.getElementById('de-setup-err');
  if (!date)   { err.style.display = 'block'; err.textContent = 'Please enter a date.';        return; }
  if (!course) { err.style.display = 'block'; err.textContent = 'Please enter a course name.'; return; }
  err.style.display = 'none';

  const holesBtn = document.querySelector('#de-holes-grp .de-opt-btn.active');
  deTotalHoles = holesBtn && holesBtn.textContent.includes('9') ? 9 : 18;

  deRoundMeta = {
    date, course,
    tees:    deGetOpt('de-tees-grp',    'Blue'),
    wind:    deGetOpt('de-wind-grp',    'Calm'),
    weather: deGetOpt('de-weather-grp', 'Sunny'),
    warmup:  deGetOpt('de-warmup-grp',  'Average'),
    sleep:   deGetOpt('de-sleep-grp',   'Average'),
    temp:    document.getElementById('de-temp').value  || null,
    notes:   document.getElementById('de-notes').value || null,
  };
  deHoles = []; deCurrentHole = 0; deEditingHole = -1;

  document.getElementById('de-setup').style.display = 'none';
  document.getElementById('de-entry').style.display = 'block';
  document.getElementById('de-round-info').textContent = `${course} · ${date} · ${deTotalHoles} holes`;
  deShowHole(0);
}

function deAbortRound()   { const b = document.getElementById('de-abort-banner'); if (b) b.style.display = 'flex'; }
function deAbortCancel()  { const b = document.getElementById('de-abort-banner'); if (b) b.style.display = 'none'; }
function deAbortConfirm() {
  deClearProgress();
  deHoles = []; deCurrentHole = 0; deEditingHole = -1;
  document.getElementById('de-entry').style.display = 'none';
  document.getElementById('de-setup').style.display = 'block';
  initDataEntry();
}

// ─── Hole form ────────────────────────────────────────────────────────────────
function deShowHole(idx) {
  deCurrentHole = idx; deEditingHole = -1;
  const existing = deHoles[idx] || null;
  const holeNum  = idx + 1;
  document.getElementById('de-hole-title').textContent = `Hole ${holeNum}`;
  document.getElementById('de-progress').style.width   = Math.round(idx / deTotalHoles * 100) + '%';
  deRenderForm(holeNum, existing);
  deRenderScorecard();
  document.getElementById('de-form-body').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function deEditHole(idx) {
  deCurrentHole = idx; deEditingHole = idx;
  document.getElementById('de-hole-title').textContent = `Edit Hole ${idx+1}`;
  deRenderForm(idx + 1, deHoles[idx]);
  document.getElementById('de-form-body').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function deRenderForm(holeNum, existing) {
  const par   = existing?.par   || 4;
  const score = existing?.score || par;

  let html = `
    <div style="display:flex;align-items:flex-start;gap:24px;margin-bottom:20px;flex-wrap:wrap">
      <div>
        <div class="de-label">Par</div>
        <div class="de-btn-group" id="form-par-grp">
          ${[3,4,5].map(p => `<button class="de-opt-btn${par===p?' active':''}" onclick="deSetParBtn(${p},this)">${p}</button>`).join('')}
        </div>
      </div>
      <div>
        <div class="de-label">Score</div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="de-num-btn" onclick="deChangeScore(-1)">−</button>
          <div style="text-align:center;min-width:70px">
            <div id="form-score-num" style="font-family:'Barlow Condensed',sans-serif;font-size:42px;line-height:1">${score}</div>
            <div id="form-score-lbl" style="font-family:'Barlow',sans-serif;font-size:11px;margin-top:-2px" class="${deScoreClass(score,par)}">${deScoreLabel(score,par)}</div>
          </div>
          <button class="de-num-btn" onclick="deChangeScore(1)">+</button>
        </div>
      </div>
    </div>
    <input type="hidden" id="form-par"   value="${par}">
    <input type="hidden" id="form-score" value="${score}">
    <input type="hidden" id="form-hole"  value="${holeNum}">
  `;

  // Tee Shot
  const teeFields = ['tee_club','shape_ott','tee_dist','fairway','tee_miss_lr'];
  if (teeFields.some(f => deEnabled[f])) {
    html += `<div class="de-section" id="form-tee-section" style="${par===3?'opacity:0.4;pointer-events:none':''}">
      <div class="de-section-title" style="display:flex;align-items:center;justify-content:space-between">
        <span>Tee Shot</span>
        <span id="form-tee-par3-note" style="font-family:'Barlow',sans-serif;font-size:10px;color:var(--text-dim)">${par===3?'(par 3 — N/A)':''}</span>
      </div>`;
    if (deEnabled['tee_club'])     html += deSelectHTML('form-tee-club','Club',CLUBS_LIST,existing?.teeClub||'Dr');
    if (deEnabled['shape_ott'])    html += deBtnGroupHTML('form-shape-ott','Shot Shape',['Draw','Straight','Fade'],existing?.shapeOTT||'Straight');
    if (deEnabled['tee_dist'])     html += `<div class="de-field"><label class="de-label">Drive Distance (yds)</label><input type="number" id="form-tee-dist" class="de-input" placeholder="e.g. 265" value="${existing?.teeDist||''}"></div>`;
    if (deEnabled['fairway'])      html += deBtnGroupHTML('form-fairway','Fairway Result',['Hit','Left','Right','Short','Long','Hazard','OB'],existing?.fairway||'');
    if (deEnabled['tee_miss_lr'])  html += `<div class="de-field"><label class="de-label">Target Miss L/R (ft) <span style="color:var(--text-dim);font-weight:400">neg=left</span></label><input type="number" id="form-tee-miss" class="de-input" placeholder="0" value="${existing?.teeMissLR||''}"></div>`;
    if (deEnabled['wind_strength'])html += deBtnGroupHTML('form-wind-strength','Wind Strength',['None','Calm','Moderate','Strong'],existing?.windStrength||'');
    if (deEnabled['wind_dir'])     html += deBtnGroupHTML('form-wind-dir','Wind Direction',['L→R','R→L','Downwind','Into Wind'],existing?.windDir||'');
    html += `</div>`;
  }

  // Approach
  const apprFields = ['appr_club','appr_dist','shape_appr','appr_lr','appr_sl','pin_loc','green','short_sided'];
  if (apprFields.some(f => deEnabled[f])) {
    html += `<div class="de-section"><div class="de-section-title">Approach / Green</div>`;
    if (deEnabled['appr_club'])   html += deSelectHTML('form-appr-club','Approach Club',CLUBS_LIST,existing?.apprClub||'7i');
    if (deEnabled['appr_dist'])   html += `<div class="de-field"><label class="de-label">Target Distance (yds)</label><input type="number" id="form-appr-dist" class="de-input" placeholder="e.g. 145" value="${existing?.apprDist||''}"></div>`;
    if (deEnabled['shape_appr'])  html += deBtnGroupHTML('form-shape-appr','Approach Shape',['Draw','Straight','Fade'],existing?.shapeAppr||'Straight');
    if (deEnabled['appr_lr'])     html += `<div class="de-field"><label class="de-label">L/R Miss (ft) <span style="color:var(--text-dim);font-weight:400">neg=left</span></label><input type="number" id="form-appr-lr" class="de-input" placeholder="0" value="${existing?.apprLR||''}"></div>`;
    if (deEnabled['appr_sl'])     html += `<div class="de-field"><label class="de-label">Short/Long Miss (ft) <span style="color:var(--text-dim);font-weight:400">neg=short</span></label><input type="number" id="form-appr-sl" class="de-input" placeholder="0" value="${existing?.apprSL||''}"></div>`;
    if (deEnabled['pin_loc'])     html += dePinLocHTML(existing?.pinLoc||'');
    if (deEnabled['green'])       html += deBtnGroupHTML('form-green','Green Result',['Hit','Left','Right','Short','Long','Duffed Shot','Skulled Shot'],existing?.green||'');
    if (deEnabled['short_sided']) html += deBtnGroupHTML('form-short-sided','Short Sided?',['Yes','No'],existing?.shortSided||'');
    html += `</div>`;
  }

  // Putting
  const puttFields = ['num_putts','putt1_len','putt1_break','putt1_break_amt','putt1_slope','putt1_hl','putt2_len','putt2_break'];
  if (puttFields.some(f => deEnabled[f])) {
    html += `<div class="de-section"><div class="de-section-title">Putting</div>`;
    if (deEnabled['num_putts']) {
      const np = existing?.numPutts || 2;
      html += `<div class="de-field">
        <div class="de-label"># of Putts</div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="de-num-btn" onclick="dePuttChange(-1)">−</button>
          <div id="form-putts-num" style="font-family:'Barlow Condensed',sans-serif;font-size:36px;min-width:40px;text-align:center">${np}</div>
          <button class="de-num-btn" onclick="dePuttChange(1)">+</button>
        </div>
        <input type="hidden" id="form-num-putts" value="${np}">
      </div>`;
    }
    if (deEnabled['putt1_len'])       html += `<div class="de-field"><label class="de-label">Putt 1 Length (ft)</label><input type="number" id="form-putt1-len" class="de-input" placeholder="e.g. 18" value="${existing?.putt1Len||''}"></div>`;
    if (deEnabled['putt1_break'])     html += deBtnGroupHTML('form-putt1-break','Putt 1 Break',['LR','RL','No Break','Double'],existing?.putt1Break||'');
    if (deEnabled['putt1_break_amt']) html += deBtnGroupHTML('form-putt1-amt','Break Amount',['Shallow','Medium','Large'],existing?.putt1BreakAmt||'');
    if (deEnabled['putt1_slope'])     html += deBtnGroupHTML('form-putt1-slope','Slope',['Uphill','Downhill','Flat','Uphill then Downhill','Downhill then Uphill'],existing?.putt1Slope||'');
    if (deEnabled['putt1_hl'])        html += deBtnGroupHTML('form-putt1-hl','High / Low',['High','Low'],existing?.putt1HL||'');
    if (deEnabled['putt2_len'])       html += `<div class="de-field"><label class="de-label">Putt 2 Length (ft)</label><input type="number" id="form-putt2-len" class="de-input" placeholder="" value="${existing?.putt2Len||''}"></div>`;
    if (deEnabled['putt2_break'])     html += deBtnGroupHTML('form-putt2-break','Putt 2 Break',['LR','RL','No Break'],existing?.putt2Break||'');
    html += `</div>`;
  }

  // Notes
  const noteFields = ['penalty','swing_thought','pressure','bad_reason','bad_club','putt_notes'];
  if (noteFields.some(f => deEnabled[f])) {
    html += `<div class="de-section"><div class="de-section-title">Notes</div>`;
    if (deEnabled['penalty']) {
      const pen = existing?.penalty || 0;
      html += `<div class="de-field"><div class="de-label">Penalty Strokes</div>
        <div class="de-btn-group" id="form-penalty-grp">
          ${[0,1,2,3].map(n => `<button class="de-opt-btn${pen===n?' active':''}" onclick="deSetOpt(this,'form-penalty-grp',${n})">${n}</button>`).join('')}
        </div></div>`;
    }
    if (deEnabled['swing_thought']) html += `<div class="de-field"><label class="de-label">Swing Thought</label><input type="text" id="form-swing" class="de-input" placeholder="e.g. Stay through the ball" value="${existing?.swingThought||''}"></div>`;
    if (deEnabled['pressure'])      html += deBtnGroupHTML('form-pressure','Under Pressure?',['Yes','No'],existing?.pressure||'No');
    if (deEnabled['bad_reason'])    html += `<div class="de-field"><label class="de-label">Reason for Bad Score</label><input type="text" id="form-bad-reason" class="de-input" placeholder="e.g. Pulled tee shot" value="${existing?.badReason||''}"></div>`;
    if (deEnabled['bad_club'])      html += deSelectHTML('form-bad-club','Bad Score Club',['','Dr','3w','5i','6i','7i','8i','9i','PW','54 Deg','Putter'],existing?.badClub||'');
    if (deEnabled['putt_notes'])    html += `<div class="de-field"><label class="de-label">Putting Notes</label><textarea id="form-putt-notes" class="de-input" rows="2" placeholder="Anything notable about your putting…" style="resize:vertical">${existing?.puttNotes||''}</textarea></div>`;
    // Strokes Gained
    const sgFields = ['sg_off_tee','sg_approach','sg_short_game','sg_putting'];
    if (sgFields.some(f => deEnabled[f])) {
      html += `<div class="de-section"><div class="de-section-title">Strokes Gained</div>`;
      if (deEnabled['sg_off_tee'])    html += `<div class="de-field"><label class="de-label">SG: Off the Tee</label><input type="number" step="0.001" id="form-sg-off-tee" class="de-input" placeholder="e.g. 0.412" value="${existing?.sgOffTee||''}"></div>`;
      if (deEnabled['sg_approach'])   html += `<div class="de-field"><label class="de-label">SG: Approach</label><input type="number" step="0.001" id="form-sg-approach" class="de-input" placeholder="e.g. -0.234" value="${existing?.sgApproach||''}"></div>`;
      if (deEnabled['sg_short_game']) html += `<div class="de-field"><label class="de-label">SG: Short Game</label><input type="number" step="0.001" id="form-sg-short-game" class="de-input" placeholder="e.g. 0.118" value="${existing?.sgShortGame||''}"></div>`;
      if (deEnabled['sg_putting'])    html += `<div class="de-field"><label class="de-label">SG: Putting</label><input type="number" step="0.001" id="form-sg-putting" class="de-input" placeholder="e.g. -0.311" value="${existing?.sgPutting||''}"></div>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Nav
  const isEditing = deEditingHole >= 0;
  const isLast    = deCurrentHole === deTotalHoles - 1;
  html += `<div class="de-hole-nav">
    <button class="btn-upload" onclick="deSubmitHole()" style="flex:1;font-size:16px">
      ${isEditing ? 'Update Hole ✓' : isLast ? 'Save Last Hole →' : `Save Hole ${holeNum} →`}
    </button>
    ${deCurrentHole > 0 ? `<button class="roll-btn" onclick="deEditHole(${deCurrentHole-1})" style="font-size:12px;padding:8px 14px">← Prev</button>` : ''}
  </div>`;

  document.getElementById('de-form-body').innerHTML = html;
}

// ─── Form HTML helpers ────────────────────────────────────────────────────────
function deSelectHTML(id, label, options, selected) {
  return `<div class="de-field"><label class="de-label">${label}</label>
    <select id="${id}" class="de-input">
      ${options.map(o => `<option value="${o}"${o===selected?' selected':''}>${o||'—'}</option>`).join('')}
    </select></div>`;
}
function deBtnGroupHTML(id, label, options, selected) {
  return `<div class="de-field"><div class="de-label">${label}</div>
    <div class="de-btn-group" id="${id}-grp">
      ${options.map(o => `<button class="de-opt-btn${o===selected?' active':''}" onclick="deSetOpt(this,'${id}-grp','${o.replace(/'/g,"\\'")}')">${o}</button>`).join('')}
    </div></div>`;
}
function dePinLocHTML(selected) {
  const positions = ['BL','BM','BR','ML','MM','MR','FL','FM','FR'];
  const labels = {FL:'Front-L',FM:'Front-M',FR:'Front-R',ML:'Mid-L',MM:'Mid-M',MR:'Mid-R',BL:'Back-L',BM:'Back-M',BR:'Back-R'};
  return `<div class="de-field"><div class="de-label">Pin Location</div>
    <div class="de-pin-grid" id="form-pin-loc-grp">
      ${positions.map(p => `<button class="de-pin-btn${p===selected?' active':''}" onclick="dePinSelect(this,'${p}')">${labels[p]}</button>`).join('')}
    </div></div>`;
}
function dePinSelect(btn, val) {
  document.querySelectorAll('#form-pin-loc-grp .de-pin-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); btn._val = val;
}

// ─── Score / par helpers ──────────────────────────────────────────────────────
function deSetParBtn(par, btn) {
  document.querySelectorAll('#form-par-grp .de-opt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('form-par').value = par;
  const score = parseInt(document.getElementById('form-score').value) || par;
  document.getElementById('form-score-num').textContent = score;
  const lbl = document.getElementById('form-score-lbl');
  lbl.textContent = deScoreLabel(score, par);
  lbl.className   = deScoreClass(score, par);
  const teeSection = document.getElementById('form-tee-section');
  if (teeSection) {
    teeSection.style.opacity       = par === 3 ? '0.4' : '1';
    teeSection.style.pointerEvents = par === 3 ? 'none' : 'auto';
    const note = document.getElementById('form-tee-par3-note');
    if (note) note.textContent = par === 3 ? '(par 3 — N/A)' : '';
  }
}
function deChangeScore(delta) {
  const par   = parseInt(document.getElementById('form-par').value)   || 4;
  const current = parseInt(document.getElementById('form-score').value) || par;
  const next  = Math.max(1, Math.min(12, current + delta));
  document.getElementById('form-score').value = next;
  document.getElementById('form-score-num').textContent = next;
  const lbl = document.getElementById('form-score-lbl');
  lbl.textContent = deScoreLabel(next, par);
  lbl.className   = deScoreClass(next, par);
}
function dePuttChange(delta) {
  const el = document.getElementById('form-num-putts');
  if (!el) return;
  const next = Math.max(0, Math.min(8, parseInt(el.value || 2) + delta));
  el.value = next;
  document.getElementById('form-putts-num').textContent = next;
}
function deScoreLabel(score, par) {
  const d = score - par;
  if (d <= -3) return 'Albatross!'; if (d === -2) return 'Eagle'; if (d === -1) return 'Birdie';
  if (d === 0) return 'Par'; if (d === 1) return 'Bogey'; if (d === 2) return 'Double';
  if (d === 3) return 'Triple'; return d + '+ over';
}
function deScoreClass(score, par) {
  const d = score - par;
  if (d <= -2) return 'de-score-eagle'; if (d === -1) return 'de-score-birdie';
  if (d === 0) return 'de-score-par';   if (d === 1)  return 'de-score-bogey';
  if (d === 2) return 'de-score-double'; return 'de-score-bad';
}

// ─── Read form values ─────────────────────────────────────────────────────────
function deGetField(id, fallback = null) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value || fallback;
  return fallback;
}
function deGetBtn(grpId, fallback = '') {
  const grp = document.getElementById(grpId + '-grp');
  if (!grp) return fallback;
  const a = grp.querySelector('.de-opt-btn.active,.de-pin-btn.active');
  return a ? (a._val || a.textContent.trim()) : fallback;
}
function deGetPinLoc() {
  const a = document.querySelector('#form-pin-loc-grp .de-pin-btn.active');
  return a ? a._val : null;
}

function deCollectHole() {
  const par     = parseInt(deGetField('form-par', 4));
  const score   = parseInt(deGetField('form-score', par));
  const holeNum = parseInt(deGetField('form-hole', deCurrentHole + 1));
  return {
    hole: holeNum, par, score,
    teeClub:      deEnabled.tee_club       ? deGetField('form-tee-club')                    : null,
    shapeOTT:     deEnabled.shape_ott      ? deGetBtn('form-shape-ott')                     : null,
    teeDist:      deEnabled.tee_dist       ? parseFloat(deGetField('form-tee-dist'))  || null : null,
    fairway:      deEnabled.fairway        ? deGetBtn('form-fairway')                        : null,
    teeMissLR:    deEnabled.tee_miss_lr    ? parseFloat(deGetField('form-tee-miss'))  || null : null,
    windStrength: deEnabled.wind_strength  ? deGetBtn('form-wind-strength')                  : null,
    windDir:      deEnabled.wind_dir       ? deGetBtn('form-wind-dir')                       : null,
    apprClub:     deEnabled.appr_club      ? deGetField('form-appr-club')                    : null,
    apprDist:     deEnabled.appr_dist      ? parseFloat(deGetField('form-appr-dist'))  || null : null,
    shapeAppr:    deEnabled.shape_appr     ? deGetBtn('form-shape-appr')                     : null,
    apprLR:       deEnabled.appr_lr        ? parseFloat(deGetField('form-appr-lr'))   || null : null,
    apprSL:       deEnabled.appr_sl        ? parseFloat(deGetField('form-appr-sl'))   || null : null,
    pinLoc:       deEnabled.pin_loc        ? deGetPinLoc()                                   : null,
    green:        deEnabled.green          ? deGetBtn('form-green')                          : null,
    shortSided:   deEnabled.short_sided    ? deGetBtn('form-short-sided')                    : null,
    numPutts:     deEnabled.num_putts      ? parseInt(deGetField('form-num-putts', 2))       : null,
    putt1Len:     deEnabled.putt1_len      ? parseFloat(deGetField('form-putt1-len')) || null : null,
    putt1Break:   deEnabled.putt1_break    ? deGetBtn('form-putt1-break')                    : null,
    putt1BreakAmt:deEnabled.putt1_break_amt? deGetBtn('form-putt1-amt')                      : null,
    putt1Slope:   deEnabled.putt1_slope    ? deGetBtn('form-putt1-slope')                    : null,
    putt1HL:      deEnabled.putt1_hl       ? deGetBtn('form-putt1-hl')                       : null,
    putt2Len:     deEnabled.putt2_len      ? parseFloat(deGetField('form-putt2-len')) || null : null,
    putt2Break:   deEnabled.putt2_break    ? deGetBtn('form-putt2-break')                    : null,
    penalty:      deEnabled.penalty        ? parseInt(deGetOpt('form-penalty-grp','0')) || 0  : 0,
    swingThought: deEnabled.swing_thought  ? deGetField('form-swing')                        : null,
    pressure:     deEnabled.pressure       ? deGetBtn('form-pressure')                       : null,
    badReason:    deEnabled.bad_reason     ? deGetField('form-bad-reason')                   : null,
    badClub:      deEnabled.bad_club       ? deGetField('form-bad-club')                     : null,
    puttNotes:    deEnabled.putt_notes     ? deGetField('form-putt-notes')                   : null,
    sgOffTee:     deEnabled.sg_off_tee     ? parseFloat(deGetField('form-sg-off-tee'))  || null : null,
    sgApproach:   deEnabled.sg_approach    ? parseFloat(deGetField('form-sg-approach'))  || null : null,
    sgShortGame:  deEnabled.sg_short_game  ? parseFloat(deGetField('form-sg-short-game'))|| null : null,
    sgPutting:    deEnabled.sg_putting     ? parseFloat(deGetField('form-sg-putting'))   || null : null,
  };
}

// ─── Submit hole ──────────────────────────────────────────────────────────────
function deSubmitHole() {
  const data = deCollectHole();
  if (deEditingHole >= 0) {
    deHoles[deEditingHole] = data; deEditingHole = -1;
  } else {
    deHoles[deCurrentHole] = data;
    if (deCurrentHole < deTotalHoles - 1) { deShowHole(deCurrentHole + 1); return; }
  }
  deRenderScorecard();
  deSaveProgress();
  const allDone = deHoles.filter(h => h != null).length === deTotalHoles;
  if (allDone) {
    document.getElementById('de-hole-title').textContent   = 'Round Complete!';
    document.getElementById('de-progress').style.width     = '100%';
    document.getElementById('de-save-btn').style.display   = 'block';
    document.getElementById('de-form-body').innerHTML = `
      <div style="padding:20px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">✅</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;letter-spacing:2px;color:var(--blue);margin-bottom:8px">All ${deTotalHoles} Holes Entered</div>
        <div style="font-family:'Barlow',sans-serif;font-size:12px;color:var(--text-dim);margin-bottom:20px">Review your scorecard. Click any row to edit a hole, then save your round.</div>
        <button class="roll-btn" onclick="deShowHole(0)" style="font-size:12px;padding:8px 16px">← Review from Hole 1</button>
      </div>`;
  } else if (deEditingHole === -1) {
    document.getElementById('de-form-body').innerHTML = `
      <div style="padding:20px;text-align:center">
        <div style="font-family:'Barlow',sans-serif;font-size:12px;color:var(--text-dim)">Hole updated. Review scorecard or save.</div>
        <button class="roll-btn" onclick="deShowHole(${data.hole-1})" style="margin-top:12px;font-size:12px">← Back to Hole ${data.hole}</button>
      </div>`;
  }
}

// ─── Scorecard ────────────────────────────────────────────────────────────────
function deRenderScorecard() {
  const tbody = document.getElementById('de-sc-body');
  const tfoot = document.getElementById('de-sc-foot');
  if (!tbody || !tfoot) return;
  let totalScore = 0, totalPar = 0, rowsHtml = '';
  for (let i = 0; i < deTotalHoles; i++) {
    const h = deHoles[i];
    if (h) {
      totalScore += h.score; totalPar += h.par;
      const pm = h.score - h.par;
      const pmStr = pm > 0 ? '+' + pm : pm === 0 ? 'E' : String(pm);
      const pmCls = pm < 0 ? 'val-green' : pm === 0 ? '' : pm === 1 ? 'val-amber' : 'val-red';
      rowsHtml += `<tr class="de-sc-row" onclick="deEditHole(${i})" title="Tap to edit hole ${i+1}">
        <td>${i+1}</td><td>${h.par}</td>
        <td class="${pmCls}" style="font-weight:600">${h.score}</td>
        <td class="${pmCls}">${pmStr}</td>
      </tr>`;
    } else {
      rowsHtml += `<tr style="opacity:0.3"><td>${i+1}</td><td>—</td><td>—</td><td>—</td></tr>`;
    }
  }
  tbody.innerHTML = rowsHtml;
  if (deHoles.filter(h => h != null).length > 0) {
    const pm = totalScore - totalPar;
    const pmStr = pm > 0 ? '+' + pm : pm === 0 ? 'E' : String(pm);
    tfoot.innerHTML = `<tr style="border-top:2px solid var(--border)">
      <td colspan="2" style="font-weight:700;color:var(--text)">Total</td>
      <td style="font-weight:700;color:var(--text)">${totalScore}</td>
      <td style="font-weight:700;color:${pm<0?'var(--green)':pm>0?'var(--red)':'var(--text)'}">${pmStr}</td>
    </tr>`;
    const pmCls = pm <= 4 ? 'val-green' : pm >= 10 ? 'val-red' : 'val-amber';
    document.getElementById('de-running-total').innerHTML = `<span class="${pmCls}">${totalScore} (${pmStr})</span>`;
  }
}

// ─── Save round to Supabase + update in-memory state ─────────────────────────
async function deSaveRound() {
  const holes = deHoles.filter(h => h != null);
  if (holes.length < 9) { alert('Need at least 9 holes to save a round.'); return; }

  const totalScore   = holes.reduce((s,h) => s + h.score, 0);
  const totalPar     = holes.reduce((s,h) => s + h.par, 0);
  const birdies      = holes.filter(h => h.score < h.par).length;
  const bogeys       = holes.filter(h => h.score > h.par && h.score < h.par+2).length;
  const doubles      = holes.filter(h => h.score >= h.par+2).length;
  const totalPutts   = holes.some(h => h.numPutts != null) ? holes.reduce((s,h) => s+(h.numPutts||0), 0) : null;
  const girHoles     = holes.filter(h => h.green && h.green.toLowerCase() === 'hit');
  const girPct       = Math.round(girHoles.length / holes.length * 1000) / 10;
  const penalties    = holes.reduce((s,h) => s+(h.penalty||0), 0);
  const fwHoles      = holes.filter(h => h.par !== 3 && h.fairway && h.fairway !== '');
  const fwHit        = fwHoles.filter(h => h.fairway === 'Hit').length;
  const fwPct        = fwHoles.length > 0 ? Math.round(fwHit/fwHoles.length*1000)/10 : null;
  const drHoles      = holes.filter(h => h.teeClub && h.teeClub.toLowerCase() === 'dr' && h.teeDist);
  const driverDist   = drHoles.length > 0 ? Math.round(drHoles.reduce((s,h) => s+h.teeDist, 0)/drHoles.length) : null;
  const missedGIR    = holes.filter(h => !h.green || h.green.toLowerCase() !== 'hit');
  const scramPct     = missedGIR.length > 0 ? Math.round(missedGIR.filter(h => h.score<=h.par).length/missedGIR.length*1000)/10 : 0;
  const onePutts     = holes.filter(h => h.numPutts === 1).length;
  const threePutts   = holes.filter(h => h.numPutts && h.numPutts >= 3).length;
  const par5Holes    = holes.filter(h => h.par === 5);
  const par5Bogeys   = par5Holes.filter(h => h.score > h.par).length;
  const siHoles      = holes.filter(h => { if (!h.apprClub) return false; const c = h.apprClub.toLowerCase().replace(/\s+/g,''); return c==='9i'||c==='pw'||c==='10i'||c.includes('deg'); });
  const siBogeys     = siHoles.filter(h => h.score > h.par).length;
  const failedUD     = holes.filter(h => (!h.green||h.green.toLowerCase()!=='hit') && (!h.shortSided||h.shortSided.toLowerCase()!=='yes') && h.score>h.par).length;
  const easyUDAttempts = missedGIR.filter(h => !h.shortSided||h.shortSided.toLowerCase()!=='yes').length;

  const newRound = {
    date:deRoundMeta.date, course:deRoundMeta.course,
    score:totalScore, par:totalPar, plus_minus:totalScore-totalPar,
    birdies, bogeys, doubles_plus:doubles, putts:totalPutts,
    gir_pct:girPct, penalties, fw_pct:fwPct, driver_dist:driverDist,
    scrambling:scramPct, one_putts:onePutts, three_putts:threePutts,
    holes:holes.length, par5_bogeys:par5Bogeys, par5_holes:par5Holes.length,
    si_bogeys:siBogeys, si_holes:siHoles.length,
    failed_ud:failedUD, easy_ud_attempts:easyUDAttempts,
  };

  currentPlayer.rounds.push(newRound);

  // Update par_scoring
  const psGroups = {3:[],4:[],5:[]};
  holes.forEach(h => { if ([3,4,5].includes(h.par)) psGroups[h.par].push(h.score - h.par); });
  const ps = currentPlayer.par_scoring || {};
  for (const [p, arr] of Object.entries(psGroups)) {
    if (arr.length > 0) {
      const oldVal = ps[String(p)] || 0, oldCount = currentPlayer.rounds.length - 1;
      ps[String(p)] = Math.round(((oldVal*oldCount) + arr.reduce((a,b)=>a+b,0)) / (oldCount+arr.length) * 100) / 100;
    }
  }
  currentPlayer.par_scoring = ps;

  // Update approach_cats + scatter
  const newApprShots = holes.filter(h => h.apprClub && h.apprLR != null);
  if (newApprShots.length > 0) {
    const cats = currentPlayer.approach_cats || {};
    for (const h of newApprShots) {
      const cat = CAT_MAP_DE[h.apprClub.toLowerCase()] || 'Other';
      if (!cats[cat]) cats[cat] = {shots:0, lr_miss:0, sl_miss:0, gir_pct:0, clubs:[]};
      const d = cats[cat], n = d.shots;
      const isGIR = h.green && h.green.toLowerCase() === 'hit' ? 1 : 0;
      d.lr_miss = Math.round(((d.lr_miss*n)+(h.apprLR))/(n+1)*10)/10;
      d.sl_miss = Math.round(((d.sl_miss*n)+(h.apprSL||0))/(n+1)*10)/10;
      d.gir_pct = Math.round(((d.gir_pct/100*n)+isGIR)/(n+1)*1000)/10;
      d.shots++;
      let ce = d.clubs.find(c => c.club === h.apprClub);
      if (!ce) { ce = {club:h.apprClub,shots:0,lr_miss:0,sl_miss:0,gir_pct:0}; d.clubs.push(ce); }
      const cn = ce.shots;
      ce.lr_miss = Math.round(((ce.lr_miss*cn)+(h.apprLR))/(cn+1)*10)/10;
      ce.sl_miss = Math.round(((ce.sl_miss*cn)+(h.apprSL||0))/(cn+1)*10)/10;
      ce.gir_pct = Math.round(((ce.gir_pct/100*cn)+isGIR)/(cn+1)*1000)/10;
      ce.shots++;
    }
    currentPlayer.approach_cats = cats;
    const newScatter = newApprShots.map(h => ({
      x:h.apprLR, y:h.apprSL||0, cat:CAT_MAP_DE[h.apprClub.toLowerCase()]||'Other',
      club:h.apprClub, gir:h.green?.toLowerCase()==='hit', dist:h.apprDist||null
    }));
    currentPlayer.approach_shots = [...(currentPlayer.approach_shots||[]), ...newScatter];
  }

  // Update tee shots
  const newTeeShots = holes.filter(h => h.teeClub && h.teeDist).map(h => ({
    x:h.teeMissLR||0, y:h.teeDist, club:h.teeClub, fairway:h.fairway==='Hit', date:deRoundMeta.date
  }));
  currentPlayer.tee_shots = [...(currentPlayer.tee_shots||[]), ...newTeeShots];

  // Update make_pct
  const puttBuckets = {'0-3':[],'3-5':[],'5-8':[],'8-12':[],'12-20':[],'20-35':[],'35-50':[],'50+':[]};
  holes.filter(h => h.putt1Len != null).forEach(h => {
    const d = h.putt1Len;
    const bkt = d<=3?'0-3':d<=5?'3-5':d<=8?'5-8':d<=12?'8-12':d<=20?'12-20':d<=35?'20-35':d<=50?'35-50':'50+';
    puttBuckets[bkt].push(h.numPutts === 1 ? 1 : 0);
  });
  const mp = currentPlayer.make_pct || {};
  for (const [b, arr] of Object.entries(puttBuckets)) {
    if (arr.length > 0) {
      const existingPct = mp[b] || null;
      const newPct = arr.reduce((a,b) => a+b, 0) / arr.length * 100;
      mp[b] = existingPct != null ? Math.round((existingPct+newPct)/2*10)/10 : Math.round(newPct*10)/10;
    }
  }
  currentPlayer.make_pct = mp;

  // Refresh course dropdown
  const sel2 = document.getElementById('de-course-select');
  if (sel2 && currentPlayer) {
    const courses = [...new Set(currentPlayer.rounds.map(r => r.course))].sort();
    sel2.innerHTML = '<option value="">— Select a course —</option>' +
      courses.map(c => `<option value="${c}">${c}</option>`).join('') +
      '<option value="__new__">+ Enter a new course…</option>';
  }

  // Persist locally
  try {
    const stored = JSON.parse(localStorage.getItem('ti_players') || '{}');
    if (stored[currentPlayer.name]) { stored[currentPlayer.name] = currentPlayer; localStorage.setItem('ti_players', JSON.stringify(stored)); }
  } catch(e) {}

  // Rebuild analytics
  buildDashboard(); buildScoring(); buildTee(); buildApproach();
  buildShotDispersion(); buildPutting(); buildBirdiesBogeys(); buildTigerFive();

  // Save to Supabase
  if (currentPlayer.player_id) {
    try {
      const { data: savedRound, error: rErr } = await sb.from('rounds').insert({
        player_id:currentPlayer.player_id,
        date:deRoundMeta.date, course:deRoundMeta.course,
        score:newRound.score, par:newRound.par, plus_minus:newRound.plus_minus,
        birdies:newRound.birdies, bogeys:newRound.bogeys, doubles_plus:newRound.doubles_plus,
        putts:newRound.putts, gir_pct:newRound.gir_pct, penalties:newRound.penalties,
        fw_pct:newRound.fw_pct, driver_dist:newRound.driver_dist, scrambling:newRound.scrambling,
        one_putts:newRound.one_putts, three_putts:newRound.three_putts, holes:holes.length,
        par5_bogeys:newRound.par5_bogeys, par5_holes:newRound.par5_holes,
        si_bogeys:newRound.si_bogeys, si_holes:newRound.si_holes,
        failed_ud:newRound.failed_ud, easy_ud_attempts:newRound.easy_ud_attempts
      }).select().single();

      if (!rErr && savedRound) {
        const holeRows = holes.map(h => ({
          round_id:savedRound.id, player_id:currentPlayer.player_id,
          hole_number:h.hole, par:h.par, score:h.score,
          tee_club:h.teeClub||null, shape_ott:h.shapeOTT||null, tee_dist:h.teeDist||null,
          fairway:h.fairway||null, tee_miss_lr:h.teeMissLR||null,
          wind_strength:h.windStrength||null, wind_dir:h.windDir||null,
          appr_club:h.apprClub||null, appr_dist:h.apprDist||null,
          appr_lr:h.apprLR??null, appr_sl:h.apprSL??null,
          pin_loc:h.pinLoc||null, green:h.green||null, short_sided:h.shortSided||null,
          num_putts:h.numPutts??null,
          putt1_len:h.putt1Len??null, putt1_break:h.putt1Break||null,
          putt1_break_amt:h.putt1BreakAmt||null, putt1_slope:h.putt1Slope||null,
          putt1_hl:h.putt1HL||null,
          putt2_len:h.putt2Len??null, putt2_break:h.putt2Break||null,
          penalty:h.penalty||0, bad_reason:h.badReason||null, bad_club:h.badClub||null,
          putt_notes:h.puttNotes||null,
          sg_off_tee:h.sgOffTee??null, sg_approach:h.sgApproach??null,
          sg_short_game:h.sgShortGame??null, sg_putting:h.sgPutting??null,
        }));
        const { error: hdErr } = await sb.from('hole_data').insert(holeRows);
        if (hdErr) {
          console.error('hole_data insert error:', hdErr.message, hdErr);
        } else {
          console.log(`✓ ${holeRows.length} hole records saved for round ${savedRound.id}`);
          const newHoleData = holeRows.map(h => ({ ...h, date: deRoundMeta.date }));
          puttHoleData  = [...(puttHoleData  || []), ...newHoleData];
          tigerHoleData = [...(tigerHoleData || []), ...newHoleData];
          pinHoleData   = [...(pinHoleData   || []), ...newHoleData];
        }
        if (newApprShots.length) {
          await sb.from('approach_shots').insert(newApprShots.map(h => {
            const cat = CAT_MAP_DE[(h.apprClub||'').toLowerCase()] || 'Other';
            return { player_id:currentPlayer.player_id, round_id:savedRound.id, x:h.apprLR, y:h.apprSL||0, cat, club:h.apprClub, gir:h.green?.toLowerCase()==='hit' };
          }));
        }
        if (newTeeShots.length) {
          await sb.from('tee_shots').insert(newTeeShots.map(s => ({
            player_id:currentPlayer.player_id, round_id:savedRound.id,
            x:s.x||0, y:s.y, club:s.club, fairway:s.fairway, date:deRoundMeta.date
          })));
        }
        await sb.from('players').update({
          stats: {
            approach_cats:currentPlayer.approach_cats, make_pct:currentPlayer.make_pct,
            par_scoring:currentPlayer.par_scoring, bad_reasons:currentPlayer.bad_reasons,
            bad_clubs:currentPlayer.bad_clubs, proximity:currentPlayer.proximity,
          },
          updated_at: new Date().toISOString()
        }).eq('id', currentPlayer.player_id);
      }
    } catch(e) {
      console.error('Supabase save error:', e);
    }
  }

  deClearProgress();
  deHoles = []; deCurrentHole = 0; deEditingHole = -1;
  document.getElementById('de-entry').style.display = 'none';
  document.getElementById('de-setup').style.display = 'block';
  document.getElementById('de-course').value = '';
  initDataEntry();

  const meta = document.getElementById('dash-meta');
  if (meta) {
    meta.textContent = `✓ Round saved! ${currentPlayer.rounds.length} rounds tracked`;
    meta.style.color = 'var(--green)';
    setTimeout(() => { meta.textContent = `${currentPlayer.rounds.length} rounds tracked`; meta.style.color = ''; }, 3000);
  }

  const overviewBtn = document.querySelector('.nav-btn');
  if (overviewBtn) overviewBtn.click();

  alert(`Round saved! ${totalScore} (${totalScore-totalPar>=0?'+':''}${totalScore-totalPar}) at ${deRoundMeta.course}`);
}
