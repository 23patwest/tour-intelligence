// ═══════════════════════════════════════════════════════════════════
// ANALYTICS — all tab-building functions
// ═══════════════════════════════════════════════════════════════════

// ─── App init ────────────────────────────────────────────────────────────────
function initApp() {
  const safe = (fn, name) => { try { fn(); } catch(e) { console.error('Tab build error ['+name+']:', e); } };
  safe(buildMyGame,       'MyGame');
  safe(buildDashboard,    'Dashboard');
  safe(buildTee,          'Tee');
  buildPinPerformance().catch(e => console.error('Tab build error [PinPerf]:', e));
  safe(buildApproach,     'Approach');
  safe(buildShotDispersion,'Dispersion');
  buildPutting();
  safe(buildAICaddie,     'AICaddie');
  safe(buildDefinitions,  'Definitions');
  safe(buildBirdiesBogeys,'BirdiesBogeys');
  buildTigerFive().catch(e => console.error('Tab build error [TigerFive]:', e));
  safe(buildBadGood,      'BadGood');
  safe(initDataEntry,     'DataEntry');
  safe(buildAlerts,       'Alerts');
  if (currentPlayer?.is_admin) { safe(buildAdminDashboard,'Admin'); buildAdminDebug().catch(()=>{}); }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function buildDashboard() {
  const r = currentPlayer.rounds;
  const s = sorted();
  const scores = r.map(x=>x.score), pm = r.map(x=>x.plus_minus);
  const gir  = r.filter(x=>x.gir_pct>0).map(x=>x.gir_pct);
  const scram = r.filter(x=>x.scrambling!=null).map(x=>x.scrambling);
  const fw    = r.filter(x=>x.fw_pct!=null).map(x=>x.fw_pct);
  const a_score=avg(scores), a_pm=avg(pm), best=Math.min(...scores);
  const a_gir=avg(gir), a_scram=avg(scram), a_fw=avg(fw);
  const a_dr  = avg(r.filter(x=>x.driver_dist).map(x=>x.driver_dist));
  const prox  = currentPlayer.proximity || null;
  const cats  = currentPlayer.approach_cats || {};
  let totSh=0,totLR=0,totSL=0;
  for (const d of Object.values(cats)) { if(d.shots&&d.lr_miss!=null){totSh+=d.shots;totLR+=d.lr_miss*d.shots;totSL+=d.sl_miss*d.shots;} }
  const avgLR=totSh>0?totLR/totSh:null, avgSL=totSh>0?totSL/totSh:null;

  document.getElementById('dash-meta').textContent    = `${r.length} rounds tracked`;
  document.getElementById('rounds-count').textContent  = `${r.length} total rounds`;

  const girTT   = `<span class="tooltip-icon">?<span class="tooltip-box"><strong>GIR % Calculation</strong><br><br>A green is hit "in regulation" when the ball is on the putting surface in (par − 2) strokes.<br><br>• Par 3: on the green in 1<br>• Par 4: on the green in 2<br>• Par 5: on the green in 3<br><br>GIR % = (GIRs ÷ 18) × 100</span></span>`;
  const scramTT = `<span class="tooltip-icon">?<span class="tooltip-box"><strong>Scrambling % Calculation</strong><br><br>The % of holes where you missed the green in regulation but still made par or better.<br><br>Scrambling % = (Pars-or-better after missed GIR ÷ total missed GIRs) × 100<br><br>A high % means strong short-game rescue ability.</span></span>`;
  const proxTT  = `<span class="tooltip-icon">?<span class="tooltip-box"><strong>Proximity to Hole</strong><br><br>Average radial distance of approach shots from the pin, calculated as √(L/R miss² + S/L miss²). Lower is better.<br><br>PGA Tour average: ~22 ft</span></span>`;
  const lrTT    = `<span class="tooltip-icon">?<span class="tooltip-box"><strong>Left/Right Miss</strong><br><br>Weighted average of approach shot Left/Right miss across all club categories.<br><br>Negative = left of target, Positive = right of target.</span></span>`;
  const slTT    = `<span class="tooltip-icon">?<span class="tooltip-box"><strong>Short/Long Miss</strong><br><br>Weighted average of approach shot Short/Long miss across all club categories.<br><br>Negative = short of target, Positive = long of target.</span></span>`;

  const lrCls = avgLR!=null&&Math.abs(avgLR)<=8?'stat-good':'stat-neutral';
  const slCls = avgSL!=null&&Math.abs(avgSL)<=10?'stat-good':'stat-neutral';

  document.getElementById('career-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Scoring Avg</div><div class="stat-value">${fmt(a_score,1)}</div><div class="stat-sub">${fmtPM(+(a_pm||0).toFixed(1))} avg to par</div></div>
    <div class="stat-card"><div class="stat-label" style="position:relative">GIR % ${girTT}</div><div class="stat-value ${a_gir>=67?'stat-good':a_gir<50?'stat-bad':'stat-neutral'}">${fmt(a_gir,1)}%</div><div class="stat-sub">Goal: 67%</div></div>
    <div class="stat-card"><div class="stat-label">Fairways %</div><div class="stat-value ${a_fw>=70?'stat-good':a_fw<50?'stat-bad':'stat-neutral'}">${fmt(a_fw,1)}%</div><div class="stat-sub">Goal: 70%</div></div>
    <div class="stat-card"><div class="stat-label" style="position:relative">Scrambling % ${scramTT}</div><div class="stat-value ${a_scram>=50?'stat-good':a_scram<30?'stat-bad':'stat-neutral'}">${fmt(a_scram,1)}%</div><div class="stat-sub">Goal: 50%</div></div>
    <div class="stat-card"><div class="stat-label">Driver Avg</div><div class="stat-value">${fmt(a_dr,0)}</div><div class="stat-sub">yards (Dr only)</div></div>
    <div class="stat-card"><div class="stat-label" style="position:relative">Proximity ${proxTT}</div><div class="stat-value ${prox&&prox<=25?'stat-good':'stat-neutral'}">${prox?prox.toFixed(1)+'ft':'—'}</div><div class="stat-sub">avg on GIR holes</div></div>
    <div class="stat-card"><div class="stat-label" style="position:relative">Avg L/R Miss ${lrTT}</div>
      <div class="stat-value ${lrCls}">${avgLR!=null?(avgLR<0?avgLR.toFixed(1):'+'+avgLR.toFixed(1))+' ft':'—'}</div>
      <div class="stat-sub">${avgLR==null?'':avgLR<0?'← Left':'→ Right'}</div></div>
    <div class="stat-card"><div class="stat-label" style="position:relative">Avg S/L Miss ${slTT}</div>
      <div class="stat-value ${slCls}">${avgSL!=null?(avgSL<0?avgSL.toFixed(1):'+'+avgSL.toFixed(1))+' ft':'—'}</div>
      <div class="stat-sub">${avgSL==null?'':avgSL<0?'↓ Short':'↑ Long'}</div></div>
  `;

  document.getElementById('rounds-tbody').innerHTML = [...r].sort((a,b)=>b.date.localeCompare(a.date)).map(rnd => {
    const pc   = rnd.plus_minus<=4?'val-green':rnd.plus_minus>=10?'val-red':'val-amber';
    const gcls = rnd.gir_pct>=67?'val-green':rnd.gir_pct>0&&rnd.gir_pct<50?'val-red':'';
    const fwcls= rnd.fw_pct!=null?(rnd.fw_pct>=70?'val-green':rnd.fw_pct<50?'val-red':''):'';
    const scrcls=rnd.scrambling!=null?(rnd.scrambling>=50?'val-green':rnd.scrambling<25?'val-red':''):'';
    const puttcls=rnd.putts!=null?(rnd.putts<=30?'val-green':rnd.putts>=36?'val-red':''):'';
    return `<tr>
      <td>${rnd.date.slice(5)} — ${rnd.course}</td>
      <td class="${pc}">${rnd.score}</td><td class="${pc}">${fmtPM(rnd.plus_minus)}</td>
      <td class="val-green">${rnd.birdies}</td><td class="val-red">${rnd.bogeys+rnd.doubles_plus}</td>
      <td class="${gcls}" style="color:${gcls?'':'var(--text)'}">${rnd.gir_pct>0?rnd.gir_pct+'%':'—'}</td>
      <td class="${fwcls}" style="color:${fwcls?'':'var(--text)'}">${rnd.fw_pct!=null?rnd.fw_pct+'%':'—'}</td>
      <td style="color:var(--text)">${rnd.driver_dist||'—'}</td>
      <td class="${scrcls}" style="color:${scrcls?'':'var(--text)'}">${rnd.scrambling!=null?rnd.scrambling+'%':'—'}</td>
      <td class="${puttcls}" style="color:${puttcls?'':'var(--text)'}">${rnd.putts||'—'}</td>
      <td>${rnd.penalties>0?'<span class="val-red">'+rnd.penalties+'</span>':'—'}</td>
    </tr>`;
  }).join('');

  buildScoring();

  // Score history with trend line
  const scores_s = s.map(x=>x.score);
  const n_s=scores_s.length, xs=scores_s.map((_,i)=>i);
  const sumX=xs.reduce((a,b)=>a+b,0), sumY=scores_s.reduce((a,b)=>a+b,0);
  const sumXY=xs.reduce((s2,x,i)=>s2+x*scores_s[i],0), sumX2=xs.reduce((s2,x)=>s2+x*x,0);
  const m=(n_s*sumXY-sumX*sumY)/(n_s*sumX2-sumX*sumX||1), b_reg=(sumY-m*sumX)/n_s;
  const trend=xs.map(x=>Math.round((m*x+b_reg)*10)/10);

  mkChart('chart-score-history','line',{
    labels:s.map(x=>x.date.slice(5,10)),
    datasets:[
      {label:'Score',data:scores_s,borderColor:C.green,backgroundColor:C.gfill,
        pointBackgroundColor:s.map(x=>x.plus_minus<=4?C.green:x.plus_minus>=10?C.red:C.amber),
        pointRadius:4,tension:0.3,fill:true,order:2},
      {label:'Trend',data:trend,borderColor:'rgba(96,165,250,0.7)',backgroundColor:'transparent',
        pointRadius:0,borderWidth:2,borderDash:[6,4],tension:0,order:1}
    ]
  },{
    ...bOpts('Score'),
    scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}},
      y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},min:Math.min(...scores_s)-4,max:Math.max(...scores_s)+4}},
    plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}},
      tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1}}
  });

  // Score distribution
  const bins={'-2 to 0':0,'1-3':0,'4-6':0,'7-9':0,'10-12':0,'13+':0};
  r.forEach(x=>{const p=x.plus_minus;if(p<=0)bins['-2 to 0']++;else if(p<=3)bins['1-3']++;else if(p<=6)bins['4-6']++;else if(p<=9)bins['7-9']++;else if(p<=12)bins['10-12']++;else bins['13+']++;});
  const binVals=Object.values(bins), binTotal=binVals.reduce((a,b)=>a+b,0);
  const pctLabelPlugin={id:'pctLabels',afterDatasetsDraw(chart){
    const ctx=chart.ctx,ds=chart.data.datasets[0];
    chart.getDatasetMeta(0).data.forEach((bar,i)=>{
      const v=ds.data[i];if(!v)return;
      ctx.save();ctx.fillStyle='#0a0f0a';ctx.font='600 12px Barlow';
      ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(Math.round(v/binTotal*100)+'%',bar.x,bar.y+5);ctx.restore();
    });
  }};
  mkChart('chart-score-dist','bar',{
    labels:Object.keys(bins),
    datasets:[{data:binVals,backgroundColor:['#4ade80','#86efac','#fbbf24','#fb923c','#f87171','#dc2626'],borderWidth:0}]
  },{...bOpts('# Rounds'),plugins:{...bOpts().plugins,pctLabels:pctLabelPlugin}},[pctLabelPlugin]);
}

// ─── Scoring trends ───────────────────────────────────────────────────────────
function buildScoring() {
  const s = sorted();
  buildRollingChart(s, rollingWindow);
  const ps = currentPlayer.par_scoring;
  mkChart('chart-par-type','bar',{
    labels:['Par 3','Par 4','Par 5'],
    datasets:[{label:'+/- to Par',data:[ps['3'],ps['4'],ps['5']],
      backgroundColor:[C.ad,C.rd,C.gd],borderColor:[C.amber,C.red,C.green],borderWidth:2}]
  },{...bOpts('+/- to Par')});
  mkChart('chart-plusminus','bar',{
    labels:s.map(x=>x.date.slice(5,10)),
    datasets:[{data:s.map(x=>x.plus_minus),
      backgroundColor:s.map(x=>x.plus_minus<=4?C.gd:x.plus_minus>=10?C.rd:C.ad),
      borderColor:s.map(x=>x.plus_minus<=4?C.green:x.plus_minus>=10?C.red:C.amber),borderWidth:1}]
  },{...bOpts('+/- to Par')});
}

function buildRollingChart(s, w) {
  const scores=s.map(x=>x.score), ra=rollingAvg(scores,w);
  if (charts['chart-rolling']) { try{charts['chart-rolling'].destroy();}catch(e){} }
  const el=document.getElementById('chart-rolling');if(!el)return;
  const sMin=Math.min(...scores)-3, sMax=Math.max(...scores)+3;
  charts['chart-rolling']=new Chart(el.getContext('2d'),{
    type:'bar',
    data:{labels:s.map(x=>x.date.slice(5,10)),datasets:[
      {type:'bar',label:'Round Score',data:scores,
        backgroundColor:s.map(x=>x.plus_minus<=4?C.gd:x.plus_minus>=10?C.rd:C.ad),
        borderColor:s.map(x=>x.plus_minus<=4?C.green:x.plus_minus>=10?C.red:C.amber),borderWidth:1,order:2},
      {type:'line',label:`${w}-Rnd Rolling Avg`,data:ra,
        borderColor:C.blue,backgroundColor:'transparent',borderWidth:2.5,pointRadius:0,tension:0.4,order:1}
    ]},
    options:{...bOpts('Score'),
      scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}},y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},min:sMin,max:sMax}},
      plugins:{...bOpts().plugins,legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}}}}
  });
}
function setRolling(w,btn){
  rollingWindow=w;
  btn.closest('.rolling-controls').querySelectorAll('.roll-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  buildRollingChart(sorted(),w);
}

// ─── Off the Tee ──────────────────────────────────────────────────────────────
function buildTee() {
  const r=currentPlayer.rounds, s=sorted();
  const dr=r.filter(x=>x.driver_dist), fw=r.filter(x=>x.fw_pct!=null);
  const a_dr=avg(dr.map(x=>x.driver_dist)), a_fw=avg(fw.map(x=>x.fw_pct));
  const max_dr=dr.length?Math.max(...dr.map(x=>x.driver_dist)):0;
  document.getElementById('tee-stats').innerHTML=`
    <div class="stat-card"><div class="stat-label">Driver Avg</div><div class="stat-value">${fmt(a_dr,0)}</div><div class="stat-sub">yards (Dr)</div></div>
    <div class="stat-card"><div class="stat-label">Max Drive</div><div class="stat-value stat-good">${max_dr||'—'}</div><div class="stat-sub">career best</div></div>
    <div class="stat-card"><div class="stat-label">Fairways Hit</div><div class="stat-value">${fmt(a_fw,1)}%</div><div class="stat-sub">Goal: 70%</div></div>
  `;
  // Fairway accuracy with trend line
  const sfw=s.filter(x=>x.fw_pct!=null), fwVals=sfw.map(x=>x.fw_pct);
  const nfw=fwVals.length, xfw=fwVals.map((_,i)=>i);
  const sfwX=xfw.reduce((a,b)=>a+b,0), sfwY=fwVals.reduce((a,b)=>a+b,0);
  const sfwXY=xfw.reduce((s2,x,i)=>s2+x*fwVals[i],0), sfwX2=xfw.reduce((s2,x)=>s2+x*x,0);
  const fwM=(nfw*sfwXY-sfwX*sfwY)/(nfw*sfwX2-sfwX*sfwX||1), fwB=(sfwY-fwM*sfwX)/nfw;
  mkChart('chart-fw-pct','line',{
    labels:sfw.map(x=>x.date.slice(5,10)),
    datasets:[
      {label:'FW %',data:fwVals,borderColor:C.amber,backgroundColor:C.ad.replace('0.4','0.07'),
        pointBackgroundColor:sfw.map(x=>x.fw_pct>=70?C.green:C.red),pointRadius:5,tension:0.3,fill:true,order:2},
      {label:'Trend',data:xfw.map(x=>Math.round((fwM*x+fwB)*10)/10),borderColor:'rgba(96,165,250,0.7)',backgroundColor:'transparent',
        pointRadius:0,borderWidth:2,borderDash:[6,4],tension:0,order:1}
    ]
  },{...bOpts('%'),plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}},
    tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1}}});

  // Distance distribution
  const dists=dr.map(x=>x.driver_dist);
  const db={'<240':0,'240-250':0,'251-260':0,'261-270':0,'271-280':0,'280+':0};
  dists.forEach(d=>{if(d<240)db['<240']++;else if(d<=250)db['240-250']++;else if(d<=260)db['251-260']++;else if(d<=270)db['261-270']++;else if(d<=280)db['271-280']++;else db['280+']++;});
  const dbVals=Object.values(db), dbTotal=dbVals.reduce((a,b)=>a+b,0);
  const distPctPlugin={id:'distPct',afterDatasetsDraw(chart){
    const ctx=chart.ctx,ds=chart.data.datasets[0];
    chart.getDatasetMeta(0).data.forEach((bar,i)=>{
      const v=ds.data[i];if(!v)return;
      ctx.save();ctx.fillStyle='#0a0f0a';ctx.font='600 12px Barlow';
      ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(Math.round(v/dbTotal*100)+'%',bar.x,bar.y+4);ctx.restore();
    });
  }};
  mkChart('chart-dist-dist','bar',{
    labels:Object.keys(db),datasets:[{data:dbVals,backgroundColor:C.gd,borderColor:C.green,borderWidth:1}]
  },{...bOpts('# Rounds')},[distPctPlugin]);

  buildDrRollingChart(s.filter(x=>x.driver_dist),drRollingWindow,teeDrClub);
  buildTeeLRDist();
  buildTeeScatter('Dr');
}

function buildTeeLRDist() {
  const allShots=currentPlayer.tee_shots||[], drShots=allShots.filter(s=>s.club==='Dr'&&s.x!=null);
  const el=document.getElementById('chart-tee-lr-dist'), emEl=document.getElementById('chart-tee-lr-empty');
  if(!el)return;
  if(drShots.length<3){el.style.display='none';if(emEl)emEl.style.display='block';return;}
  el.style.display='block';if(emEl)emEl.style.display='none';
  const FW=10,BW=15;
  const buckets=[
    {label:'>40L',min:-Infinity,max:-(FW+2*BW),zone:'wide'},
    {label:'25-40L',min:-(FW+2*BW),max:-(FW+BW),zone:'mid'},
    {label:'10-25L',min:-(FW+BW),max:-FW,zone:'close'},
    {label:'Fairway \u00b110 yds',min:-FW,max:FW,zone:'fairway'},
    {label:'10-25R',min:FW,max:FW+BW,zone:'close'},
    {label:'25-40R',min:FW+BW,max:FW+2*BW,zone:'mid'},
    {label:'>40R',min:FW+2*BW,max:Infinity,zone:'wide'},
  ];
  const counts=buckets.map(b=>({label:b.label,count:drShots.filter(s=>s.x>b.min&&s.x<=b.max).length,zone:b.zone}));
  const total=drShots.length;
  const zoneColors={fairway:'rgba(74,222,128,0.75)',close:'rgba(251,191,36,0.65)',mid:'rgba(248,113,113,0.55)',wide:'rgba(248,113,113,0.35)'};
  const colors=counts.map(b=>zoneColors[b.zone]);
  const borders=counts.map(b=>zoneColors[b.zone].replace(/[\d.]+\)$/,'1)'));
  const pctPlugin={id:'lrPct',afterDatasetsDraw(chart){
    const ctx=chart.ctx,ds=chart.data.datasets[0];
    chart.getDatasetMeta(0).data.forEach((bar,i)=>{
      const v=ds.data[i];if(!v)return;
      ctx.save();ctx.fillStyle='rgba(255,255,255,0.9)';ctx.font='600 12px Barlow';
      ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(Math.round(v/total*100)+'%',bar.x,bar.y+4);ctx.restore();
    });
  }};
  if(charts['chart-tee-lr-dist']){try{charts['chart-tee-lr-dist'].destroy();}catch(e){}}
  charts['chart-tee-lr-dist']=new Chart(el.getContext('2d'),{
    type:'bar',
    data:{labels:counts.map(b=>b.label),datasets:[{label:'# of Drives',data:counts.map(b=>b.count),backgroundColor:colors,borderColor:borders,borderWidth:1}]},
    options:{responsive:true,plugins:{legend:{display:false},
      tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,
        callbacks:{title(ctx){const b=buckets[ctx[0].dataIndex];return b.zone==='fairway'?'Fairway (±10 yds of centre)':ctx[0].label+' of centre';},
          label(ctx){const n=ctx.raw,pct=Math.round(n/total*100);return[`${n} drive${n!==1?'s':''} (${pct}%)`,`of ${total} total`];}}}},
      scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'← Left (yds)          Fairway ±10 yds          Right (yds) →',color:C.txt,font:FONT}},
        y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'# of Drives',color:C.txt,font:FONT}}}},
    plugins:[pctPlugin]
  });
}

const TEE_CHI2={0.50:1.3863,0.75:2.7726,0.95:5.9915};
function computeTeeEllipse(pixPts,chiSqVal){
  const n=pixPts.length;if(n<3)return null;
  const mx=pixPts.reduce((s,p)=>s+p.x,0)/n,my=pixPts.reduce((s,p)=>s+p.y,0)/n;
  let sxx=0,sxy=0,syy=0;
  for(const p of pixPts){const dx=p.x-mx,dy=p.y-my;sxx+=dx*dx;sxy+=dx*dy;syy+=dy*dy;}
  sxx/=(n-1);sxy/=(n-1);syy/=(n-1);
  const tr=sxx+syy,det=sxx*syy-sxy*sxy,disc=Math.sqrt(Math.max(0,tr*tr/4-det));
  const lam1=tr/2+disc,lam2=tr/2-disc;
  const angle=Math.abs(sxy)<1e-6?(sxx>=syy?0:Math.PI/2):Math.atan2(lam1-sxx,sxy);
  const sc=Math.sqrt(chiSqVal);
  return{cx:mx,cy:my,a:Math.sqrt(Math.max(0,lam1))*sc,b:Math.sqrt(Math.max(0,lam2))*sc,angle};
}

function buildTeeScatter(club) {
  teeScatterClub=club;
  const allShots=currentPlayer.tee_shots||[], shots=club==='All'?allShots:allShots.filter(s=>s.club===club);
  document.getElementById('tee-scatter-count').textContent=shots.length+' shots shown';
  if(!shots.length){
    const el=document.getElementById('chart-tee-scatter');
    if(el)el.parentElement.innerHTML=`<div class="empty-state" style="padding:30px;text-align:center;font-family:'Barlow',sans-serif;font-size:12px;color:var(--text-dim)">No tee shot data for ${club}</div>`;
    return;
  }
  const fwShots=shots.filter(s=>s.fairway), missShots=shots.filter(s=>!s.fairway);
  const maxFwDist=fwShots.length?Math.max(...fwShots.map(s=>s.y)):0, goalDist=Math.round(maxFwDist*0.90);
  const fwPts=fwShots.map(s=>({x:s.x,y:s.y})), missPts=missShots.map(s=>({x:s.x,y:s.y}));
  const allX=shots.map(s=>s.x),allY=shots.map(s=>s.y);
  const xPad=Math.max(30,Math.abs(Math.min(...allX))+10,Math.abs(Math.max(...allX))+10);
  const yMin=Math.min(...allY)-10,yMax=Math.max(...allY)+15;
  const ciAndGoalPlugin={id:'ciAndGoal',afterDatasetsDraw(chart){
    const ctx=chart.ctx,xs=chart.scales.x,ys=chart.scales.y;
    if(goalDist){
      const y0=ys.getPixelForValue(goalDist);
      ctx.save();ctx.strokeStyle='rgba(251,191,36,0.8)';ctx.lineWidth=2;ctx.setLineDash([8,5]);
      ctx.beginPath();ctx.moveTo(xs.left,y0);ctx.lineTo(xs.right,y0);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(251,191,36,0.9)';ctx.font='600 11px Barlow';ctx.textAlign='right';
      ctx.fillText('Goal: '+goalDist+' yds (90% of longest fw)',xs.right-4,y0-5);ctx.restore();
    }
    if(teeScatterCI===null)return;
    const chiVal=TEE_CHI2[teeScatterCI];
    const groups=[{pts:fwPts,stroke:'rgba(74,222,128,0.85)',fill:'rgba(74,222,128,0.08)'},{pts:missPts,stroke:'rgba(248,113,113,0.85)',fill:'rgba(248,113,113,0.08)'}];
    for(const g of groups){
      if(g.pts.length<3)continue;
      const pixPts=g.pts.map(p=>({x:xs.getPixelForValue(p.x),y:ys.getPixelForValue(p.y)}));
      const ell=computeTeeEllipse(pixPts,chiVal);
      if(!ell||ell.a<1||ell.b<1)continue;
      ctx.save();ctx.translate(ell.cx,ell.cy);ctx.rotate(ell.angle);
      ctx.beginPath();ctx.ellipse(0,0,ell.a,ell.b,0,0,2*Math.PI);
      ctx.fillStyle=g.fill;ctx.fill();ctx.strokeStyle=g.stroke;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.stroke();ctx.restore();
    }
  }};
  if(charts['chart-tee-scatter']){try{charts['chart-tee-scatter'].destroy();}catch(e){}}
  const el=document.getElementById('chart-tee-scatter');if(!el)return;
  charts['chart-tee-scatter']=new Chart(el.getContext('2d'),{
    type:'scatter',
    data:{datasets:[
      {label:'Fairway ('+fwPts.length+')',data:fwPts,backgroundColor:'rgba(74,222,128,0.65)',pointRadius:5,pointHoverRadius:7},
      {label:'Miss ('+missPts.length+')',data:missPts,backgroundColor:'rgba(248,113,113,0.65)',pointRadius:5,pointHoverRadius:7}
    ]},
    options:{responsive:true,
      plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:12}},
        tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,
          callbacks:{label(ctx){const p=ctx.raw;const lr=p.x>0?p.x.toFixed(1)+'ft R':Math.abs(p.x).toFixed(1)+'ft L';return[ctx.dataset.label.split(' ')[0]+': '+p.y+' yds',lr];}}}},
      scales:{
        x:{min:-xPad,max:xPad,grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'← Left (ft)   |   Right (ft) →',color:C.txt,font:FONT}},
        y:{min:yMin,max:yMax,grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'Distance (yds)',color:C.txt,font:FONT}}}},
    plugins:[ciAndGoalPlugin]
  });
}
function setTeeScatterClub(club,btn){btn.closest('.rolling-controls').querySelectorAll('.roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildTeeScatter(club);}
function setTeeScatterCI(ci,btn){teeScatterCI=ci;btn.closest('.rolling-controls').querySelectorAll('.roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildTeeScatter(teeScatterClub);}

function buildDrRollingChart(sdr,w,club){
  club=club||'Dr';
  const wrap=document.getElementById('dr-rolling-wrap');if(!wrap)return;
  if(charts['chart-driver-rolling']){try{charts['chart-driver-rolling'].destroy();}catch(e){} delete charts['chart-driver-rolling'];}
  wrap.innerHTML='<canvas id="chart-driver-rolling" height="88"></canvas>';
  const el=document.getElementById('chart-driver-rolling');
  const vals=club==='Dr'?sdr.map(x=>x.driver_dist):sdr.map(x=>x['dist_'+club.replace('-','').replace(' ','_')]||null);
  const validIdx=vals.reduce((a,v,i)=>v!=null?[...a,i]:a,[]);
  const validSdr=validIdx.map(i=>sdr[i]), validVals=validIdx.map(i=>vals[i]);
  if(validVals.length<2){
    wrap.innerHTML=`<div class="empty-state" style="padding:32px;text-align:center;font-family:'Barlow',sans-serif;font-size:12px;color:var(--text-dim)">${club} distance not tracked in current data.</div>`;
    return;
  }
  const ra=rollingAvg(validVals,w), vMin=Math.min(...validVals)-10, vMax=Math.max(...validVals)+10;
  charts['chart-driver-rolling']=new Chart(el.getContext('2d'),{
    type:'bar',
    data:{labels:validSdr.map(x=>x.date.slice(5,10)),datasets:[
      {type:'bar',label:club+' Distance (yds)',data:validVals,
        backgroundColor:validVals.map(v=>v>=270?C.gd:v<250?C.rd:C.ad),
        borderColor:validVals.map(v=>v>=270?C.green:v<250?C.red:C.amber),borderWidth:1,order:2},
      {type:'line',label:`${w}-Rnd Rolling Avg`,data:ra,borderColor:C.blue,backgroundColor:'transparent',borderWidth:2.5,pointRadius:0,tension:0.4,order:1}
    ]},
    options:{responsive:true,
      plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}},tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1}},
      scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}},y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},min:vMin,max:vMax}}}
  });
}
function setDrRolling(w,btn){drRollingWindow=w;btn.closest('.rolling-controls').querySelectorAll('.roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildDrRollingChart(sorted().filter(x=>x.driver_dist),drRollingWindow,teeDrClub);}
function setDrClub(club,btn){teeDrClub=club;btn.closest('.rolling-controls').querySelectorAll('.roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildDrRollingChart(sorted().filter(x=>x.driver_dist),drRollingWindow,club);}

// ─── Approach ─────────────────────────────────────────────────────────────────
function buildApproach(){
  const cats=currentPlayer.approach_cats;
  const CAT_ORDER=['Wood','Hybrid','Long Iron','Mid Iron','Short Iron','Wedge'];
  const cn=CAT_ORDER.filter(c=>cats[c]);
  buildGirRollingChart(sorted().filter(x=>x.gir_pct>0),girRollingWindow);
  const girLabelPlugin={id:'girLabels',afterDatasetsDraw(chart){
    const ctx=chart.ctx,ds=chart.data.datasets[0];
    chart.getDatasetMeta(0).data.forEach((bar,i)=>{
      const v=ds.data[i];if(v==null)return;
      ctx.save();ctx.fillStyle='#0a0f0a';ctx.font='600 12px Barlow';ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(v+'%',bar.x,bar.y+4);ctx.restore();
    });
  }};
  mkChart('chart-gir-club','bar',{labels:cn,datasets:[{label:'GIR %',data:cn.map(c=>cats[c].gir_pct),
    backgroundColor:cn.map(c=>cats[c].gir_pct>=55?'rgba(74,222,128,0.6)':'rgba(248,113,113,0.5)'),
    borderColor:cn.map(c=>cats[c].gir_pct>=55?C.green:C.red),borderWidth:1}]},{...bOpts('GIR %')},[girLabelPlugin]);
  const lrVals=cn.map(c=>cats[c].lr_miss);
  mkChart('chart-lr-miss','bar',{labels:cn,datasets:[{label:'L/R Miss (ft)',data:lrVals,
    backgroundColor:lrVals.map(v=>v<0?'rgba(96,165,250,0.6)':'rgba(251,191,36,0.6)'),
    borderColor:lrVals.map(v=>v<0?C.blue:C.amber),borderWidth:1}]},
    {...bOpts('Miss (ft)'),indexAxis:'y',
      scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'← Left   |   Right →',color:C.txt,font:FONT}},y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}}},
      plugins:{legend:{display:false},tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,
        callbacks:{label:ctx=>{const v=ctx.parsed.x;return`${v>0?'Right +':'Left '}${Math.abs(v).toFixed(1)}ft`;}}}}});
  mkChart('chart-sl-miss','bar',{labels:cn,datasets:[{label:'Short/Long ft',data:cn.map(c=>cats[c].sl_miss),
    backgroundColor:cn.map(c=>cats[c].sl_miss<0?C.rd:C.gd),borderColor:cn.map(c=>cats[c].sl_miss<0?C.red:C.green),borderWidth:1}]},{...bOpts('Miss ft (neg=Short)')});
  buildApproachTable();
  buildApproachMissBox();
}

function buildApproachMissBox(){
  const cats=currentPlayer.approach_cats||{};
  const box=document.getElementById('approach-miss-box');if(!box)return;
  let totalShots=0,totalLR=0,totalSL=0;
  for(const d of Object.values(cats)){if(!d.shots)continue;totalShots+=d.shots;totalLR+=d.lr_miss*d.shots;totalSL+=d.sl_miss*d.shots;}
  if(totalShots<3){box.textContent='Not enough approach data yet.';return;}
  const avgLR=totalLR/totalShots,avgSL=totalSL/totalShots;
  const lrDir=avgLR<0?`${Math.abs(avgLR).toFixed(1)} feet left`:`${avgLR.toFixed(1)} feet right`;
  const slDir=avgSL<0?`${Math.abs(avgSL).toFixed(1)} feet short`:`${avgSL.toFixed(1)} feet long`;
  const lrStrength=Math.abs(avgLR),slStrength=Math.abs(avgSL);
  const lrSevere=lrStrength>20?'significantly ':lrStrength>10?'moderately ':'slightly ';
  const slSevere=slStrength>30?'significantly ':slStrength>15?'moderately ':'slightly ';
  const lrTip=avgLR<-15?'Consider aiming right of your target and allowing for the miss, or work on keeping the face more square through impact.'
    :avgLR>15?'You tend to push approach shots. Focus on keeping the swing path from going too far left through impact.'
    :'Your left/right miss is within a manageable range — focus on distance control.';
  const slTip=avgSL<-15?'You consistently leave approach shots short of the target. Take one more club than you think you need, and commit to the shot.'
    :avgSL>15?'You tend to fly approach shots past the flag. Check your club selection and ball position.'
    :'Your short/long miss is well controlled — continue focusing on accuracy.';
  box.innerHTML=`
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;letter-spacing:2px;color:var(--blue);margin-bottom:12px">General Miss Tendency</div>
    <p style="margin-bottom:10px">Across <strong style="color:var(--text)">${totalShots} approach shots</strong>, your average miss is <strong style="color:var(--amber)">${lrDir}</strong> and <strong style="color:var(--amber)">${slDir}</strong> of the target.</p>
    <p style="margin-bottom:10px">Your left/right miss is ${lrSevere}biased to the ${avgLR<0?'left':'right'} — ${lrTip}</p>
    <p>Your distance control is ${slSevere}biased ${avgSL<0?'short':'long'} — ${slTip}</p>
  `;
}

function buildGirRollingChart(gsr,w){
  const vals=gsr.map(x=>x.gir_pct),ra=rollingAvg(vals,w);
  if(charts['chart-gir-round']){try{charts['chart-gir-round'].destroy();}catch(e){}}
  const el=document.getElementById('chart-gir-round');if(!el)return;
  charts['chart-gir-round']=new Chart(el.getContext('2d'),{
    type:'line',data:{labels:gsr.map(x=>x.date.slice(5,10)),datasets:[
      {label:'GIR % (each round)',data:vals,borderColor:'rgba(148,163,184,0.4)',backgroundColor:'transparent',pointRadius:3,pointBackgroundColor:'rgba(148,163,184,0.5)',tension:0.2,order:2},
      {label:`${w}-Rnd Rolling Avg`,data:ra,borderColor:C.blue,backgroundColor:'rgba(96,165,250,0.07)',borderWidth:2.5,pointRadius:0,tension:0.5,fill:true,order:1}
    ]},
    options:{...bOpts('GIR %'),plugins:{...bOpts().plugins,legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}}}}
  });
}
function setGirRolling(w,btn){girRollingWindow=w;document.querySelectorAll('#section-approach .rolling-controls .roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildGirRollingChart(sorted().filter(x=>x.gir_pct>0),w);}

function buildApproachTable(){
  const cats=currentPlayer.approach_cats;
  const CAT_ORDER=['Wood','Hybrid','Long Iron','Mid Iron','Short Iron','Wedge'];
  const orderedCats=CAT_ORDER.filter(c=>cats[c]).map(c=>[c,cats[c]]);
  const rows=[];
  orderedCats.forEach(([cat,d])=>{
    const lrc=Math.abs(d.lr_miss)>15?'val-red':'val-amber', slc=d.sl_miss<-20?'val-red':'val-amber', gc=d.gir_pct>=55?'val-green':d.gir_pct<=35?'val-red':'val-amber';
    const assess=d.gir_pct>=55?'<span class="val-green">✓ Strength</span>':d.gir_pct<=35?'<span class="val-red">✗ Focus Area</span>':'<span class="val-amber">~ Average</span>';
    const open=drillState[cat];
    rows.push(`<tr data-cat="${cat}" style="cursor:pointer" onclick="toggleDrill('${cat}')">
      <td><strong>${cat}</strong></td><td>${d.shots}</td>
      <td class="${lrc}">${d.lr_miss>0?'+':''}${d.lr_miss}ft</td><td class="${slc}">${d.sl_miss>0?'+':''}${d.sl_miss}ft</td>
      <td class="${gc}">${d.gir_pct}%</td><td>${assess}</td>
      <td><button class="drill-btn">${open?'▲ Hide':'▼ Clubs'}</button></td>
    </tr>`);
    if(open&&d.clubs){
      d.clubs.forEach(cl=>{
        const clrc=Math.abs(cl.lr_miss)>15?'val-red':'val-amber', cslc=cl.sl_miss<-20?'val-red':'val-amber', cgc=cl.gir_pct>=55?'val-green':cl.gir_pct<=35?'val-red':'val-amber';
        rows.push(`<tr class="drill-row"><td>↳ ${cl.club}</td><td>${cl.shots}</td>
          <td class="${clrc}">${cl.lr_miss>0?'+':''}${cl.lr_miss}ft</td><td class="${cslc}">${cl.sl_miss>0?'+':''}${cl.sl_miss}ft</td>
          <td class="${cgc}">${cl.gir_pct}%</td><td colspan="2" style="color:var(--text-faint)">individual club data</td></tr>`);
      });
    }
  });
  document.getElementById('approach-table-body').innerHTML=rows.join('');
}
function toggleDrill(cat){drillState[cat]=!drillState[cat];buildApproachTable();}

// ─── Putting ──────────────────────────────────────────────────────────────────
function setPuttView(mode,btn){
  puttViewMode=mode;
  document.querySelectorAll('#putt-view-btns .roll-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  buildPutting();
}

async function buildPutting(){
  const r=currentPlayer.rounds, mp=currentPlayer.make_pct||{};
  const girOnePuttPct=r.filter(x=>x.gir_pct>0&&x.one_putts!=null).map(x=>{
    const gc=Math.max(1,Math.round(x.gir_pct/100*(x.holes||18)));return Math.round((x.one_putts/gc)*1000)/10;
  });
  const a_gir1p=girOnePuttPct.length?girOnePuttPct.reduce((a,b)=>a+b,0)/girOnePuttPct.length:null;
  const a_1p=avg(r.filter(x=>x.one_putts!=null).map(x=>x.one_putts));
  const a_3p=avg(r.filter(x=>x.three_putts!=null).map(x=>x.three_putts));
  const a_scram=avg(r.filter(x=>x.scrambling!=null).map(x=>x.scrambling));
  const s_rounds=[...r].sort((a,b)=>a.date.localeCompare(b.date)).filter(x=>x.three_putts!=null);
  let maxStreak=0,curStreak=0;
  for(const rnd of s_rounds){if((rnd.three_putts||0)===0){curStreak++;maxStreak=Math.max(maxStreak,curStreak);}else curStreak=0;}
  const distWeights={'0-3':0.25,'3-5':0.18,'5-8':0.20,'8-12':0.15,'12-20':0.10,'20-35':0.07,'35-50':0.03,'50+':0.02};
  let totalMake=0,totalW=0;
  for(const[d,w]of Object.entries(distWeights)){if(mp[d]!=null){totalMake+=mp[d]*w;totalW+=w;}}
  const overallMake=totalW>0?Math.round(totalMake/totalW*10)/10:null;
  document.getElementById('putt-stats').innerHTML=`
    <div class="stat-card"><div class="stat-label">GIR 1-Putt %</div>
      <div class="stat-value ${a_gir1p>=30?'stat-good':a_gir1p!=null&&a_gir1p<20?'stat-bad':''}">${a_gir1p!=null?a_gir1p.toFixed(1)+'%':'—'}</div>
      <div class="stat-sub">Goal: ≥30% · Tour avg ~30%</div></div>
    <div class="stat-card"><div class="stat-label">1-Putt Scramble</div>
      <div class="stat-value ${(a_scram||0)>=35?'stat-good':'stat-bad'}">${fmt(a_scram,1)}%</div>
      <div class="stat-sub">1-putt after missed GIR</div></div>
    <div class="stat-card"><div class="stat-label">3-Putts / Rnd</div>
      <div class="stat-value ${(a_3p||0)<=1?'stat-good':'stat-bad'}">${fmt(a_3p,1)}</div>
      <div class="stat-sub">avg per round</div></div>
    <div class="stat-card"><div class="stat-label">3-Putt Free Streak</div>
      <div class="stat-value stat-good">${maxStreak}</div>
      <div class="stat-sub">consec. rounds no 3-putt</div></div>
    <div class="stat-card"><div class="stat-label">Overall ${puttViewMode==='make'?'Make':'Miss'} %</div>
      <div class="stat-value ${(overallMake||0)>=45?'stat-good':'stat-neutral'}">
        ${overallMake!=null?(puttViewMode==='make'?overallMake:(100-overallMake).toFixed(1))+'%':'—'}</div>
      <div class="stat-sub">weighted all distances</div></div>
  `;
  const PGA={'0-3':99,'3-5':88,'5-8':68,'8-12':50,'12-20':29,'20-35':13,'35-50':8,'50+':5};
  const dists=['0-3','3-5','5-8','8-12','12-20','20-35','35-50','50+'];
  const isM=puttViewMode==='make';
  const yourVals=dists.map(d=>mp[d]!=null?(isM?mp[d]:100-mp[d]):null);
  const pgaVals=dists.map(d=>isM?PGA[d]:100-PGA[d]);
  const titleEl=document.getElementById('putt-dist-title');
  if(titleEl)titleEl.textContent=`${isM?'Make':'Miss'} % by Distance vs PGA Tour Average`;
  mkChart('chart-make-pct','bar',{
    labels:dists.map(d=>d+' ft'),
    datasets:[
      {label:`Your ${isM?'Make':'Miss'} %`,data:yourVals,
        backgroundColor:dists.map((_,i)=>i<=1?'rgba(74,222,128,0.65)':i<=3?C.ad:'rgba(96,165,250,0.5)'),
        borderColor:dists.map((_,i)=>i<=1?C.green:i<=3?C.amber:C.blue),borderWidth:1,order:2},
      {label:`PGA Tour ${isM?'Make':'Miss'} %`,data:pgaVals,
        backgroundColor:'transparent',borderColor:'rgba(248,113,113,0.8)',
        borderWidth:2,type:'line',pointRadius:4,pointBackgroundColor:'rgba(248,113,113,0.8)',tension:0.3,order:1}
    ]
  },{...bOpts(`${isM?'Make':'Miss'} %`),
    plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}},
      tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1}}});
  // Fetch hole data if needed
  if(puttHoleData===null&&currentPlayer.player_id){
    try{const{data:hd}=await sb.from('hole_data').select('par,score,appr_club,green,short_sided,round_id,putt1_hl,putt1_break,putt1_slope,putt2_hl,putt2_break,putt2_slope,num_putts').eq('player_id',currentPlayer.player_id);puttHoleData=hd||[];}
    catch(e){puttHoleData=[];}
  }
  const hd=puttHoleData||[];
  buildPuttHLChart(hd);buildPuttBreakChart(hd);buildPuttSlopeChart(hd);
}

function puttMissOrMake(attempts,made){if(attempts===0)return null;const m=made/attempts*100;return puttViewMode==='make'?m:100-m;}

function buildPuttHLChart(hd){
  const hlEl=document.getElementById('chart-putt-hl'),emptyEl=document.getElementById('putt-hl-empty'),titleEl=document.getElementById('putt-hl-title');if(!hlEl)return;
  const hlCounts={High:0,Low:0};
  for(const h of hd){
    if(h.putt1_hl&&['High','Low'].includes(h.putt1_hl)&&h.num_putts!==1)hlCounts[h.putt1_hl]++;
    if(h.putt2_hl&&['High','Low'].includes(h.putt2_hl)&&h.num_putts>2)hlCounts[h.putt2_hl]++;
  }
  const totalMissed=hlCounts.High+hlCounts.Low;
  if(totalMissed<=3){hlEl.style.display='none';if(emptyEl)emptyEl.style.display='block';return;}
  hlEl.style.display='block';if(emptyEl)emptyEl.style.display='none';
  if(titleEl)titleEl.textContent='Miss Direction — High vs Low Side (Missed Putts Only)';
  const vals=[Math.round(hlCounts.High/totalMissed*1000)/10,Math.round(hlCounts.Low/totalMissed*1000)/10];
  if(charts['chart-putt-hl']){try{charts['chart-putt-hl'].destroy();}catch(e){}}
  charts['chart-putt-hl']=new Chart(hlEl.getContext('2d'),{
    type:'bar',data:{labels:['High Side','Low Side'],datasets:[
      {label:'% of Missed Putts',data:vals,backgroundColor:['rgba(96,165,250,0.6)','rgba(251,191,36,0.6)'],borderColor:[C.blue,C.amber],borderWidth:1.5,order:2},
      {label:'50% equal split',data:[50,50],type:'line',borderColor:'rgba(74,222,128,0.6)',borderWidth:2,borderDash:[5,4],pointRadius:0,tension:0,order:1,backgroundColor:'transparent'}
    ]},
    options:{...bOpts('% of Missed Putts'),plugins:{...bOpts().plugins,legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:16}},
      tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,
        callbacks:{label(ctx){const i=ctx.dataIndex;const count=i===0?hlCounts.High:hlCounts.Low;return`${ctx.dataset.label}: ${ctx.parsed.y!=null?ctx.parsed.y.toFixed(1)+'%':'—'} (${count} of ${totalMissed} missed)`;}}}}
    }
  });
}

function buildPuttBreakChart(hd){
  const brEl=document.getElementById('chart-putt-break'),emptyEl=document.getElementById('putt-break-empty'),titleEl=document.getElementById('putt-break-title');if(!brEl)return;
  const brCounts={LR:{made:0,total:0},RL:{made:0,total:0},'No Break':{made:0,total:0}};
  for(const h of hd){
    for(const[brk,isFirst] of [[h.putt1_break,true],[h.putt2_break,false]]){
      const key=['LR','RL','No Break'].find(k=>brk===k);if(!key)continue;
      const made=isFirst?(h.num_putts===1?1:0):(h.num_putts===2?1:0);
      brCounts[key].total++;brCounts[key].made+=made;
    }
  }
  if(!Object.values(brCounts).some(v=>v.total>2)){brEl.style.display='none';if(emptyEl)emptyEl.style.display='block';return;}
  brEl.style.display='block';if(emptyEl)emptyEl.style.display='none';
  const isM=puttViewMode==='make';if(titleEl)titleEl.textContent=`${isM?'Make':'Miss'} % by Break Type`;
  const keys=['LR','No Break','RL'],vals=keys.map(k=>puttMissOrMake(brCounts[k].total,brCounts[k].made));
  if(charts['chart-putt-break']){try{charts['chart-putt-break'].destroy();}catch(e){}}
  charts['chart-putt-break']=new Chart(brEl.getContext('2d'),{
    type:'bar',data:{labels:['Left to Right','No Break','Right to Left'],datasets:[{label:`${isM?'Make':'Miss'} %`,data:vals,
      backgroundColor:['rgba(96,165,250,0.6)','rgba(74,222,128,0.6)','rgba(251,191,36,0.6)'],borderColor:[C.blue,C.green,C.amber],borderWidth:1.5}]},
    options:{...bOpts(`${isM?'Make':'Miss'} %`),plugins:{...bOpts().plugins,legend:{display:false},
      tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,
        callbacks:{label(ctx){const k=keys[ctx.dataIndex];return`${ctx.parsed.y!=null?ctx.parsed.y.toFixed(1)+'%':'—'} (${brCounts[k].total} putts)`;}}}},
      scales:{...bOpts().scales,y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},min:0,max:100}}}
  });
}

function buildPuttSlopeChart(hd){
  const slEl=document.getElementById('chart-putt-slope'),emptyEl=document.getElementById('putt-slope-empty'),titleEl=document.getElementById('putt-slope-title');if(!slEl)return;
  const slCounts={Uphill:{made:0,total:0},Downhill:{made:0,total:0},Flat:{made:0,total:0}};
  for(const h of hd){
    for(const[slope,isFirst] of [[h.putt1_slope,true],[h.putt2_slope,false]]){
      const key=['Uphill','Downhill','Flat'].find(k=>slope&&slope.toLowerCase().includes(k.toLowerCase()));if(!key)continue;
      const made=isFirst?(h.num_putts===1?1:0):(h.num_putts===2?1:0);
      slCounts[key].total++;slCounts[key].made+=made;
    }
  }
  if(!Object.values(slCounts).some(v=>v.total>2)){slEl.style.display='none';if(emptyEl)emptyEl.style.display='block';return;}
  slEl.style.display='block';if(emptyEl)emptyEl.style.display='none';
  const isM=puttViewMode==='make';if(titleEl)titleEl.textContent=`${isM?'Make':'Miss'} % by Slope (Uphill vs Downhill)`;
  const keys=['Uphill','Flat','Downhill'],vals=keys.map(k=>puttMissOrMake(slCounts[k].total,slCounts[k].made));
  if(charts['chart-putt-slope']){try{charts['chart-putt-slope'].destroy();}catch(e){}}
  charts['chart-putt-slope']=new Chart(slEl.getContext('2d'),{
    type:'bar',data:{labels:['Uphill','Flat','Downhill'],datasets:[{label:`${isM?'Make':'Miss'} %`,data:vals,
      backgroundColor:['rgba(74,222,128,0.6)','rgba(148,163,184,0.5)','rgba(248,113,113,0.6)'],
      borderColor:[C.green,'rgba(148,163,184,0.8)',C.red],borderWidth:1.5}]},
    options:{...bOpts(`${isM?'Make':'Miss'} %`),plugins:{...bOpts().plugins,legend:{display:false},
      tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,
        callbacks:{label(ctx){const k=keys[ctx.dataIndex];return`${ctx.parsed.y!=null?ctx.parsed.y.toFixed(1)+'%':'—'} (${slCounts[k].total} putts)`;}}}},
      scales:{...bOpts().scales,y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},min:0,max:100,
        title:{display:true,text:`${isM?'Make':'Miss'} %`,color:C.txt,font:FONT}}}}
  });
}

// ─── Shot Dispersion ──────────────────────────────────────────────────────────
const CAT_COL={
  'Mid Iron':   {pt:'rgba(96,165,250,0.75)', el:'rgba(96,165,250,0.8)',  fill:'rgba(96,165,250,0.12)'},
  'Short Iron': {pt:'rgba(74,222,128,0.75)', el:'rgba(74,222,128,0.8)',  fill:'rgba(74,222,128,0.12)'},
  'Wedge':      {pt:'rgba(251,191,36,0.75)', el:'rgba(251,191,36,0.8)',  fill:'rgba(251,191,36,0.12)'},
  'Wood':       {pt:'rgba(248,113,113,0.75)',el:'rgba(248,113,113,0.8)', fill:'rgba(248,113,113,0.12)'},
  'Long Iron':  {pt:'rgba(167,139,250,0.75)',el:'rgba(167,139,250,0.8)', fill:'rgba(167,139,250,0.12)'},
  'Hybrid':     {pt:'rgba(251,146,60,0.75)', el:'rgba(251,146,60,0.8)',  fill:'rgba(251,146,60,0.12)'},
};
const CHI2={0.50:1.3863,0.75:2.7726,0.95:5.9915};

function computeEllipsePixels(pixPts,chiSqVal){
  const n=pixPts.length;if(n<3)return null;
  const mx=pixPts.reduce((s,p)=>s+p.x,0)/n,my=pixPts.reduce((s,p)=>s+p.y,0)/n;
  let sxx=0,sxy=0,syy=0;
  for(const p of pixPts){const dx=p.x-mx,dy=p.y-my;sxx+=dx*dx;sxy+=dx*dy;syy+=dy*dy;}
  sxx/=(n-1);sxy/=(n-1);syy/=(n-1);
  const tr=sxx+syy,det=sxx*syy-sxy*sxy,disc=Math.sqrt(Math.max(0,tr*tr/4-det));
  const lam1=tr/2+disc,lam2=tr/2-disc;
  const angle=Math.abs(sxy)<1e-6?(sxx>=syy?0:Math.PI/2):Math.atan2(lam1-sxx,sxy);
  const sc=Math.sqrt(chiSqVal);
  return{cx:mx,cy:my,a:Math.sqrt(Math.max(0,lam1))*sc,b:Math.sqrt(Math.max(0,lam2))*sc,angle};
}

function setDispCat(cat,btn){dispCat=cat;document.querySelectorAll('#disp-cat-btns .roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildShotDispersion();}
function setDispRecent(recent,btn){dispRecent=recent;document.querySelectorAll('#disp-recent-btns .roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildShotDispersion();}
function setDispCI(ci,btn){dispCI=ci;document.querySelectorAll('#disp-ci-btns .roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildShotDispersion();}
function clickDispCatCard(cat){dispCat=cat;document.querySelectorAll('#disp-cat-btns .roll-btn').forEach(b=>{if(b.textContent.trim()===cat)b.classList.add('active');else b.classList.remove('active');});buildShotDispersion();}

function buildShotDispersion(){
  let shots=currentPlayer.approach_shots||[];
  if(dispRecent!=='all'&&shots.length>0){
    const allRounds=[...currentPlayer.rounds].sort((a,b)=>a.date.localeCompare(b.date));
    if(dispRecent==='last1'){const lastDate=allRounds[allRounds.length-1]?.date;shots=shots.filter(s=>s.date===lastDate||!s.date);if(shots.every(s=>!s.date))shots=(currentPlayer.approach_shots||[]).slice(-18);}
    else if(dispRecent==='last10'){const last10Dates=new Set(allRounds.slice(-10).map(r=>r.date));shots=shots.filter(s=>s.date&&last10Dates.has(s.date));if(!shots.length)shots=(currentPlayer.approach_shots||[]).slice(-180);}
  }
  const el=document.getElementById('chart-dispersion');if(!el)return;
  if(dispCat==='Mid Iron'){
    const catCounts={};shots.forEach(s=>{catCounts[s.cat]=(catCounts[s.cat]||0)+1;});
    const mostCat=Object.entries(catCounts).sort((a,b)=>b[1]-a[1])[0];
    if(mostCat)dispCat=mostCat[0];
    document.querySelectorAll('#disp-cat-btns .roll-btn').forEach(b=>b.classList.toggle('active',b.textContent.trim()===dispCat));
  }
  if(!shots.length){el.parentElement.innerHTML=`<div class="empty-state">No individual approach shot data available.</div>`;document.getElementById('disp-stats').innerHTML='';return;}
  const filtered=dispCat==='All'?shots:shots.filter(s=>s.cat===dispCat);
  const girPts=filtered.filter(s=>s.gir).map(p=>({x:p.x,y:p.y,club:p.club,cat:p.cat}));
  const missedPts=filtered.filter(s=>!s.gir).map(p=>({x:p.x,y:p.y,club:p.club,cat:p.cat}));
  const datasets=[
    {label:`GIR (${girPts.length})`,data:girPts,backgroundColor:'rgba(74,222,128,0.70)',pointRadius:4,pointHoverRadius:7},
    {label:`Missed Green (${missedPts.length})`,data:missedPts,backgroundColor:'rgba(248,113,113,0.65)',pointRadius:4,pointHoverRadius:7},
    {label:'_target',data:[{x:0,y:0}],backgroundColor:'rgba(255,255,255,0.95)',pointRadius:10,pointStyle:'crossRot',pointBorderWidth:2.5,pointBorderColor:'rgba(255,255,255,0.95)'}
  ];
  const ellipsePlugin={id:'ellipsePlugin',afterDatasetsDraw(chart){
    const ctx=chart.ctx,xs=chart.scales.x,ys=chart.scales.y,chiVal=CHI2[dispCI];
    ctx.save();ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.setLineDash([5,5]);
    const x0=xs.getPixelForValue(0),y0=ys.getPixelForValue(0);
    ctx.beginPath();ctx.moveTo(xs.left,y0);ctx.lineTo(xs.right,y0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x0,ys.top);ctx.lineTo(x0,ys.bottom);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
    const ellGroups=[{pts:filtered.filter(s=>s.gir),col:{el:'rgba(74,222,128,0.85)',fill:'rgba(74,222,128,0.1)'}},{pts:filtered.filter(s=>!s.gir),col:{el:'rgba(248,113,113,0.85)',fill:'rgba(248,113,113,0.1)'}}];
    for(const g of ellGroups){
      if(g.pts.length<3)continue;
      const pixPts=g.pts.map(p=>({x:xs.getPixelForValue(p.x),y:ys.getPixelForValue(p.y)}));
      const ell=computeEllipsePixels(pixPts,chiVal);if(!ell||ell.a<1||ell.b<1)continue;
      ctx.save();ctx.translate(ell.cx,ell.cy);ctx.rotate(ell.angle);
      ctx.beginPath();ctx.ellipse(0,0,ell.a,ell.b,0,0,2*Math.PI);
      ctx.fillStyle=g.col.fill;ctx.fill();ctx.strokeStyle=g.col.el;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.restore();
      const meanX=pixPts.reduce((s,p)=>s+p.x,0)/pixPts.length,meanY=pixPts.reduce((s,p)=>s+p.y,0)/pixPts.length;
      ctx.save();ctx.strokeStyle=g.col.el;ctx.lineWidth=1.5;ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(meanX-6,meanY);ctx.lineTo(meanX+6,meanY);ctx.stroke();
      ctx.beginPath();ctx.moveTo(meanX,meanY-6);ctx.lineTo(meanX,meanY+6);ctx.stroke();ctx.restore();
    }
  }};
  const allX=filtered.map(p=>p.x),allY=filtered.map(p=>p.y);
  const pad=1.4,xRange=Math.max(Math.abs(Math.min(...allX)),Math.abs(Math.max(...allX)),20)*pad,yRange=Math.max(Math.abs(Math.min(...allY)),Math.abs(Math.max(...allY)),20)*pad,axRange=Math.max(xRange,yRange);
  if(charts['chart-dispersion']){try{charts['chart-dispersion'].destroy();}catch(e){}}
  charts['chart-dispersion']=new Chart(el.getContext('2d'),{
    type:'scatter',data:{datasets},
    options:{responsive:true,
      plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:10,filter:i=>i.text!=='_target'}},
        tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,
          callbacks:{title:ctx=>ctx[0].dataset.label,label(ctx){const p=ctx.raw;const lr=p.x===0&&p.y===0?'Pin (Target)':p.x>0?`${p.x.toFixed(1)}ft Right`:`${Math.abs(p.x).toFixed(1)}ft Left`;const sl=p.x===0&&p.y===0?'':p.y>0?`${p.y.toFixed(1)}ft Long`:`${Math.abs(p.y).toFixed(1)}ft Short`;const cat=p.cat?`${p.cat}${p.club?' — '+p.club:''}`:'';return cat?[cat,lr,sl].filter(Boolean):[lr,sl].filter(Boolean);}}}},
      scales:{
        x:{min:-axRange,max:axRange,grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'← Left   |   Right →   (feet)',color:C.txt,font:FONT}},
        y:{min:-axRange,max:axRange,grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'Short ↓   |   ↑ Long   (feet)',color:C.txt,font:FONT}}}},
    plugins:[ellipsePlugin]
  });
  const dispBox=document.getElementById('disp-miss-box');
  if(dispBox){
    const src_shots=dispCat==='All'?shots:filtered;
    if(src_shots.length>=3){
      const avgX=src_shots.reduce((s,p)=>s+p.x,0)/src_shots.length,avgY=src_shots.reduce((s,p)=>s+p.y,0)/src_shots.length;
      const lrStr=avgX<0?`${Math.abs(avgX).toFixed(1)} ft left`:`${avgX.toFixed(1)} ft right`;
      const slStr=avgY<0?`${Math.abs(avgY).toFixed(1)} ft short`:`${avgY.toFixed(1)} ft long`;
      dispBox.innerHTML=`<span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;letter-spacing:2px;color:var(--blue)">General Miss Tendency — ${dispCat}</span><br><br>Across <strong style="color:var(--text)">${src_shots.length} shots</strong> with ${dispCat==='All'?'all clubs':dispCat}, your average miss is <strong style="color:var(--amber)">${lrStr}</strong> and <strong style="color:var(--amber)">${slStr}</strong> of the target.`;
    } else { dispBox.innerHTML=''; }
  }
  const allCats=['Wood','Long Iron','Mid Iron','Short Iron','Wedge'];
  document.getElementById('disp-stats').innerHTML=allCats.map(cat=>{
    const pts=(currentPlayer.approach_shots||[]).filter(s=>s.cat===cat);if(!pts.length)return'';
    const lrA=pts.reduce((s,p)=>s+p.x,0)/pts.length,slA=pts.reduce((s,p)=>s+p.y,0)/pts.length;
    const col=CAT_COL[cat],lrStr=lrA>0?`${lrA.toFixed(1)}ft Right`:`${Math.abs(lrA).toFixed(1)}ft Left`,slStr=slA>0?`${slA.toFixed(1)}ft Long`:`${Math.abs(slA).toFixed(1)}ft Short`;
    const isActive=dispCat===cat;
    const borderStyle=isActive?`border:2px solid ${col?col.el:'var(--blue)'};background:var(--surface3);box-shadow:0 0 12px ${col?col.fill:'rgba(96,165,250,0.2)'}`:`border:1px solid var(--border);opacity:0.6`;
    return`<div class="stat-card" onclick="clickDispCatCard('${cat}')" style="cursor:pointer;transition:all 0.2s;border-top-color:${col?col.el:'var(--blue)'};${borderStyle}">
      <div class="stat-label" style="color:${isActive?'var(--text)':'var(--text-dim)'};font-weight:${isActive?'600':'400'}">${isActive?'▶ ':''}${cat}</div>
      <div style="font-family:'Barlow',sans-serif;font-size:11px;color:var(--text-dim);margin-top:6px;line-height:1.8">${pts.length} shots<br>L/R: <span style="color:var(--text)">${lrStr}</span><br>S/L: <span style="color:var(--text)">${slStr}</span></div>
      ${isActive?`<div style="font-family:'Barlow',sans-serif;font-size:9px;color:${col?col.el:'var(--blue)'};margin-top:8px;letter-spacing:1px;text-transform:uppercase">Showing in scatter ✓</div>`:''}
    </div>`;
  }).join('');
}

// ─── Birdies & Bogeys ─────────────────────────────────────────────────────────
function buildBirdiesBogeys(){
  const s=sorted();
  const a_b=avg(s.map(x=>x.birdies)),a_bo=avg(s.map(x=>x.bogeys));
  const max_b=Math.max(...s.map(x=>x.birdies));
  document.getElementById('bb-stats').innerHTML=`
    <div class="stat-card"><div class="stat-label">Avg Birdies+</div><div class="stat-value stat-good">${fmt(a_b,1)}</div><div class="stat-sub">per round</div></div>
    <div class="stat-card"><div class="stat-label">Avg Bogeys+</div><div class="stat-value stat-bad">${fmt(a_bo,1)}</div><div class="stat-sub">per round</div></div>
    <div class="stat-card"><div class="stat-label">Best Birdie Rnd</div><div class="stat-value stat-good">${max_b}</div><div class="stat-sub">birdies in a round</div></div>
    <div class="stat-card"><div class="stat-label">B:Bogey Ratio</div><div class="stat-value ${a_b/a_bo>=0.3?'stat-good':'stat-bad'}">${fmt(a_b/a_bo,2)}</div><div class="stat-sub">higher is better</div></div>
  `;
  buildBBRollingChart(s,bbRollingWindow);
  mkChart('chart-birdies','bar',{labels:s.map(x=>x.date.slice(5,10)),datasets:[{data:s.map(x=>x.birdies),backgroundColor:'rgba(74,222,128,0.5)',borderColor:C.green,borderWidth:1}]},{...bOpts('Birdies+')});
  mkChart('chart-bogeys','bar',{labels:s.map(x=>x.date.slice(5,10)),datasets:[{data:s.map(x=>x.bogeys+x.doubles_plus),backgroundColor:s.map(x=>(x.bogeys+x.doubles_plus)>=9?C.rd:C.ad),borderColor:s.map(x=>(x.bogeys+x.doubles_plus)>=9?C.red:C.amber),borderWidth:1}]},{...bOpts('Bogeys+')});
}
function buildBBRollingChart(s,w){
  const birds=s.map(x=>x.birdies),bogs=s.map(x=>x.bogeys+x.doubles_plus);
  if(charts['chart-bb-rolling']){try{charts['chart-bb-rolling'].destroy();}catch(e){}}
  const el=document.getElementById('chart-bb-rolling');if(!el)return;
  charts['chart-bb-rolling']=new Chart(el.getContext('2d'),{
    type:'line',data:{labels:s.map(x=>x.date.slice(5,10)),datasets:[
      {label:'Birdies',data:birds,borderColor:C.gd,pointRadius:2,pointBackgroundColor:C.gd,tension:0.2},
      {label:`${w}-Rnd Birdie`,data:rollingAvg(birds,w),borderColor:C.green,borderWidth:2.5,pointRadius:0,tension:0.4},
      {label:'Bogeys',data:bogs,borderColor:C.rd,pointRadius:2,pointBackgroundColor:C.rd,tension:0.2},
      {label:`${w}-Rnd Bogey`,data:rollingAvg(bogs,w),borderColor:C.red,borderWidth:2.5,pointRadius:0,tension:0.4}
    ]},options:{...bOpts(),plugins:{...bOpts().plugins,legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}}}}
  });
}
function setBBRolling(w,btn){bbRollingWindow=w;document.querySelectorAll('#section-birdies .rolling-controls .roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildBBRollingChart(sorted(),w);}

// ─── Tiger Five ───────────────────────────────────────────────────────────────
async function buildTigerFive(){
  const r=currentPlayer.rounds, s=sorted();
  if(tigerHoleData===null&&currentPlayer.player_id){
    try{
      const{data:roundRows}=await sb.from('rounds').select('id,date').eq('player_id',currentPlayer.player_id);
      const rdm={};(roundRows||[]).forEach(rr=>{rdm[rr.id]=rr.date;});
      const{data:hd}=await sb.from('hole_data').select('par,score,appr_club,green,short_sided,round_id').eq('player_id',currentPlayer.player_id);
      tigerHoleData=(hd||[]).map(h=>({...h,date:rdm[h.round_id]||null}));
    }catch(e){tigerHoleData=[];}
  }
  const hd=tigerHoleData||[];
  const totalH=r.length*18, totalD=r.reduce((a,x)=>a+(x.doubles_plus||0),0), doublePct=totalH>0?totalD/totalH*100:0;
  let par5Pct;
  if(hd.length){const p5=hd.filter(h=>parseInt(h.par)===5);const p5bog=p5.filter(h=>parseInt(h.score)>parseInt(h.par)).length;par5Pct=p5.length>0?p5bog/p5.length*100:20;}
  else{const ps=currentPlayer.par_scoring;par5Pct=Math.max(5,Math.min(45,(ps['5']||0)*15+20));}
  let shortBogPct;
  if(hd.length){const siH=hd.filter(h=>isScoringClub(h.appr_club));const siBog=siH.filter(h=>parseInt(h.score)>parseInt(h.par)).length;shortBogPct=siH.length>0?siBog/siH.length*100:25;}
  else{const cats=currentPlayer.approach_cats;const shortGIR=cats['Short Iron']?cats['Short Iron'].gir_pct:50;shortBogPct=100-shortGIR;}
  const threePr=r.filter(x=>x.three_putts!=null);
  const totalHPutt=threePr.reduce((a,x)=>a+x.holes,0), est3=threePr.reduce((a,x)=>a+(x.three_putts||0),0);
  const t3Pct=totalHPutt>0?est3/totalHPutt*100:8;
  const roundsWithUD=r.filter(x=>x.easy_ud_attempts>0);
  const a_scram=avg(r.filter(x=>x.scrambling!=null).map(x=>x.scrambling));
  const failUD=roundsWithUD.length>=3?Math.round((roundsWithUD.reduce((a,x)=>a+x.failed_ud,0)/roundsWithUD.reduce((a,x)=>a+x.easy_ud_attempts,0))*1000)/10:100-(a_scram||50);
  const metrics=[
    {name:'3-Putts',            pct:Math.round(t3Pct*10)/10,     goal:5,  pass:t3Pct<=5},
    {name:'Failed Easy Up/Down',pct:Math.round(failUD*10)/10,    goal:33, pass:failUD<=33},
    {name:'Bogey+ on Par 5s',   pct:Math.round(par5Pct*10)/10,  goal:20, pass:par5Pct<=20},
    {name:'Double Bogeys+',     pct:Math.round(doublePct*10)/10, goal:10, pass:doublePct<=10},
    {name:'Bogeys ≤ 9i',        pct:Math.round(shortBogPct*10)/10,goal:20,pass:shortBogPct<=20},
  ];
  const par5ByRound={}, siByRound={};
  for(const h of hd){
    const rid=h.round_id;if(!rid||!h.date)continue;
    if(!par5ByRound[rid])par5ByRound[rid]={bog:0,total:0,date:h.date};
    if(!siByRound[rid])siByRound[rid]={bog:0,total:0,date:h.date};
    if(parseInt(h.par)===5){par5ByRound[rid].total++;if(parseInt(h.score)>parseInt(h.par))par5ByRound[rid].bog++;}
    if(isScoringClub(h.appr_club)){siByRound[rid].total++;if(parseInt(h.score)>parseInt(h.par))siByRound[rid].bog++;}
  }
  function buildHDSeries(byRound,fallbackFn){
    const hdSeries=Object.values(byRound).filter(d=>d.total>0&&d.date).map(d=>({date:d.date,val:Math.round(d.bog/d.total*1000)/10})).sort((a,b)=>a.date.localeCompare(b.date));
    return hdSeries.length>=2?hdSeries:fallbackFn();
  }
  const tigerPerRound={
    'Bogey+ on Par 5s':buildHDSeries(par5ByRound,()=>s.filter(x=>x.par5_holes>0).map(x=>({date:x.date,val:Math.round(x.par5_bogeys/x.par5_holes*1000)/10}))),
    'Double Bogeys+':s.filter(x=>x.doubles_plus!=null&&x.holes).map(x=>({date:x.date,val:Math.round(x.doubles_plus/(x.holes||18)*1000)/10})),
    'Bogeys ≤ 9i':buildHDSeries(siByRound,()=>s.filter(x=>x.si_holes>0).map(x=>({date:x.date,val:Math.round(x.si_bogeys/x.si_holes*1000)/10}))),
    '3-Putts':s.filter(x=>x.three_putts!=null).map(x=>({date:x.date,val:Math.round(x.three_putts/(x.holes||18)*1000)/10})),
    'Failed Easy Up/Down':(()=>{const ud=s.filter(x=>x.easy_ud_attempts>0).map(x=>({date:x.date,val:Math.round(x.failed_ud/x.easy_ud_attempts*1000)/10}));return ud.length>=2?ud:s.filter(x=>x.scrambling!=null).map(x=>({date:x.date,val:Math.round((100-x.scrambling)*10)/10}));})(),
  };
  document.getElementById('tiger-cards').innerHTML=metrics.map(m=>`
    <div class="tiger-card ${m.pass?'tiger-pass':'tiger-fail'}" onclick="showTigerRolling('${m.name.replace(/'/g,"\\'")}')"
         style="cursor:pointer;transition:transform 0.15s,box-shadow 0.15s"
         onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
         onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div class="tiger-title">${m.name}</div>
      <div class="tiger-pct ${m.pass?'val-green':'val-red'}">${m.pct}%</div>
      <div class="tiger-goal">Goal: ≤${m.goal}%</div>
      <div class="tiger-diff ${m.pass?'val-green':'val-red'}">${m.pass?'✓ On Track':'✗ Needs Work'}</div>
      <div style="font-family:'Barlow',sans-serif;font-size:9px;color:var(--text-dim);margin-top:6px;letter-spacing:0.5px">click for trend →</div>
    </div>`).join('');
  window._tigerPerRound=tigerPerRound;window._tigerMetrics=metrics;
}

function isScoringClub(c){if(!c)return false;const cl=c.toLowerCase().replace(/\s+/g,'');return cl==='9i'||cl==='pw'||cl==='10i'||cl.includes('deg');}

function showTigerRolling(metricName){
  const wrap=document.getElementById('tiger-rolling-wrap'),titleEl=document.getElementById('tiger-rolling-title'),subEl=document.getElementById('tiger-rolling-sub'),canvasEl=document.getElementById('chart-tiger-rolling');
  if(!wrap)return;
  if(charts['chart-tiger-rolling']){try{charts['chart-tiger-rolling'].destroy();}catch(e){}delete charts['chart-tiger-rolling'];}
  if(canvasEl){canvasEl.style.display='block';const ctx=canvasEl.getContext('2d');ctx.clearRect(0,0,canvasEl.width,canvasEl.height);}
  document.querySelectorAll('.tiger-card').forEach(c=>{const t=c.querySelector('.tiger-title');c.style.outline=t&&t.textContent.trim()===metricName?'2px solid var(--blue)':'';});
  wrap.style.display='block';wrap.scrollIntoView({behavior:'smooth',block:'nearest'});
  const series=window._tigerPerRound?.[metricName],metric=window._tigerMetrics?.find(m=>m.name===metricName);
  if(!series||!series.length){titleEl.textContent=metricName+' — No Data Yet';subEl.textContent='No round-level data available for this metric.';if(canvasEl)canvasEl.style.display='none';return;}
  const filteredSeries=series.filter(x=>x.val!=null);
  if(filteredSeries.length<2){titleEl.textContent=metricName+' — Insufficient Data';subEl.textContent=`Only ${filteredSeries.length} data point${filteredSeries.length===1?'':'s'} — need at least 2 rounds.`;if(canvasEl)canvasEl.style.display='none';return;}
  titleEl.textContent=metricName+' — 4-Round Rolling Average';
  const goalVal=metric?.goal;subEl.textContent=`Goal: ≤${goalVal}% · ${filteredSeries.length} rounds`;
  const labels=filteredSeries.map(x=>x.date.slice(5,10)),vals=filteredSeries.map(x=>x.val),ra4=rollingAvg(vals,4);
  charts['chart-tiger-rolling']=new Chart(canvasEl.getContext('2d'),{
    type:'bar',data:{labels,datasets:[
      {type:'bar',label:metricName,data:vals,backgroundColor:vals.map(v=>v<=goalVal?'rgba(74,222,128,0.7)':'rgba(248,113,113,0.7)'),borderColor:vals.map(v=>v<=goalVal?C.green:C.red),borderWidth:1,order:2},
      {type:'line',label:'4-Rnd Avg',data:ra4,borderColor:C.blue,backgroundColor:'transparent',borderWidth:2.5,pointRadius:0,tension:0.4,order:1},
      {type:'line',label:`Goal ≤${goalVal}%`,data:vals.map(()=>goalVal),borderColor:'rgba(251,191,36,0.8)',backgroundColor:'transparent',borderWidth:1.5,borderDash:[6,4],pointRadius:0,order:0}
    ]},
    options:{responsive:true,plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:20}},
      tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,callbacks:{label(ctx){return`${ctx.dataset.label}: ${ctx.parsed.y!=null?ctx.parsed.y.toFixed(1)+'%':'—'}`;}}}}
    ,scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}},y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},min:0,title:{display:true,text:'%',color:C.txt,font:FONT}}}}
  });
}

// ─── Bad/Good ─────────────────────────────────────────────────────────────────
function buildBadGood(){
  const bc=currentPlayer.bad_clubs,br=currentPlayer.bad_reasons;
  const cn=Object.keys(bc).sort((a,b)=>bc[b]-bc[a]);
  mkChart('chart-bad-clubs','bar',{labels:cn,datasets:[{data:cn.map(c=>bc[c]),backgroundColor:'rgba(248,113,113,0.5)',borderColor:C.red,borderWidth:1}]},{...bOpts('# Bad Scores'),indexAxis:'y'});
  const reasons=Object.entries(br).sort((a,b)=>b[1]-a[1]),maxR=reasons.length?reasons[0][1]:1;
  document.getElementById('bad-reasons-list').innerHTML=`<div class="h-bar-list">${reasons.map(([r,c])=>`<div class="h-bar-item"><div class="h-bar-label">${r}</div><div class="h-bar-track"><div class="h-bar-fill" style="width:${(c/maxR)*100}%;background:rgba(248,113,113,0.6)"></div></div><div class="h-bar-val">${c}</div></div>`).join('')}</div>`;
}

// ─── AI Caddie ────────────────────────────────────────────────────────────────
let caddieHistory=[];
const CADDIE_PROMPTS=["What is my biggest weakness based on my stats?","Which club category should I practice most?","How has my scoring trended over my last 10 rounds?","Where am I losing the most shots on approach?","What does my putting data tell you?","What's one thing I should focus on to break 75?","Compare my scrambling to what a good amateur should average","What patterns do you see in my bad rounds?"];

function buildAICaddie(){const cont=document.getElementById('caddie-prompts');if(!cont)return;cont.innerHTML=CADDIE_PROMPTS.map(p=>`<button class="prompt-btn" onclick="useCaddiePrompt(this)">${p}</button>`).join('');}
function useCaddiePrompt(btn){document.getElementById('caddie-input').value=btn.textContent;document.getElementById('caddie-input').focus();}

function buildPlayerContext(){
  const r=currentPlayer.rounds,s=[...r].sort((a,b)=>a.date.localeCompare(b.date));
  const av=arr=>{const v=arr.filter(x=>x!=null&&!isNaN(x));return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  const a_score=av(r.map(x=>x.score)),a_pm=av(r.map(x=>x.plus_minus)),a_gir=av(r.filter(x=>x.gir_pct>0).map(x=>x.gir_pct));
  const a_fw=av(r.filter(x=>x.fw_pct!=null).map(x=>x.fw_pct)),a_scram=av(r.filter(x=>x.scrambling!=null).map(x=>x.scrambling));
  const a_putts=av(r.filter(x=>x.putts).map(x=>x.putts)),a_birds=av(r.map(x=>x.birdies)),a_bogs=av(r.map(x=>x.bogeys)),a_dr=av(r.filter(x=>x.driver_dist).map(x=>x.driver_dist));
  const recent=s.slice(-8).map(rnd=>`  ${rnd.date} | ${rnd.course} | Score: ${rnd.score} (${rnd.plus_minus>=0?'+':''}${rnd.plus_minus}) | GIR: ${rnd.gir_pct}% | FW: ${rnd.fw_pct||'n/a'}% | Putts: ${rnd.putts||'n/a'} | Scramble: ${rnd.scrambling||'n/a'}%`).join('\n');
  const cats=currentPlayer.approach_cats||{},catLines=Object.entries(cats).map(([cat,d])=>`  ${cat}: ${d.shots} shots, GIR ${d.gir_pct}%, L/R miss ${d.lr_miss}ft, S/L miss ${d.sl_miss}ft`).join('\n');
  const ps=currentPlayer.par_scoring||{},mp=currentPlayer.make_pct||{},br=currentPlayer.bad_reasons||{};
  const topReasons=Object.entries(br).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([r2,c])=>`${r2} (${c}x)`).join(', ');
  return`PLAYER: ${currentPlayer.name}\nTOTAL ROUNDS: ${r.length}\n\nCAREER AVERAGES:\n  Scoring Avg: ${a_score!=null?a_score.toFixed(1):'n/a'} (${a_pm!=null?(a_pm>=0?'+':'')+a_pm.toFixed(1):'n/a'} to par)\n  GIR %: ${a_gir!=null?a_gir.toFixed(1):'n/a'}%\n  Fairways %: ${a_fw!=null?a_fw.toFixed(1):'n/a'}%\n  Scrambling %: ${a_scram!=null?a_scram.toFixed(1):'n/a'}%\n  Birdies/Round: ${a_birds!=null?a_birds.toFixed(1):'n/a'}\n  Bogeys+/Round: ${a_bogs!=null?a_bogs.toFixed(1):'n/a'}\n  Driver Distance: ${a_dr!=null?a_dr.toFixed(0):'n/a'} yds\n\nPAR SCORING:\n  Par 3: ${ps['3']!=null?(ps['3']>=0?'+':'')+ps['3']:'n/a'}\n  Par 4: ${ps['4']!=null?(ps['4']>=0?'+':'')+ps['4']:'n/a'}\n  Par 5: ${ps['5']!=null?(ps['5']>=0?'+':'')+ps['5']:'n/a'}\n\nAPPROACH STATS:\n${catLines}\n\nPUTTING MAKE %:\n  0-3ft: ${mp['0-3']||'n/a'}% / 99%\n  3-5ft: ${mp['3-5']||'n/a'}% / 88%\n  5-8ft: ${mp['5-8']||'n/a'}% / 68%\n  8-12ft: ${mp['8-12']||'n/a'}% / 50%\n  12-20ft: ${mp['12-20']||'n/a'}% / 29%\n\nTOP REASONS FOR BAD SCORES: ${topReasons||'n/a'}\n\nLAST 8 ROUNDS:\n${recent}`;
}

async function sendCaddieMessage(){
  const inp=document.getElementById('caddie-input'),msg=inp.value.trim();if(!msg)return;
  inp.value='';const btn=document.getElementById('caddie-send-btn');btn.disabled=true;
  appendCaddieMsg(msg,'user');caddieHistory.push({role:'user',content:msg});
  const typingId=appendCaddieTyping();
  try{
    const ctx=buildPlayerContext();
    const geminiContents=caddieHistory.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
    const systemPrompt=`You are an expert golf coach and AI Caddie for ${currentPlayer.name}. You have complete access to their statistical profile below. Give specific, data-driven insights. Reference their actual numbers. Be conversational but precise. Use plain text — no markdown headers, no bullet asterisks.\n\n${ctx}`;
    if(geminiContents.length>0&&geminiContents[0].role==='user'){geminiContents[0].parts[0].text=systemPrompt+'\n\nPlayer question: '+geminiContents[0].parts[0].text;}
    const GEMINI_KEY='AIzaSyASAJdavpInQTlNlQ1eBt4uuVUkwMqfZ6c';
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:geminiContents})});
    removeCaddieTyping(typingId);
    if(!response.ok){const e=await response.json();throw new Error(e.error?.message||'Gemini API error '+response.status);}
    const data=await response.json();
    const reply=data.candidates?.[0]?.content?.parts?.[0]?.text||'No response received.';
    caddieHistory.push({role:'assistant',content:reply});appendCaddieMsg(reply,'ai');
  }catch(e){removeCaddieTyping(typingId);appendCaddieMsg('Sorry, I had trouble connecting. Error: '+e.message,'ai');}
  btn.disabled=false;inp.focus();
}
function appendCaddieMsg(text,role){const chat=document.getElementById('caddie-chat');const div=document.createElement('div');div.className=`caddie-msg caddie-msg-${role}`;const initials=role==='ai'?'AI':(currentPlayer.name||'Me').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();div.innerHTML=`<div class="caddie-avatar">${initials}</div><div class="caddie-bubble">${text.replace(/\n/g,'<br>')}</div>`;chat.appendChild(div);chat.scrollTop=chat.scrollHeight;}
function appendCaddieTyping(){const chat=document.getElementById('caddie-chat');const id='typing-'+Date.now();const div=document.createElement('div');div.className='caddie-msg caddie-msg-ai';div.id=id;div.innerHTML=`<div class="caddie-avatar">AI</div><div class="caddie-bubble"><div class="caddie-typing"><span></span><span></span><span></span></div></div>`;chat.appendChild(div);chat.scrollTop=chat.scrollHeight;return id;}
function removeCaddieTyping(id){const el=document.getElementById(id);if(el)el.remove();}

// ─── Definitions ──────────────────────────────────────────────────────────────
const DEFINITIONS=[
  {section:"Scoring Terms",terms:[
    {name:"Par",body:"The expected number of strokes a scratch golfer should need to complete a hole or round."},
    {name:"Birdie+",body:"Any score of 1 or more strokes under par on a hole."},
    {name:"Bogey+",body:"Any score of 1 or more strokes over par on a hole."},
    {name:"Scoring Average",body:"Your mean total score across all tracked rounds."},
    {name:"+/- to Par",body:"How many strokes over or under par you scored in a round or on average."},
    {name:"Rolling Average",body:"A smoothed trend line calculated as the average of the last N rounds."},
    {name:"Trend Line",body:"A linear regression line showing the overall direction of improvement or decline over time.",formula:"y = mx + b (least squares linear regression)"},
  ]},
  {section:"Ball Striking",terms:[
    {name:"Greens in Regulation (GIR)",body:"Hitting the putting surface within par minus 2 strokes.",formula:"GIR % = (GIRs ÷ holes played) × 100 — Goal: 67%"},
    {name:"Fairway Hit (FW%)",body:"Your tee shot on a par 4 or par 5 lands in the fairway.",formula:"FW % = (fairways hit ÷ par 4+5 holes) × 100 — Goal: 70%"},
    {name:"Driver Distance",body:"Average carry and roll distance of tee shots hit with the Driver."},
    {name:"Proximity to Hole",body:"Average distance of your first putt on GIR holes. PGA Tour average: ~22 ft."},
    {name:"Left / Right Miss",body:"How far left or right your approach shots finish relative to target.",formula:"Negative = left · Positive = right"},
    {name:"Short / Long Miss",body:"How far short or long your approach shots finish relative to target.",formula:"Negative = short · Positive = long"},
  ]},
  {section:"Short Game",terms:[
    {name:"Scrambling %",body:"The percentage of holes where you missed the green but still made par or better.",formula:"(Pars-or-better after missed GIR ÷ total missed GIRs) × 100 — Goal: 50%"},
    {name:"Up & Down",body:"Getting the ball into the hole in exactly 2 strokes from around the green after missing it."},
    {name:"1-Putt Scrambling",body:"Making the putt in a single stroke after a chip or pitch from off the green."},
  ]},
  {section:"Putting",terms:[
    {name:"GIR 1-Putt %",body:"The percentage of greens hit in regulation where you hole out in one putt. Tour average is ~28-32%."},
    {name:"1-Putt",body:"Holing the ball on the very first putt."},
    {name:"3-Putt",body:"Taking three or more strokes to hole out.",formula:"Goal: fewer than 5% of greens result in 3-putts"},
    {name:"Make % by Distance",body:"The percentage of putts holed from a given distance range."},
    {name:"PGA Tour Average (Putting)",body:"The make percentage achieved by professionals on the PGA Tour at each distance band.",formula:"0-3ft: 99% · 3-5ft: 88% · 5-8ft: 68% · 8-12ft: 50% · 12-20ft: 29% · 20-35ft: 13%"},
  ]},
  {section:"Shot Dispersion",terms:[
    {name:"Shot Dispersion Chart",body:"A scatter plot showing where all your approach shots finished relative to the pin."},
    {name:"Confidence Interval (CI)",body:"Statistical boundaries containing a given percentage of your shots. 50% CI = half your shots. 95% CI = nearly all shots."},
    {name:"Confidence Ellipse",body:"An oval drawn around your approach shot scatter representing a confidence interval boundary.",formula:"Uses chi-squared quantiles: 50% CI = 1.39, 95% CI = 5.99"},
  ]},
  {section:"Tiger Five",terms:[
    {name:"Tiger Five",body:"Five key metrics associated with elite-level scoring."},
    {name:"Bogey+ on Par 5s",body:"The % of par 5 holes where you make bogey or worse.",formula:"Goal: ≤ 20%"},
    {name:"Double Bogeys+",body:"The % of holes where you make double bogey or worse.",formula:"Goal: ≤ 10% of holes played"},
    {name:"Bogeys ≤ 9i",body:"The % of approach shots with short irons (9i, PW) that result in bogey or worse.",formula:"Goal: ≤ 20%"},
    {name:"3-Putts",body:"The % of holes where you take 3 or more putts.",formula:"Goal: ≤ 5% of holes"},
    {name:"Failed Easy Up/Down",body:"When you miss the green but fail to make par.",formula:"= 100% − Scrambling % · Goal: ≤ 33%"},
  ]},
];
function buildDefinitions(){
  const grid=document.getElementById('def-grid');if(!grid)return;
  grid.innerHTML=DEFINITIONS.map(cat=>`<div class="def-card"><div class="def-section-title">${cat.section}</div>${cat.terms.map(t=>`<div class="def-term"><div class="def-term-name">${t.name}</div><div class="def-term-body">${t.body}</div>${t.formula?`<div class="def-term-formula">${t.formula}</div>`:''}</div>`).join('')}</div>`).join('');
}

// ─── My Game (Welcome tab) ────────────────────────────────────────────────────
function buildMyGame(){
  const r=currentPlayer.rounds,sortedR=[...r].sort((a,b)=>a.date.localeCompare(b.date));
  const last4=sortedR.slice(-mgWindow),last4v=last4.filter(x=>x.score!=null),lastRound=sortedR[sortedR.length-1];
  if(!last4v.length)return;
  const _t=id=>document.getElementById(id);
  if(_t('mg-snapshot-title'))_t('mg-snapshot-title').textContent=`Last ${mgWindow} Rounds`;
  if(_t('mg-score-title'))_t('mg-score-title').textContent=`Scoring — Last ${mgWindow} Rounds`;
  if(_t('mg-stats-title'))_t('mg-stats-title').textContent=`Key Stats — Last ${mgWindow} Rounds`;
  if(_t('mg-focus-label'))_t('mg-focus-label').textContent=`Top Focus Areas — based on your last ${mgWindow} rounds`;
  const avgN=arr=>{const v=arr.filter(x=>x!=null&&!isNaN(x));return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  const medN=arr=>{const v=[...arr].filter(x=>x!=null&&!isNaN(x)).sort((a,b)=>a-b);if(!v.length)return null;const m=Math.floor(v.length/2);return v.length%2?v[m]:(v[m-1]+v[m])/2;};
  const a_pm=avgN(last4v.map(x=>x.plus_minus)),a_gir=avgN(last4.filter(x=>x.gir_pct>0).map(x=>x.gir_pct));
  const a_fw=avgN(last4.filter(x=>x.fw_pct!=null).map(x=>x.fw_pct)),a_scr=avgN(last4.filter(x=>x.scrambling!=null).map(x=>x.scrambling));
  const a_dr=avgN(last4.filter(x=>x.driver_dist).map(x=>x.driver_dist));
  const gir1puttVals=last4.filter(x=>x.gir_pct>0&&x.one_putts!=null).map(x=>{const gc=Math.max(1,Math.round(x.gir_pct/100*(x.holes||18)));return Math.round((x.one_putts/gc)*1000)/10;});
  const a_gir1putt=gir1puttVals.length?gir1puttVals.reduce((a,b)=>a+b,0)/gir1puttVals.length:null;
  const firstName=currentPlayer.name.split(' ')[0];
  const greetEl=document.getElementById('mygame-greeting'),summEl=document.getElementById('mygame-summary'),metaEl=document.getElementById('mygame-meta');
  if(greetEl)greetEl.textContent=`Welcome back, ${firstName}.`;
  if(summEl){const pmStr=a_pm!=null?(a_pm>=0?'+':'')+a_pm.toFixed(1):' —';const trend=a_pm!=null?(a_pm<=4?'You\'re in good form.':a_pm<=8?'There\'s work to do.':'Your scoring needs serious attention.'):'';summEl.innerHTML=`Last ${mgWindow} rounds you've averaged <strong style="color:var(--text)">${pmStr} to par</strong>. ${trend} Last out: <strong style="color:var(--text)">${lastRound.score} (${lastRound.plus_minus>=0?'+':''}${lastRound.plus_minus})</strong> at ${lastRound.course}.`;}
  if(metaEl)metaEl.textContent=`${r.length} round${r.length!==1?'s':''} tracked · focus window: last ${mgWindow} rounds`;
  // Dispersion weakness
  const CAT_ORDER_DISP=['Wood','Hybrid','Long Iron','Mid Iron','Short Iron','Wedge'];
  const shots=currentPlayer.approach_shots||[];let dispWeakness=null;
  const distShots=shots.filter(s=>s.x!=null&&s.y!=null&&s.dist&&s.dist>0);
  if(distShots.length>=6){
    const dispScores={};
    CAT_ORDER_DISP.forEach(cat=>{const cs=distShots.filter(s=>s.cat===cat);if(cs.length<3)return;const norms=cs.map(s=>{const rad=Math.sqrt(s.x*s.x+s.y*s.y);return rad/(s.dist*3);});dispScores[cat]={score:(medN(norms)*100),n:cs.length};});
    const catsSorted=Object.entries(dispScores).sort((a,b)=>b[1].score-a[1].score);
    if(catsSorted.length){const[worstCat,worstData]=catsSorted[0];dispWeakness={key:'disp',label:`Approach — ${worstCat}`,dir:'low',val:worstData.score,goal:5,fmt:v=>`${v.toFixed(1)}%`,tab:'dispersion',tabLabel:'Shot Dispersion Tab',desc:`Your ${worstCat} dispersion is ${worstData.score.toFixed(1)}% of target distance — that's your loosest club category. `+(worstData.score>10?'Misses of that magnitude are costing you strokes every round.':worstData.score>7?'There\'s meaningful tightening to do here.':'Getting close to the 5% goal — stay sharp.'),n:worstData.n};}
  }
  // Metric scoring
  const allMetrics=[
    {key:'pm',   label:'+/- to Par',   val:a_pm,  goal:6,  dir:'low',  fmt:v=>v!=null?(v>=0?'+':'')+v.toFixed(1):' —',       tab:'scoring', tabLabel:'Trends Tab',      desc:a_pm!=null?(a_pm<=4?'Solid scoring.':a_pm<=7?`${a_pm.toFixed(1)} over par per round.`:`${a_pm.toFixed(1)} over par is too high.`):''},
    {key:'gir',  label:'GIR %',        val:a_gir, goal:67, dir:'high', fmt:v=>v!=null?v.toFixed(1)+'%':'—',                   tab:'approach',tabLabel:'Approach Tab',    desc:a_gir!=null?(a_gir>=67?`${a_gir.toFixed(1)}% GIR — above goal.`:a_gir>=55?`${a_gir.toFixed(1)}% GIR. Below goal.`:`${a_gir.toFixed(1)}% GIR is a problem.`):''},
    {key:'fw',   label:'Fairways Hit', val:a_fw,  goal:70, dir:'high', fmt:v=>v!=null?v.toFixed(1)+'%':'—',                   tab:'tee',     tabLabel:'Off the Tee Tab', desc:a_fw!=null?(a_fw>=70?'Fairways on target.':a_fw>=55?`${a_fw.toFixed(1)}% fairways — below goal.`:`${a_fw.toFixed(1)}% fairways is well below goal.`):''},
    {key:'scram',label:'Scrambling',   val:a_scr, goal:50, dir:'high', fmt:v=>v!=null?v.toFixed(1)+'%':'—',                   tab:'approach',tabLabel:'Approach Tab',    desc:a_scr!=null?(a_scr>=50?'Above goal — solid short game.':a_scr>=35?`${a_scr.toFixed(1)}% scrambling.`:`${a_scr.toFixed(1)}% is well below the 50% goal.`):''},
    {key:'dr',   label:'Driver Avg',   val:a_dr,  goal:260,dir:'high', fmt:v=>v!=null?v.toFixed(0)+' yds':' —',               tab:'tee',     tabLabel:'Off the Tee Tab', desc:a_dr!=null?(a_dr>=270?'Strong distance.':a_dr>=255?`${a_dr.toFixed(0)} yds — decent.`:`${a_dr.toFixed(0)} yds — limited distance.`):''},
    {key:'gir1putt',label:'GIR 1-Putt %',val:a_gir1putt,goal:30,dir:'high',fmt:v=>v!=null?v.toFixed(1)+'%':' —',             tab:'putting', tabLabel:'Putting Tab',     desc:a_gir1putt!=null?(a_gir1putt>=35?'Solid GIR 1-putt rate.':a_gir1putt>=25?`${a_gir1putt.toFixed(1)}% — below 30%.`:`${a_gir1putt.toFixed(1)}% GIR 1-putt rate is well below tour average.`):''},
  ];
  if(dispWeakness)allMetrics.push(dispWeakness);
  const scored=allMetrics.map(m=>{if(m.val==null)return{...m,gap:-1};const gap=m.dir==='high'?Math.max(0,m.goal-m.val)/m.goal:Math.max(0,m.val-m.goal)/m.goal;return{...m,gap};}).filter(m=>m.gap>=0).sort((a,b)=>b.gap-a.gap);
  const top3=scored.slice(0,3);
  const wEl=document.getElementById('mygame-weaknesses');
  if(wEl){wEl.innerHTML=top3.map((m,i)=>{
    const isGood=m.gap<0.03,statColor=isGood?'var(--green)':i===0?'var(--red)':i===1?'var(--amber)':'rgba(96,165,250,0.9)';
    let goalStr;if(m.key==='pm')goalStr=`Goal ≤ +${m.goal}`;else if(m.key==='dr')goalStr=`Goal ≥ ${m.goal} yds`;else if(m.key==='disp')goalStr=`Goal ≤ ${m.goal}% of distance`;else if(m.key==='gir1putt')goalStr=`Goal ≥ ${m.goal}% 1-putt on GIR`;else goalStr=`Goal ${m.dir==='high'?'≥':'≤'} ${m.goal}%`;
    return`<div class="mg-weakness" onclick="navToSection('${m.tab}')"><div class="mg-weakness-rank">${i+1}</div><div class="mg-weakness-label">${m.label}${m.key==='disp'&&m.n?` <span style="font-size:9px;opacity:0.6">(${m.n} shots)</span>`:''}</div><div class="mg-weakness-stat" style="color:${statColor}">${m.fmt(m.val)}</div><div class="mg-weakness-goal">${goalStr}</div><div class="mg-weakness-desc">${m.desc}</div><div class="mg-weakness-link">Analyze in ${m.tabLabel} →</div></div>`;
  }).join('');}
  // Quick stats
  const qEl=document.getElementById('mygame-quickstats');
  if(qEl){const stats=[{label:'Scoring Avg',val:a_pm!=null?(a_pm>=0?'+':'')+a_pm.toFixed(1):' —',sub:`last ${mgWindow} rounds`,cls:a_pm<=4?'stat-good':a_pm>=10?'stat-bad':''},{label:'GIR %',val:a_gir!=null?a_gir.toFixed(1)+'%':' —',cls:a_gir>=67?'stat-good':a_gir<50?'stat-bad':''},{label:'Fairways %',val:a_fw!=null?a_fw.toFixed(1)+'%':' —',cls:a_fw>=70?'stat-good':a_fw<50?'stat-bad':''},{label:'Scrambling',val:a_scr!=null?a_scr.toFixed(1)+'%':' —',cls:a_scr>=50?'stat-good':a_scr<30?'stat-bad':''},{label:'GIR 1-Putt %',val:a_gir1putt!=null?a_gir1putt.toFixed(1)+'%':' —',cls:a_gir1putt>=30?'stat-good':a_gir1putt<20?'stat-bad':''},{label:'Driver Avg',val:a_dr!=null?a_dr.toFixed(0)+' yds':' —'}];qEl.innerHTML=stats.map(st=>`<div class="stat-card"><div class="stat-label">${st.label}</div><div class="stat-value ${st.cls||''}">${st.val}</div>${st.sub?`<div class="stat-sub">${st.sub}</div>`:''}</div>`).join('');}
  // Sparklines
  const lbl4=last4v.map(x=>x.date.slice(5,10)),sc4=last4v.map(x=>x.plus_minus);
  if(charts['chart-mg-score']){try{charts['chart-mg-score'].destroy();}catch(e){}}
  const mgSc=document.getElementById('chart-mg-score');
  if(mgSc){charts['chart-mg-score']=new Chart(mgSc.getContext('2d'),{type:'line',data:{labels:lbl4,datasets:[{data:sc4,borderColor:'rgba(96,165,250,0.8)',backgroundColor:'rgba(96,165,250,0.06)',pointBackgroundColor:sc4.map(v=>v<=4?C.green:v>=10?C.red:C.amber),pointRadius:6,tension:0.3,fill:true}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,callbacks:{label:ctx=>(ctx.raw>=0?'+':'')+ctx.raw+' to par'}}},scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}},y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:'+/- to Par',color:C.txt,font:FONT}}}}});}
  if(charts['chart-mg-stats']){try{charts['chart-mg-stats'].destroy();}catch(e){}}
  const mgSt=document.getElementById('chart-mg-stats');
  if(mgSt){charts['chart-mg-stats']=new Chart(mgSt.getContext('2d'),{type:'line',data:{labels:last4.map(x=>x.date.slice(5,10)),datasets:[{label:'GIR %',data:last4.map(x=>x.gir_pct>0?x.gir_pct:null),borderColor:C.green,backgroundColor:'transparent',pointRadius:4,tension:0.3},{label:'Scramble %',data:last4.map(x=>x.scrambling),borderColor:C.amber,backgroundColor:'transparent',pointRadius:4,tension:0.3},{label:'FW %',data:last4.map(x=>x.fw_pct),borderColor:C.blue,backgroundColor:'transparent',pointRadius:4,tension:0.3}]},options:{responsive:true,plugins:{legend:{display:true,labels:{color:C.txt,font:FONT,boxWidth:16}},tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1}},scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}},y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},min:0,max:100,title:{display:true,text:'%',color:C.txt,font:FONT}}}}});}
}

// ─── Pin Performance ──────────────────────────────────────────────────────────
const PIN_LOCS=['BL','BM','BR','ML','MM','MR','FL','FM','FR'];
const PIN_LABELS={BL:'Back Left',BM:'Back Mid',BR:'Back Right',ML:'Mid Left',MM:'Mid Mid',MR:'Mid Right',FL:'Front Left',FM:'Front Mid',FR:'Front Right'};
const PIN_STATS={
  pm:         {label:'+/- to Par',     dir:'low',  fmt:v=>(v>=0?'+':'')+v.toFixed(2)},
  birdie_pct: {label:'Birdie+ %',      dir:'high', fmt:v=>v.toFixed(1)+'%'},
  bogey_pct:  {label:'Bogey+ %',       dir:'low',  fmt:v=>v.toFixed(1)+'%'},
  gir_pct:    {label:'GIR %',          dir:'high', fmt:v=>v.toFixed(1)+'%'},
  gir1putt:   {label:'GIR 1-Putt %',   dir:'high', fmt:v=>v.toFixed(1)+'%'},
  avg_putts:  {label:'Avg Putts',      dir:'low',  fmt:v=>v.toFixed(2)},
  proximity:  {label:'Proximity (ft)', dir:'low',  fmt:v=>v.toFixed(1)+' ft'},
  short_sided:{label:'Short-Sided %',  dir:'low',  fmt:v=>v.toFixed(1)+'%'},
  sg_approach:{label:'SG Approach',    dir:'high', fmt:v=>(v>=0?'+':'')+v.toFixed(3)},
};

function setPinStat(stat,btn){pinStat=stat;document.querySelectorAll('#pin-stat-btns .pin-stat-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderPinGrid();if(pinSelected)showPinTrend(pinSelected);}
function setPinWindow(w,btn){pinWindow=w;document.querySelectorAll('#pin-window-btns .roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');pinSelected=null;const s=document.getElementById('pin-summary');if(s)s.style.display='none';renderPinGrid();}
function setPinClub(cat,btn){pinClub=cat;document.querySelectorAll('#pin-club-btns .roll-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');pinSelected=null;const s=document.getElementById('pin-summary');if(s)s.style.display='none';renderPinGrid();}

async function buildPinPerformance(){
  if(pinHoleData===null&&currentPlayer.player_id){
    try{
      const{data:hd}=await sb.from('hole_data').select('pin_loc,par,score,green,num_putts,short_sided,appr_club,appr_lr,appr_sl,putt1_len,sg_approach,round_id,rounds!inner(date)').eq('player_id',currentPlayer.player_id);
      pinHoleData=(hd||[]).map(h=>({pin_loc:h.pin_loc,par:parseInt(h.par)||null,score:parseInt(h.score)||null,green:h.green,num_putts:parseInt(h.num_putts)||null,short_sided:h.short_sided,appr_club:h.appr_club,appr_lr:parseFloat(h.appr_lr)||null,appr_sl:parseFloat(h.appr_sl)||null,putt1_len:parseFloat(h.putt1_len)||null,sg_approach:h.sg_approach!=null?parseFloat(h.sg_approach):null,round_id:h.round_id,date:h.rounds?.date||null}));
    }catch(e){pinHoleData=[];}
  }
  const hd=pinHoleData||[];
  const emEl=document.getElementById('pin-empty'),grid=document.getElementById('pin-grid');
  if(!hd.filter(h=>h.pin_loc).length){if(emEl)emEl.style.display='block';if(grid)grid.style.display='none';return;}
  if(emEl)emEl.style.display='none';if(grid)grid.style.display='grid';
  const hasSG=hd.some(h=>h.sg_approach!=null);const sgBtn=document.getElementById('pin-sg-btn');if(sgBtn)sgBtn.style.display=hasSG?'':'none';
  renderPinGrid();
}
function getFilteredPinHoles(){
  let hd=pinHoleData||[];
  if(pinClub!=='All'){hd=hd.filter(h=>{if(!h.appr_club)return false;const c=h.appr_club.toLowerCase().replace(/\s+/g,'');const MAP={Wood:['3w','4w','5w','7w'],Hybrid:['2h','3h','4h','5h','7h'],'Long Iron':['2i','3i','4i'],'Mid Iron':['5i','6i','7i','8i'],'Short Iron':['9i','pw','10i'],Wedge:[]};if(pinClub==='Wedge')return c.includes('deg');return(MAP[pinClub]||[]).includes(c);});}
  if(pinWindow>0){const s=[...currentPlayer.rounds].sort((a,b)=>a.date.localeCompare(b.date));const dates=new Set(s.slice(-pinWindow).map(r=>r.date));hd=hd.filter(h=>h.date&&dates.has(h.date));}
  return hd;
}
function calcPinStats(holes){
  const n=holes.length;if(!n)return null;
  const avg2=a=>{const v=a.filter(x=>x!=null);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null;};
  const gir=holes.filter(h=>h.green&&h.green.toLowerCase()==='hit'),gir1p=gir.filter(h=>h.num_putts===1),ss=holes.filter(h=>h.short_sided&&h.short_sided.toLowerCase()==='yes');
  return{n,pm:avg2(holes.filter(h=>h.par&&h.score).map(h=>h.score-h.par)),birdie_pct:holes.filter(h=>h.par&&h.score&&h.score<h.par).length/n*100,bogey_pct:holes.filter(h=>h.par&&h.score&&h.score>h.par).length/n*100,gir_pct:gir.length/n*100,gir1putt:gir.length?gir1p.length/gir.length*100:null,avg_putts:avg2(holes.filter(h=>h.num_putts).map(h=>h.num_putts)),proximity:avg2(holes.filter(h=>h.appr_lr!=null&&h.appr_sl!=null).map(h=>Math.sqrt(h.appr_lr*h.appr_lr+h.appr_sl*h.appr_sl))),short_sided:ss.length/n*100,sg_approach:avg2(holes.filter(h=>h.sg_approach!=null).map(h=>h.sg_approach))};
}
function pinHeatColor(n){if(n===null)return'rgba(20,28,20,0.8)';if(n>=0.65)return`rgba(74,222,128,${0.12+n*0.5})`;if(n<=0.35)return`rgba(248,113,113,${0.12+(1-n)*0.5})`;return'rgba(148,163,184,0.12)';}
function renderPinGrid(){
  const grid=document.getElementById('pin-grid');if(!grid)return;
  const hd=getFilteredPinHoles(),meta=PIN_STATS[pinStat],stats={};
  PIN_LOCS.forEach(loc=>{stats[loc]=calcPinStats(hd.filter(h=>h.pin_loc===loc));});
  const vals=PIN_LOCS.map(loc=>stats[loc]?.[pinStat]).filter(v=>v!=null);
  const minV=vals.length?Math.min(...vals):0,maxV=vals.length?Math.max(...vals):1,rng=maxV-minV||1;
  grid.innerHTML=PIN_LOCS.map(loc=>{
    const st=stats[loc],val=st?.[pinStat],n=st?.n||0,norm=val!=null?(meta.dir==='high'?(val-minV)/rng:(maxV-val)/rng):null;
    const bg=pinHeatColor(norm),isSel=pinSelected===loc;
    const valColor=val==null?'var(--text-dim)':norm>=0.6?'rgba(74,222,128,0.95)':norm<=0.4?'rgba(248,113,113,0.9)':'var(--text)';
    return`<div class="pin-cell${isSel?' pin-selected':''}" style="background:${bg}" onclick="selectPin('${loc}')"><div class="pin-cell-shots">${n}</div><div class="pin-cell-loc">${loc}</div><div class="pin-cell-val" style="color:${valColor}">${val!=null?meta.fmt(val):'—'}</div><div class="pin-cell-sub">${n} shot${n!==1?'s':''}</div></div>`;
  }).join('');
}
function selectPin(loc){pinSelected=loc;renderPinGrid();showPinTrend(loc);}
function showPinTrend(loc){
  const summary=document.getElementById('pin-summary');if(!summary)return;
  const hd=getFilteredPinHoles().filter(h=>h.pin_loc===loc),meta=PIN_STATS[pinStat],overall=calcPinStats(hd);
  summary.style.display='block';
  const titleEl=document.getElementById('pin-summary-title');if(titleEl)titleEl.textContent=`${PIN_LABELS[loc]} — ${meta.label}`;
  const statsEl=document.getElementById('pin-summary-stats');
  if(statsEl&&overall){
    const rows=[{l:'Shots',v:`${overall.n}`},{l:'+/- to Par',v:overall.pm!=null?(overall.pm>=0?'+':'')+overall.pm.toFixed(2):'—'},{l:'GIR %',v:overall.gir_pct!=null?overall.gir_pct.toFixed(1)+'%':'—'},{l:'Birdie+ %',v:overall.birdie_pct!=null?overall.birdie_pct.toFixed(1)+'%':'—'},{l:'Bogey+ %',v:overall.bogey_pct!=null?overall.bogey_pct.toFixed(1)+'%':'—'},{l:'Avg Putts',v:overall.avg_putts!=null?overall.avg_putts.toFixed(2):'—'},{l:'Proximity (radial)',v:overall.proximity!=null?overall.proximity.toFixed(1)+' ft':'—'},{l:'Short-Sided %',v:overall.short_sided!=null?overall.short_sided.toFixed(1)+'%':'—'}];
    if(overall.sg_approach!=null)rows.push({l:'SG Approach',v:(overall.sg_approach>=0?'+':'')+overall.sg_approach.toFixed(3)});
    statsEl.innerHTML=rows.map(x=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-family:'Barlow',sans-serif;font-size:11px"><span style="color:var(--text-dim)">${x.l}</span><span style="color:var(--text);font-weight:600">${x.v}</span></div>`).join('');
  }
  const byDate={};hd.forEach(h=>{if(!h.date)return;if(!byDate[h.date])byDate[h.date]=[];byDate[h.date].push(h);});
  const dates=Object.keys(byDate).sort(),tVals=dates.map(d=>{const st=calcPinStats(byDate[d]);return st?.[pinStat]??null;});
  const vDates=dates.filter((_,i)=>tVals[i]!=null),vVals=tVals.filter(v=>v!=null);
  const tTitle=document.getElementById('pin-trend-title');if(tTitle)tTitle.textContent=`${PIN_LABELS[loc]} — ${meta.label} Over Time`;
  if(charts['chart-pin-trend']){try{charts['chart-pin-trend'].destroy();}catch(e){}}
  const canv=document.getElementById('chart-pin-trend');if(!canv||vVals.length<2)return;
  const minV=Math.min(...vVals),maxV=Math.max(...vVals),rng=maxV-minV||1;
  charts['chart-pin-trend']=new Chart(canv.getContext('2d'),{
    type:'line',data:{labels:vDates.map(d=>d.slice(5,10)),datasets:[{data:vVals,borderColor:C.blue,backgroundColor:'rgba(96,165,250,0.07)',pointBackgroundColor:vVals.map(v=>{const n=meta.dir==='high'?(v-minV)/rng:(maxV-v)/rng;return n>=0.6?C.green:n<=0.4?C.red:C.amber;}),pointRadius:5,tension:0.3,fill:true}]},
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#162016',titleColor:'#60a5fa',bodyColor:'#e8f0e8',borderColor:'#2a3a2a',borderWidth:1,callbacks:{label(ctx){return`${meta.label}: ${meta.fmt(ctx.raw)}`;}}}},
      scales:{x:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT}},y:{grid:{color:C.grid},ticks:{color:C.txt,font:FONT},title:{display:true,text:meta.label,color:C.txt,font:FONT}}}}
  });
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
async function buildAdminDebug(){
  const el=document.getElementById('admin-debug-rows');if(!el)return;
  const row=(label,val,ok)=>`<div style="background:var(--surface);border:1px solid var(--border);padding:12px 14px"><div style="font-family:'Barlow',sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px">${label}</div><div style="font-family:'Barlow',sans-serif;font-size:12px;color:${ok===true?'var(--green)':ok===false?'var(--red)':'var(--text)'}">${val}</div></div>`;
  const pid=currentPlayer?.player_id,pidOk=pid&&pid.length>10;
  let hdStatus='Not fetched yet',hdOk=null;
  if(puttHoleData===null&&tigerHoleData===null){hdStatus='Not fetched — navigate to Putting or Tiger Five tab first';hdOk=false;}
  else{const count=(puttHoleData||tigerHoleData||[]).length;if(count>0){hdStatus=`✓ ${count} rows loaded`;hdOk=true;}else{hdStatus='0 rows — migration may not have run, or player_id not linked';hdOk=false;}}
  let liveCount='—',liveOk=null;
  if(pidOk){try{const{count,error}=await sb.from('hole_data').select('*',{count:'exact',head:true}).eq('player_id',pid);if(error)throw error;liveCount=`${count} rows in Supabase`;liveOk=count>0;}catch(e){liveCount='Error: '+e.message;liveOk=false;}}
  let authStatus='—',authOk=null;
  try{const sessionResult=await sb.auth.getSession();const session=sessionResult?.data?.session;if(session){authStatus='✓ Active ('+session.user.email+')';authOk=true;}else{authStatus='No active Supabase session';authOk=false;}}catch(e){authStatus='Session check failed: '+e.message;authOk=false;}
  let roundsCount='—';
  if(pidOk){try{const{count,error}=await sb.from('rounds').select('*',{count:'exact',head:true}).eq('player_id',pid);roundsCount=error?('Error: '+error.message):`${count} rounds in Supabase`;}catch(e){roundsCount='Error: '+e.message;}}
  const guide=document.getElementById('admin-fix-guide');if(guide)guide.style.display=pidOk?'none':'block';
  el.innerHTML=row('Logged-in Player',currentPlayer?.name||'—',null)+row('player_id',pidOk?pid.slice(0,8)+'…':'null — Supabase auth not set up yet',pidOk)+row('Auth Session',authStatus,authOk)+row('Rounds in Supabase',roundsCount,null)+row('hole_data in Supabase',liveCount,liveOk)+row('hole_data in Memory',hdStatus,hdOk)+row('Putting charts ready',(liveOk&&puttHoleData?.length>0)?'✓ Ready':liveOk?'Navigate to Putting tab to load':'✗ Need hole_data in Supabase',liveOk&&puttHoleData?.length>0)+row('Tiger Five charts ready',(liveOk&&tigerHoleData?.length>0)?'✓ Ready':liveOk?'Navigate to Tiger Five tab to load':'✗ Need hole_data in Supabase',liveOk&&tigerHoleData?.length>0);
}

async function buildAdminDashboard(){
  if(!currentPlayer?.is_admin)return;
  const kpiEl=document.getElementById('admin-kpis'),tbodyEl=document.getElementById('admin-players-tbody');
  if(!kpiEl||!tbodyEl)return;
  kpiEl.innerHTML='<div class="stat-card"><div class="stat-label">Loading…</div></div>';
  tbodyEl.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:20px">Loading players…</td></tr>';
  try{
    const{data:players,error}=await sb.from('players').select('id,name,is_admin,created_at,user_id').order('name');
    if(error)throw error;
    const{data:roundCounts}=await sb.from('rounds').select('player_id').then(r=>({data:r.data?.reduce((acc,row)=>{acc[row.player_id]=(acc[row.player_id]||0)+1;return acc;},{})}));
    const{data:lastRounds}=await sb.from('rounds').select('player_id,date').order('date',{ascending:false}).then(r=>({data:r.data?.reduce((acc,row)=>{if(!acc[row.player_id])acc[row.player_id]=row.date;return acc;},{})}));
    players.forEach(p=>{p.round_count=(roundCounts||{})[p.id]||0;p.last_round=(lastRounds||{})[p.id]||null;});
    const totalRounds=players.reduce((s,p)=>s+(parseInt(p.round_count)||0),0),totalPlayers=players.length;
    const activeToday=players.filter(p=>{if(!p.last_round)return false;const d=new Date(p.last_round),n=new Date();return(n-d)/(1000*60*60*24)<=30;}).length;
    kpiEl.innerHTML=`<div class="stat-card"><div class="stat-label">Total Players</div><div class="stat-value">${totalPlayers}</div></div><div class="stat-card"><div class="stat-label">Total Rounds</div><div class="stat-value">${totalRounds}</div></div><div class="stat-card"><div class="stat-label">Active (30 days)</div><div class="stat-value stat-good">${activeToday}</div></div>`;
    tbodyEl.innerHTML=players.map(p=>`<tr><td><strong>${p.name}</strong></td><td>${p.round_count||0}</td><td>${p.last_round||'—'}</td><td>${p.created_at?new Date(p.created_at).toLocaleDateString():'—'}</td><td>${p.is_admin?'<span style="color:var(--amber)">★ Admin</span>':'—'}</td><td><button class="roll-btn" onclick="adminViewPlayer('${p.id}','${p.name.replace(/'/g,"\\'")}')">View Data</button></td></tr>`).join('');
  }catch(e){
    kpiEl.innerHTML='<div class="stat-card"><div class="stat-label" style="color:var(--red)">Error loading admin data</div></div>';
    tbodyEl.innerHTML=`<tr><td colspan="6" style="color:var(--red);padding:12px">${e.message}</td></tr>`;
  }
}

async function adminViewPlayer(playerId,playerName){
  const detail=document.getElementById('admin-player-detail'),nameEl=document.getElementById('admin-detail-name'),statsEl=document.getElementById('admin-detail-stats');
  if(!detail||!nameEl||!statsEl)return;
  nameEl.innerHTML=`<span style="color:var(--blue)">${playerName}</span>`;
  statsEl.innerHTML='<div class="stat-card"><div class="stat-label">Loading…</div></div>';
  detail.style.display='block';detail.scrollIntoView({behavior:'smooth'});
  try{
    const{data:rounds}=await sb.from('rounds').select('*').eq('player_id',playerId).order('date');
    if(!rounds||!rounds.length){statsEl.innerHTML='<div class="stat-card"><div class="stat-label">No rounds yet</div></div>';return;}
    const scores=rounds.map(r=>r.plus_minus).filter(v=>v!=null),avgPM=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
    const avgGIR=rounds.filter(r=>r.gir_pct).map(r=>r.gir_pct),avgGIRVal=avgGIR.length?avgGIR.reduce((a,b)=>a+b,0)/avgGIR.length:null;
    const avgScram=rounds.filter(r=>r.scrambling!=null).map(r=>r.scrambling),avgScramVal=avgScram.length?avgScram.reduce((a,b)=>a+b,0)/avgScram.length:null;
    const lastRound=rounds[rounds.length-1];
    statsEl.innerHTML=`<div class="stat-card"><div class="stat-label">Total Rounds</div><div class="stat-value">${rounds.length}</div></div><div class="stat-card"><div class="stat-label">Scoring Avg</div><div class="stat-value">${avgPM!=null?(avgPM>=0?'+':'')+avgPM.toFixed(1):'—'}</div><div class="stat-sub">avg +/- to par</div></div><div class="stat-card"><div class="stat-label">GIR %</div><div class="stat-value">${avgGIRVal!=null?avgGIRVal.toFixed(1)+'%':'—'}</div></div><div class="stat-card"><div class="stat-label">Scrambling</div><div class="stat-value">${avgScramVal!=null?avgScramVal.toFixed(1)+'%':'—'}</div></div><div class="stat-card"><div class="stat-label">Last Round</div><div class="stat-value" style="font-size:18px">${lastRound.date}</div><div class="stat-sub">${lastRound.course}</div></div><div class="stat-card"><div class="stat-label">Last Score</div><div class="stat-value ${lastRound.plus_minus<=4?'stat-good':lastRound.plus_minus>=10?'stat-bad':'stat-neutral'}">${lastRound.score} (${lastRound.plus_minus>=0?'+':''}${lastRound.plus_minus})</div></div>`;
  }catch(e){statsEl.innerHTML=`<div class="stat-card"><div class="stat-label" style="color:var(--red)">${e.message}</div></div>`;}
}
