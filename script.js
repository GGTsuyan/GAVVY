// GAVVY - Dark Luxury Couple App  
const GAVVY = (() => {
  let state = {
    couple: { name1: 'Gab', name2: 'Avi', startDate: null },
    memories: [], notes: [], events: [],
    goals: [
      { id: '1', emoji: '✈️', title: 'Japan 2027', type: 'savings', progress: 32500, target: 50000, deadline: '2027-12-31', milestones: [{ value: 10000, label: '₱10k', reward: '🎯 Dreamer' }, { value: 20000, label: '₱20k', reward: '🎯 Planner' }, { value: 30000, label: '₱30k', reward: '🏅 Saver' }, { value: 40000, label: '₱40k', reward: '🏅 Go-Getter' }, { value: 50000, label: '₱50k', reward: '🏆 Travel Legends' }], createdAt: '2026-01-15' },
      { id: '2', emoji: '🎬', title: 'Movie Challenge', type: 'count', progress: 67, target: 100, milestones: [{ value: 25, label: '25 Movies', reward: '🏅 Cinephile I' }, { value: 50, label: '50 Movies', reward: '🏅 Cinephile II' }, { value: 75, label: '75 Movies', reward: '🏅 Movie Master' }, { value: 100, label: '100 Movies', reward: '🏆 Movie Legends' }], items: [{ id: '1', name: 'Interstellar', completed: true, date: '2026-02-14' }, { id: '2', name: 'La La Land', completed: true, date: '2026-03-01' }, { id: '3', name: 'Her', completed: true, date: '2026-03-15' }], createdAt: '2026-01-01' }
    ],
    lists: { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] }, trips: [],
    periodTracker: { entries: [], lastPeriodDate: null, averageLength: 36, periodLength: 6 },
    auth: { currentUser: null, token: null },
    questions: ['What place would you like to visit together?', 'What\'s a favorite memory we share?', 'What\'s something you love about me?', 'Where do you see us in 5 years?', 'What should we do next weekend?'],
    currentQuestion: 0, answeredQuestions: [],
    mood: { current: {}, customMoods: ['😊 Happy', '😌 Relaxed', '😴 Tired', '😔 Sad', '🤩 Excited'], selectedPerson: 'Gab', updatedAt: new Date().toISOString() },
    surprise: { Gab: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' }, Avi: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' } }
  };

  const API_BASE = '/api';
  let currentRoute = 'home';

  async function save() {
    localStorage.setItem('gavvy-state', JSON.stringify(state));
    if (window._supabaseReady && window.saveToSupabase) {
      try { await window.saveToSupabase(state); } catch(e) { console.warn('Sup save fail:', e); }
    }
  }
  
  function load() {
    try {
      const s = localStorage.getItem('gavvy-state');
      if (s) {
        const p = JSON.parse(s);
        // Simple merge: overwrite everything from localStorage
        // BUT only overwrite arrays if they have data (prevents empty cloud from erasing local)
        for (const k of Object.keys(p)) {
          if (Array.isArray(p[k]) && p[k].length === 0) continue; // don't overwrite with empty
          if (typeof p[k] === 'object' && p[k] !== null && !Array.isArray(p[k])) {
            // Deep merge objects
            state[k] = { ...state[k], ...p[k] };
          } else {
            state[k] = p[k];
          }
        }
      }
    } catch(e) {}
  }
  
  async function loadFromCloud() {
    if (window._supabaseReady && window.loadFromSupabase) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('t')), 5000));
        await Promise.race([window.loadFromSupabase(state), timeout]);
        localStorage.setItem('gavvy-state', JSON.stringify(state));
        console.log('[APP] Cloud loaded');
        if (currentRoute && currentRoute !== 'login') navigate(currentRoute);
      } catch(e) { console.warn('[APP] Cloud fail:', e); }
    }
  }

  function closeModalAndRefresh() {
    const m = document.getElementById('memoryModal');
    if (m && m.parentElement) m.parentElement.classList.remove('active');
    setTimeout(() => { if (currentRoute !== 'login') navigate(currentRoute); }, 150);
  }

  async function postJson(path,body) { const r=await fetch(API_BASE+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return r.json(); }
  async function uploadPhoto(file) { if(!file)return null; const f=new FormData(); f.append('photo',file); const r=await fetch(API_BASE+'/upload-photo',{method:'POST',body:f}); if(!r.ok)return null; return (await r.json()).url||null; }

  // INIT
  load();
  if (!state.couple.startDate) state.couple.startDate = '2025-07-09';
  state.couple.name1 = state.couple.name1 || 'Gab';
  state.couple.name2 = state.couple.name2 || 'Avi';
  if (state.couple.name1 === 'You') state.couple.name1 = 'Gab';
  if (state.couple.name2 === 'Partner') state.couple.name2 = 'Avi';
  if (!state.mood.current || Object.keys(state.mood.current).length === 0) {
    state.mood.current = { [state.couple.name1]: state.mood.you || '😊 Happy', [state.couple.name2]: state.mood.partner || '😊 Happy' };
  }
  state.mood.customMoods = state.mood.customMoods || ['😊 Happy','😌 Relaxed','😴 Tired','😔 Sad','🤩 Excited'];
  state.mood.selectedPerson = state.mood.selectedPerson || state.couple.name1;
  state.goals = state.goals.filter(g => g && g.id && g.emoji && g.title);
  try { localStorage.setItem('gavvy-state', JSON.stringify(state)); } catch(e) {}
  loadFromCloud();

  function el(t,cl,h) { const e=document.createElement(t); if(cl)e.className=cl; if(h!==undefined)e.innerHTML=h; return e; }

  function getDaysTogether() {
    if (!state.couple.startDate) return {y:0,m:0,d:0,total:0};
    const start=new Date(state.couple.startDate),now=new Date();
    let y=now.getFullYear()-start.getFullYear(),m=now.getMonth()-start.getMonth(),d=now.getDate()-start.getDate();
    if(d<0){m--;d+=new Date(now.getFullYear(),now.getMonth(),0).getDate();}
    if(m<0){y--;m+=12;}
    return {years:y,months:m,days:d,total:Math.floor((now-start)/86400000)};
  }

  function getCountdown(date) { if(!date)return null; const d=Math.ceil((new Date(date)-new Date())/86400000); return d>0?d:0; }

  function showGoalDetail(goal) {
    const m=document.getElementById('memoryModal'); if(!m)return;
    const p=Math.round((goal.progress/goal.target)*100);
    let h=`<div class="modal-content"><button class="modal-close" id="closeModal">✕</button><div style="text-align:center"><div style="font-size:2.5rem">${goal.emoji}</div><h2>${goal.title}</h2><div class="note-meta">${goal.type==='savings'?'₱'+goal.progress.toLocaleString()+' / ₱'+goal.target.toLocaleString():goal.progress+' / '+goal.target}</div></div><div class="progress-bar" style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden"><div class="progress-fill" style="width:${p}%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f)"></div></div><div style="text-align:center;font-size:1.2rem">${p}%</div>`;
    if(goal.type==='savings')h+=`<div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px"><div class="label">Add Savings</div><div style="display:flex;gap:8px"><input id="goalAddAmount" type="number" placeholder="Amount (₱)" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)"><button id="goalSaveBtn" class="btn btn-small">Add</button></div></div>`;
    else if(goal.type==='count')h+=`<div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px"><div class="label">Update Count</div><div style="display:flex;gap:8px;align-items:center;justify-content:center"><button id="goalDecrementBtn" class="btn btn-small">−</button><div style="font-size:1.5rem;font-weight:600">${goal.progress}</div><button id="goalIncrementBtn" class="btn btn-small">+</button></div></div>`;
    h+='</div>'; m.innerHTML=h;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick=()=>document.getElementById('memoryModal').parentElement.classList.remove('active');
    setTimeout(()=>{
      if(goal.type==='savings'){const b=document.getElementById('goalSaveBtn'),a=document.getElementById('goalAddAmount');if(b&&a)b.onclick=()=>{const v=parseInt(a.value,10);if(v&&v>0){goal.progress+=v;if(goal.progress>goal.target)goal.progress=goal.target;save();closeModalAndRefresh()}};}
      else if(goal.type==='count'){const i=document.getElementById('goalIncrementBtn'),d=document.getElementById('goalDecrementBtn');if(i)i.onclick=()=>{if(goal.progress<goal.target){goal.progress++;save();closeModalAndRefresh()}};if(d)d.onclick=()=>{if(goal.progress>0){goal.progress--;save();closeModalAndRefresh()}};}
    },50);
  }

  function showMemoryDetail(m) {
    const modal=document.getElementById('memoryModal');if(!modal)return;
    modal.innerHTML=`<div class="modal-content"><button class="modal-close" id="closeModal">✕</button>${m.image?`<div style="margin-bottom:18px;border-radius:20px;overflow:hidden"><img src="${m.image}" alt="${m.title}" style="width:100%"></div>`:`<div style="font-size:3rem;text-align:center">${m.emoji||'📸'}</div>`}<h2 style="text-align:center">${m.title}</h2><div class="note-meta" style="text-align:center">${m.date}</div>${m.location?`<div class="muted" style="margin-bottom:12px">📍 ${m.location}</div>`:''}<div style="padding:16px;background:var(--bg-0);border-radius:12px;border:1px solid var(--border)">${m.story||m.text||'No description'}</div></div>`;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick=()=>document.getElementById('memoryModal').parentElement.classList.remove('active');
  }

  function showDateEventModal(dateStr) {
    const modal=document.getElementById('memoryModal');if(!modal)return;
    const e=state.events.filter(x=>x.date===dateStr),d=new Date(dateStr+'T00:00:00');
    modal.innerHTML=`<div class="modal-content"><button class="modal-close" id="closeModal">✕</button><h3>${d.toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</h3><div style="max-height:200px;overflow-y:auto">${e.length===0?'<div class="muted">No events</div>':e.map(x=>`<div style="padding:12px;background:rgba(212,175,55,0.05);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between"><div><span style="font-size:1.2rem">${x.emoji||'●'}</span> <strong>${x.title}</strong></div><button class="delete-ev" data-date="${x.date}" data-title="${x.title}" style="background:none;border:none;color:var(--accent);cursor:pointer">×</button></div>`).join('')}</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><input id="me" placeholder="🍽️" value="🍽️" style="width:50px;text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input id="mt" placeholder="Event title" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><button id="ae" class="btn">Add</button></div></div>`;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick=()=>document.getElementById('memoryModal').parentElement.classList.remove('active');
    setTimeout(()=>{
      document.getElementById('ae').onclick=()=>{const em=document.getElementById('me').value||'●',t=document.getElementById('mt').value.trim();if(!t)return;state.events.push({emoji:em,date:dateStr,title:t});save();closeModalAndRefresh()};
      document.querySelectorAll('.delete-ev').forEach(b=>{b.onclick=()=>{if(confirm('Delete?')){state.events=state.events.filter(x=>!(x.date===b.dataset.date&&x.title===b.dataset.title));save();showDateEventModal(dateStr)}}});
    },10);
  }

  function renderHome() {
    const root=el('div');const d=getDaysTogether();
    const b=el('div','couple-banner');b.innerHTML=`<div class="couple-photo"></div><div class="couple-banner-body"><div class="couple-names">${state.couple.name1} <span class="heart">🖤</span> ${state.couple.name2}</div><div class="label">Together for</div><div class="days-summary">${d.years}Y ${d.months}M ${d.days}D</div></div>`;root.appendChild(b);
    const sc=el('div','card');sc.style.marginTop='24px';sc.innerHTML=`<div class="label">Start Date</div><input type="date" id="setStart" value="${state.couple.startDate}" disabled>`;root.appendChild(sc);
    const qc=el('div','question-card');qc.style.marginTop='24px';qc.innerHTML=`<div class="question-label">Today's Question</div><div class="question-text">"${state.questions[state.currentQuestion%state.questions.length]}"</div><button class="question-btn" id="answerBtn">Answer</button>`;root.appendChild(qc);
    const mc=el('div','card mood-card');mc.style.marginTop='24px';mc.innerHTML=`<div class="label">Mood</div><div class="mood-grid">${state.mood.customMoods.map(m=>`<button class="mood-option" data-mood="${m}">${m}</button>`).join('')}</div><div class="mood-status"><div><strong>${state.couple.name1}:</strong> ${state.mood.current[state.couple.name1]||'Not set'}</div><div><strong>${state.couple.name2}:</strong> ${state.mood.current[state.couple.name2]||'Not set'}</div></div>`;root.appendChild(mc);
    const sr=el('div','grid');sr.style.marginTop='24px';
    const ne=state.events.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
    const cd=el('div','col-12');cd.appendChild(el('div','countdown-widget',`<div class="countdown-header">Next Date</div><div class="countdown-title">${ne?`${ne.emoji||'🍽️'} ${ne.title}`:'Plan your next date'}</div><div class="countdown-time">${ne?`${getCountdown(ne.date)} days left`:'No date planned'}</div>`));sr.appendChild(cd);
    const gg=el('div','col-12');gg.appendChild(el('div','card',`<div class="label">Active Goals</div><div id="homeGoalsContainer">${state.goals.length===0?'<div class="muted" style="padding:20px;text-align:center">No goals yet</div>':state.goals.map(g=>{const p=Math.round((g.progress/g.target)*100),n=g.milestones?.find(m=>m.value>g.progress);return`<div class="goal-card-home" data-goal-id="${g.id}" style="cursor:pointer;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:12px"><div style="display:flex;justify-content:space-between"><div><span style="font-size:1.5rem">${g.emoji}</span> <strong>${g.title}</strong></div><div style="font-size:0.8rem;color:var(--secondary)">${p}%</div></div><div style="color:var(--secondary);font-size:0.9rem;margin-bottom:8px">${g.type==='savings'?'₱'+g.progress.toLocaleString()+' / ₱'+g.target.toLocaleString():g.progress+' / '+g.target}</div><div class="progress-bar" style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden"><div class="progress-fill" style="width:${p}%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f);border-radius:3px"></div></div>${n?`<div style="font-size:0.8rem;color:var(--secondary);margin-top:8px">Next: ${n.label}</div>`:'<div style="font-size:0.8rem;color:#d4af37;margin-top:8px">✓ Complete!</div>'}</div>`}).join('')}</div>`));sr.appendChild(gg);root.appendChild(sr);
    const mcard=el('div','card recent-memory-card');mcard.style.marginTop='24px';
    if(state.memories.length>0){const rm=state.memories[0];mcard.innerHTML=`<div class="label">Recent Memory</div><div class="memory-hero">${rm.emoji||'📸'}</div><div class="memory-title">${rm.title}</div><div class="note-meta">${rm.date}</div><button class="btn" id="viewMemBtn">View</button>`;}
    else mcard.innerHTML=`<div class="label">Recent Memory</div><div class="muted" style="padding:24px 0;text-align:center">No memory yet</div>`;
    root.appendChild(mcard);
    setTimeout(()=>{
      document.querySelectorAll('.goal-card-home').forEach(c=>{c.onclick=()=>{const g=state.goals.find(x=>x.id===c.dataset.goalId);if(g)showGoalDetail(g)}});
      const si=document.getElementById('setStart');if(si)si.onchange=e=>{state.couple.startDate=e.target.value;save()};
      const ab=document.getElementById('answerBtn');if(ab)ab.onclick=()=>{const q=state.questions[state.currentQuestion%state.questions.length],ans=prompt('Your answer:');if(ans){state.answeredQuestions.push({question:q,answer:ans,date:new Date().toISOString().split('T')[0],by:(state.auth.currentUser?.username)||state.couple.name1});state.currentQuestion++;save();alert('💕')}};
      document.querySelectorAll('.mood-option').forEach(b=>{b.onclick=()=>{const p=(state.auth.currentUser?.username)||state.couple.name1;state.mood.current[p]=b.dataset.mood;save();navigate('home')}});
      if(state.memories.length>0){const vm=document.getElementById('viewMemBtn');if(vm)vm.onclick=()=>showMemoryDetail(state.memories[0])}
    },50);
    return root;
  }

  function renderMemories() {
    const root=el('div');let af='all',sq='';
    const sr=el('div','search-row');sr.innerHTML=`<input id="memSearch" placeholder="Search" type="text"><div class="filter-tags"><button class="tab-btn active" data-filter="all">All</button><button class="tab-btn" data-filter="photos">Photos</button><button class="tab-btn" data-filter="trips">Trips</button><button class="tab-btn" data-filter="dates">Dates</button></div>`;root.appendChild(sr);
    const grid=el('div','memory-grid');root.appendChild(grid);
    const af2=el('div','card');af2.innerHTML=`<div class="label">Add Memory</div><div style="display:grid;grid-template-columns:80px 1fr;gap:12px;margin-top:16px"><input id="memEmoji" placeholder="📸" value="📸" style="text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input id="memTitle" placeholder="Title" type="text" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input id="memLocation" placeholder="Location" type="text" style="grid-column:1/-1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input id="memFile" type="file" accept="image/*" style="grid-column:1/-1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><textarea id="memStory" placeholder="Story..." style="grid-column:1/-1;height:100px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"></textarea></div><button id="addMemBtn" class="btn">Save</button>`;root.appendChild(af2);
    function ug(){const f=state.memories.filter(m=>{const t=`${m.title} ${m.story||m.text} ${m.location||''}`.toLowerCase();return(!sq||t.includes(sq))&&(af==='all'||m.category===af)});grid.innerHTML=f.map(m=>`<div class="memory-card" data-id="${m.date}-${m.title}">${m.image?`<div class="memory-image-preview"><img src="${m.image}" alt="${m.title}"></div>`:`<div class="memory-icon">${m.emoji||'📸'}</div>`}<div class="memory-title">${m.title}</div><div class="memory-date">${m.date}</div><button class="del-mem" data-id="${m.date}-${m.title}" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:none;color:var(--accent);cursor:pointer;">×</button></div>`).join('')||'<div class="muted" style="grid-column:1/-1;text-align:center;padding:40px">No memories</div>';grid.querySelectorAll('.memory-card').forEach(c=>{const m=state.memories.find(x=>`${x.date}-${x.title}`===c.dataset.id);if(m)c.onclick=()=>showMemoryDetail(m)});grid.querySelectorAll('.del-mem').forEach(b=>{b.onclick=(e)=>{e.stopPropagation();if(confirm('Delete?')){state.memories=state.memories.filter(x=>`${x.date}-${x.title}`!==b.dataset.id);save();ug()}}})}
    setTimeout(()=>{document.getElementById('memSearch').oninput=e=>{sq=e.target.value.toLowerCase();ug()};document.querySelectorAll('.tab-btn').forEach(b=>{b.onclick=()=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');af=b.dataset.filter;ug()}});document.getElementById('addMemBtn').onclick=async()=>{const em=document.getElementById('memEmoji').value||'📸',t=document.getElementById('memTitle').value.trim(),l=document.getElementById('memLocation').value.trim(),f=document.getElementById('memFile').files[0],s=document.getElementById('memStory').value.trim();if(!t||!s)return;let img=null;if(f)img=await uploadPhoto(f);state.memories.unshift({emoji:em,title:t,location:l,image:img,story:s,category:'photos',date:new Date().toISOString().split('T')[0]});save();ug();document.getElementById('memEmoji').value='📸';document.getElementById('memTitle').value='';document.getElementById('memLocation').value='';document.getElementById('memFile').value='';document.getElementById('memStory').value=''}},50);ug();return root;
  }

  function renderMood(){const ap=state.mood.selectedPerson||state.couple.name1;const root=el('div','grid');const mc=el('div','col-12');mc.appendChild(el('div','card',`<div class="label">Mood Lab</div><div class="mood-person-toggle"><button class="mood-person-btn ${ap===state.couple.name1?'active':''}" data-person="${state.couple.name1}">${state.couple.name1}</button><button class="mood-person-btn ${ap===state.couple.name2?'active':''}" data-person="${state.couple.name2}">${state.couple.name2}</button></div><div class="mood-grid">${state.mood.customMoods.map(m=>`<button class="mood-option" data-mood="${m}">${m}</button>`).join('')}</div><div class="mood-status"><div><strong>${state.couple.name1}:</strong> ${state.mood.current[state.couple.name1]||'Not set'}</div><div><strong>${state.couple.name2}:</strong> ${state.mood.current[state.couple.name2]||'Not set'}</div></div><div class="label" style="margin-top:20px">Create custom mood</div><div style="display:flex;gap:8px;margin-top:12px"><input id="customMoodInput" placeholder="Emoji + mood" type="text" style="flex:1"><button class="btn btn-small" id="saveCustomMoodBtn">Add</button></div>`));root.appendChild(mc);setTimeout(()=>{document.querySelectorAll('.mood-option').forEach(b=>{b.onclick=()=>{state.mood.current[(state.auth.currentUser?.username)||state.couple.name1]=b.dataset.mood;save();navigate('home')}});const sc=document.getElementById('saveCustomMoodBtn'),ci=document.getElementById('customMoodInput');if(sc&&ci)sc.onclick=()=>{const t=ci.value.trim();if(t&&!state.mood.customMoods.includes(t)){state.mood.customMoods.push(t);save();navigate('mood')}}},50);return root;}

  function renderCalendar() {
    const root=el('div');let cm=new Date();const cc=el('div');root.appendChild(cc);
    function rc(){const y=cm.getFullYear(),mo=cm.getMonth(),f=new Date(y,mo,1),l=new Date(y,mo+1,0);const cal=el('div','card');cal.innerHTML=`<div class="flex-between"><h2 style="font-size:1.5rem">${cm.toLocaleString('default',{month:'long',year:'numeric'}).toUpperCase()}</h2><div style="display:flex;gap:8px"><button class="pm btn btn-sec btn-small">←</button><button class="nm btn btn-sec btn-small">→</button></div></div><div class="calendar-grid" id="calGrid"></div>`;cc.innerHTML='';cc.appendChild(cal);const grid=document.getElementById('calGrid');if(!grid)return;['SUN','MON','TUE','WED','THU','FRI','SAT'].forEach(d=>{const h=el('div');h.style.fontWeight='600';h.style.fontSize='11px';h.style.color='var(--secondary)';h.style.textAlign='center';h.textContent=d;grid.appendChild(h)});for(let i=0;i<f.getDay();i++)grid.appendChild(el('div'));for(let i=1;i<=l.getDate();i++){const day=el('div','calendar-day'),date=new Date(y,mo,i),ds=date.toISOString().split('T')[0];const eo=state.events.filter(e=>e.date===ds);if(date.toDateString()===new Date().toDateString())day.classList.add('today');day.innerHTML=`<div>${i}</div>${eo.map(e=>`<div style="font-size:8px">${e.emoji||'●'}</div>`).join('')}`;day.dataset.date=ds;day.onclick=()=>showDateEventModal(ds);grid.appendChild(day)}setTimeout(()=>{const btns=cc.querySelectorAll('.pm,.nm');if(btns[0])btns[0].onclick=()=>{cm.setMonth(cm.getMonth()-1);rc()};if(btns[1])btns[1].onclick=()=>{cm.setMonth(cm.getMonth()+1);rc()}},10);}
    setTimeout(()=>rc(),50);
    const el2=el('div','card');el2.innerHTML='<div class="label">Upcoming Events</div><div id="upcomingEvents"></div>';root.appendChild(el2);
    function re(){setTimeout(()=>{const u=state.events.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));const l=document.getElementById('upcomingEvents');if(l){l.innerHTML=u.map(e=>`<div class="note-item"><div style="flex:1"><div style="font-weight:600">${e.emoji||'•'} ${e.title}</div><div class="note-meta">${e.date}</div></div><button class="del-ev" data-date="${e.date}" data-title="${e.title}" style="background:none;border:none;color:var(--accent);cursor:pointer">×</button></div>`).join('')||'<div class="muted">No upcoming events</div>';l.querySelectorAll('.del-ev').forEach(b=>{b.onclick=(e)=>{e.preventDefault();if(confirm(`Delete "${b.dataset.title}"?`)){state.events=state.events.filter(x=>!(x.date===b.dataset.date&&x.title===b.dataset.title));save();re()}}})}},10);}
    re();return root;
  }

  function renderLists(){const root=el('div');const tabs=el('div','tab-nav');tabs.innerHTML=`<button class="tab-btn active" data-list="travelList">✈️ Travel</button><button class="tab-btn" data-list="movies">🎬 Movies</button><button class="tab-btn" data-list="restaurants">🍽️ Restaurants</button><button class="tab-btn" data-list="giftIdeas">🎁 Gift Ideas</button>`;root.appendChild(tabs);const content=el('div','card');root.appendChild(content);function rl(lt){const list=state.lists[lt]||[];content.innerHTML=`<div id="listItems"></div><div class="list-add"><input id="listInput" placeholder="Add..." type="text"><button id="listAddBtn" class="btn btn-small">+</button></div>`;setTimeout(()=>{const li=document.getElementById('listItems');if(li){li.innerHTML=list.map((item,i)=>`<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0"><div style="flex:1;display:flex;align-items:center;gap:10px"><input type="checkbox" id="item-${i}" ${item.checked?'checked':''}><label for="item-${i}" style="flex:1">${item.text||item}</label></div><button class="del-li" data-index="${i}" style="background:none;border:none;color:var(--accent);cursor:pointer">×</button></div>`).join('')||'<div class="muted">No items</div>';li.querySelectorAll('input[type="checkbox"]').forEach((cb,i)=>{cb.onchange=()=>{if(typeof list[i]==='string')list[i]={text:list[i],checked:cb.checked};else list[i].checked=cb.checked;save()}});li.querySelectorAll('.del-li').forEach(b=>{b.onclick=(e)=>{e.stopPropagation();const idx=parseInt(b.dataset.index);if(confirm('Delete?')){state.lists[lt].splice(idx,1);save();rl(lt)}}})}const ab=document.getElementById('listAddBtn'),inp=document.getElementById('listInput');if(ab&&inp){ab.onclick=()=>{const t=inp.value.trim();if(t){state.lists[lt].push({text:t,checked:false});save();rl(lt)}};inp.onkeypress=e=>{if(e.key==='Enter')ab.click()}}},10)}rl('travelList');tabs.querySelectorAll('.tab-btn').forEach(b=>{b.onclick=()=>{tabs.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');rl(b.dataset.list)}});return root;}

  function renderIdeas(){const root=el('div');const header=el('div','flex-between');header.innerHTML=`<div style="font-size:1.2rem;font-weight:600">All Ideas</div><button class="btn btn-small" id="addIdeaBtn" style="padding:8px 14px;font-size:1.2rem">+</button>`;root.appendChild(header);const tabs=el('div','tab-nav');tabs.innerHTML=`<button class="tab-btn active" data-list="dateIdeas">💕 Date Ideas</button><button class="tab-btn" data-list="travelList">✈️ Travel</button><button class="tab-btn" data-list="movies">🎬 Movies</button><button class="tab-btn" data-list="restaurants">🍽️ Restaurants</button><button class="tab-btn" data-list="giftIdeas">🎁 Gift Ideas</button>`;root.appendChild(tabs);const content=el('div','card');root.appendChild(content);function rl(lt){const list=state.lists[lt]||[];content.innerHTML=`<div id="listItems"></div><div class="list-add"><input id="listInput" placeholder="Add..." type="text"><button id="listAddBtn" class="btn btn-small">+</button></div>`;setTimeout(()=>{const li=document.getElementById('listItems');if(li){li.innerHTML=list.map((item,i)=>`<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0"><div style="flex:1;display:flex;align-items:center;gap:10px"><input type="checkbox" id="item-${i}" ${item.checked?'checked':''}><label for="item-${i}" style="flex:1">${item.text||item}</label></div><button class="del-li" data-index="${i}" style="background:none;border:none;color:var(--accent);cursor:pointer">×</button></div>`).join('')||'<div class="muted">No items</div>';li.querySelectorAll('input[type="checkbox"]').forEach((cb,i)=>{cb.onchange=()=>{if(typeof list[i]==='string')list[i]={text:list[i],checked:cb.checked};else list[i].checked=cb.checked;save()}});li.querySelectorAll('.del-li').forEach(b=>{b.onclick=(e)=>{e.stopPropagation();const idx=parseInt(b.dataset.index);if(confirm('Delete?')){state.lists[lt].splice(idx,1);save();rl(lt)}}})}const ab=document.getElementById('listAddBtn'),inp=document.getElementById('listInput');if(ab&&inp){ab.onclick=()=>{const t=inp.value.trim();if(t){state.lists[lt].push({text:t,checked:false});save();rl(lt)}};inp.onkeypress=e=>{if(e.key==='Enter')ab.click()}}},10)}rl('dateIdeas');tabs.querySelectorAll('.tab-btn').forEach(b=>{b.onclick=()=>{tabs.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');rl(b.dataset.list)}});setTimeout(()=>{document.getElementById('addIdeaBtn').onclick=()=>{const at=tabs.querySelector('.tab-btn.active'),lt=at.dataset.list,item=prompt('Add item:');if(item&&item.trim()){state.lists[lt].push({text:item.trim(),checked:false});save();rl(lt)}}},10);return root;}

  function renderLogin(){const root=el('div');root.innerHTML=`<div class="card" style="max-width:480px;margin:0 auto;text-align:center"><div class="label">Member Login</div><h2>Select your profile</h2><div style="margin-top:24px;display:grid;gap:14px"><button class="btn" id="loginGab">Gab</button><button class="btn btn-sec" id="loginAvi">Avi</button></div></div>`;setTimeout(()=>{document.getElementById('loginGab').onclick=()=>{state.auth.currentUser={username:'Gab'};state.auth.token='Gab';localStorage.setItem('gavvy-state',JSON.stringify(state));navigate('home')};document.getElementById('loginAvi').onclick=()=>{state.auth.currentUser={username:'Avi'};state.auth.token='Avi';localStorage.setItem('gavvy-state',JSON.stringify(state));navigate('home')}},50);return root;}

  function renderNotes(){const root=el('div');const header=el('div','flex-between');header.innerHTML=`<div><div class="label">Notes Hub</div><h2>Private thoughts</h2></div><button class="btn btn-small" id="newNoteBtn">New Note</button>`;root.appendChild(header);const lc=el('div','card');lc.id='notesList';root.appendChild(lc);const ac=el('div','card');ac.innerHTML=`<div class="label">Write a Note</div><input id="noteTitle" placeholder="Title" type="text" style="margin-top:16px"><textarea id="noteBody" placeholder="Write..." style="margin-top:12px;height:130px"></textarea><button class="btn" id="saveNoteBtn">Save</button>`;root.appendChild(ac);function rn(){const nl=document.getElementById('notesList');if(!nl)return;nl.innerHTML=state.notes.slice().reverse().map(n=>`<div class="note-item" style="display:flex;justify-content:space-between;padding:12px 0"><div style="flex:1"><div style="font-weight:600">${n.title||'Untitled'}</div><div class="note-meta">${n.date} · ${(n.body||'').slice(0,90)}</div></div><button class="del-note" data-id="${n.id}" style="background:none;border:none;color:var(--accent);cursor:pointer">×</button></div>`).join('')||'<div class="muted" style="padding:24px;text-align:center">No notes yet</div>';nl.querySelectorAll('.del-note').forEach(b=>{b.onclick=()=>{state.notes=state.notes.filter(x=>x.id!==b.dataset.id);save();rn()}})}setTimeout(()=>{document.getElementById('saveNoteBtn').onclick=()=>{const t=document.getElementById('noteTitle').value.trim(),b=document.getElementById('noteBody').value.trim();if(!b)return;state.notes.push({id:Date.now().toString(),title:t||'Untitled',body:b,date:new Date().toISOString().split('T')[0]});save();document.getElementById('noteTitle').value='';document.getElementById('noteBody').value='';rn()};document.getElementById('newNoteBtn').onclick=()=>document.getElementById('noteTitle').focus()},50);rn();return root;}

  function renderPeriodTracker(){const root=el('div','period-tracker-page');const t=state.periodTracker;const ld=t.lastPeriodDate?new Date(t.lastPeriodDate):null;const today=new Date();today.setHours(0,0,0,0);let dc=null,cp='off',pc='#666',npd=null;if(ld){const dd=Math.floor((today-ld)/86400000);dc=dd%t.averageLength;if(dc<t.periodLength){cp='menstrual';pc='#e74c3c'}else if(dc<Math.floor(t.averageLength/2)-2){cp='follicular';pc='#f39c12'}else if(dc>=Math.floor(t.averageLength/2)-2&&dc<=Math.floor(t.averageLength/2)+2){cp='ovulation';pc='#e91e63'}else{cp='luteal';pc='#9b59b6'}npd=new Date(ld);npd.setDate(npd.getDate()+t.averageLength)}root.innerHTML=`<h2>Cycle Insights</h2><div class="card" style="background:linear-gradient(135deg,${pc}22,${pc}11);border:1px solid ${pc}44"><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div><div class="label">Phase</div><div style="font-size:1.8rem;font-weight:700;color:${pc}">${cp==='menstrual'?'🩸 Menstrual':cp==='follicular'?'🌱 Follicular':cp==='ovulation'?'💗 Ovulation':cp==='luteal'?'🌙 Luteal':'Not tracked'}</div></div><div><div class="label">Next Period</div><div style="font-size:1.8rem;font-weight:700;color:#e74c3c">${npd?npd.toLocaleDateString():'—'}</div></div></div></div>`;return root;}

  // Simplified renderTrips - just add/delete/list
  function renderTrips(){const root=el('div');const tripList=el('div','card');const addForm=el('div','col-12');addForm.appendChild(el('div','card',`<div class="label">Plan a Trip</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><input id="tripName" placeholder="Trip name" style="flex:1;min-width:150px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input type="number" id="tripBudget" placeholder="Budget" style="width:120px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><button id="addTripBtn" class="btn">Add</button></div>`));root.appendChild(addForm);tripList.innerHTML='<div class="label">Your Trips</div>';tripList.style.marginTop='18px';root.appendChild(tripList);function rt(){tripList.innerHTML=`<div class="label">Your Trips</div>${state.trips.map((t,i)=>`<div class="note-item" style="display:flex;justify-content:space-between;padding:12px 0"><div><div style="font-weight:600">${t.name}</div><div class="note-meta">₱${t.spent||0} / ₱${t.budget||0}</div></div><button class="del-trip" data-index="${i}" style="background:none;border:none;color:var(--accent);cursor:pointer">×</button></div>`).join('')||'<div class="muted" style="padding:24px;text-align:center">No trips yet</div>'}tripList.querySelectorAll('.del-trip')?.forEach(b=>{b.onclick=()=>{const idx=parseInt(b.dataset.index);if(confirm('Delete?')){state.trips.splice(idx,1);save();rt()}}});setTimeout(()=>{document.getElementById('addTripBtn').onclick=()=>{const name=document.getElementById('tripName').value.trim(),budget=parseInt(document.getElementById('tripBudget').value,10)||0;if(!name||!budget)return;state.trips.push({name,budget,spent:0,checklist:[],itinerary:[],startDate:'',endDate:''});save();document.getElementById('tripName').value='';document.getElementById('tripBudget').value='';rt()}},50);rt();return root;}

  // FULL renderUs with goals, conversations, delete buttons
  function renderUs(){const root=el('div','grid us-page');const ph=el('div','col-12');ph.appendChild(el('div','us-page-header',`<div></div><button class="btn btn-small" id="logoutBtn">Logout</button>`));root.appendChild(ph);
    const ic=el('div','col-12');ic.appendChild(el('div','card',`<div style="text-align:center;font-size:3rem">💑</div><div class="couple-names" style="text-align:center">${state.couple.name1} 🖤 ${state.couple.name2}</div><div style="text-align:center;color:var(--secondary);margin-top:16px"><label>Start Date</label><input type="date" id="anniversary" value="${state.couple.startDate||''}" disabled></div>`));root.appendChild(ic);
    const stats=el('div','col-12');const d=getDaysTogether();
    stats.appendChild(el('div','card',`<div class="label">Stats</div><div class="stats-grid"><div class="stat-card"><div class="stat-icon">❤️</div><div class="stat-number">${d.total}</div><div class="stat-label">Days</div></div><div class="stat-card"><div class="stat-icon">🎉</div><div class="stat-number">${state.events.length}</div><div class="stat-label">Dates</div></div><div class="stat-card"><div class="stat-icon">✈️</div><div class="stat-number">${state.trips.length}</div><div class="stat-label">Trips</div></div><div class="stat-card"><div class="stat-icon">📸</div><div class="stat-number">${state.memories.length}</div><div class="stat-label">Memories</div></div></div>`));root.appendChild(stats);
    const gc=el('div','col-12');gc.appendChild(el('div','card',`<div class="flex-between"><div><div class="label">Goals</div></div><button class="btn btn-small" id="goalExpandBtn">Manage</button></div><div id="usGoalsContainer" style="display:grid;gap:12px">${state.goals.length?state.goals.map(g=>{const p=Math.round((g.progress/g.target)*100);return`<div class="goal-item-us" data-goal-id="${g.id}" style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;display:flex;gap:12px;align-items:center;justify-content:space-between"><div style="flex:1;cursor:pointer" class="goal-view-area"><div style="display:flex;justify-content:space-between"><strong>${g.emoji} ${g.title}</strong><span style="color:var(--secondary)">${p}%</span></div></div><button class="goal-delete-btn btn btn-sec btn-small" data-goal-id="${g.id}" style="padding:8px 12px">×</button></div>`}).join(''):'<div class="muted" style="padding:20px;text-align:center">No goals yet</div>'}</div><div id="goalExpandPanel" style="display:none;margin-top:18px;border-top:1px solid rgba(255,255,255,0.1);padding-top:18px"><div class="label">Add New Goal</div><div style="display:grid;gap:12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><input id="goalEmoji" placeholder="✨" value="✨" style="text-align:center" maxlength="2"><input id="goalTitle" placeholder="Goal title" type="text"></div><select id="goalType" style="padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)"><option value="savings">💰 Savings</option><option value="count">🎯 Count</option></select><input id="goalTarget" placeholder="Target" type="number" min="1"><button id="goalAddBtn" class="btn">Create Goal</button></div></div>`));root.appendChild(gc);
    setTimeout(()=>{
      document.getElementById('logoutBtn').onclick=()=>{state.auth.currentUser=null;state.auth.token=null;localStorage.setItem('gavvy-state',JSON.stringify(state));navigate('login')};
      document.getElementById('goalExpandBtn').onclick=()=>{const p=document.getElementById('goalExpandPanel');p.style.display=p.style.display==='none'?'block':'none'};
      document.querySelectorAll('.goal-item-us').forEach(item=>{item.querySelector('.goal-view-area')?.addEventListener('click',()=>{const g=state.goals.find(x=>x.id===item.dataset.goalId);if(g)showGoalDetail(g)});item.querySelector('.goal-delete-btn')?.addEventListener('click',(e)=>{e.stopPropagation();const id=e.target.dataset.goalId;if(confirm('Delete?')){state.goals=state.goals.filter(g=>g.id!==id);save();navigate('us')}})});
      document.getElementById('goalAddBtn').onclick=()=>{const emoji=document.getElementById('goalEmoji')?.value?.trim()||'✨',title=document.getElementById('goalTitle')?.value?.trim(),type=document.getElementById('goalType')?.value||'count',target=parseInt(document.getElementById('goalTarget')?.value,10)||100;if(!title)return;state.goals.push({id:Date.now().toString(),emoji,title,type,progress:0,target,deadline:null,milestones:[{value:Math.floor(target*0.25),label:Math.floor(target*0.25)+'',reward:'🏅'},{value:Math.floor(target*0.5),label:Math.floor(target*0.5)+'',reward:'🏅'},{value:Math.floor(target*0.75),label:Math.floor(target*0.75)+'',reward:'🏆'},{value:target,label:target+'',reward:'🏆'}],items:[],createdAt:new Date().toISOString()});save();navigate('us')};
    },50);
    const convCard=el('div','col-12');let ch=`<div class="card"><div class="label">Our Conversations 💬</div><div style="display:grid;gap:12px">`;
    if(state.answeredQuestions.length===0)ch+='<div class="muted" style="padding:16px;text-align:center">No conversations yet</div>';
    else state.answeredQuestions.slice().reverse().forEach(q=>{ch+=`<div style="border-left:3px solid var(--accent);padding:12px;background:rgba(212,175,55,0.05);border-radius:4px"><div style="color:var(--secondary);font-size:0.85rem">${q.date} · ${q.by}</div><div style="font-style:italic;color:var(--secondary)">Q: ${q.question}</div><div>A: ${q.answer}</div></div>`});
    ch+='</div></div>';convCard.innerHTML=ch;root.appendChild(convCard);
    const app=el('div');app.appendChild(root);return app;
  }

  function showFAB(){const m=document.getElementById('fabMenu');if(m)m.classList.toggle('active');}

  function navigate(route) {
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
    const app=document.getElementById('app');app.innerHTML='';
    if(!state.auth.currentUser&&route!=='login')route='login';
    if(state.auth.currentUser&&route==='login')route='home';
    currentRoute=route;localStorage.setItem('gavvy-lastRoute',route);
    if(route==='home')app.appendChild(renderHome());else if(route==='memories')app.appendChild(renderMemories());else if(route==='calendar')app.appendChild(renderCalendar());else if(route==='lists')app.appendChild(renderLists());else if(route==='ideas')app.appendChild(renderIdeas());else if(route==='notes')app.appendChild(renderNotes());else if(route==='period')app.appendChild(renderPeriodTracker());else if(route==='trips')app.appendChild(renderTrips());else if(route==='us')app.appendChild(renderUs());else if(route==='login')app.appendChild(renderLogin());
  }

  function init() {
    const mw=el('div','modal');const mc=el('div');mc.id='memoryModal';mw.appendChild(mc);document.body.appendChild(mw);
    const fab=el('button','fab');fab.innerHTML='+';fab.onclick=showFAB;document.body.appendChild(fab);
    const fm=el('div','fab-menu');fm.id='fabMenu';
    fm.innerHTML=`<div class="fab-item" data-action="memory">📸 Memory</div><div class="fab-item" data-action="dateIdea">💕 Date Idea</div><div class="fab-item" data-action="note">📝 Note</div><div class="fab-item" data-action="goal">🎯 Goal</div><div class="fab-item" data-action="trip">✈️ Trip</div>`;document.body.appendChild(fm);
    fm.querySelectorAll('.fab-item').forEach(item=>{item.onclick=()=>{const a=item.dataset.action;if(a==='memory')navigate('memories');else if(a==='dateIdea')navigate('ideas');else if(a==='note')navigate('notes');else if(a==='goal')navigate('us');else if(a==='trip')navigate('trips');fm.classList.remove('active')}});
    document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
    let ir='home';if(state.auth.currentUser){const lr=localStorage.getItem('gavvy-lastRoute');if(lr&&lr!=='login')ir=lr;}else ir='login';navigate(ir);
  }
  return{init};
})();
document.addEventListener('DOMContentLoaded',()=>GAVVY.init());