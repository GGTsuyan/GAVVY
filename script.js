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
    questions: ['What place would you like to visit together?', 'What is a favorite memory we share?', 'What is something you love about me?', 'Where do you see us in 5 years?', 'What should we do next weekend?'],
    currentQuestion: 0, answeredQuestions: [],
    mood: { current: {}, customMoods: ['Happy', 'Relaxed', 'Tired', 'Sad', 'Excited'], selectedPerson: 'Gab', updatedAt: new Date().toISOString() },
    surprise: { Gab: { preview: 'Message locked until June 15, 2026 at 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' }, Avi: { preview: 'Message locked until June 15, 2026 at 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' } }
  };

  const API_BASE = '/api';
  let currentRoute = 'home';

  async function save() {
    localStorage.setItem('gavvy-state', JSON.stringify(state));
    if (window._supabaseReady && window.saveToSupabase) {
      try { await window.saveToSupabase(state); } catch(e) { console.warn('Supabase save failed:', e); }
    }
  }

  function load() {
    try {
      const s = localStorage.getItem('gavvy-state');
      if (s) {
        const p = JSON.parse(s);
        // Only overwrite arrays if they have data (prevents empty localStorage from erasing cloud data)
        if (p.notes && p.notes.length > 0) state.notes = p.notes;
        if (p.trips && p.trips.length > 0) state.trips = p.trips;
        if (p.events && p.events.length > 0) state.events = p.events;
        if (p.memories && p.memories.length > 0) state.memories = p.memories;
        if (p.goals && p.goals.length > 0) state.goals = p.goals;
        if (p.answeredQuestions && p.answeredQuestions.length > 0) state.answeredQuestions = p.answeredQuestions;
        if (p.periodTracker && p.periodTracker.entries && p.periodTracker.entries.length > 0) state.periodTracker = p.periodTracker;
        if (p.auth) state.auth = p.auth;
        if (p.couple) state.couple = p.couple;
        if (p.mood && p.mood.current && Object.keys(p.mood.current).length > 0) state.mood = p.mood;
        if (p.currentQuestion !== undefined) state.currentQuestion = p.currentQuestion;
      }
    } catch(e) {}
  }

  async function loadFromCloud() {
    if (window._supabaseReady && window.loadFromSupabase) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        await Promise.race([window.loadFromSupabase(state), timeout]);
        localStorage.setItem('gavvy-state', JSON.stringify(state));
        console.log('Cloud loaded');
        if (currentRoute !== 'login') navigate(currentRoute);
      } catch(e) { console.warn('Cloud load failed:', e); }
    }
  }

  load();
  if (!state.couple.startDate) state.couple.startDate = '2025-07-09';
  state.couple.name1 = state.couple.name1 || 'Gab';
  state.couple.name2 = state.couple.name2 || 'Avi';
  if (state.couple.name1 === 'You') state.couple.name1 = 'Gab';
  if (state.couple.name2 === 'Partner') state.couple.name2 = 'Avi';
  if (!state.mood.current || Object.keys(state.mood.current).length === 0) {
    state.mood.current = { [state.couple.name1]: state.mood.you || 'Happy', [state.couple.name2]: state.mood.partner || 'Happy' };
  }
  state.mood.customMoods = state.mood.customMoods || ['Happy', 'Relaxed', 'Tired', 'Sad', 'Excited'];
  state.goals = state.goals.filter(g => g && g.id && g.emoji && g.title);
  try { localStorage.setItem('gavvy-state', JSON.stringify(state)); } catch(e) {}
  loadFromCloud();

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  function getDaysTogether() {
    if (!state.couple.startDate) return { years: 0, months: 0, days: 0, total: 0 };
    const start = new Date(state.couple.startDate), now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return { years, months, days, total: Math.floor((now - start) / 86400000) };
  }

  function getCountdown(date) { if (!date) return null; const d = Math.ceil((new Date(date) - new Date()) / 86400000); return d > 0 ? d : 0; }

  function closeModalAndRefresh() {
    const m = document.getElementById('memoryModal');
    if (m && m.parentElement) m.parentElement.classList.remove('active');
    setTimeout(() => { if (currentRoute !== 'login') navigate(currentRoute); }, 150);
  }

  function showGoalDetail(goal) {
    const modal = document.getElementById('memoryModal'); if (!modal) return;
    const pct = Math.round((goal.progress / goal.target) * 100);
    let html = '<div class="modal-content">';
    html += '<button class="modal-close" id="closeModal">X</button>';
    html += '<div style="text-align:center"><div style="font-size:2.5rem">' + goal.emoji + '</div><h2>' + goal.title + '</h2>';
    html += '<div class="note-meta">' + (goal.type === 'savings' ? 'P' + goal.progress.toLocaleString() + ' / P' + goal.target.toLocaleString() : goal.progress + ' / ' + goal.target) + '</div></div>';
    html += '<div class="progress-bar" style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden"><div class="progress-fill" style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f)"></div></div>';
    html += '<div style="text-align:center;font-size:1.2rem">' + pct + '% Complete</div>';
    if (goal.type === 'savings') {
      html += '<div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px"><div class="label">Add Savings</div><div style="display:flex;gap:8px"><input id="goalAddAmount" type="number" placeholder="Amount" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)"><button id="goalSaveBtn" class="btn btn-small">Add</button></div></div>';
    } else if (goal.type === 'count') {
      html += '<div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px"><div class="label">Update Count</div><div style="display:flex;gap:8px;align-items:center;justify-content:center"><button id="goalDecrementBtn" class="btn btn-small">-</button><div style="font-size:1.5rem;font-weight:600">' + goal.progress + '</div><button id="goalIncrementBtn" class="btn btn-small">+</button></div></div>';
    }
    html += '</div>';
    modal.innerHTML = html;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = () => document.getElementById('memoryModal').parentElement.classList.remove('active');
    setTimeout(() => {
      if (goal.type === 'savings') {
        const btn = document.getElementById('goalSaveBtn'), amt = document.getElementById('goalAddAmount');
        if (btn && amt) btn.onclick = () => { const v = parseInt(amt.value, 10); if (v && v > 0) { goal.progress += v; if (goal.progress > goal.target) goal.progress = goal.target; save(); closeModalAndRefresh(); } };
      } else if (goal.type === 'count') {
        const inc = document.getElementById('goalIncrementBtn'), dec = document.getElementById('goalDecrementBtn');
        if (inc) inc.onclick = () => { if (goal.progress < goal.target) { goal.progress++; save(); closeModalAndRefresh(); } };
        if (dec) dec.onclick = () => { if (goal.progress > 0) { goal.progress--; save(); closeModalAndRefresh(); } };
      }
    }, 50);
  }

  function showMemoryDetail(memory) {
    const modal = document.getElementById('memoryModal'); if (!modal) return;
    let html = '<div class="modal-content">';
    html += '<button class="modal-close" id="closeModal">X</button>';
    if (memory.image) html += '<div style="margin-bottom:18px;border-radius:20px;overflow:hidden"><img src="' + memory.image + '" alt="' + memory.title + '" style="width:100%;display:block"></div>';
    else html += '<div style="font-size:3rem;text-align:center;margin-bottom:16px">' + (memory.emoji || '📸') + '</div>';
    html += '<h2 style="text-align:center;margin-bottom:8px">' + memory.title + '</h2>';
    html += '<div class="note-meta" style="text-align:center;margin-bottom:16px">' + memory.date + '</div>';
    if (memory.location) html += '<div class="muted" style="margin-bottom:12px">Location: ' + memory.location + '</div>';
    html += '<div style="margin-bottom:20px;padding:16px;background:var(--bg-0);border-radius:12px;border:1px solid var(--border)">' + (memory.story || memory.text || 'No description') + '</div>';
    html += '</div>';
    modal.innerHTML = html;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = () => document.getElementById('memoryModal').parentElement.classList.remove('active');
  }

  function showDateEventModal(dateStr) {
    const modal = document.getElementById('memoryModal'); if (!modal) return;
    const eventsOnDate = state.events.filter(e => e.date === dateStr);
    const dateObj = new Date(dateStr + 'T00:00:00');
    let html = '<div class="modal-content">';
    html += '<button class="modal-close" id="closeModal">X</button>';
    html += '<h3>' + dateObj.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + '</h3>';
    html += '<div style="max-height:200px;overflow-y:auto">';
    if (eventsOnDate.length === 0) html += '<div class="muted">No events on this date</div>';
    else eventsOnDate.forEach(e => {
      html += '<div style="padding:12px;background:rgba(212,175,55,0.05);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
      html += '<div><span style="font-size:1.2rem">' + (e.emoji || '●') + '</span> <strong>' + e.title + '</strong></div>';
      html += '<button class="delete-event-modal" data-event-date="' + e.date + '" data-event-title="' + e.title + '" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem">X</button></div>';
    });
    html += '</div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">';
    html += '<input id="modalEventEmoji" placeholder="Emoji" value="🍽️" style="width:50px;text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    html += '<input id="modalEventTitle" placeholder="Event title" style="flex:1;min-width:150px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    html += '<button id="addEventFromModal" class="btn">Add</button>';
    html += '</div></div>';
    modal.innerHTML = html;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = () => document.getElementById('memoryModal').parentElement.classList.remove('active');
    setTimeout(() => {
      const addBtn = document.getElementById('addEventFromModal');
      if (addBtn) addBtn.onclick = () => { const em = document.getElementById('modalEventEmoji').value || '●'; const t = document.getElementById('modalEventTitle').value.trim(); if (!t) return; state.events.push({ emoji: em, date: dateStr, title: t }); save(); closeModalAndRefresh(); };
      document.querySelectorAll('.delete-event-modal').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); if (confirm('Delete?')) { state.events = state.events.filter(x => !(x.date === btn.dataset.eventDate && x.title === btn.dataset.eventTitle)); save(); showDateEventModal(dateStr); } }; });
    }, 10);
  }

  function renderHome() {
    const root = el('div');
    const days = getDaysTogether();
    const banner = el('div', 'couple-banner');
    banner.innerHTML = '<div class="couple-photo"></div><div class="couple-banner-body"><div class="couple-names">' + state.couple.name1 + ' <span class="heart">&#x1F5A4;</span> ' + state.couple.name2 + '</div><div class="label" style="margin-top:8px">Together for</div><div class="days-summary">' + days.years + ' Year(s) ' + days.months + ' Month(s) ' + days.days + ' Day(s)</div></div>';
    root.appendChild(banner);
    const sc = el('div', 'card'); sc.style.marginTop = '24px';
    sc.innerHTML = '<div class="label">Relationship Start Date</div><input type="date" id="setStart" value="' + state.couple.startDate + '" style="margin-top:16px;width:100%;" disabled>';
    root.appendChild(sc);
    const qc = el('div', 'question-card'); qc.style.marginTop = '24px';
    qc.innerHTML = '<div class="question-label">Today\'s Question</div><div class="question-text">"' + state.questions[state.currentQuestion % state.questions.length] + '"</div><button class="question-btn" id="answerBtn">Answer</button>';
    root.appendChild(qc);
    const moodCard = el('div', 'card mood-card'); moodCard.style.marginTop = '24px';
    moodCard.innerHTML = '<div class="label">Mood Check-In</div><div class="mood-grid">' + state.mood.customMoods.map(m => '<button class="mood-option" data-mood="' + m + '">' + m + '</button>').join('') + '</div><div class="mood-status"><div><strong>' + state.couple.name1 + ':</strong> ' + (state.mood.current[state.couple.name1] || 'Not set') + '</div><div><strong>' + state.couple.name2 + ':</strong> ' + (state.mood.current[state.couple.name2] || 'Not set') + '</div></div>';
    root.appendChild(moodCard);
    const sr = el('div', 'grid'); sr.style.marginTop = '24px';
    const nextEvent = state.events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    const cd = el('div', 'col-12');
    cd.appendChild(el('div', 'countdown-widget', '<div class="countdown-header">Next Date</div><div class="countdown-title">' + (nextEvent ? (nextEvent.emoji || '🍽️') + ' ' + nextEvent.title : 'Plan your next date') + '</div><div class="countdown-time">' + (nextEvent ? getCountdown(nextEvent.date) + ' days left' : 'No date planned') + '</div>'));
    sr.appendChild(cd);
    const gg = el('div', 'col-12');
    let goalsHtml = '<div class="label">Active Goals</div><div id="homeGoalsContainer" style="display:grid;gap:14px;margin-top:16px">';
    if (state.goals.length === 0) goalsHtml += '<div class="muted" style="padding:20px;text-align:center">No goals yet. Add one in Us.</div>';
    else state.goals.forEach(g => { const p = Math.round((g.progress / g.target) * 100); const n = g.milestones ? g.milestones.find(m => m.value > g.progress) : null; goalsHtml += '<div class="goal-card-home" data-goal-id="' + g.id + '" style="cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px"><div><span style="font-size:1.5rem">' + g.emoji + '</span> <strong>' + g.title + '</strong></div><div style="font-size:0.8rem;color:var(--secondary)">' + p + '%</div></div><div style="color:var(--secondary);font-size:0.9rem;margin-bottom:8px">' + (g.type === 'savings' ? 'P' + g.progress.toLocaleString() + ' / P' + g.target.toLocaleString() : g.progress + ' / ' + g.target) + '</div><div class="progress-bar" style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:8px"><div class="progress-fill" style="width:' + p + '%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f);border-radius:3px"></div></div>' + (n ? '<div style="font-size:0.8rem;color:var(--secondary)">Next: ' + n.label + '</div>' : '<div style="font-size:0.8rem;color:#d4af37">✓ Goal Complete!</div>') + '</div>'; });
    goalsHtml += '</div>';
    gg.appendChild(el('div', 'card', goalsHtml));
    sr.appendChild(gg);
    root.appendChild(sr);

    const memCard = el('div', 'card recent-memory-card'); memCard.style.marginTop = '24px';
    if (state.memories.length > 0) { const rm = state.memories[0]; memCard.innerHTML = '<div class="label">Recent Memory</div><div class="memory-hero">' + (rm.emoji || '📸') + '</div><div class="memory-title">' + rm.title + '</div><div class="note-meta">' + rm.date + '</div><button class="btn" id="viewMemBtn">View Memory</button>'; }
    else memCard.innerHTML = '<div class="label">Recent Memory</div><div class="muted" style="padding:24px 0;text-align:center">No memory saved yet.</div>';
    root.appendChild(memCard);

    setTimeout(() => {
      document.querySelectorAll('.goal-card-home').forEach(c => { c.onclick = () => { const g = state.goals.find(x => x.id === c.dataset.goalId); if (g) showGoalDetail(g); }; });
      const si = document.getElementById('setStart'); if (si) si.onchange = e => { state.couple.startDate = e.target.value; save(); };
      const ab = document.getElementById('answerBtn'); if (ab) ab.onclick = () => { const q = state.questions[state.currentQuestion % state.questions.length]; const ans = prompt('Your answer:'); if (ans) { state.answeredQuestions.push({ question: q, answer: ans, date: new Date().toISOString().split('T')[0], by: (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1 }); state.currentQuestion++; save(); alert('Answer saved!'); } };
      document.querySelectorAll('.mood-option').forEach(b => { b.onclick = () => { const p = (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1; state.mood.current[p] = b.dataset.mood; state.mood.updatedAt = new Date().toISOString(); save(); navigate('home'); }; });
      if (state.memories.length > 0) { const vm = document.getElementById('viewMemBtn'); if (vm) vm.onclick = () => showMemoryDetail(state.memories[0]); }
    }, 50);
    return root;
  }

  function renderMemories() {
    const root = el('div'); let activeFilter = 'all', searchQuery = '';
    const searchRow = el('div', 'search-row');
    searchRow.innerHTML = '<input id="memSearch" placeholder="Search Memories" type="text"><div class="filter-tags"><button class="tab-btn active" data-filter="all">All</button><button class="tab-btn" data-filter="photos">Photos</button><button class="tab-btn" data-filter="trips">Trips</button><button class="tab-btn" data-filter="dates">Dates</button></div>';
    root.appendChild(searchRow);
    const grid = el('div', 'memory-grid'); root.appendChild(grid);
    const addForm = el('div', 'card');
    addForm.innerHTML = '<div class="label">Add Memory</div><div style="display:grid;grid-template-columns:80px 1fr;gap:12px;margin-top:16px"><input id="memEmoji" placeholder="Emoji" value="📸" style="text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input id="memTitle" placeholder="Title" type="text" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input id="memLocation" placeholder="Location" type="text" style="grid-column:1 / -1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input id="memFile" type="file" accept="image/*" style="grid-column:1/ -1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><textarea id="memStory" placeholder="Story..." style="grid-column:1/-1;height:100px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"></textarea></div><button id="addMemBtn" class="btn" style="margin-top:16px">Save Memory</button>';
    root.appendChild(addForm);
    function updateGrid() {
      const filtered = state.memories.filter(m => { const t = (m.title + ' ' + (m.story || m.text) + ' ' + (m.location || '')).toLowerCase(); return (!searchQuery || t.includes(searchQuery)) && (activeFilter === 'all' || m.category === activeFilter); });
      grid.innerHTML = filtered.map(m => '<div class="memory-card" data-id="' + m.date + '-' + m.title + '" style="position:relative;">' + (m.image ? '<div class="memory-image-preview"><img src="' + m.image + '" alt="' + m.title + '"></div>' : '<div class="memory-icon">' + (m.emoji || '📸') + '</div>') + '<div class="memory-title">' + m.title + '</div><div class="memory-date">' + m.date + '</div><div class="memory-location">' + (m.location || '') + '</div><button class="delete-memory-btn" data-mem-id="' + m.date + '-' + m.title + '" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:none;color:var(--accent);cursor:pointer;font-size:1.2rem;padding:4px 8px;border-radius:4px;display:none;">X</button></div>').join('') || '<div class="muted" style="grid-column:1/-1;text-align:center;padding:40px">No memories found.</div>';
      grid.querySelectorAll('.memory-card').forEach(card => { const m = state.memories.find(x => x.date + '-' + x.title === card.dataset.id); if (m) { card.onclick = () => showMemoryDetail(m); card.onmouseenter = () => { const b = card.querySelector('.delete-memory-btn'); if (b) b.style.display = 'block'; }; card.onmouseleave = () => { const b = card.querySelector('.delete-memory-btn'); if (b) b.style.display = 'none'; }; } const d = card.querySelector('.delete-memory-btn'); if (d) d.onclick = (e) => { e.stopPropagation(); if (confirm('Delete this memory?')) { state.memories = state.memories.filter(x => x.date + '-' + x.title !== d.dataset.memId); save(); updateGrid(); } }; });
    }
    setTimeout(() => {
      const si = document.getElementById('memSearch'); if (si) si.oninput = e => { searchQuery = e.target.value.toLowerCase(); updateGrid(); };
      document.querySelectorAll('.tab-btn').forEach(b => { b.onclick = () => { document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); activeFilter = b.dataset.filter; updateGrid(); }; });
      const amb = document.getElementById('addMemBtn'); if (amb) amb.onclick = async () => { const emoji = document.getElementById('memEmoji').value || '📸'; const title = document.getElementById('memTitle').value.trim(); const location = document.getElementById('memLocation').value.trim(); const file = document.getElementById('memFile').files[0]; const story = document.getElementById('memStory').value.trim(); if (!title || !story) return; let image = null; if (file) image = await uploadPhoto(file); state.memories.unshift({ emoji, title, location, image, story, category: 'photos', date: new Date().toISOString().split('T')[0] }); save(); updateGrid(); document.getElementById('memEmoji').value = '📸'; document.getElementById('memTitle').value = ''; document.getElementById('memLocation').value = ''; document.getElementById('memFile').value = ''; document.getElementById('memStory').value = ''; };
    }, 50);
    updateGrid();
    return root;
  }

  function renderMood() {
    const activePerson = state.mood.selectedPerson || state.couple.name1;
    const root = el('div', 'grid');
    const moodCard = el('div', 'col-12');
    moodCard.appendChild(el('div', 'card', '<div class="label">Mood Lab</div><div class="mood-person-toggle"><button class="mood-person-btn ' + (activePerson === state.couple.name1 ? 'active' : '') + '" data-person="' + state.couple.name1 + '">' + state.couple.name1 + '</button><button class="mood-person-btn ' + (activePerson === state.couple.name2 ? 'active' : '') + '" data-person="' + state.couple.name2 + '">' + state.couple.name2 + '</button></div><div class="mood-grid">' + state.mood.customMoods.map(m => '<button class="mood-option" data-mood="' + m + '">' + m + '</button>').join('') + '</div><div class="mood-status"><div><strong>' + state.couple.name1 + ':</strong> ' + (state.mood.current[state.couple.name1] || 'Not set') + '</div><div><strong>' + state.couple.name2 + ':</strong> ' + (state.mood.current[state.couple.name2] || 'Not set') + '</div><div class="note-meta">Updated ' + (state.mood.updatedAt ? new Date(state.mood.updatedAt).toLocaleString() : 'never') + '</div></div><div class="label" style="margin-top:20px">Create a custom mood</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><input id="customMoodInput" placeholder="Emoji + mood label" type="text" style="flex:1;min-width:180px"><button class="btn btn-small" id="saveCustomMoodBtn">Add</button></div>'));
    root.appendChild(moodCard);
    setTimeout(() => {
      document.querySelectorAll('.mood-option').forEach(b => { b.onclick = () => { const p = (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1; state.mood.current[p] = b.dataset.mood; state.mood.updatedAt = new Date().toISOString(); save(); navigate('home'); }; });
      const sc = document.getElementById('saveCustomMoodBtn'), ci = document.getElementById('customMoodInput'); if (sc && ci) sc.onclick = () => { const t = ci.value.trim(); if (!t) return; if (!state.mood.customMoods.includes(t)) state.mood.customMoods.push(t); save(); navigate('mood'); };
    }, 50);
    return root;
  }

  function renderCalendar() {
    const root = el('div'); let currentMonth = new Date(); const cc = el('div'); root.appendChild(cc);
    function renderCal() {
      const year = currentMonth.getFullYear(), month = currentMonth.getMonth(), first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
      const cal = el('div', 'card');
      cal.innerHTML = '<div class="flex-between" style="margin-bottom:16px"><h2 style="margin:0;font-size:1.5rem">' + currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase() + '</h2><div style="display:flex;gap:8px"><button class="prevMonthBtn btn btn-sec btn-small">←</button><button class="nextMonthBtn btn btn-sec btn-small">→</button></div></div><div class="calendar-grid" id="calGrid"></div>';
      cc.innerHTML = ''; cc.appendChild(cal);
      const grid = document.getElementById('calGrid'); if (!grid) return;
      ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(d => { const h = el('div'); h.style.fontWeight = '600'; h.style.fontSize = '11px'; h.style.color = 'var(--secondary)'; h.style.textAlign = 'center'; h.textContent = d; grid.appendChild(h); });
      for (let i = 0; i < first.getDay(); i++) grid.appendChild(el('div'));
      for (let i = 1; i <= last.getDate(); i++) {
        const day = el('div', 'calendar-day'), date = new Date(year, month, i), dateStr = date.toISOString().split('T')[0];
        const eventsOn = state.events.filter(e => e.date === dateStr);
        if (date.toDateString() === new Date().toDateString()) day.classList.add('today');
        day.innerHTML = '<div>' + i + '</div>' + eventsOn.map(e => '<div style="font-size:8px">' + (e.emoji || '●') + '</div>').join('');
        day.dataset.date = dateStr; day.onclick = () => showDateEventModal(dateStr); grid.appendChild(day);
      }
      setTimeout(() => { const btns = cc.querySelectorAll('.prevMonthBtn, .nextMonthBtn'); if (btns[0]) btns[0].onclick = () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCal(); }; if (btns[1]) btns[1].onclick = () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCal(); }; }, 10);
    }
    setTimeout(() => { renderCal(); }, 50);
    const eventsList = el('div', 'card');
    eventsList.innerHTML = '<div class="label" style="margin-bottom:16px">Upcoming Events</div><div id="upcomingEvents"></div>';
    root.appendChild(eventsList);
    function renderEvents() {
      setTimeout(() => {
        const upcoming = state.events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
        const list = document.getElementById('upcomingEvents');
        if (list) {
          list.innerHTML = upcoming.map(e => '<div class="note-item"><div style="flex:1"><div style="font-weight:600">' + (e.emoji || '•') + ' ' + e.title + '</div><div class="note-meta">' + e.date + '</div></div><button class="delEvBtn btn btn-sec btn-small" data-date="' + e.date + '" data-title="' + e.title + '">X</button></div>').join('') || '<div class="muted">No upcoming events</div>';
          list.querySelectorAll('.delEvBtn').forEach(b => { b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); if (confirm('Delete "' + b.dataset.title + '"?')) { state.events = state.events.filter(evt => !(evt.date === b.dataset.date && evt.title === b.dataset.title)); save(); renderEvents(); } }; });
        }
      }, 10);
    }
    renderEvents();
    return root;
  }

  function renderLists() {
    const root = el('div');
    const tabs = el('div', 'tab-nav');
    tabs.innerHTML = '<button class="tab-btn active" data-list="travelList">Travel</button><button class="tab-btn" data-list="movies">Movies</button><button class="tab-btn" data-list="restaurants">Restaurants</button><button class="tab-btn" data-list="giftIdeas">Gift Ideas</button>';
    root.appendChild(tabs);
    const content = el('div', 'card'); root.appendChild(content);
    function renderList(listType) {
      const list = state.lists[listType] || [];
      content.innerHTML = '<div id="listItems"></div><div class="list-add"><input id="listInput" placeholder="Add item..." type="text"><button id="listAddBtn" class="btn btn-small">+</button></div>';
      setTimeout(() => {
        const li = document.getElementById('listItems');
        if (li) {
          li.innerHTML = list.map((item, i) => '<div class="list-item" style="justify-content:space-between;"><div style="display:flex;align-items:center;gap:10px;flex:1;"><input type="checkbox" id="item-' + i + '" ' + (item.checked ? 'checked' : '') + '><label for="item-' + i + '" style="flex:1;">' + (item.text || item) + '</label></div><button class="delete-list-btn" data-index="' + i + '" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem;padding:0;">X</button></div>').join('') || '<div class="muted" style="padding:20px;text-align:center">No items yet</div>';
          li.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => { cb.onchange = () => { if (typeof list[i] === 'string') list[i] = { text: list[i], checked: cb.checked }; else list[i].checked = cb.checked; save(); }; });
          li.querySelectorAll('.delete-list-btn').forEach(b => { b.onclick = (e) => { e.stopPropagation(); const idx = parseInt(b.dataset.index); if (confirm('Delete "' + (list[idx].text || list[idx]) + '"?')) { state.lists[listType].splice(idx, 1); save(); renderList(listType); } }; });
        }
        const ab = document.getElementById('listAddBtn'), inp = document.getElementById('listInput');
        if (ab && inp) { ab.onclick = () => { const t = inp.value.trim(); if (!t) return; state.lists[listType].push({ text: t, checked: false }); save(); renderList(listType); }; inp.onkeypress = e => { if (e.key === 'Enter') ab.click(); }; }
      }, 10);
    }
    renderList('travelList');
    tabs.querySelectorAll('.tab-btn').forEach(b => { b.onclick = () => { tabs.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderList(b.dataset.list); }; });
    return root;
  }

  function renderIdeas() {
    const root = el('div');
    const header = el('div', 'flex-between');
    header.innerHTML = '<div style="font-size:1.2rem;font-weight:600;">All Ideas</div><button class="btn btn-small" id="addCustomIdeaBtn" style="padding:8px 14px;font-size:1.2rem;line-height:1;">+</button>';
    root.appendChild(header);
    const tabs = el('div', 'tab-nav');
    tabs.innerHTML = '<button class="tab-btn active" data-list="dateIdeas">Date Ideas</button><button class="tab-btn" data-list="travelList">Travel</button><button class="tab-btn" data-list="movies">Movies</button><button class="tab-btn" data-list="restaurants">Restaurants</button><button class="tab-btn" data-list="giftIdeas">Gift Ideas</button>';
    root.appendChild(tabs);
    const content = el('div', 'card'); root.appendChild(content);
    function renderList(listType) {
      const list = state.lists[listType] || [];
      content.innerHTML = '<div id="listItems"></div><div class="list-add"><input id="listInput" placeholder="Add item..." type="text"><button id="listAddBtn" class="btn btn-small">+</button></div>';
      setTimeout(() => {
        const li = document.getElementById('listItems');
        if (li) {
          li.innerHTML = list.map((item, i) => '<div class="list-item" style="justify-content:space-between;"><div style="display:flex;align-items:center;gap:10px;flex:1;"><input type="checkbox" id="item-' + i + '" ' + (item.checked ? 'checked' : '') + '><label for="item-' + i + '" style="flex:1;">' + (item.text || item) + '</label></div><button class="delete-list-btn" data-index="' + i + '" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem;padding:0;">X</button></div>').join('') || '<div class="muted" style="padding:20px;text-align:center">No items yet</div>';
          li.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => { cb.onchange = () => { if (typeof list[i] === 'string') list[i] = { text: list[i], checked: cb.checked }; else list[i].checked = cb.checked; save(); }; });
          li.querySelectorAll('.delete-list-btn').forEach(b => { b.onclick = (e) => { e.stopPropagation(); const idx = parseInt(b.dataset.index); if (confirm('Delete "' + (list[idx].text || list[idx]) + '"?')) { state.lists[listType].splice(idx, 1); save(); renderList(listType); } }; });
        }
        const ab = document.getElementById('listAddBtn'), inp = document.getElementById('listInput');
        if (ab && inp) { ab.onclick = () => { const t = inp.value.trim(); if (!t) return; state.lists[listType].push({ text: t, checked: false }); save(); renderList(listType); }; inp.onkeypress = e => { if (e.key === 'Enter') ab.click(); }; }
      }, 10);
    }
    renderList('dateIdeas');
    tabs.querySelectorAll('.tab-btn').forEach(b => { b.onclick = () => { tabs.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderList(b.dataset.list); }; });
    setTimeout(() => { const ab = document.getElementById('addCustomIdeaBtn'); if (ab) ab.onclick = () => { const at = tabs.querySelector('.tab-btn.active'), lt = at.dataset.list, item = prompt('Add a new item:'); if (item && item.trim()) { state.lists[lt].push({ text: item.trim(), checked: false }); save(); renderList(lt); } }; }, 10);
    return root;
  }

  function renderLogin() {
    const root = el('div');
    root.innerHTML = '<div class="card" style="max-width:480px;margin:0 auto;text-align:center"><div class="label">Member Login</div><h2>Select your profile</h2><div style="margin-top:24px;display:grid;gap:14px"><button class="btn" id="loginGab">Gab</button><button class="btn btn-sec" id="loginAvi">Avi</button><div class="muted" style="font-size:12px;padding-top:10px">This site is private for Gab and Avi only!</div></div></div>';
    setTimeout(() => { const g = document.getElementById('loginGab'); const a = document.getElementById('loginAvi'); if (g) g.onclick = () => { state.auth.currentUser = { username: 'Gab' }; state.auth.token = 'Gab'; localStorage.setItem('gavvy-state', JSON.stringify(state)); navigate('home'); }; if (a) a.onclick = () => { state.auth.currentUser = { username: 'Avi' }; state.auth.token = 'Avi'; localStorage.setItem('gavvy-state', JSON.stringify(state)); navigate('home'); }; }, 50);
    return root;
  }

  function renderNotes() {
    const root = el('div');
    const header = el('div', 'flex-between');
    header.innerHTML = '<div><div class="label">Notes Hub</div><h2>Private thoughts and shared notes</h2></div><button class="btn btn-small" id="newNoteBtn">New Note</button>';
    root.appendChild(header);
    const lc = el('div', 'card'); lc.id = 'notesList'; root.appendChild(lc);
    const ac = el('div', 'card');
    ac.innerHTML = '<div class="label">Write a Note</div><input id="noteTitle" placeholder="Title" type="text" style="margin-top:16px"><textarea id="noteBody" placeholder="Write your message..." style="margin-top:12px;height:130px"></textarea><div class="flex-between" style="margin-top:14px"><div class="muted">Share a memory, idea, or secret</div><button class="btn" id="saveNoteBtn">Save</button></div>';
    root.appendChild(ac);
    function refreshNotes() {
      const nl = document.getElementById('notesList');
      if (!nl) return;
      nl.innerHTML = state.notes.slice().reverse().map(n => '<div class="note-item"><div style="flex:1"><div style="font-weight:600">' + (n.title || 'Untitled note') + '</div><div class="note-meta">' + n.date + ' - ' + (n.body || '').slice(0, 90) + ((n.body || '').length > 90 ? '...' : '') + '</div></div><button class="btn btn-sec btn-small" data-id="' + n.id + '">Delete</button></div>').join('') || '<div class="muted" style="padding:24px;text-align:center">No notes yet.</div>';
      nl.querySelectorAll('button[data-id]').forEach(b => { b.onclick = () => { state.notes = state.notes.filter(x => x.id !== b.dataset.id); save(); refreshNotes(); }; });
    }
    setTimeout(() => { const sb = document.getElementById('saveNoteBtn'), nb = document.getElementById('newNoteBtn'), ti = document.getElementById('noteTitle'), bi = document.getElementById('noteBody'); if (nb) nb.onclick = () => { ti.focus(); }; if (sb) sb.onclick = () => { const t = ti.value.trim(), b = bi.value.trim(); if (!b) return; state.notes.push({ id: Date.now().toString(), title: t || 'Untitled', body: b, date: new Date().toISOString().split('T')[0] }); save(); ti.value = ''; bi.value = ''; refreshNotes(); }; }, 50);
    refreshNotes();
    return root;
  }

  function renderPeriodTracker() {
    const root = el('div', 'period-tracker-page');
    const tracker = state.periodTracker;
    const lastDate = tracker.lastPeriodDate ? new Date(tracker.lastPeriodDate) : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let dayInCycle = null, cyclePhase = 'off', phaseColor = '#666', nextPeriodDate = null;
    if (lastDate) {
      const daysDiff = Math.floor((today - lastDate) / 86400000);
      dayInCycle = daysDiff % tracker.averageLength;
      if (dayInCycle < tracker.periodLength) { cyclePhase = 'menstrual'; phaseColor = '#e74c3c'; }
      else if (dayInCycle < Math.floor(tracker.averageLength / 2) - 2) { cyclePhase = 'follicular'; phaseColor = '#f39c12'; }
      else if (dayInCycle >= Math.floor(tracker.averageLength / 2) - 2 && dayInCycle <= Math.floor(tracker.averageLength / 2) + 2) { cyclePhase = 'ovulation'; phaseColor = '#e91e63'; }
      else { cyclePhase = 'luteal'; phaseColor = '#9b59b6'; }
      nextPeriodDate = new Date(lastDate); nextPeriodDate.setDate(nextPeriodDate.getDate() + tracker.averageLength);
    }
    let html = '<div style="margin-bottom:24px"><div class="label" style="margin-bottom:8px">Period Tracker</div><h2 style="margin:0;margin-bottom:4px">Cycle Insights</h2><div class="note-meta">Track your cycle and stay informed</div></div>';
    html += '<div class="card" style="background:linear-gradient(135deg,' + phaseColor + '22 0%,' + phaseColor + '11 100%);border:1px solid ' + phaseColor + '44;margin-bottom:20px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div><div class="label">Current Phase</div><div style="font-size:1.8rem;font-weight:700;margin-top:8px;color:' + phaseColor + '">' + (cyclePhase === 'menstrual' ? 'Menstrual' : cyclePhase === 'follicular' ? 'Follicular' : cyclePhase === 'ovulation' ? 'Ovulation' : cyclePhase === 'luteal' ? 'Luteal' : 'Not tracked') + '</div><div class="note-meta" style="margin-top:8px">' + (dayInCycle !== null ? 'Day ' + (dayInCycle + 1) + ' of ' + tracker.averageLength : 'Log your first period to start') + '</div></div><div><div class="label">Next Period</div><div style="font-size:1.8rem;font-weight:700;margin-top:8px;color:#e74c3c">' + (nextPeriodDate ? nextPeriodDate.toLocaleDateString() : '---') + '</div><div class="note-meta" style="margin-top:8px">' + (nextPeriodDate ? Math.ceil((nextPeriodDate - today) / 86400000) + ' days away' : 'Log period to predict') + '</div></div></div></div>';
    root.innerHTML = html;
    return root;
  }

  function renderTrips() {
    const root = el('div'); let selectedTripIndex = 0;
    const tripList = el('div', 'card'); const tripDetail = el('div');
    function renderTripPanel() {
      const trip = state.trips[selectedTripIndex];
      if (!trip) { tripDetail.innerHTML = '<div class="card" style="padding:32px;text-align:center">No trips yet. Add one to begin planning your next adventure.</div>'; return; }
      tripDetail.innerHTML = '<div class="card"><div class="flex-between" style="margin-bottom:16px"><div><div class="label">Trip Plan</div><div class="trip-title">' + trip.name + '</div></div><button class="btn btn-small" id="saveTripUpdateBtn">Save</button></div><div class="grid" style="gap:14px"><div class="col-6"><div class="label">Budget</div><div class="note-meta">P' + (trip.spent || 0) + ' spent of P' + (trip.budget || 0) + '</div><div class="trip-budget-bar"><div class="trip-budget-fill" style="width:' + Math.min((trip.spent / trip.budget) * 100 || 0, 100) + '%"></div></div><input type="number" id="tripSpent" placeholder="Update spent" style="margin-top:14px" value="' + (trip.spent || 0) + '"></div><div class="col-6"><div class="label">Dates</div><input type="date" id="tripStartDate" placeholder="Start date" style="margin-top:14px" value="' + (trip.startDate || '') + '"><input type="date" id="tripEndDate" placeholder="End date" style="margin-top:12px" value="' + (trip.endDate || '') + '"></div></div></div>';
      setTimeout(() => {
        const sBtn = document.getElementById('saveTripUpdateBtn');
        if (sBtn) sBtn.onclick = () => { trip.spent = parseInt(document.getElementById('tripSpent').value, 10) || trip.spent; trip.startDate = document.getElementById('tripStartDate').value; trip.endDate = document.getElementById('tripEndDate').value; save(); renderTripPanel(); };
      }, 50);
    }
    const addForm = el('div', 'col-12');
    addForm.appendChild(el('div', 'card', '<div class="label">Plan a Trip</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><input id="tripName" placeholder="Trip name (e.g., Tokyo Escape)" style="flex:1;min-width:150px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input type="number" id="tripBudget" placeholder="Budget" style="width:120px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><button id="addTripBtn" class="btn">Add</button></div>'));
    root.appendChild(addForm);
    tripList.innerHTML = '<div class="label">Your Trips</div>';
    tripList.style.marginTop = '18px';
    root.appendChild(tripList);
    root.appendChild(tripDetail);
    function refreshTrips() {
      tripList.innerHTML = '<div class="label">Your Trips</div>' + state.trips.map((t, i) => '<div class="note-item" style="cursor:pointer;justify-content:space-between" data-index="' + i + '"><div><div style="font-weight:600">' + t.name + '</div><div class="note-meta">P' + (t.spent || 0) + ' / P' + (t.budget || 0) + '</div></div><div style="display:flex;align-items:center;gap:12px;"><div style="color:var(--secondary)">View</div><button class="delete-trip-btn" data-index="' + i + '" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem;padding:0;">X</button></div></div>').join('');
      tripList.querySelectorAll('[data-index]').forEach(item => { item.onclick = (e) => { if (e.target.classList.contains('delete-trip-btn')) return; selectedTripIndex = parseInt(item.dataset.index, 10); renderTripPanel(); }; });
      tripList.querySelectorAll('.delete-trip-btn').forEach(b => { b.onclick = (e) => { e.stopPropagation(); const idx = parseInt(b.dataset.index); if (confirm('Delete trip?')) { state.trips.splice(idx, 1); save(); if (selectedTripIndex >= state.trips.length && selectedTripIndex > 0) selectedTripIndex--; refreshTrips(); } }; });
      if (state.trips.length) renderTripPanel();
    }
    setTimeout(() => { const ab = document.getElementById('addTripBtn'); if (ab) ab.onclick = () => { const name = document.getElementById('tripName').value.trim(), budget = parseInt(document.getElementById('tripBudget').value, 10) || 0; if (!name || !budget) return; state.trips.push({ name, budget, spent: 0, checklist: [], itinerary: [], startDate: '', endDate: '' }); save(); document.getElementById('tripName').value = ''; document.getElementById('tripBudget').value = ''; selectedTripIndex = state.trips.length - 1; refreshTrips(); }; }, 50);
    refreshTrips();
    return root;
  }

  function renderUs() {
    const root = el('div', 'grid us-page');
    const pageHeader = el('div', 'col-12');
    pageHeader.appendChild(el('div', 'us-page-header', '<div></div><button class="btn btn-small us-logout-btn" id="logoutBtn">Logout</button>'));
    root.appendChild(pageHeader);
    const infoCard = el('div', 'col-12');
    infoCard.appendChild(el('div', 'card', '<div style="text-align:center;font-size:3rem;margin-bottom:16px">💑</div><div class="couple-names" style="text-align:center">' + state.couple.name1 + ' <span class="heart">🖤</span> ' + state.couple.name2 + '</div><div style="text-align:center;color:var(--secondary);margin-top:16px"><label style="display:block;margin-bottom:8px">Relationship Start Date</label><input type="date" id="anniversary" value="' + (state.couple.startDate || '') + '" style="margin-top:8px" disabled></div>'));
    root.appendChild(infoCard);
    const stats = el('div', 'col-12');
    const days = getDaysTogether();
    const user = (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1;
    stats.appendChild(el('div', 'card', '<div class="label" style="margin-bottom:16px">Relationship Stats</div><div class="stats-grid"><div class="stat-card"><div class="stat-icon">❤️</div><div class="stat-number">' + days.total + '</div><div class="stat-label">Days Together</div></div><div class="stat-card"><div class="stat-icon">🎉</div><div class="stat-number">' + state.events.length + '</div><div class="stat-label">Dates</div></div><div class="stat-card"><div class="stat-icon">✈️</div><div class="stat-number">' + state.trips.length + '</div><div class="stat-label">Trips</div></div><div class="stat-card"><div class="stat-icon">📸</div><div class="stat-number">' + state.memories.length + '</div><div class="stat-label">Memories</div></div></div>'));
    root.appendChild(stats);
    const goalsCard = el('div', 'col-12');
    let goalsHtml = '<div class="flex-between" style="margin-bottom:16px"><div><div class="label">Relationship Goals</div><div style="font-size:0.9rem;color:var(--secondary)">Track shared milestones and achievements.</div></div><button class="btn btn-small" id="goalExpandBtn">Manage</button></div>';
    goalsHtml += '<div id="usGoalsContainer" style="display:grid;gap:12px">';
    if (state.goals.length === 0) goalsHtml += '<div class="muted" style="padding:20px;text-align:center">No goals yet.</div>';
    else state.goals.forEach(goal => { const pct = Math.round((goal.progress / goal.target) * 100); goalsHtml += '<div class="goal-item-us" data-goal-id="' + goal.id + '" style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;display:flex;gap:12px;align-items:center;justify-content:space-between"><div style="flex:1;cursor:pointer" class="goal-view-area"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>' + goal.emoji + ' ' + goal.title + '</strong><span style="color:var(--secondary);font-size:0.9rem">' + pct + '%</span></div><div style="display:flex;gap:12px;align-items:center"><div class="progress-bar" style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden"><div class="progress-fill" style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f)"></div></div><div style="font-size:0.8rem;color:var(--secondary);min-width:100px;text-align:right">' + (goal.type === 'savings' ? 'P' + goal.progress.toLocaleString() : goal.progress) + ' / ' + (goal.type === 'savings' ? 'P' + goal.target.toLocaleString() : goal.target) + '</div></div></div><button class="btn btn-sec btn-small goal-delete-btn" data-goal-id="' + goal.id + '" style="padding:8px 12px;flex-shrink:0">X</button></div>'; });
    goalsHtml += '</div>';
    goalsHtml += '<div id="goalExpandPanel" style="display:none;margin-top:18px;border-top:1px solid rgba(255,255,255,0.1);padding-top:18px"><div class="label" style="margin-bottom:12px">Add New Goal</div><div style="display:grid;gap:12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><input id="goalEmoji" placeholder="Emoji" value="✨" style="text-align:center" maxlength="2"><input id="goalTitle" placeholder="Goal title" type="text"></div><select id="goalType" style="padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)"><option value="savings">Savings Goal</option><option value="count">Count Goal</option></select><input id="goalTarget" placeholder="Target number" type="number" min="1"><input id="goalDeadline" placeholder="Deadline (optional)" type="date"><button id="goalAddBtn" class="btn">Create Goal</button></div></div>';
    goalsCard.appendChild(el('div', 'card', goalsHtml));
    root.appendChild(goalsCard);
    setTimeout(() => {
      document.getElementById('logoutBtn').onclick = () => { state.auth.currentUser = null; state.auth.token = null; localStorage.setItem('gavvy-state', JSON.stringify(state)); navigate('login'); };
      const gb = document.getElementById('goalExpandBtn'), gp = document.getElementById('goalExpandPanel'); if (gb && gp) gb.onclick = () => gp.style.display = gp.style.display === 'none' ? 'block' : 'none';
      document.querySelectorAll('.goal-item-us').forEach(item => { item.querySelector('.goal-view-area').onclick = () => { const g = state.goals.find(x => x.id === item.dataset.goalId); if (g) showGoalDetail(g); }; item.querySelector('.goal-delete-btn').onclick = (e) => { e.stopPropagation(); if (confirm('Delete this goal?')) { state.goals = state.goals.filter(g => g.id !== e.target.dataset.goalId); save(); navigate('us'); } }; });
      document.getElementById('goalAddBtn').onclick = () => { const emoji = document.getElementById('goalEmoji').value.trim() || '✨'; const title = document.getElementById('goalTitle').value.trim(); const type = document.getElementById('goalType').value || 'count'; const target = parseInt(document.getElementById('goalTarget').value, 10) || 100; if (!title) return; state.goals.push({ id: Date.now().toString(), emoji, title, type, progress: 0, target, deadline: document.getElementById('goalDeadline').value || null, milestones: [{ value: Math.floor(target * 0.25), label: Math.floor(target * 0.25), reward: 'Progress' }, { value: Math.floor(target * 0.5), label: Math.floor(target * 0.5), reward: 'Halfway' }, { value: Math.floor(target * 0.75), label: Math.floor(target * 0.75), reward: 'Almost There' }, { value: target, label: target, reward: 'Complete' }], items: [], createdAt: new Date().toISOString() }); save(); navigate('us'); };
    }, 50);
    const conversationsCard = el('div', 'col-12');
    let conversationsHtml = '<div class="card"><div class="label" style="margin-bottom:16px">Our Conversations</div><div style="display:grid;gap:12px;">';
    if (state.answeredQuestions.length === 0) conversationsHtml += '<div style="color:var(--secondary);text-align:center;padding:16px;">No conversations yet. Start by answering today\'s question!</div>';
    else state.answeredQuestions.slice().reverse().forEach(qa => { conversationsHtml += '<div style="border-left:3px solid var(--accent);padding:12px;background:rgba(212,175,55,0.05);border-radius:4px;"><div style="color:var(--secondary);font-size:0.85rem;margin-bottom:6px;">' + qa.date + ' - ' + qa.by + '</div><div style="font-size:0.95rem;margin-bottom:8px;font-style:italic;color:var(--secondary);">Q: ' + qa.question + '</div><div style="font-size:0.95rem;color:var(--text);">A: ' + qa.answer + '</div></div>'; });
    conversationsHtml += '</div></div>';
    conversationsCard.innerHTML = conversationsHtml;
    root.appendChild(conversationsCard);
    const app = el('div'); app.appendChild(root);
    return app;
  }

  function showFAB() { const m = document.getElementById('fabMenu'); if (m) m.classList.toggle('active'); }

  function navigate(route) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.route === route));
    const app = document.getElementById('app'); app.innerHTML = '';
    if (!state.auth.currentUser && route !== 'login') route = 'login';
    if (state.auth.currentUser && route === 'login') route = 'home';
    currentRoute = route;
    localStorage.setItem('gavvy-lastRoute', route);
    if (route === 'home') app.appendChild(renderHome());
    else if (route === 'memories') app.appendChild(renderMemories());
    else if (route === 'calendar') app.appendChild(renderCalendar());
    else if (route === 'lists') app.appendChild(renderLists());
    else if (route === 'ideas') app.appendChild(renderIdeas());
    else if (route === 'notes') app.appendChild(renderNotes());
    else if (route === 'period') app.appendChild(renderPeriodTracker());
    else if (route === 'trips') app.appendChild(renderTrips());
    else if (route === 'us') app.appendChild(renderUs());
    else if (route === 'login') app.appendChild(renderLogin());
  }

  function init() {
    const mw = el('div', 'modal'); const mc = el('div'); mc.id = 'memoryModal'; mw.appendChild(mc); document.body.appendChild(mw);
    const fab = el('button', 'fab'); fab.innerHTML = '+'; fab.onclick = showFAB; document.body.appendChild(fab);
    const fm = el('div', 'fab-menu'); fm.id = 'fabMenu';
    fm.innerHTML = '<div class="fab-item" data-action="memory">Add Memory</div><div class="fab-item" data-action="dateIdea">Add Date Idea</div><div class="fab-item" data-action="note">Add Note</div><div class="fab-item" data-action="goal">Add Goal</div><div class="fab-item" data-action="trip">Add Trip</div>';
    document.body.appendChild(fm);
    fm.querySelectorAll('.fab-item').forEach(item => { item.onclick = () => { const a = item.dataset.action; if (a === 'memory') navigate('memories'); else if (a === 'dateIdea') navigate('ideas'); else if (a === 'note') navigate('notes'); else if (a === 'goal') navigate('us'); else if (a === 'trip') navigate('trips'); fm.classList.remove('active'); }; });
    document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => navigate(b.dataset.route)));
    let initialRoute = 'home';
    if (state.auth.currentUser) { const lr = localStorage.getItem('gavvy-lastRoute'); if (lr && lr !== 'login') initialRoute = lr; }
    else initialRoute = 'login';
    navigate(initialRoute);
  }
  return { init };
})();
document.addEventListener('DOMContentLoaded', () => GAVVY.init());