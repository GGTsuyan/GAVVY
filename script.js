// GAVVY - Dark Luxury Couple App
const GAVVY = (() => {
  let state = {
    couple: { name1: 'Gab', name2: 'Avi', startDate: null },
    memories: [], notes: [], events: [],
    goals: [
      { id: '1', emoji: 'plane', title: 'Japan 2027', type: 'savings', progress: 32500, target: 50000, deadline: '2027-12-31', milestones: [{ value: 10000, label: '10k', reward: 'Dreamer' }, { value: 20000, label: '20k', reward: 'Planner' }, { value: 30000, label: '30k', reward: 'Saver' }, { value: 40000, label: '40k', reward: 'Go-Getter' }, { value: 50000, label: '50k', reward: 'Travel Legends' }], createdAt: '2026-01-15' },
      { id: '2', emoji: 'film', title: 'Movie Challenge', type: 'count', progress: 67, target: 100, milestones: [{ value: 25, label: '25 Movies', reward: 'Cinephile I' }, { value: 50, label: '50 Movies', reward: 'Cinephile II' }, { value: 75, label: '75 Movies', reward: 'Movie Master' }, { value: 100, label: '100 Movies', reward: 'Movie Legends' }], items: [{ id: '1', name: 'Interstellar', completed: true, date: '2026-02-14' }, { id: '2', name: 'La La Land', completed: true, date: '2026-03-01' }, { id: '3', name: 'Her', completed: true, date: '2026-03-15' }], createdAt: '2026-01-01' }
    ],
    lists: { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] }, trips: [],
    periodTracker: { entries: [], lastPeriodDate: null, averageLength: 36, periodLength: 6 },
    auth: { currentUser: null, token: null },
    questions: ['What place would you like to visit together?', 'What is a favorite memory we share?', 'What is something you love about me?', 'Where do you see us in 5 years?', 'What should we do next weekend?'],
    currentQuestion: 0, answeredQuestions: [],
    mood: { current: {}, customMoods: ['Happy', 'Relaxed', 'Tired', 'Sad', 'Excited'], selectedPerson: 'Gab', updatedAt: new Date().toISOString() },
    surprise: {}
  };

  const API_BASE = '/api';
  let currentRoute = 'home';

  async function save() {
    localStorage.setItem('gavvy-state', JSON.stringify(state));
    if (window._supabaseReady && window.saveToSupabase) {
      try { await window.saveToSupabase(state); } catch(e) { console.warn('save fail:', e); }
    }
  }

  function load() {
    try {
      const s = localStorage.getItem('gavvy-state');
      if (s) {
        const p = JSON.parse(s);
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
        if (p.lists) for (const k of Object.keys(p.lists)) { if (p.lists[k].length > 0) state.lists[k] = p.lists[k]; }
      }
    } catch(e) {}
  }

  async function loadFromCloud() {
    if (window._supabaseReady && window.loadFromSupabase) {
      try {
        await Promise.race([window.loadFromSupabase(state), new Promise(function(_, reject) { setTimeout(function() { reject(new Error('timeout')); }, 5000); })]);
        localStorage.setItem('gavvy-state', JSON.stringify(state));
        if (currentRoute !== 'login') navigate(currentRoute);
      } catch(e) { console.warn('cloud fail:', e); }
    }
  }

  load();
  if (!state.couple.startDate) state.couple.startDate = '2025-07-09';
  state.couple.name1 = state.couple.name1 || 'Gab';
  state.couple.name2 = state.couple.name2 || 'Avi';
  if (!state.mood.current || Object.keys(state.mood.current).length === 0) {
    state.mood.current = {}; state.mood.current[state.couple.name1] = 'Happy'; state.mood.current[state.couple.name2] = 'Happy';
  }
  state.mood.customMoods = state.mood.customMoods || ['Happy', 'Relaxed', 'Tired', 'Sad', 'Excited'];
  state.goals = state.goals.filter(function(g) { return g && g.id && g.emoji && g.title; });
  loadFromCloud();

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (html !== undefined) { e.innerHTML = html; }
    return e;
  }

  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  function getDaysTogether() {
    if (!state.couple.startDate) return { years: 0, months: 0, days: 0, total: 0 };
    var start = new Date(state.couple.startDate), now = new Date();
    var years = now.getFullYear() - start.getFullYear();
    var months = now.getMonth() - start.getMonth();
    var days = now.getDate() - start.getDate();
    if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years -= 1; months += 12; }
    return { years: years, months: months, days: days, total: Math.floor((now - start) / 86400000) };
  }

  function getCountdown(date) { if (!date) return null; var d = Math.ceil((new Date(date) - new Date()) / 86400000); return d > 0 ? d : 0; }

  function closeModalAndRefresh() {
    var m = document.getElementById('memoryModal');
    if (m && m.parentElement) m.parentElement.classList.remove('active');
    setTimeout(function() { if (currentRoute !== 'login') navigate(currentRoute); }, 150);
  }

  function buildCard(label, body) {
    return '<div class="card">' + label + body + '</div>';
  }

  function div(cls, content) {
    return '<div class="' + esc(cls) + '">' + content + '</div>';
  }

  function showGoalDetail(goal) {
    var modal = document.getElementById('memoryModal');
    if (!modal) return;
    var pct = Math.round((goal.progress / goal.target) * 100);
    var s = '';
    s += '<div class="modal-content">';
    s += '<button class="modal-close" id="closeModal">X</button>';
    s += div('', '<div style="font-size:2.5rem">' + esc(goal.emoji) + '</div><h2>' + esc(goal.title) + '</h2>');
    s += div('note-meta', esc(goal.type === 'savings' ? 'P' + goal.progress.toLocaleString() + ' / P' + goal.target.toLocaleString() : goal.progress + ' / ' + goal.target));
    s += '<div class="progress-bar" style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden"><div class="progress-fill" style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f)"></div></div>';
    s += '<div style="text-align:center">' + pct + '% Complete</div>';
    if (goal.type === 'savings') {
      s += '<div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px"><div class="label">Add Savings</div><div style="display:flex;gap:8px"><input id="goalAddAmount" type="number" placeholder="Amount" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)"><button id="goalSaveBtn" class="btn btn-small">Add</button></div></div>';
    } else if (goal.type === 'count') {
      s += '<div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px"><div class="label">Update Count</div><div style="display:flex;gap:8px;align-items:center;justify-content:center"><button id="goalDecrementBtn" class="btn btn-small">-</button><div style="font-size:1.5rem;font-weight:600">' + goal.progress + '</div><button id="goalIncrementBtn" class="btn btn-small">+</button></div></div>';
    }
    s += '</div>';
    modal.innerHTML = s;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = function() { document.getElementById('memoryModal').parentElement.classList.remove('active'); };
    setTimeout(function() {
      if (goal.type === 'savings') {
        var btn = document.getElementById('goalSaveBtn'), amt = document.getElementById('goalAddAmount');
        if (btn && amt) btn.onclick = function() { var v = parseInt(amt.value, 10); if (v && v > 0) { goal.progress += v; if (goal.progress > goal.target) goal.progress = goal.target; save(); closeModalAndRefresh(); } };
      } else if (goal.type === 'count') {
        var inc = document.getElementById('goalIncrementBtn'), dec = document.getElementById('goalDecrementBtn');
        if (inc) inc.onclick = function() { if (goal.progress < goal.target) { goal.progress++; save(); closeModalAndRefresh(); } };
        if (dec) dec.onclick = function() { if (goal.progress > 0) { goal.progress--; save(); closeModalAndRefresh(); } };
      }
    }, 50);
  }

  function showMemoryDetail(mem) {
    var modal = document.getElementById('memoryModal');
    if (!modal) return;
    var s = '<div class="modal-content"><button class="modal-close" id="closeModal">X</button>';
    if (mem.image) { s += '<div style="margin-bottom:18px;border-radius:20px;overflow:hidden"><img src="' + esc(mem.image) + '" alt="' + esc(mem.title) + '" style="width:100%;display:block"></div>'; }
    else { s += '<div style="font-size:3rem;text-align:center;margin-bottom:16px">' + esc(mem.emoji) + '</div>'; }
    s += '<h2 style="text-align:center;margin-bottom:8px">' + esc(mem.title) + '</h2>';
    s += '<div class="note-meta" style="text-align:center">' + esc(mem.date) + '</div>';
    if (mem.location) { s += '<div class="muted" style="margin-bottom:12px">Location: ' + esc(mem.location) + '</div>'; }
    s += '<div style="margin-bottom:20px;padding:16px;background:var(--bg-0);border-radius:12px;border:1px solid var(--border)">' + esc(mem.story || mem.text || 'No description') + '</div></div>';
    modal.innerHTML = s;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = function() { document.getElementById('memoryModal').parentElement.classList.remove('active'); };
  }

  function showDateEventModal(dateStr) {
    var modal = document.getElementById('memoryModal');
    if (!modal) return;
    var evts = state.events.filter(function(e) { return e.date === dateStr; });
    var d = new Date(dateStr + 'T00:00:00');
    var s = '<div class="modal-content"><button class="modal-close" id="closeModal">X</button>';
    s += '<h3>' + d.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + '</h3>';
    s += '<div style="max-height:200px;overflow-y:auto">';
    if (evts.length === 0) { s += '<div class="muted">No events on this date</div>'; }
    else {
      for (var i = 0; i < evts.length; i++) {
        s += '<div style="padding:12px;background:rgba(212,175,55,0.05);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
        s += '<div><span style="font-size:1.2rem">' + esc(evts[i].emoji) + '</span> <strong>' + esc(evts[i].title) + '</strong></div>';
        s += '<button class="delete-ev-btn" data-date="' + esc(evts[i].date) + '" data-title="' + esc(evts[i].title) + '" style="background:none;border:none;color:var(--accent);cursor:pointer">X</button></div>';
      }
    }
    s += '</div>';
    s += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">';
    s += '<input id="mde" placeholder="Emoji" value="star" style="width:50px;text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    s += '<input id="mdt" placeholder="Event title" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    s += '<button id="addEvBtn" class="btn">Add</button></div></div>';
    modal.innerHTML = s;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = function() { document.getElementById('memoryModal').parentElement.classList.remove('active'); };
    setTimeout(function() {
      document.getElementById('addEvBtn').onclick = function() {
        var em = document.getElementById('mde').value || 'star';
        var t = document.getElementById('mdt').value.trim();
        if (!t) return;
        state.events.push({ emoji: em, date: dateStr, title: t });
        save();
        closeModalAndRefresh();
      };
      document.querySelectorAll('.delete-ev-btn').forEach(function(btn) {
        btn.onclick = function() {
          if (confirm('Delete?')) {
            state.events = state.events.filter(function(x) { return !(x.date === btn.dataset.date && x.title === btn.dataset.title); });
            save();
            showDateEventModal(dateStr);
          }
        };
      });
    }, 10);
  }

  function renderHome() {
    var root = el('div');
    var days = getDaysTogether();
    var s = '';

    s += div('couple-banner', '<div class="couple-photo"></div>' + div('couple-banner-body', '<div class="couple-names">' + esc(state.couple.name1) + ' heart ' + esc(state.couple.name2) + '</div>' + div('label', 'Together for') + '<div class="days-summary">' + days.years + 'Y ' + days.months + 'M ' + days.days + 'D</div>'));
    root.appendChild(el('div', '', s));

    s = '<div class="label">Relationship Start Date</div><input type="date" id="setStart" value="' + esc(state.couple.startDate) + '" style="margin-top:16px;width:100%;" disabled>';
    root.appendChild(el('div', 'card', s));

    s = '<div class="question-label">Question of the Day</div><div class="question-text">"' + esc(state.questions[state.currentQuestion % state.questions.length]) + '"</div><button class="question-btn" id="answerBtn">Answer</button>';
    root.appendChild(el('div', 'question-card', s));

    s = '<div class="label">Mood</div><div class="mood-grid">';
    for (var i = 0; i < state.mood.customMoods.length; i++) {
      s += '<button class="mood-option" data-mood="' + esc(state.mood.customMoods[i]) + '">' + esc(state.mood.customMoods[i]) + '</button>';
    }
    s += '</div><div class="mood-status"><div><strong>' + esc(state.couple.name1) + ':</strong> ' + esc(state.mood.current[state.couple.name1] || 'Not set') + '</div><div><strong>' + esc(state.couple.name2) + ':</strong> ' + esc(state.mood.current[state.couple.name2] || 'Not set') + '</div></div>';
    root.appendChild(el('div', 'card mood-card', s));

    var nextEvent = null;
    for (var i = 0; i < state.events.length; i++) {
      if (new Date(state.events[i].date) >= new Date()) {
        if (!nextEvent || new Date(state.events[i].date) < new Date(nextEvent.date)) {
          nextEvent = state.events[i];
        }
      }
    }
    var countdownS = '<div class="countdown-header">Next Date</div><div class="countdown-title">' + (nextEvent ? esc(nextEvent.title) : 'Plan your next date') + '</div><div class="countdown-time">' + (nextEvent ? getCountdown(nextEvent.date) + ' days left' : 'No date planned') + '</div>';
    root.appendChild(el('div', 'col-12', countdownS));

    s = '<div class="label">Active Goals</div><div style="display:grid;gap:14px;margin-top:16px">';
    if (state.goals.length === 0) {
      s += '<div class="muted" style="padding:20px;text-align:center">No goals yet. Add one in Us.</div>';
    } else {
      for (var i = 0; i < state.goals.length; i++) {
        var g = state.goals[i];
        var p = Math.round((g.progress / g.target) * 100);
        s += '<div class="goal-card-home" data-goal-id="' + esc(g.id) + '" style="cursor:pointer;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:12px">';
        s += '<div style="display:flex;justify-content:space-between"><div><span style="font-size:1.5rem">' + esc(g.emoji) + '</span> <strong>' + esc(g.title) + '</strong></div><div style="color:var(--secondary)">' + p + '%</div></div>';
        s += '<div style="color:var(--secondary);font-size:0.9rem">' + esc(g.type === 'savings' ? 'P' + g.progress.toLocaleString() + ' / P' + g.target.toLocaleString() : g.progress + ' / ' + g.target) + '</div>';
        s += '<div class="progress-bar" style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-top:8px"><div class="progress-fill" style="width:' + p + '%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f);border-radius:3px"></div></div>';
        s += '</div>';
      }
    }
    s += '</div>';
    root.appendChild(el('div', 'col-12', s));

    if (state.memories.length > 0) {
      var rm = state.memories[0];
      s = '<div class="label">Recent Memory</div><div class="memory-hero">' + esc(rm.emoji) + '</div><div class="memory-title">' + esc(rm.title) + '</div><div class="note-meta">' + esc(rm.date) + '</div><button class="btn" id="viewMemBtn">View Memory</button>';
    } else {
      s = '<div class="label">Recent Memory</div><div class="muted" style="padding:24px 0;text-align:center">No memory saved yet.</div>';
    }
    root.appendChild(el('div', 'card recent-memory-card', s));

    setTimeout(function() {
      document.querySelectorAll('.goal-card-home').forEach(function(c) {
        c.onclick = function() {
          var goal = state.goals.find(function(x) { return x.id === c.dataset.goalId; });
          if (goal) showGoalDetail(goal);
        };
      });
      var ab = document.getElementById('answerBtn');
      if (ab) ab.onclick = function() {
        var q = state.questions[state.currentQuestion % state.questions.length];
        var ans = prompt('Your answer:');
        if (ans) {
          state.answeredQuestions.push({ question: q, answer: ans, date: new Date().toISOString().split('T')[0], by: (state.auth.currentUser && state.auth.currentUser.username) || state.couple.name1 });
          state.currentQuestion++;
          save();
          alert('Answer saved!');
        }
      };
      document.querySelectorAll('.mood-option').forEach(function(b) {
        b.onclick = function() {
          var p = (state.auth.currentUser && state.auth.currentUser.username) || state.couple.name1;
          state.mood.current[p] = b.dataset.mood;
          save();
          navigate('home');
        };
      });
      var vm = document.getElementById('viewMemBtn');
      if (vm) vm.onclick = function() { showMemoryDetail(state.memories[0]); };
    }, 50);
    return root;
  }

  function renderMemories() {
    var root = el('div');
    root.innerHTML = '<input id="memSearch" placeholder="Search Memories" type="text"><div class="filter-tags"><button class="tab-btn active" data-filter="all">All</button><button class="tab-btn" data-filter="photos">Photos</button><button class="tab-btn" data-filter="trips">Trips</button><button class="tab-btn" data-filter="dates">Dates</button></div>';
    var grid = el('div', 'memory-grid');
    root.appendChild(grid);
    
    var addForm = '<div class="label">Add Memory</div>';
    addForm += '<div style="display:grid;grid-template-columns:80px 1fr;gap:12px;margin-top:16px">';
    addForm += '<input id="memEmoji" placeholder="Emoji" value="star" style="text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    addForm += '<input id="memTitle" placeholder="Title" type="text" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    addForm += '<input id="memLocation" placeholder="Location" type="text" style="grid-column:1/-1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    addForm += '<input id="memFile" type="file" accept="image/*" style="grid-column:1/-1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">';
    addForm += '<textarea id="memStory" placeholder="Story..." style="grid-column:1/-1;height:100px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"></textarea>';
    addForm += '</div><button id="addMemBtn" class="btn" style="margin-top:16px">Save Memory</button>';
    root.appendChild(el('div', 'card', addForm));

    function updateGrid() {
      var filtered = state.memories.filter(function(m) { return m; });
      var html = '';
      for (var i = 0; i < filtered.length; i++) {
        var m = filtered[i];
        html += '<div class="memory-card" data-id="' + esc(m.date) + '-' + esc(m.title) + '" style="position:relative">';
        if (m.image) { html += '<div class="memory-image-preview"><img src="' + esc(m.image) + '" alt="' + esc(m.title) + '" style="width:100%"></div>'; }
        else { html += '<div class="memory-icon">' + esc(m.emoji) + '</div>'; }
        html += '<div class="memory-title">' + esc(m.title) + '</div>';
        html += '<div class="memory-date">' + esc(m.date) + '</div>';
        html += '<button class="del-mem-btn" data-id="' + esc(m.date) + '-' + esc(m.title) + '" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:none;color:var(--accent);cursor:pointer">X</button>';
        html += '</div>';
      }
      if (html === '') { html = '<div class="muted" style="grid-column:1/-1;text-align:center;padding:40px">No memories found.</div>'; }
      grid.innerHTML = html;
    }
    updateGrid();
    return root;
  }

  function renderLogin() {
    var root = el('div');
    root.innerHTML = '<div class="card" style="max-width:480px;margin:0 auto;text-align:center"><div class="label">Member Login</div><h2>Select your profile</h2><div style="margin-top:24px;display:grid;gap:14px"><button class="btn" id="loginGab">Gab</button><button class="btn btn-sec" id="loginAvi">Avi</button></div></div>';
    setTimeout(function() {
      document.getElementById('loginGab').onclick = function() { state.auth.currentUser = { username: 'Gab' }; state.auth.token = 'Gab'; localStorage.setItem('gavvy-state', JSON.stringify(state)); navigate('home'); };
      document.getElementById('loginAvi').onclick = function() { state.auth.currentUser = { username: 'Avi' }; state.auth.token = 'Avi'; localStorage.setItem('gavvy-state', JSON.stringify(state)); navigate('home'); };
    }, 50);
    return root;
  }

  function renderNotes() {
    var root = el('div');
    root.innerHTML = '<div><div class="label">Notes Hub</div><h2>Private thoughts</h2></div><button class="btn btn-small" id="newNoteBtn">New Note</button>';
    var lc = el('div', 'card'); lc.id = 'notesList';
    root.appendChild(lc);
    var ac = '<div class="label">Write a Note</div><input id="noteTitle" placeholder="Title" type="text" style="margin-top:16px"><textarea id="noteBody" placeholder="Write your message..." style="margin-top:12px;height:130px"></textarea><button class="btn" id="saveNoteBtn">Save</button>';
    root.appendChild(el('div', 'card', ac));

    function refreshNotes() {
      var nl = document.getElementById('notesList');
      if (!nl) return;
      var html = '';
      for (var i = state.notes.length - 1; i >= 0; i--) {
        var n = state.notes[i];
        html += '<div class="note-item" style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1)">';
        html += '<div style="flex:1"><div style="font-weight:600">' + esc(n.title || 'Untitled') + '</div><div class="note-meta">' + esc(n.date) + ' - ' + esc((n.body || '').slice(0, 90)) + '</div></div>';
        html += '<button class="del-note-btn" data-id="' + esc(n.id) + '" style="background:none;border:none;color:var(--accent);cursor:pointer">X</button></div>';
      }
      if (html === '') { html = '<div class="muted" style="padding:24px;text-align:center">No notes yet.</div>'; }
      nl.innerHTML = html;
      nl.querySelectorAll('.del-note-btn').forEach(function(b) {
        b.onclick = function() { state.notes = state.notes.filter(function(x) { return x.id !== b.dataset.id; }); save(); refreshNotes(); };
      });
    }

    setTimeout(function() {
      document.getElementById('saveNoteBtn').onclick = function() {
        var t = document.getElementById('noteTitle').value.trim();
        var b = document.getElementById('noteBody').value.trim();
        if (!b) return;
        state.notes.push({ id: Date.now().toString(), title: t || 'Untitled', body: b, date: new Date().toISOString().split('T')[0] });
        save();
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteBody').value = '';
        refreshNotes();
      };
      document.getElementById('newNoteBtn').onclick = function() { document.getElementById('noteTitle').focus(); };
    }, 50);
    refreshNotes();
    return root;
  }

  function renderCalendar() {
    var root = el('div');
    var cm = new Date();
    var cc = el('div');
    root.appendChild(cc);

    function renderCal() {
      var year = cm.getFullYear(), month = cm.getMonth(), first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
      var s = '<div style="display:flex;justify-content:space-between;margin-bottom:16px"><h2 style="margin:0;font-size:1.5rem">' + esc(cm.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()) + '</h2>';
      s += '<div style="display:flex;gap:8px"><button class="prevMonthBtn btn btn-sec btn-small"><</button><button class="nextMonthBtn btn btn-sec btn-small">></button></div></div>';
      s += '<div class="calendar-grid" id="calGrid"></div>';
      cc.innerHTML = '';
      cc.appendChild(el('div', 'card', s));
      var grid = document.getElementById('calGrid');
      if (!grid) return;
      ['SUN','MON','TUE','WED','THU','FRI','SAT'].forEach(function(d) { grid.appendChild(el('div', 'calendar-header', d)); });
      for (var i = 0; i < first.getDay(); i++) { grid.appendChild(el('div')); }
      for (var d = 1; d <= last.getDate(); d++) {
        var day = el('div', 'calendar-day');
        var date = new Date(year, month, d);
        var ds = date.toISOString().split('T')[0];
        if (date.toDateString() === new Date().toDateString()) { day.classList.add('today'); }
        day.innerHTML = '<div>' + d + '</div>';
        day.dataset.date = ds;
        day.onclick = function() { showDateEventModal(this.dataset.date); };
        grid.appendChild(day);
      }
      setTimeout(function() {
        var btns = cc.querySelectorAll('.prevMonthBtn, .nextMonthBtn');
        if (btns[0]) btns[0].onclick = function() { cm.setMonth(cm.getMonth() - 1); renderCal(); };
        if (btns[1]) btns[1].onclick = function() { cm.setMonth(cm.getMonth() + 1); renderCal(); };
      }, 10);
    }
    setTimeout(function() { renderCal(); }, 50);
    return root;
  }

  function renderTrips() {
    var root = el('div');
    var s = '<div class="label">Plan a Trip</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><input id="tripName" placeholder="Trip name" style="flex:1;min-width:150px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input type="number" id="tripBudget" placeholder="Budget" style="width:120px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><button id="addTripBtn" class="btn">Add</button></div>';
    root.appendChild(el('div', 'card', s));
    var tripList = el('div', 'card');
    root.appendChild(tripList);

    function refreshTrips() {
      var html = '<div class="label">Your Trips</div>';
      if (state.trips.length === 0) { html += '<div class="muted" style="padding:24px;text-align:center">No trips yet.</div>'; }
      else {
        for (var i = 0; i < state.trips.length; i++) {
          var t = state.trips[i];
          html += '<div class="note-item" style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1)">';
          html += '<div><div style="font-weight:600">' + esc(t.name) + '</div><div class="note-meta">P' + (t.spent || 0) + ' / P' + (t.budget || 0) + '</div></div>';
          html += '<button class="del-trip-btn" data-index="' + i + '" style="background:none;border:none;color:var(--accent);cursor:pointer">X</button></div>';
        }
      }
      tripList.innerHTML = html;
      tripList.querySelectorAll('.del-trip-btn').forEach(function(b) {
        b.onclick = function() {
          var idx = parseInt(b.dataset.index);
          if (confirm('Delete trip?')) { state.trips.splice(idx, 1); save(); refreshTrips(); }
        };
      });
    }

    setTimeout(function() {
      document.getElementById('addTripBtn').onclick = function() {
        var name = document.getElementById('tripName').value.trim();
        var budget = parseInt(document.getElementById('tripBudget').value, 10) || 0;
        if (!name || !budget) return;
        state.trips.push({ name: name, budget: budget, spent: 0, checklist: [], itinerary: [], startDate: '', endDate: '' });
        save();
        document.getElementById('tripName').value = '';
        document.getElementById('tripBudget').value = '';
        refreshTrips();
      };
    }, 50);
    refreshTrips();
    return root;
  }

  function renderUs() {
    var root = el('div', 'grid us-page');
    var s = '<div></div><button class="btn btn-small" id="logoutBtn">Logout</button>';
    root.appendChild(el('div', 'col-12', s));
    
    s = '<div style="text-align:center;font-size:3rem;margin-bottom:16px">couple</div>';
    s += '<div class="couple-names" style="text-align:center">' + esc(state.couple.name1) + ' heart ' + esc(state.couple.name2) + '</div>';
    s += '<div style="text-align:center;color:var(--secondary);margin-top:16px"><label>Relationship Start Date</label><br><input type="date" id="anniversary" value="' + esc(state.couple.startDate || '') + '" disabled></div>';
    root.appendChild(el('div', 'col-12', s));

    var days = getDaysTogether();
    s = '<div class="label">Stats</div>';
    s += '<div class="stats-grid">';
    s += '<div class="stat-card"><div class="stat-icon">heart</div><div class="stat-number">' + days.total + '</div><div class="stat-label">Days</div></div>';
    s += '<div class="stat-card"><div class="stat-icon">star</div><div class="stat-number">' + state.events.length + '</div><div class="stat-label">Dates</div></div>';
    s += '<div class="stat-card"><div class="stat-icon">map</div><div class="stat-number">' + state.trips.length + '</div><div class="stat-label">Trips</div></div>';
    s += '<div class="stat-card"><div class="stat-icon">picture</div><div class="stat-number">' + state.memories.length + '</div><div class="stat-label">Memories</div></div>';
    s += '</div>';
    root.appendChild(el('div', 'col-12', s));

    // Goals section
    s = '<div class="flex-between" style="margin-bottom:16px"><div><div class="label">Goals</div></div><button class="btn btn-small" id="goalExpandBtn">Manage</button></div>';
    s += '<div id="usGoalsContainer" style="display:grid;gap:12px">';
    if (state.goals.length === 0) { s += '<div class="muted" style="padding:20px;text-align:center">No goals yet.</div>'; }
    else {
      for (var i = 0; i < state.goals.length; i++) {
        var g = state.goals[i];
        var p = Math.round((g.progress / g.target) * 100);
        s += '<div class="goal-item-us" data-goal-id="' + esc(g.id) + '" style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;display:flex;gap:12px;align-items:center;justify-content:space-between">';
        s += '<div style="flex:1;cursor:pointer" class="goal-view-area">';
        s += '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>' + esc(g.emoji) + ' ' + esc(g.title) + '</strong><span style="color:var(--secondary);font-size:0.9rem">' + p + '%</span></div>';
        s += '<div class="progress-bar" style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden"><div class="progress-fill" style="width:' + p + '%;height:100%;background:linear-gradient(90deg,#d4af37,#f4d03f)"></div></div>';
        s += '</div><button class="goal-delete-btn btn btn-sec btn-small" data-goal-id="' + esc(g.id) + '" style="padding:8px 12px">X</button></div>';
      }
    }
    s += '</div>';
    s += '<div id="goalExpandPanel" style="display:none;margin-top:18px;border-top:1px solid rgba(255,255,255,0.1);padding-top:18px">';
    s += '<div class="label">Add New Goal</div>';
    s += '<div style="display:grid;gap:12px">';
    s += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><input id="goalEmoji" placeholder="Emoji" value="star" style="text-align:center" maxlength="2"><input id="goalTitle" placeholder="Goal title" type="text"></div>';
    s += '<input id="goalTarget" placeholder="Target" type="number" min="1">';
    s += '<button id="goalAddBtn" class="btn">Create Goal</button></div></div>';
    root.appendChild(el('div', 'col-12', s));

    // Conversations
    s = '<div class="card"><div class="label">Our Conversations</div>';
    if (state.answeredQuestions.length === 0) { s += '<div class="muted" style="padding:16px;text-align:center">No conversations yet.</div>'; }
    else {
      for (var i = state.answeredQuestions.length - 1; i >= 0; i--) {
        var qa = state.answeredQuestions[i];
        s += '<div style="border-left:3px solid var(--accent);padding:12px;background:rgba(212,175,55,0.05);border-radius:4px;margin-bottom:12px">';
        s += '<div style="color:var(--secondary);font-size:0.85rem;margin-bottom:6px">' + esc(qa.date) + ' - ' + esc(qa.by) + '</div>';
        s += '<div style="font-size:0.95rem;margin-bottom:8px;font-style:italic;color:var(--secondary)">Q: ' + esc(qa.question) + '</div>';
        s += '<div style="font-size:0.95rem;color:var(--text)">A: ' + esc(qa.answer) + '</div></div>';
      }
    }
    s += '</div>';
    root.appendChild(el('div', 'col-12', s));

    setTimeout(function() {
      document.getElementById('logoutBtn').onclick = function() { state.auth.currentUser = null; state.auth.token = null; localStorage.setItem('gavvy-state', JSON.stringify(state)); navigate('login'); };
      var gb = document.getElementById('goalExpandBtn'), gp = document.getElementById('goalExpandPanel');
      if (gb && gp) gb.onclick = function() { gp.style.display = gp.style.display === 'none' ? 'block' : 'none'; };
      document.querySelectorAll('.goal-item-us').forEach(function(item) {
        item.querySelector('.goal-view-area').onclick = function() { var goal = state.goals.find(function(x) { return x.id === item.dataset.goalId; }); if (goal) showGoalDetail(goal); };
        item.querySelector('.goal-delete-btn').onclick = function(e) { e.stopPropagation(); if (confirm('Delete this goal?')) { state.goals = state.goals.filter(function(g) { return g.id !== e.target.dataset.goalId; }); save(); navigate('us'); } };
      });
      document.getElementById('goalAddBtn').onclick = function() {
        var emoji = document.getElementById('goalEmoji').value.trim() || 'star';
        var title = document.getElementById('goalTitle').value.trim();
        var target = parseInt(document.getElementById('goalTarget').value, 10) || 100;
        if (!title) return;
        state.goals.push({ id: Date.now().toString(), emoji: emoji, title: title, type: 'count', progress: 0, target: target, deadline: null, milestones: [], items: [], createdAt: new Date().toISOString() });
        save();
        navigate('us');
      };
    }, 50);
    return root;
  }

  function navigate(route) {
    document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.route === route); });
    var app = document.getElementById('app');
    app.innerHTML = '';
    if (!state.auth.currentUser && route !== 'login') route = 'login';
    if (state.auth.currentUser && route === 'login') route = 'home';
    currentRoute = route;
    localStorage.setItem('gavvy-lastRoute', route);
    if (route === 'home') app.appendChild(renderHome());
    else if (route === 'memories') app.appendChild(renderMemories());
    else if (route === 'calendar') app.appendChild(renderCalendar());
    else if (route === 'notes') app.appendChild(renderNotes());
    else if (route === 'trips') app.appendChild(renderTrips());
    else if (route === 'us') app.appendChild(renderUs());
    else if (route === 'login') app.appendChild(renderLogin());
  }

  function init() {
    var mw = el('div', 'modal');
    var mc = el('div'); mc.id = 'memoryModal'; mw.appendChild(mc);
    document.body.appendChild(mw);
    document.querySelectorAll('.nav-btn').forEach(function(b) { b.addEventListener('click', function() { navigate(b.dataset.route); }); });
    var ir = 'home';
    if (state.auth.currentUser) { var lr = localStorage.getItem('gavvy-lastRoute'); if (lr && lr !== 'login') ir = lr; }
    else { ir = 'login'; }
    navigate(ir);
  }
  return { init: init };
})();
document.addEventListener('DOMContentLoaded', function() { GAVVY.init(); });