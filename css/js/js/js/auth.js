// ─── Player dropdown ─────────────────────────────────────────────────────────

const FALLBACK_PLAYERS = ['Pat West', 'Demo Player'];

function populateDropdown(names) {
  const sel = document.getElementById('login-player');
  if (!sel) { console.error('populateDropdown: #login-player not found'); return; }
  while (sel.options.length > 1) sel.remove(1);
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
  console.log('Dropdown populated with:', names);
}

async function fetchPlayers() {
  console.log('fetchPlayers: starting');

  // Step 1: populate fallback immediately — dropdown is never empty
  populateDropdown(FALLBACK_PLAYERS);

  // Step 2: guard — sb must be available
  if (typeof sb === 'undefined' || typeof sb.from !== 'function') {
    console.warn('fetchPlayers: Supabase client not available — keeping fallback');
    return;
  }

  // Step 3: try Supabase and upgrade the list if successful
  try {
    console.log('fetchPlayers: querying Supabase players table...');
    const { data, error } = await sb
      .from('players')
      .select('id, name')
      .order('name', { ascending: true });

    console.log('fetchPlayers: Supabase response:', { data, error });

    if (error) {
      console.error('fetchPlayers: Supabase error —', error.message, error);
      return; // fallback already showing
    }
    if (!data || data.length === 0) {
      console.warn('fetchPlayers: no rows returned — keeping fallback');
      return;
    }

    // Merge DB players with hardcoded Demo Player (Demo is never in Supabase)
    const merged = [...data.map(p => p.name), 'Demo Player'];
    console.log('fetchPlayers: loaded', data.length, 'from Supabase, merged with Demo Player');
    populateDropdown(merged);

  } catch (err) {
    console.error('fetchPlayers: unexpected error —', err);
    // Fallback already showing — do nothing
  }
}

function rebuildLoginDropdown() { fetchPlayers(); }

// Run as soon as DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fetchPlayers);
} else {
  fetchPlayers();
}

// ─── Login ───────────────────────────────────────────────────────────────────

async function handleLogin() {
  const sel     = document.getElementById('login-player');
  const pin     = document.getElementById('login-pin').value.trim();
  const err     = document.getElementById('login-error');
  const loading = document.getElementById('login-loading');
  const name    = sel.options[sel.selectedIndex]?.text || '';

  err.style.display = 'none';
  if (!sel.value) { err.style.display='block'; err.textContent='Please select a player.'; return; }
  if (!pin)       { err.style.display='block'; err.textContent='Please enter your PIN.';   return; }
  loading.style.display = 'block';

  try {
    // 1. Verify PIN via Supabase RPC
    const { data: players, error: verr } = await sb.rpc('verify_player_pin', { p_name: name, p_pin: pin });

    if (verr || !players || !players.length) {
      loading.style.display = 'none';
      // Fallback: check hardcoded players (Demo Player / offline)
      const fallbackKey = Object.keys(PLAYERS).find(k => PLAYERS[k].name === name);
      if (fallbackKey && (fallbackKey === 'demo_player' || PLAYERS[fallbackKey].pin === pin)) {
        currentPlayer = { ...PLAYERS[fallbackKey], player_id: null, is_admin: PLAYERS[fallbackKey].is_admin || false };
        // Try to get player_id without a full auth session
        try {
          const { data: playerRow } = await sb.from('players').select('id,is_admin').eq('name', name).eq('pin', pin).single();
          if (playerRow) {
            currentPlayer.player_id  = playerRow.id;
            currentPlayer.is_admin   = playerRow.is_admin || currentPlayer.is_admin;
          }
        } catch(authErr) { /* silent — offline or RLS blocked */ }
        launchApp();
        return;
      }
      err.style.display = 'block';
      err.textContent   = 'Incorrect PIN or player not found.';
      return;
    }

    const playerRecord = players[0];

    // 2. Sign in with Supabase Auth (creates account on first login)
    const email = nameToEmail(name);
    let { data: authData, error: authErr } = await sb.auth.signInWithPassword({ email, password: pin });
    if (authErr) {
      const { error: signUpErr } = await sb.auth.signUp({ email, password: pin });
      if (!signUpErr) {
        const res = await sb.auth.signInWithPassword({ email, password: pin });
        authData = res.data;
        if (authData?.user) {
          await sb.rpc('link_user_to_player', { p_name: name, p_pin: pin, p_user_id: authData.user.id });
        }
      }
    }

    // 3. Load all player data from Supabase
    await loadPlayerFromSupabase(playerRecord);

  } catch(e) {
    loading.style.display = 'none';
    // Network / unexpected error — try hardcoded fallback
    const fallbackKey = Object.keys(PLAYERS).find(k => PLAYERS[k].name === name);
    if (fallbackKey && (fallbackKey === 'demo_player' || PLAYERS[fallbackKey].pin === pin)) {
      currentPlayer = { ...PLAYERS[fallbackKey], player_id: null, is_admin: false };
      launchApp();
      return;
    }
    err.style.display = 'block';
    err.textContent   = 'Connection error. Please try again.';
  }
}

async function loadPlayerFromSupabase(playerRecord) {
  const loading = document.getElementById('login-loading');
  const err     = document.getElementById('login-error');
  try {
    // Confirm active session before hitting RLS-protected tables
    const { data: sessionData } = await sb.auth.getSession();
    const session = sessionData?.session;
    if (!session) {
      console.warn('loadPlayerFromSupabase: no active session — RLS queries may return empty');
    } else {
      console.log('loadPlayerFromSupabase: active session for', session.user.email);
    }

    // Fetch all data in parallel — one round-trip for everything
    const [
      { data: rounds,      error: re },
      { data: apprShots },
      { data: teeShots },
      { data: rawHoleData },
      { data: roundRows }
    ] = await Promise.all([
      sb.from('rounds').select('*').eq('player_id', playerRecord.player_id).order('date'),
      sb.from('approach_shots').select('*').eq('player_id', playerRecord.player_id),
      sb.from('tee_shots').select('*').eq('player_id', playerRecord.player_id),
      sb.from('hole_data')
        .select([
          'round_id','hole_number','par','score','fairway',
          'tee_club','tee_dist',
          'appr_club','appr_dist','appr_lr','appr_sl','green','short_sided','pin_loc',
          'num_putts','putt1_len','putt1_hl','putt1_break','putt1_break_amt','putt1_slope',
          'putt2_len','putt2_hl','putt2_break',
          'sg_approach','penalty','bad_reason','bad_club'
        ].join(','))
        .eq('player_id', playerRecord.player_id),
      sb.from('rounds').select('id,date').eq('player_id', playerRecord.player_id)
    ]);

    if (re) console.error('rounds fetch error:', re.message);

    // Attach dates to hole rows via round_id lookup
    const _rdm = {};
    (roundRows || []).forEach(r => { _rdm[r.id] = r.date; });
    const formattedHoleData = (rawHoleData || []).map(h => ({ ...h, date: _rdm[h.round_id] || null }));
    console.log(`Loaded ${formattedHoleData.length} hole_data rows for ${playerRecord.player_name}`);

    const stats          = playerRecord.stats || {};
    const formattedRounds = (rounds || []).map(r => ({
      date:r.date, course:r.course, score:r.score, par:r.par, plus_minus:r.plus_minus,
      birdies:r.birdies, bogeys:r.bogeys, doubles_plus:r.doubles_plus,
      putts:r.putts, gir_pct:r.gir_pct, penalties:r.penalties, fw_pct:r.fw_pct,
      driver_dist:r.driver_dist, scrambling:r.scrambling,
      one_putts:r.one_putts, three_putts:r.three_putts, holes:r.holes || 18
    }));
    const formattedAppr = (apprShots || []).map(s => ({ x:s.x, y:s.y, cat:s.cat, club:s.club, gir:s.gir, dist:s.dist||null }));
    const formattedTee  = (teeShots  || []).map(s => ({ x:s.x, y:s.y, club:s.club, fairway:s.fairway, date:s.date }));

    let rounds_final = formattedRounds;
    let appr_final   = formattedAppr;
    let tee_final    = formattedTee;

    // If Supabase returned nothing, fall back to hardcoded data
    if (!rounds_final.length) {
      const fallbackKey = Object.keys(PLAYERS).find(k => PLAYERS[k].name === playerRecord.player_name);
      if (fallbackKey && PLAYERS[fallbackKey]) {
        const fb = PLAYERS[fallbackKey];
        rounds_final = fb.rounds || [];
        appr_final   = fb.approach_shots || [];
        tee_final    = fb.tee_shots || [];
        Object.assign(stats, {
          approach_cats: stats.approach_cats || fb.approach_cats,
          make_pct:      stats.make_pct      || fb.make_pct,
          par_scoring:   stats.par_scoring   || fb.par_scoring,
          bad_reasons:   stats.bad_reasons   || fb.bad_reasons,
          bad_clubs:     stats.bad_clubs     || fb.bad_clubs,
          proximity:     stats.proximity     || fb.proximity,
        });
      }
    }

    currentPlayer = {
      name:          playerRecord.player_name,
      pin:           playerRecord.stats?.pin || '',
      player_id:     playerRecord.player_id,
      is_admin:      playerRecord.is_admin,
      rounds:        rounds_final,
      approach_shots: appr_final,
      tee_shots:     tee_final,
      approach_cats: stats.approach_cats || {},
      make_pct:      stats.make_pct      || {},
      par_scoring:   stats.par_scoring   || {},
      bad_reasons:   stats.bad_reasons   || {},
      bad_clubs:     stats.bad_clubs     || {},
      proximity:     stats.proximity     || null,
      course_data:   [],
    };

    // Prime all hole caches in one shot — no lazy fetches needed on tab visits
    if (formattedHoleData.length) {
      puttHoleData  = formattedHoleData;
      tigerHoleData = formattedHoleData;
      pinHoleData   = formattedHoleData;
      console.log(`✓ All hole caches primed (${formattedHoleData.length} rows)`);
    }

    launchApp();

  } catch(e) {
    loading.style.display = 'none';
    err.style.display     = 'block';
    err.textContent       = 'Failed to load player data. Please try again.';
    console.error(e);
  }
}

function launchApp() {
  document.getElementById('login-loading').style.display = 'none';
  document.getElementById('player-name-badge').textContent = currentPlayer.name;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const adminBtn = document.getElementById('nav-admin-btn');
  if (adminBtn) adminBtn.style.display = currentPlayer.is_admin ? '' : 'none';
  initApp();
}

async function handleLogout() {
  puttHoleData  = null;
  tigerHoleData = null;
  pinHoleData   = null;
  await sb.auth.signOut().catch(() => {});
  currentPlayer = null;
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e) {} });
  for (let k in charts) delete charts[k];
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-pin').value = '';
  document.getElementById('login-player').value = '';
}

function enterAppFromUpload() {
  if (!uploadedPlayerData) return;
  currentPlayer = uploadedPlayerData.data;
  document.getElementById('player-name-badge').textContent = currentPlayer.name;
  document.getElementById('upload-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  initApp();
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  btn.classList.add('active');
  closeMobileNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileNav() {
  const nav = document.getElementById('main-nav');
  const btn = document.getElementById('hamburger-btn');
  if (nav.classList.contains('open')) { closeMobileNav(); }
  else { nav.classList.add('open'); btn.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
}

function closeMobileNav() {
  const nav = document.getElementById('main-nav');
  const btn = document.getElementById('hamburger-btn');
  nav.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', function(e) {
  const nav = document.getElementById('main-nav');
  const btn = document.getElementById('hamburger-btn');
  if (nav && btn && nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) {
    closeMobileNav();
  }
});

function navToSection(id) {
  const btn = Array.from(document.querySelectorAll('.nav-btn'))
    .find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes("'" + id + "'"));
  if (btn) btn.click();
}

function showDataEntryFromHeader() {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('section-dataentry');
  if (sec) { sec.classList.add('active'); window.scrollTo({ top:0, behavior:'smooth' }); closeMobileNav(); }
}

function toggleSignOut() {
  const pop = document.getElementById('signout-popup');
  if (!pop) return;
  const open = pop.style.display !== 'none';
  pop.style.display = open ? 'none' : 'block';
  const nameEl = document.getElementById('signout-name');
  if (nameEl && currentPlayer) nameEl.textContent = currentPlayer.name;
}

document.addEventListener('click', function(e) {
  const pop   = document.getElementById('signout-popup');
  const badge = document.getElementById('player-badge-btn');
  if (pop && badge && !badge.contains(e.target) && !pop.contains(e.target)) {
    pop.style.display = 'none';
  }
});

// ─── Login page event listeners ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const pinInput = document.getElementById('login-pin');
  if (pinInput) pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  const playerSel = document.getElementById('login-player');
  if (playerSel) playerSel.addEventListener('change', function() {
    const isDemo  = this.value === 'Demo Player' || this.options[this.selectedIndex]?.text === 'Demo Player';
    const hint    = document.getElementById('login-demo-hint');
    const pinEl   = document.getElementById('login-pin');
    const pinLbl  = document.getElementById('login-pin-label');
    if (hint)   hint.style.display   = isDemo ? 'block' : 'none';
    if (pinEl)  { pinEl.placeholder  = isDemo ? 'No PIN needed' : 'Enter your PIN'; if (isDemo) pinEl.value = ''; }
    if (pinLbl) pinLbl.style.color   = isDemo ? 'var(--text-dim)' : '';
  });
});
